/**
 * sosService.js — Emergency SOS Service Layer
 * Raksha AI · frontend/src/services/
 *
 * Handles:
 *  - Building and sending SOS alert payloads to the FastAPI backend
 *  - Notifying emergency contacts via backend relay
 *  - Fetching nearby hospitals (Google Maps Places API via backend)
 *  - Simulated ambulance dispatch with ETA
 *  - Retry logic for critical emergency requests
 *
 * Usage:
 *  import { sendSOS, getNearbyHospitals, cancelSOS } from './sosService';
 *
 *  const result = await sendSOS({ lat: 28.6139, lng: 77.2090 });
 *  // → { alertId, hospitals, ambulanceETA, contacts_notified }
 */

import { getAuthToken } from "./authService";

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL       = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api/v1";
const USE_MOCK       = process.env.REACT_APP_USE_MOCK === "true" || process.env.NODE_ENV === "development";
const SOS_TIMEOUT_MS = 8000;   // 8 s hard timeout on emergency requests
const MAX_RETRIES    = 3;       // retry up to 3× before giving up
const RETRY_DELAY_MS = 1200;   // delay between retries

// ── Error classes ─────────────────────────────────────────────────────────────
export class SOSNetworkError extends Error {
  constructor(message, { status, retries } = {}) {
    super(message);
    this.name   = "SOSNetworkError";
    this.status  = status;
    this.retries = retries;
  }
}

export class SOSLocationError extends Error {
  constructor(message) {
    super(message);
    this.name = "SOSLocationError";
  }
}

// ── Internal fetch wrapper with timeout + retry ───────────────────────────────
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), SOS_TIMEOUT_MS);

  try {
    const token = await getAuthToken().catch(() => null);
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new SOSNetworkError(body.detail || `HTTP ${res.status}`, { status: res.status });
    }

    return res.json();
  } catch (err) {
    clearTimeout(timer);

    const isRetryable =
      err.name === "AbortError" ||
      (err instanceof SOSNetworkError && err.status >= 500) ||
      err.message === "Failed to fetch";

    if (isRetryable && retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return fetchWithRetry(url, options, retries - 1);
    }

    throw err instanceof SOSNetworkError
      ? err
      : new SOSNetworkError(err.message, { retries: MAX_RETRIES - retries });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Geolocation helper ────────────────────────────────────────────────────────
/**
 * Acquires the device's current GPS position.
 * Falls back to a default Delhi coordinate if permission is denied.
 *
 * @param {object}  [opts]
 * @param {boolean} [opts.highAccuracy=true]
 * @param {number}  [opts.timeoutMs=6000]
 * @param {boolean} [opts.allowFallback=true]   Use Delhi coords if GPS fails
 * @returns {Promise<{ lat: number, lng: number, accuracy: number|null, isFallback: boolean }>}
 */
export async function getCurrentLocation({
  highAccuracy   = true,
  timeoutMs      = 6000,
  allowFallback  = true,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      if (allowFallback) {
        resolve({ lat: 28.6139, lng: 77.2090, accuracy: null, isFallback: true });
      } else {
        reject(new SOSLocationError("Geolocation API not supported in this browser."));
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        lat:        pos.coords.latitude,
        lng:        pos.coords.longitude,
        accuracy:   pos.coords.accuracy,
        isFallback: false,
      }),
      err => {
        if (allowFallback) {
          resolve({ lat: 28.6139, lng: 77.2090, accuracy: null, isFallback: true });
        } else {
          reject(new SOSLocationError(`GPS error (${err.code}): ${err.message}`));
        }
      },
      { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: 0 }
    );
  });
}

// ── Mock implementations ──────────────────────────────────────────────────────
const MOCK_HOSPITALS = [
  { id: "h1", name: "AIIMS Trauma Centre",       distance: "1.2 km", eta: "4 min",  phone: "011-26588500", lat: 28.5672, lng: 77.2100 },
  { id: "h2", name: "Safdarjung Hospital",        distance: "2.7 km", eta: "8 min",  phone: "011-26707444", lat: 28.5692, lng: 77.2062 },
  { id: "h3", name: "Ram Manohar Lohia Hospital", distance: "3.1 km", eta: "10 min", phone: "011-23404359", lat: 28.6248, lng: 77.2070 },
];

