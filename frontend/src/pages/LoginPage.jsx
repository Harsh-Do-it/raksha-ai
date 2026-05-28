import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, loginAdmin, register } from "../services/authService";

/* ─────────────────────────────────────────────────────────────────────────────
   LoginPage.jsx — Unified login/register page for Raksha AI
   Tabs: User Login · Create Account · Admin Login
   ───────────────────────────────────────────────────────────────────────────── */

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');`;

const STYLES = `
* { box-sizing: border-box; margin: 0; padding: 0; }

.login-root {
  min-height: 100vh;
  background: #060810;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Sans', sans-serif;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* Background glow */
.login-root::before {
  content: '';
  position: fixed;
  top: 15%; left: 50%;
  transform: translate(-50%, -50%);
  width: 700px; height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%);
  pointer-events: none;
}

/* Grid */
.login-root::after {
  content: '';
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 80%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(8,12,20,0.9);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 36px 32px;
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;
  animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.login-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(220,38,38,0.5), transparent);
  border-radius: 20px 20px 0 0;
}

.tab-bar {
  display: flex;
  gap: 2px;
  background: rgba(255,255,255,0.04);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 28px;
}

.tab-btn {
  flex: 1;
  padding: 8px 6px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #dc2626;
  color: white;
  box-shadow: 0 2px 12px rgba(220,38,38,0.4);
}

.tab-btn:not(.active) {
  background: transparent;
  color: rgba(255,255,255,0.35);
}

.field-label {
  display: block;
  font-size: 10px;
  font-family: 'DM Mono', monospace;
  letter-spacing: 1.2px;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  margin-bottom: 7px;
}

.field-input {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9px;
  padding: 11px 14px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  color: rgba(255,255,255,0.85);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input:focus {
  border-color: rgba(220,38,38,0.5);
  box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
}

.field-input::placeholder { color: rgba(255,255,255,0.18); }

.submit-btn {
  width: 100%;
  padding: 13px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  font-family: 'DM Sans', sans-serif;
  letter-spacing: 0.5px;
  transition: all 0.18s;
  margin-top: 6px;
}

.submit-btn.primary {
  background: #dc2626;
  color: white;
  box-shadow: 0 4px 20px rgba(220,38,38,0.35);
}

.submit-btn.primary:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 6px 28px rgba(220,38,38,0.45);
}

.submit-btn.admin {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  box-shadow: 0 4px 20px rgba(124,58,237,0.35);
}

.submit-btn.admin:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 28px rgba(124,58,237,0.5);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-box {
  background: rgba(220,38,38,0.08);
  border: 1px solid rgba(220,38,38,0.25);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12.5px;
  color: #f87171;
  margin-top: 12px;
  font-family: 'DM Sans', sans-serif;
}

.success-box {
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12.5px;
  color: #4ade80;
  margin-top: 12px;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(124,58,237,0.12);
  border: 1px solid rgba(124,58,237,0.25);
  color: #a78bfa;
  font-size: 10px;
  font-family: 'DM Mono', monospace;
  letter-spacing: 1px;
  margin-bottom: 20px;
}
`;

function ShieldLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="25" fill="#0d111b" stroke="rgba(220,38,38,0.3)" strokeWidth="1"/>
      <path d="M26 8 L40 15 L40 28 C40 36 26 44 26 44 C26 44 12 36 12 28 L12 15 Z"
        fill="#dc2626" fillOpacity="0.15" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/>
      <text x="26" y="32" textAnchor="middle"
        fill="#f1f5f9" fontSize="13" fontFamily="'Bebas Neue',cursive" letterSpacing="2">RA</text>
    </svg>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="field-label">{label}</label>
      <input
        className="field-input"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

