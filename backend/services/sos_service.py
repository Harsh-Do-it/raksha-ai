"""
sos_service.py – Raksha AI persistent SOS alerts store.

Alerts are persisted to backend/data/sos_alerts.json.
Thread-safe reads/writes via a module-level Lock.
"""

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
SOS_FILE = DATA_DIR / "sos_alerts.json"

_LOCK = Lock()

def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

def _load() -> List[Dict[str, Any]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not SOS_FILE.exists():
        return []
    try:
        return json.loads(SOS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []

def _save(alerts: List[Dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SOS_FILE.write_text(json.dumps(alerts, indent=2), encoding="utf-8")


# ── Public API ────────────────────────────────────────────────────────────────

def save_sos_alert(alert_payload: Dict[str, Any]) -> None:
    """Save a new SOS alert to the JSON store."""
    with _LOCK:
        alerts = _load()
        alerts.insert(0, alert_payload)  # newest first
        _save(alerts)

def get_sos_alerts(*, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
    """Return a paginated list of SOS alerts."""
    with _LOCK:
        alerts = _load()

    total = len(alerts)
    page = alerts[offset: offset + limit]
    return {"total": total, "items": page}

def delete_sos_alert(alert_id: str) -> bool:
    """Delete an SOS alert by ID. Returns True if deleted, False if not found."""
    with _LOCK:
        alerts = _load()
        initial_count = len(alerts)
        alerts = [a for a in alerts if a.get("alert_id") != alert_id]
        if len(alerts) < initial_count:
            _save(alerts)
            return True
        return False

__all__ = [
    "save_sos_alert",
    "get_sos_alerts",
    "delete_sos_alert",
]
