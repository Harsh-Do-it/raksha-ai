/**
 * riskService.js — Accident Risk Prediction Service Layer
 * Raksha AI · frontend/src/services/
 *
 * Handles:
 *  - Requesting ML-based zone risk scores from the FastAPI backend
 *  - Fetching the live alert feed of high-risk zones
 *  - Subscribing to real-time risk updates via Server-Sent Events (SSE)
 *  - Retrieving historical risk analytics (hourly, daily, weekly trends)
 *  - Route risk profiling (risk score along a polyline)
 *  - Checking a single coordinate against current risk thresholds
 *
 * Backend ML model inputs:
 *   - Time of day      → encodes circadian traffic patterns
 *   - Weather          → rain/fog multiplier
 *   - Road condition   → pothole / waterlogging penalty
 *   - Traffic level    → congestion coefficient
 *   - Historical data  → baseline accident rate per zone
 *
 * Usage:
 *  import { getRiskScore, getLiveAlerts, subscribeToAlerts } from './riskService';
 *
 *  const { score, label, factors } = await getRiskScore({ lat: 28.61, lng: 77.20, time: "evening" });
 *  const unsubscribe = subscribeToAlerts(alert => console.log(alert));
 */

import { getAuthToken } from "./authService";

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL  = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api/v1";
const USE_MOCK  = process.env.REACT_APP_USE_MOCK === "true" || process.env.NODE_ENV === "development";

/** Thresholds that map numeric scores to risk labels */
export const RISK_THRESHOLDS = {
  critical: 75,
  high:     50,
  medium:   30,
  // below medium → "low"
};

// ── Error class ───────────────────────────────────────────────────────────────
export class RiskServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "RiskServiceError";
    this.code = code; // "NETWORK" | "INVALID_INPUT" | "MODEL_ERROR"
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiFetch(path, opts = {}) {
  const token = await getAuthToken().catch(() => null);
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new RiskServiceError(body.detail || `HTTP ${res.status}`, "NETWORK");
  }
  return res.json();
}

/**
 * scoreToLabel — Converts a 0–100 integer score to a risk label.
 *
 * @param {number} score
 * @returns {"critical"|"high"|"medium"|"low"}
 */
export function scoreToLabel(score) {
  if (score >= RISK_THRESHOLDS.critical) return "critical";
  if (score >= RISK_THRESHOLDS.high)     return "high";
  if (score >= RISK_THRESHOLDS.medium)   return "medium";
  return "low";
}

/**
 * scoreToColor — Maps a risk score to the standard Raksha AI colour palette.
 *
 * @param {number} score
 * @returns {string} CSS hex colour
 */
