"""
Centralized app configuration, loaded from environment variables.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "Onco Trial Match API"
    ENV: str = "development"
    DEBUG: bool = True

    # --- PostgreSQL ---
    POSTGRES_USER: str = "onco_user"
    POSTGRES_PASSWORD: str = "onco_pass"
    POSTGRES_DB: str = "onco_trials"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # --- ChromaDB ---
    # --- ChromaDB ---
    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000
    CHROMA_COLLECTION_TRIALS: str = "trial_eligibility"
    CHROMA_API_KEY: str = ""
    CHROMA_TENANT: str = ""
    CHROMA_DATABASE: str = ""

    # --- ClinicalTrials.gov ---
    CLINICALTRIALS_API_BASE: str = "https://clinicaltrials.gov/api/v2"

    # --- LLM ---
   # --- LLM ---
    LLM_PROVIDER: str = "grok"
    GEMINI_API_KEY: str = ""
    GROK_API_KEY: str = ""
    LLM_MODEL: str = "grok-4"

    # --- Embeddings ---
    BIOBERT_MODEL_NAME: str = "pritamdeka/S-BioBert-snli-multinli-stsb"

    # --- Security ---
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_CHAT_PER_MINUTE: int = 20
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    API_KEY: str = ""  # Set in production to require X-API-Key header

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()