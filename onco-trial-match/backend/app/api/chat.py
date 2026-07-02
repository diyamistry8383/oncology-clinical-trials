"""
FastAPI router for handling AI Chat Assistant queries.

Security: Rate-limited to prevent LLM API abuse, with input length validation.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db import get_db
from app.nlp.chat_assistant import generate_chat_response
from app.security import sanitize_text, log_audit_event

router = APIRouter()

# Max message content length to prevent abuse (2000 chars per message)
_MAX_MESSAGE_LENGTH = 2000
# Max conversation history to accept per request
_MAX_MESSAGES = 20


class ChatMessage(BaseModel):
    role: str
    content: str = Field(max_length=_MAX_MESSAGE_LENGTH)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(max_length=_MAX_MESSAGES)
    patient_id: str | None = None


@router.post("", status_code=200)
async def chat_interaction(payload: ChatRequest, request: Request, db: AsyncSession = Depends(get_db)):
    if not payload.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")

    # Sanitize message content
    dict_messages = [
        {"role": m.role, "content": sanitize_text(m.content, max_length=_MAX_MESSAGE_LENGTH)}
        for m in payload.messages
    ]

    log_audit_event(
        action="CHAT_QUERY",
        resource_type="chat",
        user_ip=request.client.host if request.client else None,
        details=f"messages={len(dict_messages)}, patient_id={payload.patient_id}",
    )

    response_text = await generate_chat_response(
        messages=dict_messages,
        patient_id=payload.patient_id,
        db=db
    )

    return {"content": response_text}