export function scoreToColor(score) {
  const COLORS = { critical: "#dc2626", high: "#f97316", medium: "#eab308", low: "#22c55e" };
  return COLORS[scoreToLabel(score)];
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_ALERTS = [
  { id:"a1", zone:"NH-48 Ring Road",      lat:28.6284, lng:77.2194, score:88, severity:"critical", reason:"Peak hour + wet road surface",        time:"Now",     status:"active"            },
  { id:"a2", zone:"Outer Ring Road N",    lat:28.7041, lng:77.1025, score:72, severity:"high",     reason:"Night + poor visibility + fog",        time:"8m ago",  status:"active"            },
  { id:"a3", zone:"DND Flyway",           lat:28.5621, lng:77.3089, score:68, severity:"high",     reason:"Active construction zone",             time:"14m ago", status:"active"            },
  { id:"a4", zone:"Mathura Rd Flyover",   lat:28.5928, lng:77.2475, score:53, severity:"high",     reason:"Moderate traffic congestion",          time:"22m ago", status:"active"            },
  { id:"a5", zone:"Rohtak Road NH-9",     lat:28.6647, lng:77.0508, score:44, severity:"medium",   reason:"Light rain — slick surface detected",  time:"31m ago", status:"active"            },
  { id:"a6", zone:"GT Karnal Expressway", lat:28.7573, lng:77.1273, score:31, severity:"medium",   reason:"Reduced visibility at dusk",           time:"45m ago", status:"active"            },
  { id:"a7", zone:"Mehrauli-Gurgaon Rd",  lat:28.5065, lng:77.1890, score:21, severity:"low",      reason:"Below-average incident count today",   time:"1h ago",  status:"cleared"           },
];

const MOCK_HOURLY = [14,8,5,4,6,10,18,32,47,38,29,24,21,19,23,28,35,41,52,61,48,37,29,20];

function mockRiskScore({ time = "", weather = "", road = "", traffic = "" } = {}) {
  let score = 20;
  if (time.includes("Peak") || time.includes("Night"))              score += 25;
  if (weather.includes("Rain") || weather.includes("Fog"))          score += 20;
  if (road.includes("Pothole") || road.includes("Damaged"))         score += 20;
  if (traffic.includes("Heavy") || traffic.includes("Stop"))        score += 15;
  score = Math.min(score + Math.floor(Math.random() * 8), 99);

  const label = scoreToLabel(score);
  return {
    score,
    label,
    color: scoreToColor(score),
    factors: {
      timeOfDay:    time.includes("Peak") || time.includes("Night") ? 8 : 4,
      weather:      weather.includes("Rain") || weather.includes("Fog") ? 7 : 3,
      roadCondition:road.includes("Pothole") || road.includes("Damaged") ? 8 : 3,
      trafficLevel: traffic.includes("Heavy") || traffic.includes("Stop") ? 7 : 4,
    },
    advice: score >= 75
      ? "Avoid this zone if possible. High accident probability detected."
      : score >= 50
      ? "Drive with extreme caution. Multiple risk factors active."
      : score >= 30
      ? "Normal precautions advised. Monitor conditions."
      : "Zone appears safe. Standard driving precautions apply.",
    generatedAt: new Date().toISOString(),
  };
}

// ── Risk score API ────────────────────────────────────────────────────────────
/**
 * getRiskScore — Calls the ML model endpoint with environmental inputs and
 * returns a composite risk score for the given location and conditions.
 *
 * @param {object}  params
 * @param {number}  [params.lat]        Latitude  (optional — improves localisation)
 * @param {number}  [params.lng]        Longitude
 * @param {string}  [params.time]       Time condition string, e.g. "Peak Morning (7–10AM)"
 * @param {string}  [params.weather]    Weather string, e.g. "Heavy Rain"
 * @param {string}  [params.road]       Road condition string, e.g. "Potholes"
 * @param {string}  [params.traffic]    Traffic level string, e.g. "Heavy"
 * @param {string}  [params.zone]       Named zone override (bypasses lat/lng lookup)
 *
 * @returns {Promise<{
 *   score:       number,           // 0–100
 *   label:       "critical"|"high"|"medium"|"low",
 *   color:       string,           // hex colour
 *   factors:     { timeOfDay, weather, roadCondition, trafficLevel }, // each 0–10
 *   advice:      string,
 *   generatedAt: string,           // ISO timestamp
 * }>}
 */
export async function getRiskScore(params = {}) {
  if (USE_MOCK) {
    await sleep(1500);
    return mockRiskScore(params);
  }

  return apiFetch("/risk/score", {
    method: "POST",
    body:   JSON.stringify(params),
  });
}

/**
 * getRiskForCoordinate — Convenience wrapper: gets the current real-time risk
 * for a specific lat/lng using live conditions pulled from weather/traffic APIs.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<RiskScoreResult>}
 */
export async function getRiskForCoordinate(lat, lng) {
  if (USE_MOCK) {
    await sleep(800);
    const score = Math.round(20 + Math.random() * 70);
    return { score, label: scoreToLabel(score), color: scoreToColor(score), factors: {}, advice: "", generatedAt: new Date().toISOString() };
  }
  const params = new URLSearchParams({ lat, lng });
  return apiFetch(`/risk/coordinate?${params}`);
}

// ── Live alert feed ───────────────────────────────────────────────────────────
/**
 * getLiveAlerts — Fetches the current live alert feed sorted by severity.
 *
 * @param {object}  [opts]
 * @param {string}  [opts.minSeverity]  "critical" | "high" | "medium" | "low"
 * @param {number}  [opts.limit=20]
 * @param {string}  [opts.status]       "active" | "cleared" | all
 *
 * @returns {Promise<Array<{
 *   id: string, zone: string, lat: number, lng: number,
 *   score: number, severity: string, reason: string,
 *   time: string, status: string
 * }>>}
 */
export async function getLiveAlerts({
  minSeverity = null,
  limit       = 20,
  status      = "active",
} = {}) {
  if (USE_MOCK) {
    await sleep(500);
    const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
    let items = [...MOCK_ALERTS];
    if (status)      items = items.filter(a => a.status === status);
    if (minSeverity) items = items.filter(a => SEV_ORDER[a.severity] <= SEV_ORDER[minSeverity]);
    items.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
    return items.slice(0, limit);
  }

  const params = new URLSearchParams({ limit });
  if (minSeverity) params.set("min_severity", minSeverity);
  if (status)      params.set("status", status);
  return apiFetch(`/risk/alerts?${params}`);
}

// ── SSE real-time subscription ────────────────────────────────────────────────
/**
 * subscribeToAlerts — Opens a Server-Sent Events stream for real-time risk
 * alert updates. Reconnects automatically on disconnect.
 *
 * @param {function}  onAlert     Called with each new alert object
 * @param {function}  [onError]   Called with error (optional)
 * @returns {function}            Unsubscribe function — call to close the stream
 *
 * Usage:
 *   const unsub = subscribeToAlerts(alert => setAlerts(prev => [alert, ...prev]));
 *   // later:
 *   unsub();
 */
export function subscribeToAlerts(onAlert, onError) {
  if (USE_MOCK) {
    // Simulate periodic alerts in dev mode
    const MOCK_NEW = [
      { id:`m${Date.now()}1`, zone:"ITO Crossing",        score:79, severity:"critical", reason:"Flash flood risk detected", time:"Just now", status:"active" },
      { id:`m${Date.now()}2`, zone:"Ashram Chowk",        score:62, severity:"high",     reason:"Heavy traffic buildup",      time:"Just now", status:"active" },
      { id:`m${Date.now()}3`, zone:"Dhaula Kuan Flyover", score:48, severity:"medium",   reason:"Light rain — drive slowly",  time:"Just now", status:"active" },
    ];
    let i = 0;
    const interval = setInterval(() => {
      onAlert(MOCK_NEW[i % MOCK_NEW.length]);
      i++;
    }, 12000); // new mock alert every 12 s
    return () => clearInterval(interval);
  }

  let es;
  let reconnectTimer;

  function connect() {
    es = new EventSource(`${BASE_URL}/risk/stream`);

    es.onmessage = event => {
      try {
        const alert = JSON.parse(event.data);
        onAlert(alert);
      } catch (err) {
        onError?.(new RiskServiceError("Failed to parse SSE message.", "MODEL_ERROR"));
      }
    };

    es.onerror = () => {
      es.close();
      onError?.(new RiskServiceError("Alert stream disconnected. Reconnecting…", "NETWORK"));
      reconnectTimer = setTimeout(connect, 5000); // reconnect after 5 s
    };
  }

  connect();

  return () => {
    clearTimeout(reconnectTimer);
    es?.close();
  };
}

// ── Historical analytics ──────────────────────────────────────────────────────
/**
 * getHourlyDistribution — Returns accident count per hour of day (0–23)
 * for the given lookback window.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.days=30]
 * @param {string}  [opts.zone]       Optional zone filter
 *
 * @returns {Promise<number[]>}  Array of 24 counts indexed by hour
 */
export async function getHourlyDistribution({ days = 30, zone = null } = {}) {
  if (USE_MOCK) {
    await sleep(400);
    return MOCK_HOURLY;
  }
  const params = new URLSearchParams({ days });
  if (zone) params.set("zone", zone);
  return apiFetch(`/risk/analytics/hourly?${params}`);
}

/**
 * getZoneRankings — Returns all monitored zones sorted by composite risk score.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.limit=20]
 * @param {number}  [opts.days=30]    Lookback for historical weighting
 *
 * @returns {Promise<Array<{ zone, lat, lng, score, count, delta }>>}
 */
export async function getZoneRankings({ limit = 20, days = 30 } = {}) {
  if (USE_MOCK) {
    await sleep(600);
    return [
      { zone:"NH-48 Ring Road",      lat:28.6284, lng:77.2194, score:88, count:142, delta:+18 },
      { zone:"Mathura Rd Flyover",   lat:28.5928, lng:77.2475, score:74, count:118, delta:-6  },
      { zone:"Outer Ring Road N",    lat:28.7041, lng:77.1025, score:67, count:97,  delta:+31 },
      { zone:"DND Flyway",           lat:28.5621, lng:77.3089, score:58, count:83,  delta:+4  },
      { zone:"Mehrauli-Gurgaon Rd",  lat:28.5065, lng:77.1890, score:49, count:71,  delta:-12 },
      { zone:"GT Karnal Road",       lat:28.7573, lng:77.1273, score:42, count:64,  delta:+9  },
      { zone:"Rohtak Road NH-9",     lat:28.6647, lng:77.0508, score:34, count:52,  delta:-3  },
    ].slice(0, limit);
  }
  const params = new URLSearchParams({ limit, days });
  return apiFetch(`/risk/analytics/zones?${params}`);
}

/**
 * getRouteRiskProfile — Evaluates risk score at intervals along a route
 * (encoded polyline or array of coordinates). Useful for showing a per-segment
 * risk heat overlay on a route.
 *
 * @param {Array<{ lat: number, lng: number }>} waypoints
 * @param {object}  [opts]
 * @param {string}  [opts.time]
 * @param {string}  [opts.weather]
 *
 * @returns {Promise<Array<{ lat, lng, score, label, color }>>}
 */
export async function getRouteRiskProfile(waypoints, opts = {}) {
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    throw new RiskServiceError("At least 2 waypoints are required.", "INVALID_INPUT");
  }

  if (USE_MOCK) {
    await sleep(700);
    return waypoints.map(pt => {
      const score = Math.round(20 + Math.random() * 75);
      return { ...pt, score, label: scoreToLabel(score), color: scoreToColor(score) };
    });
  }

  return apiFetch("/risk/route-profile", {
    method: "POST",
    body:   JSON.stringify({ waypoints, ...opts }),
  });
}

// ── User alert preferences ────────────────────────────────────────────────────
/**
 * getUserAlertPreferences — Fetches the authenticated user's alert settings.
 *
 * @returns {Promise<{ minSeverity: string, zones: string[], pushEnabled: boolean, smsEnabled: boolean }>}
 */
export async function getUserAlertPreferences() {
  if (USE_MOCK) {
    return { minSeverity: "high", zones: [], pushEnabled: true, smsEnabled: false };
  }
  return apiFetch("/risk/preferences");
}

/**
 * updateAlertPreferences — Saves the user's alert preferences.
 *
 * @param {object} prefs
 * @returns {Promise<object>}
 */
export async function updateAlertPreferences(prefs) {
  if (USE_MOCK) {
    await sleep(300);
    return { ...prefs, updated: true };
  }
  return apiFetch("/risk/preferences", {
    method: "PUT",
    body:   JSON.stringify(prefs),
  });
}