/**
 * AuthContext.jsx — Global Authentication State Provider
 * Raksha AI · frontend/src/context/
 *
 * Provides the entire app with:
 *  - Current user object (uid, email, name, phone, role, etc.)
 *  - Authentication loading state (for splash screens / route guards)
 *  - Sign-up, sign-in (email + Google + phone OTP), sign-out actions
 *  - Password reset
 *  - Role / permission checks (isAdmin, isVerifiedReporter)
 *  - Auth error state with human-readable messages
 *  - Token auto-refresh (transparent to components)
 *  - Route guard helper: `requireAuth()`
 *
 * All Firebase calls are delegated to `authService.js`.
 * This context only manages React state and side-effects.
 *
 * Usage:
 *  // Wrap app in App.jsx (inside LocationProvider):
 *  <AuthProvider>
 *    <RouterApp />
 *  </AuthProvider>
 *
 *  // In any component:
 *  const { user, signIn, signOut, isAdmin, authLoading } = useAuth();
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  sendOTP,
  verifyOTP,
  signOut as serviceSignOut,
  sendPasswordReset,
  updateUserProfile,
  deleteAccount,
  getAuthToken,
} from "../services/authService";

// ── User roles ────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN:    "admin",
  REPORTER: "reporter",    // verified community reporter
  USER:     "user",        // standard authenticated user
  GUEST:    null,          // unauthenticated
};

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Token refresh interval ────────────────────────────────────────────────────
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000; // refresh every 50 min (token expires at 60)

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);    // UserProfile | null
  const [authLoading, setAuthLoading] = useState(true);   // true until first auth check resolves
  const [authError,   setAuthError]   = useState(null);   // string | null
  const [actionLoading, setActionLoading] = useState(false); // sign-in / sign-up in progress

  // OTP flow intermediate state
  const [otpConfirmation, setOtpConfirmation] = useState(null); // ConfirmationResult from sendOTP

  const refreshTimerRef = useRef(null);

  // ── Subscribe to Firebase auth state ───────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(fbUser => {
      setUser(fbUser);
      setAuthLoading(false);

      if (fbUser) {
        scheduleTokenRefresh();
      } else {
        clearTokenRefreshTimer();
      }
    });

    return () => {
      unsubscribe();
      clearTokenRefreshTimer();
    };
  }, []);

  // ── Token refresh ───────────────────────────────────────────────────────────
  function scheduleTokenRefresh() {
    clearTokenRefreshTimer();
    refreshTimerRef.current = setInterval(async () => {
      try {
        await getAuthToken(true); // force refresh
      } catch {
        // If refresh fails (e.g. revoked token), sign out gracefully
        handleSignOut();
      }
    }, TOKEN_REFRESH_INTERVAL_MS);
  }

  function clearTokenRefreshTimer() {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }

  // ── Clear error ─────────────────────────────────────────────────────────────
  const clearError = useCallback(() => setAuthError(null), []);

  // ── Email sign-up ───────────────────────────────────────────────────────────
  /**
   * signUp — Creates a new Raksha AI account.
   *
   * @param {string} email
   * @param {string} password
   * @param {object} [profile]  { name, phone }
   * @returns {Promise<UserProfile>}
   */
  const signUp = useCallback(async (email, password, profile = {}) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const newUser = await signUpWithEmail(email, password, profile);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Email sign-in ───────────────────────────────────────────────────────────
  /**
   * signIn — Signs in with email + password.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<UserProfile>}
   */
  const signIn = useCallback(async (email, password) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const signedInUser = await signInWithEmail(email, password);
      setUser(signedInUser);
      return signedInUser;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Google sign-in ──────────────────────────────────────────────────────────
  /**
   * signInGoogle — OAuth popup sign-in via Google.
   *
   * @returns {Promise<UserProfile>}
   */
  const signInGoogle = useCallback(async () => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const googleUser = await signInWithGoogle();
      setUser(googleUser);
      return googleUser;
    } catch (err) {
      // Don't set error for user-closed popup
      if (err.code !== "auth/popup-closed-by-user") {
        setAuthError(err.message);
      }
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Phone OTP: step 1 — send code ──────────────────────────────────────────
  /**
   * requestOTP — Sends OTP SMS to an Indian mobile number.
   * After calling this, use `confirmOTP` to verify the code.
   *
   * @param {string}  phoneNumber       E.164 format: "+919876543210"
   * @param {object}  recaptchaVerifier firebase RecaptchaVerifier instance
   * @returns {Promise<void>}
   */
  const requestOTP = useCallback(async (phoneNumber, recaptchaVerifier) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      const confirmation = await sendOTP(phoneNumber, recaptchaVerifier);
      setOtpConfirmation(confirmation);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Phone OTP: step 2 — verify code ────────────────────────────────────────
  /**
   * confirmOTP — Verifies the SMS OTP code. Completes phone sign-in.
   *
   * @param {string} code   6-digit code from SMS
   * @returns {Promise<UserProfile>}
   */
  const confirmOTP = useCallback(async (code) => {
    if (!otpConfirmation) {
      const err = new Error("No OTP confirmation pending. Call requestOTP first.");
      setAuthError(err.message);
      throw err;
    }
    setActionLoading(true);
    setAuthError(null);
    try {
      const phoneUser = await verifyOTP(otpConfirmation, code);
      setUser(phoneUser);
      setOtpConfirmation(null);
      return phoneUser;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [otpConfirmation]);

  // ── Sign-out ────────────────────────────────────────────────────────────────
  /**
   * handleSignOut — Signs out and clears all auth state.
   *
   * @returns {Promise<void>}
   */
  const handleSignOut = useCallback(async () => {
    setActionLoading(true);
    setAuthError(null);
    try {
      await serviceSignOut();
      setUser(null);
      setOtpConfirmation(null);
      clearTokenRefreshTimer();
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Password reset ──────────────────────────────────────────────────────────
  /**
   * resetPassword — Sends password-reset email.
   *
   * @param {string} email
   * @returns {Promise<void>}
   */
  const resetPassword = useCallback(async (email) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      await sendPasswordReset(email);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Profile update ──────────────────────────────────────────────────────────
  /**
   * updateProfile — Updates the current user's profile on the backend.
   * Optimistically updates local state before server confirmation.
   *
   * @param {object} updates   Partial UserProfile fields
   * @returns {Promise<UserProfile>}
   */
  const updateProfile = useCallback(async (updates) => {
    if (!user) throw new Error("Not authenticated.");
    setAuthError(null);
    // Optimistic update
    setUser(prev => ({ ...prev, ...updates }));
    try {
      const updated = await updateUserProfile(updates);
      setUser(updated);
      return updated;
    } catch (err) {
      // Roll back optimistic update
      setUser(prev => ({ ...prev, ...Object.fromEntries(Object.keys(updates).map(k => [k, prev[k]])) }));
      setAuthError(err.message);
      throw err;
    }
  }, [user]);

  // ── Account deletion ────────────────────────────────────────────────────────
  /**
   * removeAccount — Permanently deletes the account.
   * Clears all local state on success.
   *
   * @returns {Promise<void>}
   */
  const removeAccount = useCallback(async () => {
    setActionLoading(true);
    setAuthError(null);
    try {
      await deleteAccount();
      setUser(null);
      clearTokenRefreshTimer();
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Permission / role helpers ───────────────────────────────────────────────
  /** True if a user is currently signed in */
  const isAuthenticated = !!user;

  /** True if the user has the admin role */
  const isAdmin = user?.role === ROLES.ADMIN;

  /** True if the user is a verified community reporter */
  const isVerifiedReporter = user?.role === ROLES.REPORTER || isAdmin;

  /**
   * hasRole — Checks whether the current user has the given role.
   *
   * @param {"admin"|"reporter"|"user"} role
   * @returns {boolean}
   */
  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (isAdmin) return true;            // admins pass all role checks
    return user.role === role;
  }, [user, isAdmin]);

  /**
   * requireAuth — Throws if the user is not signed in.
   * Use as a guard in async handlers before making protected API calls.
   *
   * @throws {Error} if not authenticated
   */
  const requireAuth = useCallback(() => {
    if (!user) throw new Error("Authentication required. Please sign in.");
  }, [user]);

  // ── Context value ───────────────────────────────────────────────────────────
  const value = {
    // ── State ──────────────────────────────────────────────────────────────
    /** Current user (UserProfile) or null */
    user,

    /** True during initial Firebase auth check (before first emit) */
    authLoading,

    /** True during any sign-in / sign-up / sign-out action */
    actionLoading,

    /** Human-readable auth error string, or null */
    authError,

    /** True if an OTP has been sent and is awaiting confirmation */
    otpPending: !!otpConfirmation,

    // ── Computed ───────────────────────────────────────────────────────────
    isAuthenticated,
    isAdmin,
    isVerifiedReporter,

    // ── Actions ────────────────────────────────────────────────────────────
    /** Sign up with email + password */
    signUp,

    /** Sign in with email + password */
    signIn,

    /** Sign in with Google OAuth popup */
    signInGoogle,

    /** Step 1 of phone OTP — sends SMS */
    requestOTP,

    /** Step 2 of phone OTP — verifies code */
    confirmOTP,

    /** Sign out current user */
    signOut: handleSignOut,

    /** Send password reset email */
    resetPassword,

    /** Update current user's profile */
    updateProfile,

    /** Permanently delete account */
    removeAccount,

    /** Clear authError manually (e.g. when user edits the form) */
    clearError,

    // ── Helpers ────────────────────────────────────────────────────────────
    /** Check if current user has a specific role */
    hasRole,

    /** Guard: throws if not authenticated */
    requireAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * useAuth — Consumes AuthContext.
 * Must be used inside <AuthProvider>.
 *
 * @returns {AuthContextValue}
 * @throws if used outside AuthProvider
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}

// ── Route guard HOC ───────────────────────────────────────────────────────────
/**
 * withAuth — Higher-order component that redirects unauthenticated users.
 * Wrap page components that require a signed-in user.
 *
 * Usage:
 *   export default withAuth(Dashboard);
 *
 *   // With role requirement:
 *   export default withAuth(AdminPanel, { role: "admin" });
 *
 * @param {React.Component} Component
 * @param {object}          [opts]
 * @param {string}          [opts.role]        Required role
 * @param {string}          [opts.redirectTo]  Path to redirect if not authed (default "/")
 */
export function withAuth(Component, { role = null, redirectTo = "/" } = {}) {
  return function ProtectedComponent(props) {
    const { user, authLoading, isAdmin } = useAuth();

    // Still waiting for Firebase to resolve
    if (authLoading) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060810",
          flexDirection: "column",
          gap: 16,
          fontFamily: "'DM Mono', monospace",
        }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: "50%",
            border: "2.5px solid rgba(220,38,38,0.15)",
            borderTopColor: "#dc2626",
            animation: "spin 0.9s linear infinite",
          }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "1px" }}>
            AUTHENTICATING…
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    // Not signed in → redirect
    if (!user) {
      window.location.replace(redirectTo);
      return null;
    }

    // Role check
    if (role && !isAdmin && user.role !== role) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060810",
          flexDirection: "column",
          gap: 12,
          fontFamily: "'DM Sans', sans-serif",
          color: "rgba(255,255,255,0.4)",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Access Restricted</div>
          <div style={{ fontSize: 12 }}>You do not have the required permissions.</div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;