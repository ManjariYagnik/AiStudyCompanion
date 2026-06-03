"""Minimal OAuth2 (authorization-code) for Google and GitHub.

No external OAuth library: we build the authorize URL, exchange the code, and
fetch the user's email/name with httpx. CSRF is handled with a short-lived
signed `state` (a JWT), so no server-side session is needed.

A provider is "enabled" only when its client id + secret are configured.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional, TypedDict
from urllib.parse import urlencode

import httpx
import jwt

from .config import (
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    JWT_ALGORITHM,
    JWT_SECRET,
    OAUTH_REDIRECT_BASE,
)


class OAuthProfile(TypedDict):
    email: str
    name: str


_PROVIDERS = {
    "google": {
        "authorize": "https://accounts.google.com/o/oauth2/v2/auth",
        "token": "https://oauth2.googleapis.com/token",
        "userinfo": "https://openidconnect.googleapis.com/v1/userinfo",
        "scope": "openid email profile",
        "client_id": lambda: GOOGLE_CLIENT_ID,
        "client_secret": lambda: GOOGLE_CLIENT_SECRET,
    },
    "github": {
        "authorize": "https://github.com/login/oauth/authorize",
        "token": "https://github.com/login/oauth/access_token",
        "userinfo": "https://api.github.com/user",
        "scope": "read:user user:email",
        "client_id": lambda: GITHUB_CLIENT_ID,
        "client_secret": lambda: GITHUB_CLIENT_SECRET,
    },
}


def is_enabled(provider: str) -> bool:
    p = _PROVIDERS.get(provider)
    return bool(p and p["client_id"]() and p["client_secret"]())


def enabled_providers() -> dict:
    return {name: is_enabled(name) for name in _PROVIDERS}


def redirect_uri(provider: str) -> str:
    return f"{OAUTH_REDIRECT_BASE}/api/auth/oauth/{provider}/callback"


def _sign_state(provider: str) -> str:
    payload = {
        "provider": provider,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_state(provider: str, state: str) -> bool:
    try:
        payload = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return False
    return payload.get("provider") == provider


def authorize_url(provider: str) -> str:
    p = _PROVIDERS[provider]
    params = {
        "client_id": p["client_id"](),
        "redirect_uri": redirect_uri(provider),
        "scope": p["scope"],
        "response_type": "code",
        "state": _sign_state(provider),
    }
    if provider == "google":
        params["access_type"] = "online"
        params["prompt"] = "select_account"
    return f"{p['authorize']}?{urlencode(params)}"


async def exchange_code_for_profile(provider: str, code: str) -> Optional[OAuthProfile]:
    """Exchange the auth code for an access token and return {email, name}."""
    p = _PROVIDERS[provider]
    data = {
        "client_id": p["client_id"](),
        "client_secret": p["client_secret"](),
        "code": code,
        "redirect_uri": redirect_uri(provider),
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        token_res = await client.post(
            p["token"], data=data, headers={"Accept": "application/json"}
        )
        token_res.raise_for_status()
        access_token = token_res.json().get("access_token")
        if not access_token:
            return None

        headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        info = (await client.get(p["userinfo"], headers=headers)).json()

        if provider == "google":
            email = info.get("email")
            name = info.get("name") or (email.split("@")[0] if email else "")
        else:  # github
            name = info.get("name") or info.get("login") or ""
            email = info.get("email")
            if not email:  # GitHub hides email unless we ask /user/emails
                emails = (await client.get("https://api.github.com/user/emails", headers=headers)).json()
                primary = next(
                    (e for e in emails if e.get("primary") and e.get("verified")), None
                ) or next((e for e in emails if e.get("verified")), None)
                email = primary["email"] if primary else None

    if not email:
        return None
    return OAuthProfile(email=email.lower(), name=name or email.split("@")[0])
