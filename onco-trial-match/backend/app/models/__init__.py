"""
Re-export all models here so that `Base.metadata` sees every table when
app.db.init_db() runs Base.metadata.create_all (a single import of this
package guarantees full model discovery).
"""
from app.models.match import Match, MatchStatus
from app.models.patient import Patient
from app.models.trial import Trial

__all__ = ["Trial", "Patient", "Match", "MatchStatus"]