async function mockSendSOS(payload) {
  await sleep(1600);
  return {
    alertId:           `SOS-${Date.now()}`,
    status:            "dispatched",
    timestamp:         new Date().toISOString(),
    location:          payload.location,
    hospitals:         MOCK_HOSPITALS,
    ambulanceETA:      "6 min",
    ambulanceUnit:     "DL-AMB-042",
    contacts_notified: payload.emergencyContacts?.length ?? 0,
    policeNotified:    true,
    mock:              true,
  };
}

async function mockGetNearbyHospitals(lat, lng) {
  await sleep(900);
  return MOCK_HOSPITALS;
}

async function mockCancelSOS(alertId) {
  await sleep(500);
  return { alertId, status: "cancelled", timestamp: new Date().toISOString() };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * sendSOS — Core function. Acquires GPS (if not pre-supplied), sends alert
 * to backend, which dispatches ambulance + notifies contacts.
 *
 * @param {object}   [opts]
 * @param {object}   [opts.location]           Pre-resolved { lat, lng } (skips GPS call)
 * @param {string[]} [opts.emergencyContacts]  Phone numbers to SMS-notify via backend
 * @param {string}   [opts.userId]             Firebase UID for auth-linked alerts
 * @param {string}   [opts.note]               Optional user-provided note
 *
 * @returns {Promise<{
 *   alertId:           string,
 *   status:            "dispatched" | "failed",
 *   timestamp:         string,
 *   location:          { lat: number, lng: number, isFallback: boolean },
 *   hospitals:         Array,
 *   ambulanceETA:      string,
 *   ambulanceUnit:     string,
 *   contacts_notified: number,
 *   policeNotified:    boolean,
 * }>}
 */
export async function sendSOS({
  location         = null,
  emergencyContacts = [],
  userId           = null,
  note             = "",
} = {}) {
  // Acquire location if not provided
  const resolvedLocation = location ?? await getCurrentLocation({ allowFallback: true });

  const payload = {
    location:          resolvedLocation,
    emergencyContacts,
    userId,
    note,
    deviceInfo: {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    },
  };

  if (USE_MOCK) return mockSendSOS(payload);

  return fetchWithRetry(`${BASE_URL}/sos`, {
    method: "POST",
    body:   JSON.stringify(payload),
  });
}

/**
 * getNearbyHospitals — Returns hospitals sorted by distance from the given
 * coordinates. Calls backend which proxies Google Maps Places API.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {object} [opts]
 * @param {number} [opts.radiusKm=5]   Search radius in km
 * @param {number} [opts.limit=5]      Max results
 *
 * @returns {Promise<Array<{
 *   id: string, name: string, distance: string, eta: string,
 *   phone: string, lat: number, lng: number,
 *   beds?: number, type?: string, open24h?: boolean
 * }>>}
 */
export async function getNearbyHospitals(lat, lng, { radiusKm = 5, limit = 5 } = {}) {
  if (USE_MOCK) return mockGetNearbyHospitals(lat, lng);

  const params = new URLSearchParams({ lat, lng, radius_km: radiusKm, limit });
  return fetchWithRetry(`${BASE_URL}/sos/nearby-hospitals?${params}`);
}

/**
 * cancelSOS — Cancels an active SOS alert (e.g. accidental trigger).
 * Backend revokes notifications and marks alert as false alarm.
 *
 * @param {string} alertId   The alertId returned by sendSOS
 * @param {string} [reason]  Optional cancellation reason
 *
 * @returns {Promise<{ alertId: string, status: "cancelled", timestamp: string }>}
 */
export async function cancelSOS(alertId, reason = "User cancelled") {
  if (USE_MOCK) return mockCancelSOS(alertId);

  return fetchWithRetry(`${BASE_URL}/sos/${alertId}/cancel`, {
    method: "POST",
    body:   JSON.stringify({ reason }),
  });
}

/**
 * getSOSHistory — Fetches the authenticated user's past SOS activations.
 *
 * @param {object} [opts]
 * @param {number} [opts.limit=10]
 * @param {number} [opts.offset=0]
 *
 * @returns {Promise<{ total: number, items: Array }>}
 */
export async function getSOSHistory({ limit = 10, offset = 0 } = {}) {
  if (USE_MOCK) {
    await sleep(600);
    return { total: 0, items: [] };
  }

  const params = new URLSearchParams({ limit, offset });
  return fetchWithRetry(`${BASE_URL}/sos/history?${params}`);
}