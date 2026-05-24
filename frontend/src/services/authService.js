/**
 * authService.js — Firebase Authentication Service Layer
 * Raksha AI · frontend/src/services/
 *
 * Handles:
 *  - Firebase SDK initialisation (singleton)
 *  - Email / password sign-up and sign-in
 *  - Google OAuth sign-in
 *  - Phone number OTP sign-in (for Indian mobile users)
 *  - Sign-out
 *  - Auth state listener / subscription
 *  - ID token retrieval (used by all other services for Bearer auth)
 *  - User profile read and update (Firebase + backend sync)
 *  - Password reset flow
 *  - Account deletion
 *
 * Other services import ONLY `getAuthToken` from this module.
 * Components subscribe via `onAuthStateChanged` or the `useAuth` hook.
 *
 * Usage:
 *  import { signInWithEmail, signUpWithEmail, signOut, onAuthStateChanged } from './authService';
 *
 *  await signUpWithEmail("user@example.com", "password123", { name: "Rahul" });
 *  const token = await getAuthToken();   // called internally by other services
 */

// ── Firebase config (from env) ────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const USE_MOCK  = process.env.REACT_APP_USE_MOCK === "true" || process.env.NODE_ENV === "development";
const BASE_URL  = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api/v1";

// ── Error class ───────────────────────────────────────────────────────────────
export class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AuthError";
    this.code = code; // maps to Firebase error codes or custom ones
  }
}

// ── Friendly error messages (Firebase → human-readable) ──────────────────────
const FIREBASE_ERROR_MAP = {
  "auth/email-already-in-use":    "This email is already registered. Try signing in.",
  "auth/invalid-email":           "Please enter a valid email address.",
  "auth/weak-password":           "Password must be at least 6 characters.",
  "auth/user-not-found":          "No account found for this email.",
  "auth/wrong-password":          "Incorrect password. Please try again.",
  "auth/too-many-requests":       "Too many attempts. Please wait and try again.",
  "auth/network-request-failed":  "Network error. Check your connection.",
  "auth/popup-closed-by-user":    "Sign-in popup was closed. Please try again.",
  "auth/invalid-credential":      "Invalid credentials. Please try again.",
};

function humaniseFirebaseError(err) {
  const friendly = FIREBASE_ERROR_MAP[err.code];
  return new AuthError(friendly || err.message, err.code);
}

// ── Firebase SDK loader (singleton) ──────────────────────────────────────────
let _firebaseApp  = null;
let _auth         = null;
let _sdkPromise   = null;

/**
 * initFirebase — Dynamically imports and initialises the Firebase SDK once.
 * All auth functions call this before doing anything.
 *
 * @returns {Promise<{ app, auth }>}
 */
async function initFirebase() {
  if (_auth) return { app: _firebaseApp, auth: _auth };
  if (_sdkPromise) return _sdkPromise;

  _sdkPromise = (async () => {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js");
    const { getAuth }                = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js");

    _firebaseApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    _auth        = getAuth(_firebaseApp);
    return { app: _firebaseApp, auth: _auth };
  })();

  return _sdkPromise;
}

// ── Mock user store (dev only) ────────────────────────────────────────────────
let _mockUser = null;
const _authListeners = new Set();

