from datetime import datetime, timezone
from pathlib import Path
import sys

from flask import Flask, jsonify, request

sys.path.append(str(Path(__file__).resolve().parents[1]))

app = Flask(__name__)

DEFAULT_SUMMARY = {
    "stats": [
        {
            "label": "Active Incidents",
            "value": 14,
            "change": "+3 since yesterday",
            "color": "#dc2626",
        },
        {
            "label": "Issues Reported",
            "value": 2847,
            "change": "+12 today",
            "color": "#f97316",
        },
        {
            "label": "SOS Activations",
            "value": 341,
            "change": "This month",
            "color": "#22c55e",
        },
        {
            "label": "Resolved Issues",
            "value": "89%",
            "change": "Resolution rate",
            "color": "#3b82f6",
        },
    ],
    "hotspots": [
        {"name": "NH-48 Ring Road", "count": 142},
        {"name": "Mathura Road Flyover", "count": 118},
        {"name": "Outer Ring Road N", "count": 97},
        {"name": "DND Flyway", "count": 83},
        {"name": "Mehrauli-Gurgaon Rd", "count": 71},
    ],
    "recentIssues": [
        {
            "id": 1,
            "type": "Pothole",
            "severity": "critical",
            "road": "NH-48, KM 14",
            "area": "Mahipalpur",
            "reportedAt": "18 min ago",
            "status": "verified",
        },
        {
            "id": 2,
            "type": "Waterlogging",
            "severity": "high",
            "road": "Outer Ring Road",
            "area": "Nangloi",
            "reportedAt": "1 hr ago",
            "status": "in-progress",
        },
        {
            "id": 3,
            "type": "Damaged Road",
            "severity": "high",
            "road": "Mathura Road",
            "area": "Badarpur",
            "reportedAt": "3 hrs ago",
            "status": "pending",
        },
        {
            "id": 4,
            "type": "Broken Divider",
            "severity": "medium",
            "road": "Rohini Sec-3",
            "area": "Rohini",
            "reportedAt": "5 hrs ago",
            "status": "pending",
        },
        {
            "id": 5,
            "type": "Missing Sign",
            "severity": "medium",
            "road": "DND Entry",
            "area": "Noida Link",
            "reportedAt": "8 hrs ago",
            "status": "verified",
        },
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
    "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
}


@app.route("/")
def home():
    return jsonify({
        "message": "Raksha AI Dashboard API Running",
        "version": "1.0",
    })


@app.route("/dashboard/summary", methods=["GET"])
def dashboard_summary():
    days = request.args.get("days", default=30, type=int)
    limit = request.args.get("limit", default=5, type=int)

    summary = {
        **DEFAULT_SUMMARY,
        "hotspots": DEFAULT_SUMMARY["hotspots"][:limit],
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "filters": {
            "days": days,
            "limit": limit,
        },
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


if __name__ == "__main__":
    app.run(debug=True)
