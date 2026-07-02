"""
FastAPI application entrypoint.

Step 1 scope: app boots, connects to Postgres + Chroma, exposes a health
check, and creates tables on startup for local dev. Trials/Patients/Matches
routers are added in later steps (app/api/trials.py, patients.py, matches.py,
review.py) — import and include_router them here as they're built.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import health
from app.config import get_settings
from app.db import init_db
from app.security import SecurityHeadersMiddleware, APIKeyMiddleware
from dotenv import load_dotenv
load_dotenv()
settings = get_settings()

# --- Rate limiter (shared instance used by route decorators) ---
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if they don't exist (dev convenience).
    # Swap for Alembic migrations once the schema stabilizes.
    await init_db()
    yield
    # Shutdown: nothing to clean up yet (engine disposal handled by SQLAlchemy).


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# --- Rate limiter registration ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS — use explicit allowed origins from config ---
allowed_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security middleware stack ---
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(APIKeyMiddleware)

app.include_router(health.router)

from app.api import matches, patients, review, trials, chat  # noqa: E402  (import after app creation keeps router wiring grouped here)

app.include_router(trials.router, prefix="/trials", tags=["trials"])
app.include_router(patients.router, prefix="/patients", tags=["patients"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
# No prefix: matches.router's own paths already include /patients/{id}/match
# and /patients/{id}/matches, since matches are conceptually nested under
# a patient rather than being top-level resources.
app.include_router(matches.router, tags=["matches"])
app.include_router(review.router, tags=["review"])