function setMockUser(user) {
  _mockUser = user;
  _authListeners.forEach(cb => cb(user));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Token cache ───────────────────────────────────────────────────────────────
let _tokenCache = null;
let _tokenExpiry = 0;

/**
 * getAuthToken — Returns the current Firebase ID token.
 * Caches the token and refreshes it when it's within 5 minutes of expiry.
 * Returns null (not throwing) if no user is signed in.
 *
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<string|null>}
 */
export async function getAuthToken(forceRefresh = false) {
  if (USE_MOCK) {
    return _mockUser ? `mock-token-${_mockUser.uid}` : null;
  }

  const now = Date.now();
  if (!forceRefresh && _tokenCache && now < _tokenExpiry - 5 * 60 * 1000) {
    return _tokenCache;
  }

  try {
    const { auth } = await initFirebase();
    const user = auth.currentUser;
    if (!user) return null;

    const token   = await user.getIdToken(forceRefresh);
    const payload = JSON.parse(atob(token.split(".")[1]));
    _tokenCache   = token;
    _tokenExpiry  = payload.exp * 1000;
    return token;
  } catch {
    return null;
  }
}

// ── Auth state listener ───────────────────────────────────────────────────────
/**
 * onAuthStateChanged — Subscribes to auth state changes.
 * Calls `callback` immediately with the current user (or null),
 * then again on every sign-in / sign-out.
 *
 * @param {function} callback   (user: UserProfile | null) => void
 * @returns {function}          Unsubscribe function
 *
 * Usage:
 *   const unsub = onAuthStateChanged(user => setCurrentUser(user));
 *   // later: unsub();
 */
export function onAuthStateChanged(callback) {
  if (USE_MOCK) {
    _authListeners.add(callback);
    callback(_mockUser); // immediate call with current value
    return () => _authListeners.delete(callback);
  }

  let unsubscribe = () => {};
  initFirebase().then(({ auth }) => {
    const { onAuthStateChanged: fbListener } = require("firebase/auth");
    unsubscribe = fbListener(auth, async fbUser => {
      if (!fbUser) { callback(null); return; }
      callback(normaliseUser(fbUser));
    });
  });

  return () => unsubscribe();
}

// ── User normaliser ───────────────────────────────────────────────────────────
function normaliseUser(fbUser) {
  return {
    uid:          fbUser.uid,
    email:        fbUser.email,
    name:         fbUser.displayName || "Raksha User",
    phone:        fbUser.phoneNumber,
    photoUrl:     fbUser.photoURL,
    emailVerified: fbUser.emailVerified,
    provider:     fbUser.providerData[0]?.providerId ?? "password",
    createdAt:    fbUser.metadata.creationTime,
  };
}

// ── Sign-up with email ────────────────────────────────────────────────────────
/**
 * signUpWithEmail — Creates a new account with email + password.
 * Optionally sets displayName. Syncs user profile to backend.
 *
 * @param {string}  email
 * @param {string}  password
 * @param {object}  [profile]
 * @param {string}  [profile.name]    Display name
 * @param {string}  [profile.phone]   Contact number (not Firebase phone auth)
 *
 * @returns {Promise<UserProfile>}
 */
export async function signUpWithEmail(email, password, profile = {}) {
  if (!email || !password) throw new AuthError("Email and password are required.", "MISSING_FIELDS");

  if (USE_MOCK) {
    await sleep(900);
    const user = { uid: `mock-${Date.now()}`, email, name: profile.name || "Raksha User", phone: profile.phone || null, emailVerified: false, provider: "password", createdAt: new Date().toISOString() };
    setMockUser(user);
    return user;
  }

  try {
    const { auth } = await initFirebase();
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js");

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (profile.name) await updateProfile(credential.user, { displayName: profile.name });
    await sendEmailVerification(credential.user);

    // Sync to backend
    const token = await credential.user.getIdToken();
    await syncProfileToBackend(token, { email, ...profile });

    return normaliseUser(credential.user);
  } catch (err) {
    throw humaniseFirebaseError(err);
  }
}

// ── Sign-in with email ────────────────────────────────────────────────────────
/**
 * signInWithEmail — Signs in an existing user with email + password.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserProfile>}
 */
export async function signInWithEmail(email, password) {
  if (!email || !password) throw new AuthError("Email and password are required.", "MISSING_FIELDS");

  if (USE_MOCK) {
    await sleep(800);
    const user = { uid: "mock-uid-001", email, name: "Raksha User", phone: null, emailVerified: true, provider: "password", createdAt: "2024-01-01T00:00:00.000Z" };
    setMockUser(user);
    return user;
  }

  try {
    const { auth } = await initFirebase();
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js");
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return normaliseUser(credential.user);
  } catch (err) {
    throw humaniseFirebaseError(err);
  }
}

// ── Google OAuth sign-in ──────────────────────────────────────────────────────
/**
 * signInWithGoogle — Opens a Google OAuth popup and signs the user in.
 *
 * @returns {Promise<UserProfile>}
 */
export async function signInWithGoogle() {
  if (USE_MOCK) {
    await sleep(700);
    const user = { uid: "mock-google-001", email: "user@gmail.com", name: "Google User", phone: null, emailVerified: true, provider: "google.com", photoUrl: null, createdAt: new Date().toISOString() };
    setMockUser(user);
    return user;
  }

  try {
    const { auth } = await initFirebase();
    const { GoogleAuthProvider, signInWithPopup } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js");
    const provider    = new GoogleAuthProvider();
    const credential  = await signInWithPopup(auth, provider);
    const token       = await credential.user.getIdToken();
    await syncProfileToBackend(token, {
      email:   credential.user.email,
      name:    credential.user.displayName,
      photoUrl:credential.user.photoURL,
    });
    return normaliseUser(credential.user);
  } catch (err) {
    throw humaniseFirebaseError(err);
  }
}

// ── Phone OTP sign-in ─────────────────────────────────────────────────────────
/**
 * sendOTP — Sends an SMS OTP to the given Indian mobile number.
 * Returns a confirmation result object needed for verifyOTP.
 *
 * @param {string}  phoneNumber   E.164 format, e.g. "+919876543210"
 * @param {object}  recaptchaVerifier   window.grecaptcha verifier instance
 *
 * @returns {Promise<ConfirmationResult>}
 */
export async function sendOTP(phoneNumber, recaptchaVerifier) {
  if (USE_MOCK) {
    await sleep(1000);
    return { confirm: async () => {
      const user = { uid:"mock-phone-001", email:null, name:"Phone User", phone:phoneNumber, emailVerified:false, provider:"phone", createdAt:new Date().toISOString() };
      setMockUser(user);
      return user;
    }};
  }

  try {
    const { auth } = await initFirebase();
    const { signInWithPhoneNumber } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js");
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  } catch (err) {
    throw humaniseFirebaseError(err);
  }
}

/**
 * verifyOTP — Verifies the OTP code entered by the user.
 *
 * @param {ConfirmationResult} confirmationResult   Returned by sendOTP
 * @param {string}             code                 6-digit OTP
 *
 * @returns {Promise<UserProfile>}
 */
export async function verifyOTP(confirmationResult, code) {
  if (USE_MOCK) return confirmationResult.confirm(code);
  try {
    const credential = await confirmationResult.confirm(code);
    return normaliseUser(credential.user);
  } catch (err) {
    throw humaniseFirebaseError(err);
  }
}

// ── Sign-out ──────────────────────────────────────────────────────────────────
/**
 * signOut — Signs the current user out of Firebase and clears local state.
 *
 * @returns {Promise<void>}
 */
export async function signOut() {
  _tokenCache  = null;
  _tokenExpiry = 0;

  if (USE_MOCK) {
    await sleep(300);
    setMockUser(null);
    return;
  }

  const { auth } = await initFirebase();
  const { signOut: fbSignOut } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js");
  await fbSignOut(auth);
}

// ── Password reset ────────────────────────────────────────────────────────────
/**
 * sendPasswordReset — Sends a password-reset email to the given address.
 *
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function sendPasswordReset(email) {
  if (!email) throw new AuthError("Email is required.", "MISSING_FIELDS");

  if (USE_MOCK) { await sleep(700); return; }

  try {
    const { auth } = await initFirebase();
    const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js");
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    throw humaniseFirebaseError(err);
  }
}

// ── Profile CRUD ──────────────────────────────────────────────────────────────
/**
 * getUserProfile — Returns the currently signed-in user's profile from
 * the backend (richer than Firebase's native profile).
 *
 * @returns {Promise<UserProfile>}
 */
export async function getUserProfile() {
  const token = await getAuthToken();
  if (!token) throw new AuthError("Not authenticated.", "UNAUTHENTICATED");

  if (USE_MOCK) {
    await sleep(400);
    return { ..._mockUser, emergencyContacts: [], preferredZone: "New Delhi", notificationsEnabled: true };
  }

  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new AuthError("Failed to fetch profile.", "NETWORK");
  return res.json();
}

/**
 * updateUserProfile — Updates the backend user profile.
 *
 * @param {object} updates   Partial profile fields to update
 * @returns {Promise<UserProfile>}
 */
export async function updateUserProfile(updates) {
  const token = await getAuthToken();
  if (!token) throw new AuthError("Not authenticated.", "UNAUTHENTICATED");

  if (USE_MOCK) {
    await sleep(500);
    setMockUser({ ..._mockUser, ...updates });
    return { ..._mockUser, ...updates };
  }

  const res = await fetch(`${BASE_URL}/users/me`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body:    JSON.stringify(updates),
  });
  if (!res.ok) throw new AuthError("Failed to update profile.", "NETWORK");
  return res.json();
}

