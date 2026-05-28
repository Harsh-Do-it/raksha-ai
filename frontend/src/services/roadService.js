/**
 * roadService.js — Road Issue & AI Detection Service Layer (v2)
 * Fixed: VITE_ env vars, real backend calls, no mock in production.
 */

import { getAuthToken } from "./authService";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || "http://127.0.0.1:5000";
const USE_MOCK  = import.meta.env.VITE_APP_USE_MOCK === "true";

export class RoadServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "RoadServiceError";
    this.code = code;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiFetch(path, opts = {}) {
  const token = await getAuthToken().catch(() => null);
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new RoadServiceError(body.error || body.detail || `HTTP ${res.status}`, "NETWORK");
  }
  return res.json();
}

// ── Submit road issue (real) ──────────────────────────────────────────────────

/**
 * submitIssue — POST /roads/issues — saves a new report to backend.
 */
export async function submitIssue(issue) {
  if (!issue.type)     throw new RoadServiceError("Issue type is required.", "VALIDATION");
  if (!issue.road)     throw new RoadServiceError("Road/location is required.", "VALIDATION");

  if (USE_MOCK) {
    await sleep(900);
    return { issueId: `ISS-${Date.now()}`, status: "pending", createdAt: new Date().toISOString(), mock: true };
  }

  const data = await apiFetch("/roads/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: issue.type,
      severity: issue.severity || "medium",
      road: issue.road,
      area: issue.area || "",
      description: issue.description || "",
      ai_label: issue.aiLabel || null,
      ai_confidence: issue.aiConfidence || null,
      image_filename: issue.imageFilename || null,
      lat: issue.lat || null,
      lng: issue.lng || null,
    }),
  });
  return { issueId: data.report?.id, status: "pending", createdAt: data.report?.created_at, report: data.report };
}

// ── Fetch issues list ─────────────────────────────────────────────────────────

export async function getIssues({ status, severity, type, limit = 20, offset = 0 } = {}) {
  if (USE_MOCK) {
    await sleep(500);
    return { total: 0, items: [] };
  }
  const params = new URLSearchParams();
  if (status)   params.set("status",   status);
  if (severity) params.set("severity", severity);
  if (type)     params.set("type",     type);
  params.set("limit",  limit);
  params.set("offset", offset);
  return apiFetch(`/roads/issues?${params}`);
}

// ── Admin: update issue status ─────────────────────────────────────────────────

export async function updateIssueStatus(reportId, newStatus, adminNote = "") {
  return apiFetch(`/roads/issues/${reportId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus, admin_note: adminNote }),
  });
}

// ── Admin: delete issue ────────────────────────────────────────────────────────

export async function deleteIssue(reportId) {
  return apiFetch(`/roads/issues/${reportId}`, { method: "DELETE" });
}

// ── AI detection (upload image) ────────────────────────────────────────────────

const MOCK_DETECTIONS = [
  { label: "Pothole",      confidence: 0.94, severity: "critical", description: "Deep pothole detected. Immediate repair recommended.", bbox: null },
  { label: "Damaged Road", confidence: 0.87, severity: "high",     description: "Road surface cracking detected. Maintenance recommended.", bbox: null },
  { label: "Waterlogging", confidence: 0.91, severity: "high",     description: "Standing water on road surface detected.", bbox: null },
  { label: "Surface Wear", confidence: 0.78, severity: "medium",   description: "General surface wear detected.", bbox: null },
];

export async function uploadAndDetect(file) {
  if (USE_MOCK) {
    await sleep(1800);
    return { ...MOCK_DETECTIONS[Math.floor(Math.random() * MOCK_DETECTIONS.length)], jobId: `mock-${Date.now()}`, savedFilename: null };
  }

  const form = new FormData();
  form.append("file", file, file.name);
  const token = await getAuthToken().catch(() => null);

  const res = await fetch(`${BASE_URL}/roads/detect`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new RoadServiceError(body.error || `Detection failed (${res.status})`, "DETECTION_FAILED");
  }

  const data = await res.json();
  // data.savedFilename is the actual filename stored on the server
  if (data.jobId && !data.label) {
    return pollDetectionJob(data.jobId);
  }
  return data; // includes savedFilename
}

export async function pollDetectionJob(jobId) {
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const data = await apiFetch(`/roads/detect/${jobId}`);
    if (data.status === "complete") return data;
    if (data.status === "failed") throw new RoadServiceError("AI detection failed.", "DETECTION_FAILED");
  }
  throw new RoadServiceError("Detection timed out.", "DETECTION_FAILED");
}