/**
 * Small horizontal bar showing a 0-1 similarity score, with the numeric
 * value alongside. This is the one place we lean into a distinctive visual
 * treatment — an oncologist scanning a list of 5-20 matches needs to see
 * relative match strength at a glance, faster than reading numbers alone.
 */
export default function SimilarityGauge({ score }) {
    const pct = Math.round(score * 100);

    let tone = "low";
    if (score >= 0.75) tone = "high";
    else if (score >= 0.5) tone = "medium";

    return (
        <div className="similarity-gauge" title={`Similarity score: ${pct}%`}>
            <div className="similarity-gauge-track">
                <div className={`similarity-gauge-fill similarity-gauge-fill--${tone}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="similarity-gauge-value">{pct}%</span>
        </div>
    );
}