/**
 * authService.js — Raksha AI simple token auth
 * Works with the Flask /auth/* endpoints.
 * Stores token + user info in localStorage.
 */

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || "http://127.0.0.1:5000";

const STORAGE_KEY = "raksha_auth";

// ── Storage helpers ───────────────────────────────────────────────────────────

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredAuth(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export async function getAuthToken() {
  const auth = getStoredAuth();
  return auth?.token ?? null;
}

export function getCurrentUser() {
  return getStoredAuth();
}

export function isAuthenticated() {
  return !!getStoredAuth()?.token;
}

export function isAdmin() {
  return getStoredAuth()?.role === "admin";
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function authPost(path, body) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth functions ─────────────────────────────────────────────────────────────

/**
 * Register a new user account.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
export async function register(name, email, password) {
  const data = await post("/auth/register", { name, email, password });
  // Don't auto-login after register — let user login explicitly
  return data;
}

/**
 * Login as a regular user.
 * @param {string} email
 * @param {string} password
 * @returns {{ token, name, role, user_id }}
 */
export async function login(email, password) {
  const data = await post("/auth/login", { email, password });
  setStoredAuth(data);
  return data;
}

/**
 * Login as an admin using admin credentials.
 * @param {string} username  Admin username (from .env ADMIN_USERNAME)
 * @param {string} password  Admin password (from .env ADMIN_PASSWORD)
 */
export async function loginAdmin(username, password) {
  const data = await post("/auth/admin/login", { username, password });
  setStoredAuth(data);
  return data;
}

/**
 * Logout current user (clears localStorage + calls backend).
 */
export async function logout() {
  try {
    await authPost("/auth/logout", {});
  } catch {
    // ignore network errors on logout
  }
  clearStoredAuth();
}

export default { register, login, loginAdmin, logout, getAuthToken, getCurrentUser, isAuthenticated, isAdmin };