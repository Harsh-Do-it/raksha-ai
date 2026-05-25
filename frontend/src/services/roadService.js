/**
 * roadService.js — Road Issue & AI Detection Service Layer
 * Raksha AI · frontend/src/services/
 *
 * Handles:
 *  - Uploading road images to the FastAPI backend for AI classification
 *  - Polling detection job status (for async inference pipelines)
 *  - Submitting road issue reports (pothole, damage, waterlogging, etc.)
 *  - Fetching the issue feed with filtering and pagination
 *  - Upvoting / flagging issues
 *  - Fetching a single issue by ID
 *  - Deleting / updating own reports
 *
 * AI Pipeline (backend):
 *   POST /roads/detect  → { jobId }
 *   GET  /roads/detect/{jobId} → { status, label, confidence, severity }
 *
 * Usage:
 *  import { uploadAndDetect, submitIssue, getIssues } from './roadService';
 *
 *  const result = await uploadAndDetect(imageFile);
 *  // → { label: "Pothole", confidence: 0.94, severity: "critical", description: "…" }
 *
 *  const issueId = await submitIssue({ type: "Pothole", severity: "critical", road: "NH-48", lat, lng });
 */

import { getAuthToken } from "./authService";

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL          = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
const USE_MOCK          = process.env.REACT_APP_USE_MOCK === "true" || process.env.NODE_ENV === "development";
const MAX_FILE_SIZE_MB  = 10;
const ALLOWED_TYPES     = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const POLL_INTERVAL_MS  = 1000;
const MAX_POLL_ATTEMPTS = 20;

// ── Error class ───────────────────────────────────────────────────────────────
export class RoadServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "RoadServiceError";
    this.code = code; // "FILE_TOO_LARGE" | "INVALID_TYPE" | "DETECTION_FAILED" | "NETWORK" | "NOT_FOUND"
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────
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
    throw new RoadServiceError(body.detail || `HTTP ${res.status}`, "NETWORK");
  }
  return res.json();
}

/**
 * validateImage — Pre-flight checks before upload.
 *
 * @param {File} file
 * @throws {RoadServiceError}
 */
export function validateImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new RoadServiceError(
      `Unsupported file type: ${file.type}. Use JPEG, PNG, WEBP or HEIC.`,
      "INVALID_TYPE"
    );
  }
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    throw new RoadServiceError(
      `File is ${sizeMB.toFixed(1)} MB — maximum allowed is ${MAX_FILE_SIZE_MB} MB.`,
      "FILE_TOO_LARGE"
    );
  }
}

// ── Mock AI detection results ─────────────────────────────────────────────────
const MOCK_DETECTIONS = [
  {
    label:       "Pothole",
    confidence:  0.94,
    severity:    "critical",
    description: "Deep pothole detected with high confidence. Estimated diameter 40–60 cm. Immediate repair recommended.",
    bbox:        { x: 0.22, y: 0.38, w: 0.3, h: 0.25 },
  },
  {
    label:       "Damaged Road",
    confidence:  0.87,
    severity:    "high",
    description: "Road surface cracking and subsidence detected. Multiple fracture lines visible across carriageway.",
    bbox:        { x: 0.15, y: 0.5, w: 0.6, h: 0.35 },
  },
  {
    label:       "Waterlogging",
    confidence:  0.91,
    severity:    "high",
    description: "Standing water on road surface detected. Estimated depth >10 cm based on visual cues.",
    bbox:        { x: 0.1, y: 0.55, w: 0.8, h: 0.35 },
  },
  {
    label:       "Surface Wear",
    confidence:  0.78,
    severity:    "medium",
    description: "General road surface wear and minor cracking. No immediate danger but scheduled maintenance required.",
    bbox:        null,
  },
];

async function mockDetect() {
  await sleep(1800);
  return MOCK_DETECTIONS[Math.floor(Math.random() * MOCK_DETECTIONS.length)];
}

// ── Upload image for AI detection ─────────────────────────────────────────────
/**
 * uploadAndDetect — Uploads an image file to the backend, runs AI inference,
 * and returns the classification result synchronously (polls if async).
 *
 * @param {File}     file           Image file from <input type="file" />
 * @param {object}   [opts]
 * @param {function} [opts.onProgress]  Called with 0–100 upload progress %
 *
 * @returns {Promise<{
 *   label:       string,           // "Pothole" | "Damaged Road" | "Waterlogging" | …
 *   confidence:  number,           // 0–1
 *   severity:    "critical"|"high"|"medium"|"low",
 *   description: string,
 *   bbox:        { x,y,w,h }|null, // Normalised bounding box [0–1]
 *   jobId:       string,
 * }>}
 */
