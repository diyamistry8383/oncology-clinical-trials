"""
Security utilities for the Onco Trial Match API.

Provides:
- Input sanitization (XSS prevention via bleach)
- Audit logging for HIPAA-style compliance
- Security headers middleware
- Optional API key authentication
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Callable

import bleach
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings

logger = logging.getLogger("security")
audit_logger = logging.getLogger("audit")

# Configure audit logger to always output (even in production)
if not audit_logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("%(asctime)s [AUDIT] %(message)s", datefmt="%Y-%m-%dT%H:%M:%S")
    )
    audit_logger.addHandler(handler)
    audit_logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Input sanitization
# ---------------------------------------------------------------------------

# Allowed tags: none — we strip ALL HTML for clinical text inputs
_ALLOWED_TAGS: list[str] = []
_ALLOWED_ATTRIBUTES: dict = {}

# Maximum field lengths to prevent oversized payloads
_MAX_LENGTHS = {
    "display_name": 120,
    "primary_diagnosis": 500,
    "clinical_summary": 5000,
    "cancer_type": 120,
    "stage": 20,
    "biomarker_item": 100,
    "treatment_item": 200,
    "chat_message": 2000,
}


def sanitize_text(value: str, max_length: int | None = None) -> str:
    """Strip HTML tags and limit length to prevent XSS and oversized inputs."""
    if not value:
        return value
    cleaned = bleach.clean(value, tags=_ALLOWED_TAGS, attributes=_ALLOWED_ATTRIBUTES, strip=True)
    # Collapse excessive whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned


def sanitize_list_field(items: list[str], max_item_length: int = 100) -> list[str]:
    """Sanitize each item in a list field (biomarkers, treatments, etc.)."""
    if not items:
        return items
    return [sanitize_text(item, max_length=max_item_length) for item in items if item.strip()]


def sanitize_patient_input(data: dict) -> dict:
    """Sanitize all text fields in a patient create/update payload."""
    sanitized = dict(data)

    if "display_name" in sanitized and sanitized["display_name"]:
        sanitized["display_name"] = sanitize_text(
            sanitized["display_name"], _MAX_LENGTHS["display_name"]
        )

    if "primary_diagnosis" in sanitized and sanitized["primary_diagnosis"]:
        sanitized["primary_diagnosis"] = sanitize_text(
            sanitized["primary_diagnosis"], _MAX_LENGTHS["primary_diagnosis"]
        )

    if "clinical_summary" in sanitized and sanitized["clinical_summary"]:
        sanitized["clinical_summary"] = sanitize_text(
            sanitized["clinical_summary"], _MAX_LENGTHS["clinical_summary"]
        )

    if "cancer_type" in sanitized and sanitized["cancer_type"]:
        sanitized["cancer_type"] = sanitize_text(
            sanitized["cancer_type"], _MAX_LENGTHS["cancer_type"]
        )

    if "stage" in sanitized and sanitized["stage"]:
        sanitized["stage"] = sanitize_text(
            sanitized["stage"], _MAX_LENGTHS["stage"]
        )

    if "biomarkers" in sanitized and sanitized["biomarkers"]:
        sanitized["biomarkers"] = sanitize_list_field(
            sanitized["biomarkers"], _MAX_LENGTHS["biomarker_item"]
        )

    if "prior_treatments" in sanitized and sanitized["prior_treatments"]:
        sanitized["prior_treatments"] = sanitize_list_field(
            sanitized["prior_treatments"], _MAX_LENGTHS["treatment_item"]
        )

    if "comorbidities" in sanitized and sanitized["comorbidities"]:
        sanitized["comorbidities"] = sanitize_list_field(
            sanitized["comorbidities"], _MAX_LENGTHS["treatment_item"]
        )

    return sanitized


# ---------------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------------

def log_audit_event(
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    user_ip: str | None = None,
    details: str | None = None,
) -> None:
    """Log a structured audit event for compliance tracking."""
    timestamp = datetime.now(timezone.utc).isoformat()
    parts = [
        f"action={action}",
        f"resource={resource_type}",
    ]
    if resource_id:
        parts.append(f"id={resource_id}")
    if user_ip:
        parts.append(f"ip={user_ip}")
    if details:
        parts.append(f"details={details}")
    audit_logger.info(" | ".join(parts))


# ---------------------------------------------------------------------------
# Security headers middleware
# ---------------------------------------------------------------------------

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        # HSTS only in non-debug/production
        settings = get_settings()
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# ---------------------------------------------------------------------------
# API key authentication (optional, for production)
# ---------------------------------------------------------------------------

class APIKeyMiddleware(BaseHTTPMiddleware):
    """
    Optional API key validation. When API_KEY is set in config, all
    requests must include a matching X-API-Key header. Health check
    and docs endpoints are exempted.
    """

    _EXEMPT_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        settings = get_settings()
        api_key = settings.API_KEY

        # If no API key configured, skip auth entirely
        if not api_key:
            return await call_next(request)

        # Exempt health/docs paths
        if request.url.path in self._EXEMPT_PATHS:
            return await call_next(request)

        provided_key = request.headers.get("X-API-Key", "")
        if provided_key != api_key:
            from fastapi.responses import JSONResponse
            log_audit_event(
                action="AUTH_FAILURE",
                resource_type="api",
                user_ip=request.client.host if request.client else "unknown",
                details=f"path={request.url.path}",
            )
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or missing API key"},
            )
        return await call_next(request)
