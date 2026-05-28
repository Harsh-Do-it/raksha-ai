"""
reports_service.py – Raksha AI persistent reports store.

Reports are persisted to backend/data/reports.json so they survive restarts.
Thread-safe reads/writes via a module-level Lock.
"""

import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
REPORTS_FILE = DATA_DIR / "reports.json"

_LOCK = Lock()

SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
VALID_STATUSES = {"pending", "verified", "in-progress", "resolved"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _load() -> List[Dict[str, Any]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not REPORTS_FILE.exists():
        return []
    try:
        return json.loads(REPORTS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save(reports: List[Dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_FILE.write_text(json.dumps(reports, indent=2), encoding="utf-8")


# ── Public API ────────────────────────────────────────────────────────────────

def create_report(
    *,
    issue_type: str,
    severity: str,
    road: str,
    area: str = "",
    description: str = "",
    ai_label: Optional[str] = None,
    ai_confidence: Optional[float] = None,
    image_filename: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    reporter_name: str = "Anonymous",
    reporter_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Create and persist a new road issue report."""
    report = {
        "id": f"RPT-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6].upper()}",
        "type": issue_type,
        "severity": severity,
        "road": road,
        "area": area,
        "description": description,
        "ai_label": ai_label,
        "ai_confidence": ai_confidence,
        "image_filename": image_filename,
        "lat": lat,
        "lng": lng,
        "reporter_name": reporter_name,
        "reporter_id": reporter_id,
        "status": "pending",
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
        "admin_note": "",
    }

    with _LOCK:
        reports = _load()
        reports.insert(0, report)  # newest first
        _save(reports)

    return report


def get_reports(
    *,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    issue_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    """Return a filtered, paginated list of reports."""
    with _LOCK:
        reports = _load()

    if status:
        reports = [r for r in reports if r.get("status") == status]
    if severity:
        reports = [r for r in reports if r.get("severity") == severity]
    if issue_type:
        reports = [r for r in reports if r.get("type", "").lower() == issue_type.lower()]

    total = len(reports)
    page = reports[offset: offset + limit]
    return {"total": total, "items": page}


def get_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    with _LOCK:
        reports = _load()
    return next((r for r in reports if r["id"] == report_id), None)


def update_report_status(
    report_id: str,
    new_status: str,
    admin_note: str = "",
) -> Optional[Dict[str, Any]]:
    """Update status and optional admin note. Returns updated report or None."""
    if new_status not in VALID_STATUSES:
        return None

    with _LOCK:
        reports = _load()
        for report in reports:
            if report["id"] == report_id:
                report["status"] = new_status
                report["updated_at"] = _now_iso()
                if admin_note:
                    report["admin_note"] = admin_note
                _save(reports)
                return report

    return None


def delete_report(report_id: str) -> bool:
    """Remove a report by ID. Returns True if deleted."""
    with _LOCK:
        reports = _load()
        before = len(reports)
        reports = [r for r in reports if r["id"] != report_id]
        if len(reports) < before:
            _save(reports)
            return True
    return False


def get_stats() -> Dict[str, Any]:
    """Return summary stats for the dashboard."""
    with _LOCK:
        reports = _load()

    total = len(reports)
    by_status: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    by_type: Dict[str, int] = {}

    for r in reports:
        s = r.get("status", "pending")
        by_status[s] = by_status.get(s, 0) + 1
        sev = r.get("severity", "medium")
        by_severity[sev] = by_severity.get(sev, 0) + 1
        t = r.get("type", "Other")
        by_type[t] = by_type.get(t, 0) + 1

    resolved = by_status.get("resolved", 0)
    resolution_rate = f"{round(resolved / total * 100)}%" if total else "N/A"

    return {
        "total": total,
        "by_status": by_status,
        "by_severity": by_severity,
        "by_type": by_type,
        "resolution_rate": resolution_rate,
    }


__all__ = [
    "create_report",
    "get_reports",
    "get_report_by_id",
    "update_report_status",
    "delete_report",
    "get_stats",
]
