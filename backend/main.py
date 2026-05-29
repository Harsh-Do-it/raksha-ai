import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Event
from typing import Any, Dict, List, Optional

from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS

sys.path.append(str(Path(__file__).resolve().parent))

from config import Config
from models.RiskModel import RakshaRiskModel
from models.RoadModel import RakshaRoadModel
from models.SosModel import RakshaAISOS
from services.ai_bridge import RakshaAIBridge
from services.firebase_service import get_firebase_status
from services.maps_service import nearby_hospitals, reverse_geocode
from services.auth_service import (
    register_user, login_user, login_admin,
    get_current_user, is_admin, logout_token,
)
from services.reports_service import (
    create_report, get_reports, get_report_by_id,
    update_report_status, delete_report, get_stats,
)
from services.sos_service import save_sos_alert, get_sos_alerts, delete_sos_alert


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=Config.SECRET_KEY,
        MAX_CONTENT_LENGTH=Config.MAX_CONTENT_LENGTH,
    )
    CORS(app, resources={r"/*": {"origins": "*"}})
    Config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return app


app = create_app()

risk_model = RakshaRiskModel()
road_model = RakshaRoadModel(upload_dir=Config.UPLOAD_DIR)
ai_bridge = RakshaAIBridge(upload_dir=Config.UPLOAD_DIR, model=road_model)
sos_model = RakshaAISOS()

# In-memory risk alerts (non-critical to persist)
RISK_ALERTS: List[Dict[str, Any]] = []
PREFERENCES = {
    "minSeverity": "high",
    "zones": [],
    "pushEnabled": True,
    "smsEnabled": False,
}
BASE_HOURLY_DISTRIBUTION = [14, 8, 5, 4, 6, 10, 18, 32, 47, 38, 29, 24, 21, 19, 23, 28, 35, 41, 52, 61, 48, 37, 29, 20]
SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _parse_payload() -> Dict[str, Any]:
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return {}
    return payload


def _coerce_float(value: Any) -> Optional[float]:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _default_zone_name(payload: Dict[str, Any]) -> str:
    if payload.get("zone"):
        return str(payload["zone"])
    if payload.get("lat") is not None and payload.get("lng") is not None:
        return f"Lat {payload['lat']}, Lng {payload['lng']}"
    return "Unknown Zone"


def _build_alert(zone: str, score: int, reason: Optional[str] = None) -> Dict[str, Any]:
    alert = risk_model.build_alert(zone=zone, score=score, reason=reason)
    alert["id"] = f"risk-{int(time.time() * 1000)}"
    return alert


def _append_alert(zone: str, score: int, reason: Optional[str] = None) -> Dict[str, Any]:
    alert = _build_alert(zone, score, reason)
    RISK_ALERTS.append(alert)
    if len(RISK_ALERTS) > 100:
        del RISK_ALERTS[:-100]
    return alert


def _get_auth_user():
    """Extract current user from Authorization header."""
    return get_current_user(request.headers.get("Authorization"))