/**
 * deleteAccount — Permanently deletes the user's account from Firebase
 * and removes their data from the backend.
 *
 * @returns {Promise<void>}
 */
export async function deleteAccount() {
  const token = await getAuthToken();
  if (!token) throw new AuthError("Not authenticated.", "UNAUTHENTICATED");

  if (USE_MOCK) {
    await sleep(600);
    setMockUser(null);
    return;
  }

  // Delete from backend first
  await fetch(`${BASE_URL}/users/me`, {
    method:  "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Then from Firebase
  const { auth } = await initFirebase();
  await auth.currentUser?.delete();
  _tokenCache  = null;
  _tokenExpiry = 0;
}

// ── Internal: sync profile to backend on first sign-in ───────────────────────
async function syncProfileToBackend(token, profile) {
  try {
    await fetch(`${BASE_URL}/users/sync`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify(profile),
    });
  } catch {
    // Non-blocking — profile sync failure does not block login
    console.warn("[authService] Backend profile sync failed. Will retry on next login.");
  }
}

// ── Convenience getter ────────────────────────────────────────────────────────
/**
 * getCurrentUser — Synchronous getter for the current Firebase user.
 * Returns null if not signed in or SDK not yet loaded.
 *
 * @returns {UserProfile|null}
 */
export function getCurrentUser() {
  if (USE_MOCK) return _mockUser;
  return _auth?.currentUser ? normaliseUser(_auth.currentUser) : null;
}