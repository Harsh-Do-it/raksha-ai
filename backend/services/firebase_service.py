import os
from typing import Any, Dict, Optional, Tuple

_FIREBASE_APP: Optional[Any] = None


def _load_firebase_modules() -> Tuple[Optional[Any], Optional[Any], Optional[Any], Optional[Any]]:
    """Load Firebase Admin modules lazily and return them if available."""
    try:
        import firebase_admin  # type: ignore[import-not-found]
        from firebase_admin import credentials, db, initialize_app  # type: ignore[import-not-found]

        return firebase_admin, credentials, db, initialize_app
    except Exception:
        return None, None, None, None


def get_firebase_config() -> Dict[str, Any]:
    """Return optional Firebase configuration values from environment variables."""
    return {
        "type": os.getenv("FIREBASE_TYPE", "service_account"),
        "project_id": os.getenv("FIREBASE_PROJECT_ID"),
        "service_account_path": os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH"),
        "database_url": os.getenv("FIREBASE_DATABASE_URL"),
    }


def is_firebase_available() -> bool:
    """Check whether the optional Firebase Admin SDK is installed."""
    firebase_admin, _, _, initialize_app = _load_firebase_modules()
    return firebase_admin is not None and initialize_app is not None


def initialize_firebase() -> Optional[Any]:
    """Initialize Firebase Admin SDK if configuration and dependencies are available."""
    global _FIREBASE_APP

    firebase_admin, credentials, _, initialize_app = _load_firebase_modules()

    if firebase_admin is None or initialize_app is None:
        return None

    cached_app = globals().get("_FIREBASE_APP")
    if cached_app is not None:
        return cached_app

    config = get_firebase_config()

    if config["type"] == "service_account" and config["service_account_path"] and credentials is not None:
        _FIREBASE_APP = initialize_app(credentials.Certificate(config["service_account_path"]))
        return _FIREBASE_APP

    if config["database_url"]:
        _FIREBASE_APP = initialize_app(options={"databaseURL": config["database_url"]})
        return _FIREBASE_APP

    _FIREBASE_APP = initialize_app()
    return _FIREBASE_APP


def get_firestore_client() -> Optional[Any]:
    """Return a Firestore client if Firebase is configured, otherwise None."""
    _, _, db, _ = _load_firebase_modules()

    if db is None:
        return None

    initialize_firebase()
    return db.reference


def get_firebase_status() -> Dict[str, Any]:
    """Return readable Firebase availability information."""
    config = get_firebase_config()
    return {
        "available": is_firebase_available(),
        "project_id": config["project_id"],
        "database_url": config["database_url"],
        "service_account_path": bool(config["service_account_path"]),
    }


__all__ = [
    "get_firestore_client",
    "get_firebase_config",
    "get_firebase_status",
    "initialize_firebase",
    "is_firebase_available",
]
