"""
RAG-based Chat Assistant logic. 
Answers questions about clinical trials, patient matching, and general oncology criteria.
"""
from __future__ import annotations

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.config import get_settings
from app.models.patient import Patient
from app.models.trial import Trial
from app.embeddings.biobert_embedder import embed_text
from app.vectorstore import query_similar_trials
from app.matching.eligibility_scoring import calculate_match_score

logger = logging.getLogger("chat_assistant")
settings = get_settings()

_SYSTEM_PROMPT = """You are a helpful, expert AI Oncology Clinical Trial Assistant. \
You assist oncologists and clinical trial coordinators by searching, analyzing, and comparing trials.

You have access to a database of clinical trials and patient profiles. When the user asks about trials, \
use the provided context containing relevant trials retrieved from the database to answer. \
Format your answer clearly, using bullet points, bold text for trial NCT IDs and key criteria, and markdown tables when appropriate.

Always base your answers on the provided context when searching or comparing. If the context does not contain the answer, \
state that you don't have enough information. If a patient is selected, keep their clinical context (biomarkers, prior treatments, diagnosis) in mind.

Be professional, clinical, and precise. Never make up details or NCT IDs that are not present in the context.
"""


async def generate_chat_response(
    messages: list[dict],
    patient_id: str | None,
    db: AsyncSession
) -> str:
    settings = get_settings()
    has_valid_key = (
        settings.GROK_API_KEY
        and settings.GROK_API_KEY.startswith("xai-")
    )

    # 1. Gather context
    last_user_message = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")

    patient_context = ""
    patient = None
    if patient_id:
        import uuid
        try:
            patient = await db.get(Patient, uuid.UUID(patient_id))
            if patient:
                patient_context = (
                    f"Active Patient Context:\n"
                    f"- Name: {patient.display_name}\n"
                    f"- Age: {patient.age} | Sex: {patient.sex}\n"
                    f"- Primary Diagnosis: {patient.primary_diagnosis} ({patient.cancer_type})\n"
                    f"- Biomarkers: {', '.join(patient.biomarkers) if patient.biomarkers else 'None'}\n"
                    f"- Prior Treatments: {', '.join(patient.prior_treatments) if patient.prior_treatments else 'None'}\n"
                    f"- Clinical Summary: {patient.clinical_summary or 'None'}\n\n"
                )
        except Exception as e:
            logger.warning("Error fetching patient context for chat: %s", e)

    # 2. Perform RAG Search
    retrieved_trials_context = ""
    lowered_msg = last_user_message.lower()
    is_searching_trials = any(kw in lowered_msg for kw in ["find", "search", "show", "trial", "nct", "breast", "lung", "colon", "prostate", "leukemia", "cancer", "study", "match"])

    if is_searching_trials:
        try:
            query_embedding = embed_text(last_user_message)
            results = query_similar_trials(query_embedding=query_embedding, top_k=3)
            metadatas = results.get("metadatas", [[]])[0]
            nct_ids = [meta.get("nct_id") for meta in metadatas if meta and meta.get("nct_id")]

            if nct_ids:
                result = await db.execute(select(Trial).where(Trial.nct_id.in_(nct_ids)))
                trials = result.scalars().all()
                context_blocks = []
                for t in trials:
                    structured = t.eligibility_structured or {}
                    match_score_str = ""
                    if patient:
                        score_info = calculate_match_score(patient, t, 0.5)
                        match_score_str = f"Composite Match Percentage for {patient.display_name}: {score_info['score']}%\n"
                    block = (
                        f"Trial NCT ID: {t.nct_id}\n"
                        f"Title: {t.title}\n"
                        f"Phase: {t.phase or 'Unspecified'}\n"
                        f"Status: {t.status}\n"
                        f"Conditions: {', '.join(t.conditions) if t.conditions else 'Cancer'}\n"
                        f"Key Biomarkers: {', '.join(structured.get('biomarkers', [])) if structured.get('biomarkers') else 'None'}\n"
                        f"Prior Treatments: {', '.join(structured.get('prior_treatment', [])) if structured.get('prior_treatment') else 'None'}\n"
                        f"{match_score_str}"
                        f"Eligibility criteria (raw summary): {t.brief_summary or 'None'}\n"
                    )
                    context_blocks.append(block)
                if context_blocks:
                    retrieved_trials_context = "Relevant Trials from Database:\n\n" + "\n---\n".join(context_blocks) + "\n\n"
        except Exception as e:
            logger.warning("Error performing semantic search for chat RAG: %s", e)

    # 3. Call Grok (xAI) or fallback
    if not has_valid_key:
        return _generate_fallback_chat_response(last_user_message, patient, retrieved_trials_context)

    try:
        client = AsyncOpenAI(
            api_key=settings.GROK_API_KEY,
            base_url="https://api.x.ai/v1",
        )

        system_content = _SYSTEM_PROMPT
        if patient_context or retrieved_trials_context:
            system_content += f"\n\nCONTEXT INFORMATION:\n{patient_context}{retrieved_trials_context}"

        chat_messages = [
            {
                "role": "system",
                "content": system_content
            }
        ]

        for m in messages[-10:]:
            chat_messages.append(
                {
                    "role": m["role"],
                    "content": m["content"]
                }
            )

        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=chat_messages,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.warning("Error calling Grok API for chat: %s", e)
        return _generate_fallback_chat_response(last_user_message, patient, retrieved_trials_context, failed_api=True)


def _generate_fallback_chat_response(
    message: str,
    patient: Patient | None,
    trials_context: str,
    failed_api: bool = False
) -> str:
    suffix = " (API key not configured)" if not failed_api else " (AI service currently unavailable)"
    header = f"### Oncology Chat Assistant{suffix}\n\n"
    body = ""

    if patient:
        body += f"Active patient: **{patient.display_name}** ({patient.age} year old {patient.sex.lower()}, diagnosis: *{patient.primary_diagnosis}*).\n\n"

    if trials_context:
        body += "Based on database search, the following trial options are available:\n\n"
        lines = trials_context.split("\n")
        current_trial = {}
        for line in lines:
            if line.startswith("Trial NCT ID:"):
                if current_trial:
                    body += f"- **{current_trial.get('nct', '')}**: {current_trial.get('title', '')} (Phase {current_trial.get('phase', 'N/A')})\n"
                    if current_trial.get('match'):
                        body += f"  - *{current_trial.get('match')}*\n"
                current_trial = {"nct": line.split(":")[1].strip()}
            elif line.startswith("Title:"):
                current_trial["title"] = line.split(":", 1)[1].strip()
            elif line.startswith("Phase:"):
                current_trial["phase"] = line.split(":")[1].strip()
            elif line.startswith("Composite Match Percentage"):
                current_trial["match"] = line.strip()
        if current_trial:
            body += f"- **{current_trial.get('nct', '')}**: {current_trial.get('title', '')} (Phase {current_trial.get('phase', 'N/A')})\n"
            if current_trial.get('match'):
                body += f"  - *{current_trial.get('match')}*\n"
    else:
        body += (
            "I can search and match clinical trials from our database. "
            "Please ask a question containing terms like 'breast cancer', 'lung cancer', or a trial NCT ID."
        )

    body += "\n\n*Note: Configure a valid GROK_API_KEY in the backend .env to enable full natural language conversation.*"
    return header + body