/* ── User Login tab ── */
function UserLoginForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password);
      onSuccess(data);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Email Address" type="email" value={email} onChange={setEmail}
        placeholder="you@example.com" autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword}
        placeholder="Your password" autoComplete="current-password" />
      {error && <div className="error-box">{error}</div>}
      <button className="submit-btn primary" type="submit" disabled={loading} style={{ marginTop: 20 }}>
        {loading ? "Signing in…" : "Sign In →"}
      </button>
    </form>
  );
}

/* ── Register tab ── */
function RegisterForm({ onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    try {
      const { register: registerFn } = await import("../services/authService");
      await registerFn(name, email, password);
      setSuccess(true);
      setTimeout(() => onSuccess({ autoLogin: true, email, password }), 1200);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, letterSpacing: 2, color: "#22c55e" }}>Account Created!</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>Signing you in…</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Full Name" value={name} onChange={setName} placeholder="Your name" autoComplete="name" />
      <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 6 characters" autoComplete="new-password" />
      <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat password" autoComplete="new-password" />
      {error && <div className="error-box">{error}</div>}
      <button className="submit-btn primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
        {loading ? "Creating account…" : "Create Account →"}
      </button>
    </form>
  );
}

/* ── Admin Login tab ── */
function AdminLoginForm({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) { setError("Enter admin credentials."); return; }
    setLoading(true);
    setError("");
    try {
      const data = await loginAdmin(username, password);
      onSuccess(data);
    } catch (err) {
      setError(err.message || "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="admin-badge">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        ADMIN ACCESS
      </div>
      <Field label="Admin Username" value={username} onChange={setUsername} placeholder="admin" autoComplete="username" />
      <Field label="Admin Password" type="password" value={password} onChange={setPassword} placeholder="Admin password" autoComplete="current-password" />
      {error && <div className="error-box">{error}</div>}
      <button className="submit-btn admin" type="submit" disabled={loading} style={{ marginTop: 20 }}>
        {loading ? "Authenticating…" : "🔐 Access Admin Panel →"}
      </button>
      <div style={{ marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", fontFamily: "'DM Mono',monospace" }}>
        Admin credentials are configured by the system administrator
      </div>
    </form>
  );
}

/* ── Main Page ── */
const TABS = [
  { id: "login", label: "Sign In" },
  { id: "register", label: "Register" },
  { id: "admin", label: "🔐 Admin" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");

  async function handleSuccess(data) {
    // If register flow, auto-login
    if (data.autoLogin) {
      try {
        const { login: loginFn } = await import("../services/authService");
        const result = await loginFn(data.email, data.password);
        redirectAfterLogin(result);
        return;
      } catch {
        setTab("login");
        return;
      }
    }
    redirectAfterLogin(data);
  }

  function redirectAfterLogin(data) {
    if (data.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <>
      <style>{FONTS + STYLES}</style>
      <div className="login-root">
        <div className="login-card">

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <ShieldLogo />
            <div>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: 3, color: "#f1f5f9", lineHeight: 1 }}>
                RAKSHA AI
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace", letterSpacing: "1.5px", marginTop: 2 }}>
                ROAD SAFETY ECOSYSTEM
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 26, letterSpacing: 2, color: "#f1f5f9", marginBottom: 6 }}>
            {tab === "login" ? "Welcome Back" : tab === "register" ? "Create Account" : "Admin Access"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 24, fontFamily: "'DM Sans',sans-serif" }}>
            {tab === "login" ? "Sign in to your Raksha AI account" :
             tab === "register" ? "Join the road safety community" :
             "Restricted to authorized administrators only"}
          </div>

          {/* Tab bar */}
          <div className="tab-bar">
            {TABS.map(t => (
              <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "login"    && <UserLoginForm onSuccess={handleSuccess} />}
          {tab === "register" && <RegisterForm onSuccess={handleSuccess} />}
          {tab === "admin"    && <AdminLoginForm onSuccess={handleSuccess} />}

          {/* Footer nav */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button onClick={() => navigate("/")} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Mono',monospace", letterSpacing: "0.5px",
            }}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