def _require_admin():
    """Return (user, error_response) tuple. error_response is None if OK."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, (jsonify({"success": False, "error": "Authentication required."}), 401)
    token = auth[7:]
    if not is_admin(token):
        return None, (jsonify({"success": False, "error": "Admin access required."}), 403)
    user = get_current_user(auth)
    return user, None


# ── Root & Health ─────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({"message": "Raksha AI backend running", "version": "2.0"})


@app.route("/health")
def health_check():
    return jsonify({
        "status": "ok",
        "timestamp": _now_iso(),
        "firebase": get_firebase_status(),
    })


# ── Auth Routes ───────────────────────────────────────────────────────────────

@app.route("/auth/register", methods=["POST"])
def auth_register():
    payload = _parse_payload()
    result = register_user(
        name=payload.get("name", ""),
        email=payload.get("email", ""),
        password=payload.get("password", ""),
    )
    if not result.get("success"):
        return jsonify(result), 400
    return jsonify(result), 201


@app.route("/auth/login", methods=["POST"])
def auth_login():
    payload = _parse_payload()
    result = login_user(
        email=payload.get("email", ""),
        password=payload.get("password", ""),
    )
    if not result.get("success"):
        return jsonify(result), 401
    return jsonify(result)


@app.route("/auth/admin/login", methods=["POST"])
def auth_admin_login():
    payload = _parse_payload()
    result = login_admin(
        username=payload.get("username", ""),
        password=payload.get("password", ""),
    )
    if not result.get("success"):
        return jsonify(result), 401
    return jsonify(result)


@app.route("/auth/logout", methods=["POST"])
def auth_logout():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        logout_token(auth[7:])
    return jsonify({"success": True})


@app.route("/auth/me", methods=["GET"])
def auth_me():
    user = _get_auth_user()
    if not user:
        return jsonify({"success": False, "error": "Not authenticated"}), 401
    return jsonify({"success": True, **user})


# ── Road Issue Reports ─────────────────────────────────────────────────────────

@app.route("/roads/issues", methods=["POST"])
def submit_road_issue():
    payload = _parse_payload()
    issue_type = payload.get("type", "").strip()
    severity = payload.get("severity", "medium").strip()
    road = payload.get("road", "").strip()

    if not issue_type:
        return jsonify({"success": False, "error": "Issue type is required."}), 400
    if not road:
        return jsonify({"success": False, "error": "Road/location is required."}), 400

    # Identify who is reporting
    user = _get_auth_user()
    reporter_name = user.get("name", "Anonymous") if user else "Anonymous"
    reporter_id = user.get("user_id") if user else None

    report = create_report(
        issue_type=issue_type,
        severity=severity,
        road=road,
        area=payload.get("area", ""),
        description=payload.get("description", ""),
        ai_label=payload.get("ai_label"),
        ai_confidence=payload.get("ai_confidence"),
        image_filename=payload.get("image_filename"),
        lat=_coerce_float(payload.get("lat")),
        lng=_coerce_float(payload.get("lng")),
        reporter_name=reporter_name,
        reporter_id=reporter_id,
    )
    return jsonify({"success": True, "report": report}), 201


@app.route("/roads/issues", methods=["GET"])
def list_road_issues():
    status = request.args.get("status")
    severity = request.args.get("severity")
    issue_type = request.args.get("type")
    limit = request.args.get("limit", default=20, type=int)
    offset = request.args.get("offset", default=0, type=int)

    result = get_reports(
        status=status,
        severity=severity,
        issue_type=issue_type,
        limit=limit,
        offset=offset,
    )
    return jsonify(result)


@app.route("/roads/issues/<report_id>", methods=["GET"])
def get_road_issue(report_id: str):
    report = get_report_by_id(report_id)
    if not report:
        return jsonify({"success": False, "error": "Report not found."}), 404
    return jsonify(report)


@app.route("/roads/issues/<report_id>", methods=["PATCH"])
def update_road_issue(report_id: str):
    _, err = _require_admin()
    if err:
        return err

    payload = _parse_payload()
    new_status = payload.get("status", "").strip()
    admin_note = payload.get("admin_note", "").strip()

    updated = update_report_status(report_id, new_status, admin_note)
    if not updated:
        return jsonify({"success": False, "error": "Report not found or invalid status."}), 404
    return jsonify({"success": True, "report": updated})


@app.route("/roads/issues/<report_id>", methods=["DELETE"])
def delete_road_issue(report_id: str):
    _, err = _require_admin()
    if err:
        return err

    deleted = delete_report(report_id)
    if not deleted:
        return jsonify({"success": False, "error": "Report not found."}), 404
    return jsonify({"success": True, "deleted": report_id})


@app.route("/roads/issues/stats", methods=["GET"])
def road_issues_stats():
    return jsonify(get_stats())


# ── Existing AI detection routes ───────────────────────────────────────────────

@app.route("/roads/detect", methods=["POST"])
def detect_road_issue():
    file_storage = request.files.get("file")
    if file_storage is None or file_storage.filename == "":
        return jsonify({"success": False, "error": "No image file provided"}), 400

    created = ai_bridge.create_detection_job(file_storage, filename=file_storage.filename)

    if created.get("status") == "failed":
        return jsonify(created), 400

    if created.get("status") == "complete":
        result = created["result"]
        # Get the saved filename from the job
        job = ai_bridge._get_job(created["job_id"])
        saved_filename = job.get("filename") if job else None
        return jsonify({
            "jobId": created["job_id"],
            "status": "complete",
            "label": result["label"],
            "confidence": result["confidence"],
            "severity": result["severity"],
            "description": result["description"],
            "bbox": result.get("bbox"),
            "savedFilename": saved_filename,
        })

    return jsonify({"jobId": created["job_id"], "status": created.get("status", "processing")})


@app.route("/roads/detect/<job_id>", methods=["GET"])
def road_detection_status(job_id: str):
    current = ai_bridge.poll_detection_job(job_id)

    if current.get("status") == "failed":
        if current.get("error") == "Job not found":
            return jsonify(current), 404
        return jsonify(current), 400

    if current.get("status") == "complete":
        result = current["result"]
        job = ai_bridge._get_job(job_id)
        saved_filename = job.get("filename") if job else None
        return jsonify({
            "jobId": job_id,
            "status": "complete",
            "label": result["label"],
            "confidence": result["confidence"],
            "severity": result["severity"],
            "description": result["description"],
            "bbox": result.get("bbox"),
            "savedFilename": saved_filename,
        })

    return jsonify({"jobId": job_id, "status": current.get("status", "processing")})


@app.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename: str):
    """Serve uploaded images so admin panel can display them."""
    return send_from_directory(Config.UPLOAD_DIR, filename)


# ── Risk Routes ───────────────────────────────────────────────────────────────

@app.route("/risk/score", methods=["POST"])
def risk_score():
    payload = _parse_payload()
    result = risk_model.build_response(
        lat=_coerce_float(payload.get("lat")),
        lng=_coerce_float(payload.get("lng")),
        time=payload.get("time"),
        weather=payload.get("weather"),
        road=payload.get("road"),
        traffic=payload.get("traffic"),
        zone=payload.get("zone"),
    )
    _append_alert(_default_zone_name(payload), result["score"], reason=f"Model score {result['score']} for {_default_zone_name(payload)}")
    return jsonify(result)


@app.route("/risk/coordinate", methods=["GET"])
def risk_coordinate():
    lat = _coerce_float(request.args.get("lat"))
    lng = _coerce_float(request.args.get("lng"))

    if lat is None or lng is None:
        return jsonify({"success": False, "error": "lat and lng are required"}), 400

    result = risk_model.build_response(lat=lat, lng=lng)
    _append_alert(f"Lat {lat}, Lng {lng}", result["score"], reason="Coordinate risk check")
    return jsonify(result)


@app.route("/risk/alerts", methods=["GET"])
def risk_alerts():
    min_severity = request.args.get("min_severity")
    status = request.args.get("status", "active")
    limit = request.args.get("limit", default=20, type=int)

    alerts = list(RISK_ALERTS)
    if status:
        alerts = [a for a in alerts if a.get("status") == status]
    if min_severity:
        alerts = [a for a in alerts if SEVERITY_ORDER.get(a.get("severity", "low"), 3) <= SEVERITY_ORDER.get(min_severity, 3)]

    alerts.sort(key=lambda item: SEVERITY_ORDER.get(item.get("severity", "low"), 3))
    return jsonify(alerts[:limit])


@app.route("/risk/stream")
def risk_stream():
    stop_event = Event()

    def event_stream():
        while not stop_event.is_set():
            if RISK_ALERTS:
                yield f"data: {json.dumps(RISK_ALERTS[-1])}\n\n"
            else:
                yield "event: ping\ndata: {}\n\n"
            time.sleep(12)

    response = Response(event_stream(), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"
    return response


@app.route("/risk/analytics/hourly", methods=["GET"])
def risk_analytics_hourly():
    zone = request.args.get("zone")
    payload = list(BASE_HOURLY_DISTRIBUTION)
    if zone:
        payload[len(zone) % len(payload)] = max(payload)
    return jsonify(payload)


@app.route("/risk/analytics/zones", methods=["GET"])
def risk_analytics_zones():
    limit = request.args.get("limit", default=20, type=int)
    days = request.args.get("days", default=30, type=int)

    ranked = []
    for index, alert in enumerate(RISK_ALERTS[:limit]):
        ranked.append({
            "zone": alert.get("zone", "Unknown Zone"),
            "lat": None,
            "lng": None,
            "score": alert.get("score", 0),
            "count": max(1, len(RISK_ALERTS) - index),
            "delta": min(30, (days % 10) + index),
        })

    if not ranked:
        ranked = [
            {
                "zone": f"Zone {index + 1}",
                "lat": None,
                "lng": None,
                "score": max(1, BASE_HOURLY_DISTRIBUTION[index % len(BASE_HOURLY_DISTRIBUTION)]),
                "count": 1,
                "delta": 0,
            }
            for index in range(min(limit, 5))
        ]

    return jsonify(ranked[:limit])


@app.route("/risk/route-profile", methods=["POST"])
def risk_route_profile():
    payload = _parse_payload()
    waypoints = payload.get("waypoints")
    if not isinstance(waypoints, list) or len(waypoints) < 2:
        return jsonify({"success": False, "error": "waypoints must be an array with at least 2 entries"}), 400

    route = risk_model.profile_route(
        waypoints,
        time=payload.get("time"),
        weather=payload.get("weather"),
        traffic=payload.get("traffic"),
        road=payload.get("road"),
    )
    return jsonify(route)


@app.route("/risk/preferences", methods=["GET", "PUT"])
def risk_preferences():
    if request.method == "GET":
        return jsonify(PREFERENCES)

    payload = _parse_payload()
    PREFERENCES.update(payload)
    return jsonify(PREFERENCES)


# ── Dashboard Routes ───────────────────────────────────────────────────────────

@app.route("/dashboard/summary", methods=["GET"])
def dashboard_summary():
    stats = get_stats()
    total = stats["total"]
    resolved = stats["by_status"].get("resolved", 0)
    resolution_rate = f"{round(resolved / total * 100)}%" if total else "N/A"

    # Build hotspots from UNRESOLVED reports only
    all_reports = get_reports(limit=500)["items"]
    active_reports = [r for r in all_reports if r.get("status") != "resolved"]
    area_counts: Dict[str, int] = {}
    for r in active_reports:
        area = r.get("road") or r.get("area") or "Unknown"
        area_counts[area] = area_counts.get(area, 0) + 1

    hotspots = sorted(
        [{"name": k, "count": v} for k, v in area_counts.items()],
        key=lambda x: x["count"], reverse=True
    )[:5]

    # Fallback hotspots if no active reports yet
    if not hotspots:
        hotspots = [
            {"name": "NH-48 Ring Road", "count": 142},
            {"name": "Mathura Road Flyover", "count": 118},
            {"name": "Outer Ring Road N", "count": 97},
            {"name": "DND Flyway", "count": 83},
            {"name": "Mehrauli-Gurgaon Rd", "count": 71},
        ]

    recent_issues = get_reports(limit=5)["items"]

    return jsonify({
        "stats": [
            {"label": "Active Incidents", "value": stats["by_status"].get("pending", 0) + stats["by_status"].get("verified", 0), "change": f"+{stats['by_status'].get('pending', 0)} pending", "color": "#dc2626"},
            {"label": "Issues Reported", "value": total, "change": f"+{stats['by_status'].get('pending', 0)} today", "color": "#f97316"},
            {"label": "SOS Activations", "value": 341, "change": "This month", "color": "#22c55e"},
            {"label": "Resolved Issues", "value": resolution_rate, "change": "Resolution rate", "color": "#3b82f6"},
        ],
        "hotspots": hotspots,
        "recentIssues": recent_issues,
        "generatedAt": _now_iso(),
    })


@app.route("/dashboard/recent-issues", methods=["GET"])
def dashboard_recent_issues():
    limit = request.args.get("limit", default=5, type=int)
    result = get_reports(limit=limit)
    return jsonify(result["items"])


@app.route("/dashboard/hotspots", methods=["GET"])
def dashboard_hotspots():
    """Return hotspot zones from ACTIVE (unresolved) reports only."""
    limit = request.args.get("limit", default=5, type=int)
    all_reports = get_reports(limit=500)["items"]
    # Only count unresolved issues as active hotspots
    active_reports = [r for r in all_reports if r.get("status") != "resolved"]
    area_counts: Dict[str, int] = {}
    for r in active_reports:
        area = r.get("road") or r.get("area") or "Unknown"
        area_counts[area] = area_counts.get(area, 0) + 1
    hotspots = sorted(
        [{"name": k, "count": v} for k, v in area_counts.items()],
        key=lambda x: x["count"], reverse=True
    )[:limit]
    if not hotspots:
        hotspots = [
            {"name": "NH-48 Ring Road", "count": 142},
            {"name": "Mathura Road Flyover", "count": 118},
            {"name": "Outer Ring Road N", "count": 97},
        ]
    return jsonify(hotspots)


@app.route("/dashboard/map", methods=["GET"])
def dashboard_map():
    return jsonify({"mode": "placeholder", "markers": []})


# ── Maps Routes ───────────────────────────────────────────────────────────────

@app.route("/maps/reverse-geocode", methods=["GET"])
def reverse_geo():
    lat = _coerce_float(request.args.get("lat"))
    lng = _coerce_float(request.args.get("lng"))
    if lat is None or lng is None:
        return jsonify({"success": False, "error": "lat and lng are required"}), 400
    return jsonify(reverse_geocode(lat, lng))


@app.route("/maps/hospitals", methods=["GET"])
def nearby_hospital_list():
    lat = _coerce_float(request.args.get("lat"))
    lng = _coerce_float(request.args.get("lng"))
    radius_km = _coerce_float(request.args.get("radius_km", 5))
    limit = request.args.get("limit", default=5, type=int)

    if lat is None or lng is None:
        return jsonify({"success": False, "error": "lat and lng are required"}), 400

    return jsonify(nearby_hospitals(lat, lng, radius_km=radius_km or 5.0, limit=limit))


# ── SOS Routes ────────────────────────────────────────────────────────────────

@app.route("/sos/activate", methods=["POST"])
def sos_activate():
    payload = _parse_payload()
    result = sos_model.activate_sos(
        location=payload.get("location"),
        emergency_contacts=payload.get("emergency_contacts"),
        user_id=payload.get("user_id"),
        note=payload.get("note", ""),
        device_info=payload.get("device_info"),
    )
    if result.get("alert"):
        save_sos_alert(result["alert"])
    return jsonify(result)


@app.route("/sos/alerts", methods=["GET"])
def list_sos_alerts():
    limit = request.args.get("limit", default=50, type=int)
    offset = request.args.get("offset", default=0, type=int)
    return jsonify(get_sos_alerts(limit=limit, offset=offset))


@app.route("/sos/alerts/<alert_id>", methods=["DELETE"])
def remove_sos_alert(alert_id):
    deleted = delete_sos_alert(alert_id)
    if deleted:
        return jsonify({"message": "Alert deleted successfully"}), 200
    return jsonify({"error": "Alert not found"}), 404


# Also support /sos for frontend compatibility
@app.route("/sos", methods=["POST"])
def sos_activate_compat():
    return sos_activate()


if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