export async function uploadAndDetect(file, { onProgress } = {}) {
  validateImage(file);

  if (USE_MOCK) return { ...await mockDetect(), jobId: `mock-${Date.now()}` };

  // Build multipart form
  const form = new FormData();
  form.append("file", file, file.name);

  // XHR for upload progress, fetch for simplicity otherwise
  const jobData = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/roads/detect`);

    getAuthToken()
      .then(token => { if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`); })
      .catch(() => {})
      .finally(() => {
        xhr.upload.onprogress = e => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            const body = JSON.parse(xhr.responseText || "{}");
            reject(new RoadServiceError(body.detail || `Upload failed (${xhr.status})`, "NETWORK"));
          }
        };
        xhr.onerror = () => reject(new RoadServiceError("Network error during upload.", "NETWORK"));
        xhr.send(form);
      });
  });

  // If backend returns a jobId, poll until complete
  if (jobData.jobId && !jobData.label) {
    return pollDetectionJob(jobData.jobId);
  }

  return jobData;
}

/**
 * pollDetectionJob — Polls GET /roads/detect/{jobId} until the result is ready.
 *
 * @param {string} jobId
 * @returns {Promise<DetectionResult>}
 */
export async function pollDetectionJob(jobId) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    const data = await apiFetch(`/roads/detect/${jobId}`);

    if (data.status === "complete") return data;
    if (data.status === "failed")   throw new RoadServiceError("AI detection failed on the server.", "DETECTION_FAILED");
    // status === "pending" or "processing" → keep polling
  }
  throw new RoadServiceError("Detection timed out after maximum poll attempts.", "DETECTION_FAILED");
}

// ── Submit road issue ─────────────────────────────────────────────────────────
/**
 * submitIssue — Saves a verified road issue report to Firebase via the backend.
 *
 * @param {object}  issue
 * @param {string}  issue.type         "Pothole" | "Damaged Road" | "Waterlogging" | "Broken Divider" | "Missing Sign" | "Other"
 * @param {string}  issue.severity     "critical" | "high" | "medium" | "low"
 * @param {string}  issue.road         Road name / description
 * @param {string}  [issue.area]       Locality / area name
 * @param {number}  [issue.lat]        GPS latitude
 * @param {number}  [issue.lng]        GPS longitude
 * @param {string}  [issue.desc]       Additional notes
 * @param {string}  [issue.imageUrl]   Uploaded image URL (from storage)
 * @param {object}  [issue.aiResult]   Raw AI detection result
 *
 * @returns {Promise<{ issueId: string, status: "pending", createdAt: string }>}
 */
export async function submitIssue(issue) {
  if (!issue.type)     throw new RoadServiceError("Issue type is required.",     "VALIDATION");
  if (!issue.severity) throw new RoadServiceError("Severity is required.",       "VALIDATION");
  if (!issue.road)     throw new RoadServiceError("Road/location is required.",  "VALIDATION");

  if (USE_MOCK) {
    await sleep(900);
    return {
      issueId:   `ISS-${Date.now()}`,
      status:    "pending",
      createdAt: new Date().toISOString(),
      mock:      true,
    };
  }

  return apiFetch("/roads/issues", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      ...issue,
      reportedAt: new Date().toISOString(),
    }),
  });
}

// ── Fetch issues feed ─────────────────────────────────────────────────────────
const MOCK_ISSUES = [
  { id:"i1", type:"Pothole",        severity:"critical", road:"NH-48, KM 14",     area:"Mahipalpur",    reportedAt:"18 min ago",  status:"verified",    upvotes:47 },
  { id:"i2", type:"Waterlogging",   severity:"high",     road:"Outer Ring Road",  area:"Nangloi",       reportedAt:"1 hr ago",    status:"in-progress", upvotes:31 },
  { id:"i3", type:"Damaged Road",   severity:"high",     road:"Mathura Road",     area:"Badarpur",      reportedAt:"3 hrs ago",   status:"pending",     upvotes:22 },
  { id:"i4", type:"Broken Divider", severity:"medium",   road:"Rohini Sec-3",     area:"Rohini",        reportedAt:"5 hrs ago",   status:"pending",     upvotes:14 },
  { id:"i5", type:"Missing Sign",   severity:"medium",   road:"DND Entry",        area:"Noida Link",    reportedAt:"8 hrs ago",   status:"verified",    upvotes:9  },
  { id:"i6", type:"Pothole",        severity:"low",      road:"MG Road Sec-14",   area:"Gurgaon",       reportedAt:"12 hrs ago",  status:"resolved",    upvotes:6  },
  { id:"i7", type:"Waterlogging",   severity:"critical", road:"Palam Flyover",    area:"Palam",         reportedAt:"20 hrs ago",  status:"in-progress", upvotes:58 },
];

/**
 * getIssues — Returns paginated, filtered road issue reports.
 *
 * @param {object}  [opts]
 * @param {string}  [opts.type]       Filter by issue type
 * @param {string}  [opts.severity]   Filter by severity
 * @param {string}  [opts.status]     Filter by status
 * @param {string}  [opts.sortBy]     "recent" | "upvotes" | "severity"
 * @param {number}  [opts.limit=20]
 * @param {number}  [opts.offset=0]
 * @param {number}  [opts.lat]        Centre for proximity sort
 * @param {number}  [opts.lng]
 * @param {number}  [opts.radiusKm]   Filter to radius around lat/lng
 *
 * @returns {Promise<{ total: number, items: Array }>}
 */
