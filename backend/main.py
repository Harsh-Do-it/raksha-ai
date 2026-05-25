import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Event
from typing import Any, Dict, List, Optional

from flask import Flask, Response, jsonify, request

sys.path.append(str(Path(__file__).resolve().parent))

from config import Config
from models.RiskModel import RakshaRiskModel
from models.RoadModel import RakshaRoadModel
from models.SosModel import RakshaAISOS
from services.ai_bridge import RakshaAIBridge
from services.firebase_service import get_firebase_status
from services.maps_service import nearby_hospitals, reverse_geocode


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY=Config.SECRET_KEY,
        MAX_CONTENT_LENGTH=Config.MAX_CONTENT_LENGTH,
    )
    Config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return app


app = create_app()

risk_model = RakshaRiskModel()
road_model = RakshaRoadModel(upload_dir=Config.UPLOAD_DIR)
ai_bridge = RakshaAIBridge(upload_dir=Config.UPLOAD_DIR, model=road_model)
sos_model = RakshaAISOS()

RISK_ALERTS: List[Dict[str, Any]] = []
PREFERENCES = {
    "minSeverity": "high",
    "zones": [],
    "pushEnabled": True,
    "smsEnabled": False,
}
BASE_HOURLY_DISTRIBUTION = [14, 8, 5, 4, 6, 10, 18, 32, 47, 38, 29, 24, 21, 19, 23, 28, 35, 41, 52, 61, 48, 37, 29, 20]
SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}

DEFAULT_SUMMARY = {
    "stats": [
        {"label": "Active Incidents", "value": 14, "change": "+3 since yesterday", "color": "#dc2626"},
        {"label": "Issues Reported", "value": 2847, "change": "+12 today", "color": "#f97316"},
        {"label": "SOS Activations", "value": 341, "change": "This month", "color": "#22c55e"},
        {"label": "Resolved Issues", "value": "89%", "change": "Resolution rate", "color": "#3b82f6"},
    ],
    "hotspots": [
        {"name": "NH-48 Ring Road", "count": 142},
        {"name": "Mathura Road Flyover", "count": 118},
        {"name": "Outer Ring Road N", "count": 97},
        {"name": "DND Flyway", "count": 83},
        {"name": "Mehrauli-Gurgaon Rd", "count": 71},
    ],
    "recentIssues": [
        {"id": 1, "type": "Pothole", "severity": "critical", "road": "NH-48, KM 14", "area": "Mahipalpur", "reportedAt": "18 min ago", "status": "verified"},
        {"id": 2, "type": "Waterlogging", "severity": "high", "road": "Outer Ring Road", "area": "Nangloi", "reportedAt": "1 hr ago", "status": "in-progress"},
        {"id": 3, "type": "Damaged Road", "severity": "high", "road": "Mathura Road", "area": "Badarpur", "reportedAt": "3 hrs ago", "status": "pending"},
        {"id": 4, "type": "Broken Divider", "severity": "medium", "road": "Rohini Sec-3", "area": "Rohini", "reportedAt": "5 hrs ago", "status": "pending"},
        {"id": 5, "type": "Missing Sign", "severity": "medium", "road": "DND Entry", "area": "Noida Link", "reportedAt": "8 hrs ago", "status": "verified"},
    ],
    "map": {
        "mode": "placeholder",
        "markers": [
            {"label": "High Risk", "top": "35%", "left": "28%", "color": "#dc2626"},
            {"label": "High Risk", "top": "55%", "left": "55%", "color": "#f97316"},
            {"label": "Critical", "top": "25%", "left": "65%", "color": "#dc2626"},
            {"label": "Medium", "top": "65%", "left": "35%", "color": "#eab308"},
            {"label": "Low Risk", "top": "45%", "left": "75%", "color": "#22c55e"},
        ],
    },
}


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


@app.route("/")
def home():
    return jsonify({
        "message": "Raksha AI backend running",
        "version": "1.0",
    })


@app.route("/health")
def health_check():
    return jsonify({
        "status": "ok",
        "timestamp": _now_iso(),
        "firebase": get_firebase_status(),
    })


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
        alerts = [alert for alert in alerts if alert.get("status") == status]
    if min_severity:
        alerts = [alert for alert in alerts if SEVERITY_ORDER.get(alert.get("severity", "low"), 3) <= SEVERITY_ORDER.get(min_severity, 3)]

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


@app.route("/dashboard/summary", methods=["GET"])
def dashboard_summary():
    days = request.args.get("days", default=30, type=int)
    limit = request.args.get("limit", default=5, type=int)

    summary = {
        **DEFAULT_SUMMARY,
        "hotspots": DEFAULT_SUMMARY["hotspots"][:limit],
        "generatedAt": _now_iso(),
        "filters": {"days": days, "limit": limit},
    }
    return jsonify(summary)


@app.route("/dashboard/recent-issues", methods=["GET"])
def dashboard_recent_issues():
    limit = request.args.get("limit", default=5, type=int)
    return jsonify(DEFAULT_SUMMARY["recentIssues"][:limit])


@app.route("/dashboard/hotspots", methods=["GET"])
def dashboard_hotspots():
    limit = request.args.get("limit", default=5, type=int)
    return jsonify(DEFAULT_SUMMARY["hotspots"][:limit])


@app.route("/dashboard/map", methods=["GET"])
def dashboard_map():
    return jsonify(DEFAULT_SUMMARY["map"])


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
        return jsonify({
            "jobId": created["job_id"],
            "status": "complete",
            "label": result["label"],
            "confidence": result["confidence"],
            "severity": result["severity"],
            "description": result["description"],
            "bbox": result.get("bbox"),
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
        return jsonify({
            "jobId": job_id,
            "status": "complete",
            "label": result["label"],
            "confidence": result["confidence"],
            "severity": result["severity"],
            "description": result["description"],
            "bbox": result.get("bbox"),
        })

    return jsonify({"jobId": job_id, "status": current.get("status", "processing")})


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
    return jsonify(result)


if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
