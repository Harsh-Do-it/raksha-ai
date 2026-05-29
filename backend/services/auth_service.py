"""
auth_service.py – Raksha AI simple auth layer.

Users are stored in backend/data/users.json.
Admin credentials are read from environment variables.
Tokens are random UUID-based strings stored in-memory.
"""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
USERS_FILE = DATA_DIR / "users.json"

# In-memory token store: {token: {user_id, role, name, email, created_at}}
_TOKENS: Dict[str, Dict[str, Any]] = {}
TOKENS_FILE = DATA_DIR / "tokens.json"
_LOCK = Lock()

def _load_tokens():
    if TOKENS_FILE.exists():
        try:
            _TOKENS.update(json.loads(TOKENS_FILE.read_text(encoding="utf-8")))
        except:
            pass

_load_tokens()

def _save_tokens():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    TOKENS_FILE.write_text(json.dumps(_TOKENS, indent=2), encoding="utf-8")


def _load_users() -> Dict[str, Dict[str, Any]]:
    """Load users dict from JSON file, keyed by email."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not USERS_FILE.exists():
        return {}
    try:
        return json.loads(USERS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_users(users: Dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    USERS_FILE.write_text(json.dumps(users, indent=2), encoding="utf-8")


def _get_admin_credentials() -> tuple[str, str]:
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD", "raksha@admin2024")
    return username, password


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


# ── Public API ────────────────────────────────────────────────────────────────

def register_user(name: str, email: str, password: str) -> Dict[str, Any]:
    """Register a new user. Returns {success, message, user_id}."""
    if not name or not email or not password:
        return {"success": False, "error": "Name, email, and password are required."}
    if len(password) < 6:
        return {"success": False, "error": "Password must be at least 6 characters."}

    users = _load_users()
    email_lower = email.strip().lower()

    if email_lower in users:
        return {"success": False, "error": "An account with this email already exists."}

    user_id = f"user-{uuid.uuid4().hex[:10]}"
    users[email_lower] = {
        "user_id": user_id,
        "name": name.strip(),
        "email": email_lower,
        "password": password,   # NOTE: plain-text for demo only; hash in production
        "role": "user",
        "created_at": _now_iso(),
    }
    _save_users(users)
    return {"success": True, "user_id": user_id, "name": name.strip(), "role": "user"}


def login_user(email: str, password: str) -> Dict[str, Any]:
    """Authenticate a regular user. Returns {success, token, name, role}."""
    if not email or not password:
        return {"success": False, "error": "Email and password are required."}

    # Check admin credentials first
    admin_user, admin_pass = _get_admin_credentials()
    if email.strip().lower() == admin_user.lower() and password == admin_pass:
        token = _mint_token("admin-0001", "Administrator", email.strip().lower(), "admin")
        return {"success": True, "token": token, "name": "Administrator", "role": "admin", "user_id": "admin-0001"}

    users = _load_users()
    email_lower = email.strip().lower()
    user = users.get(email_lower)

    if not user or user.get("password") != password:
        return {"success": False, "error": "Invalid email or password."}

    token = _mint_token(user["user_id"], user["name"], email_lower, user["role"])
    return {
        "success": True,
        "token": token,
        "name": user["name"],
        "role": user["role"],
        "user_id": user["user_id"],
    }


def login_admin(username: str, password: str) -> Dict[str, Any]:
    """Authenticate an admin. Returns {success, token, role}."""
    admin_user, admin_pass = _get_admin_credentials()
    if username.strip().lower() == admin_user.lower() and password == admin_pass:
        token = _mint_token("admin-0001", "Administrator", username.strip().lower(), "admin")
        return {"success": True, "token": token, "name": "Administrator", "role": "admin", "user_id": "admin-0001"}
    return {"success": False, "error": "Invalid admin credentials."}


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Return the user payload for a valid token, or None if invalid."""
    with _LOCK:
        return _TOKENS.get(token)


def logout_token(token: str) -> None:
    """Invalidate a token."""
    with _LOCK:
        if _TOKENS.pop(token, None):
            _save_tokens()


def is_admin(token: str) -> bool:
    """Return True if the token belongs to an admin user."""
    payload = verify_token(token)
    return payload is not None and payload.get("role") == "admin"


# ── Internal helpers ──────────────────────────────────────────────────────────

def _mint_token(user_id: str, name: str, email: str, role: str) -> str:
    token = uuid.uuid4().hex
    with _LOCK:
        _TOKENS[token] = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "created_at": _now_iso(),
        }
        _save_tokens()
    return token


def get_current_user(auth_header: Optional[str]) -> Optional[Dict[str, Any]]:
    """Extract and verify the bearer token from an Authorization header."""
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    return verify_token(token)


__all__ = [
    "register_user",
    "login_user",
    "login_admin",
    "verify_token",
    "logout_token",
    "is_admin",
    "get_current_user",
]