export async function getIssues({
  type      = null,
  severity  = null,
  status    = null,
  sortBy    = "recent",
  limit     = 20,
  offset    = 0,
  lat       = null,
  lng       = null,
  radiusKm  = null,
} = {}) {
  if (USE_MOCK) {
    await sleep(500);
    let items = [...MOCK_ISSUES];
    if (type)     items = items.filter(i => i.type === type);
    if (severity) items = items.filter(i => i.severity === severity);
    if (status)   items = items.filter(i => i.status === status);
    if (sortBy === "upvotes") items.sort((a, b) => b.upvotes - a.upvotes);
    return { total: items.length, items: items.slice(offset, offset + limit) };
  }

  const params = new URLSearchParams();
  if (type)     params.set("type",     type);
  if (severity) params.set("severity", severity);
  if (status)   params.set("status",   status);
  params.set("sort_by", sortBy);
  params.set("limit",   limit);
  params.set("offset",  offset);
  if (lat)      params.set("lat",       lat);
  if (lng)      params.set("lng",       lng);
  if (radiusKm) params.set("radius_km", radiusKm);

  return apiFetch(`/roads/issues?${params}`);
}

/**
 * getIssueById — Fetches a single issue with full detail.
 *
 * @param {string} issueId
 * @returns {Promise<object>}
 */
export async function getIssueById(issueId) {
  if (USE_MOCK) {
    await sleep(300);
    const found = MOCK_ISSUES.find(i => i.id === issueId);
    if (!found) throw new RoadServiceError(`Issue ${issueId} not found.`, "NOT_FOUND");
    return found;
  }
  return apiFetch(`/roads/issues/${issueId}`);
}

/**
 * upvoteIssue — Increments the upvote count for a reported issue.
 * Idempotent — calling twice does not double-count (backend de-dupes by user).
 *
 * @param {string} issueId
 * @returns {Promise<{ issueId: string, upvotes: number }>}
 */
export async function upvoteIssue(issueId) {
  if (USE_MOCK) {
    await sleep(200);
    return { issueId, upvotes: Math.floor(Math.random() * 60) + 1 };
  }
  return apiFetch(`/roads/issues/${issueId}/upvote`, { method: "POST" });
}

/**
 * updateIssueStatus — Allows verified users / admins to change issue status.
 *
 * @param {string} issueId
 * @param {"pending"|"verified"|"in-progress"|"resolved"} newStatus
 * @returns {Promise<{ issueId: string, status: string }>}
 */
export async function updateIssueStatus(issueId, newStatus) {
  if (USE_MOCK) {
    await sleep(300);
    return { issueId, status: newStatus };
  }
  return apiFetch(`/roads/issues/${issueId}/status`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ status: newStatus }),
  });
}

/**
 * deleteIssue — Soft-deletes an issue (own report only).
 *
 * @param {string} issueId
 * @returns {Promise<{ issueId: string, deleted: true }>}
 */
export async function deleteIssue(issueId) {
  if (USE_MOCK) {
    await sleep(300);
    return { issueId, deleted: true };
  }
  return apiFetch(`/roads/issues/${issueId}`, { method: "DELETE" });
}

/**
 * getHotspots — Returns aggregated accident/issue hotspot data for map overlay.
 *
 * @param {object} [opts]
 * @param {number} [opts.days=30]    Lookback window in days
 * @param {number} [opts.minCount=3] Minimum incidents to be a hotspot
 *
 * @returns {Promise<Array<{ lat, lng, count, severity, zone }>>}
 */
export async function getHotspots({ days = 30, minCount = 3 } = {}) {
  if (USE_MOCK) {
    await sleep(600);
    return [
      { lat: 28.6284, lng: 77.2194, count: 142, severity: "critical", zone: "NH-48 Ring Road"      },
      { lat: 28.5928, lng: 77.2475, count: 118, severity: "critical", zone: "Mathura Rd Flyover"   },
      { lat: 28.7041, lng: 77.1025, count: 97,  severity: "high",     zone: "Outer Ring Road N"    },
      { lat: 28.5621, lng: 77.3089, count: 83,  severity: "high",     zone: "DND Flyway"           },
      { lat: 28.5065, lng: 77.1890, count: 71,  severity: "high",     zone: "Mehrauli-Gurgaon Rd"  },
      { lat: 28.7573, lng: 77.1273, count: 64,  severity: "medium",   zone: "GT Karnal Road"       },
      { lat: 28.6647, lng: 77.0508, count: 52,  severity: "medium",   zone: "Rohtak Road NH-9"     },
    ];
  }

  const params = new URLSearchParams({ days, min_count: minCount });
  return apiFetch(`/roads/hotspots?${params}`);
}