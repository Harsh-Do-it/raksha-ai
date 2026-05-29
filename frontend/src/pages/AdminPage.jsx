import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, isAdmin, logout } from "../services/authService";
import { getIssues, updateIssueStatus, deleteIssue, getSosAlerts, deleteSosAlert } from "../services/roadService";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || "http://127.0.0.1:5000";


/* ─────────────────────────────────────────────────────────────────────────────
   AdminPage.jsx — Raksha AI Admin Panel
   Protected: only accessible to users with role === "admin"
   ───────────────────────────────────────────────────────────────────────────── */

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');`;

const SEV_COLOR = { critical: "#dc2626", high: "#f97316", medium: "#eab308", low: "#22c55e" };
const STATUS_COLOR = { pending: "#f97316", verified: "#3b82f6", "in-progress": "#eab308", resolved: "#22c55e" };
const VALID_STATUSES = ["pending", "verified", "in-progress", "resolved"];

function Badge({ text, color }) {
  return (
    <span style={{
      fontSize: 9, padding: "2px 8px", borderRadius: 4,
      background: color + "18", border: `1px solid ${color}33`,
      color, fontFamily: "'DM Mono',monospace", letterSpacing: "0.5px",
      whiteSpace: "nowrap",
    }}>{text}</span>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: "#080c14", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: 1.2, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 32, letterSpacing: 1, color: "#f1f5f9", lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function FilterBar({ filters, setFilters }) {
  const statusOpts = ["all", "pending", "verified", "in-progress", "resolved"];
  const sevOpts = ["all", "critical", "high", "medium", "low"];

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
      <div>
        <label style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: 1, color: "rgba(255,255,255,0.25)", display: "block", marginBottom: 4 }}>STATUS</label>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "6px 10px", color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
          {statusOpts.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: 1, color: "rgba(255,255,255,0.25)", display: "block", marginBottom: 4 }}>SEVERITY</label>
        <select value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "6px 10px", color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
          {sevOpts.map(s => <option key={s} value={s}>{s === "all" ? "All Severities" : s}</option>)}
        </select>
      </div>
    </div>
  );
}

function IssueRow({ issue, onStatusChange, onDelete, updating }) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(issue.status);
  const [adminNote, setAdminNote] = useState(issue.admin_note || "");

  const sev = issue.severity || "medium";
  const status = issue.status || "pending";

  function timeAgo(isoStr) {
    if (!isoStr) return "Unknown";
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 10, marginBottom: 8,
      background: expanded ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.01)",
      transition: "background 0.15s",
    }}>
      {/* Row header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", cursor: "pointer",
      }} onClick={() => setExpanded(e => !e)}>

        {/* Severity dot */}
        <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: SEV_COLOR[sev], boxShadow: `0 0 6px ${SEV_COLOR[sev]}` }} />

        {/* ID */}
        <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", flexShrink: 0, width: 130 }}>
          {issue.id}
        </div>

        {/* Type + Road */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {issue.type} — {issue.road}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
            {issue.area && `${issue.area} · `}{timeAgo(issue.created_at)} · by {issue.reporter_name || "Anonymous"}
          </div>
        </div>

        <Badge text={sev.toUpperCase()} color={SEV_COLOR[sev]} />
        <Badge text={status} color={STATUS_COLOR[status]} />
        {issue.image_filename && (
          <span title="Has photo" style={{
            fontSize: 9, padding: "2px 7px", borderRadius: 4,
            background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)",
            color: "#a78bfa", fontFamily: "'DM Mono',monospace", letterSpacing: "0.5px",
            whiteSpace: "nowrap",
          }}>📷 PHOTO</span>
        )}

        {/* Expand arrow */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Two-column: image | details */}
          <div style={{ display: "grid", gridTemplateColumns: issue.image_filename ? "200px 1fr" : "1fr", gap: 16, marginTop: 14, marginBottom: 14 }}>

            {/* Image thumbnail (only if present) */}
            {issue.image_filename && (
              <div>
                <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: 1, color: "rgba(255,255,255,0.25)", marginBottom: 6, textTransform: "uppercase" }}>
                  Reported Photo
                </div>
                <a href={`${BASE_URL}/uploads/${issue.image_filename}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", textDecoration: "none" }}>
                  <div style={{
                    borderRadius: 8, overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    position: "relative",
                    aspectRatio: "4/3",
                  }}>
                    <img
                      src={`${BASE_URL}/uploads/${issue.image_filename}`}
                      alt="Reported issue"
                      style={{
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transition: "transform 0.2s",
                      }}
                      onError={e => {
                        e.target.parentElement.innerHTML = `
                          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;padding:16px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-linecap="round">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                            </svg>
                            <span style="font-size:10px;color:rgba(255,255,255,0.2);font-family:DM Mono,monospace">Image unavailable</span>
                          </div>`;
                      }}
                      onMouseEnter={e => e.target.style.transform = "scale(1.03)"}
                      onMouseLeave={e => e.target.style.transform = "scale(1)"}
                    />
                  </div>
                  <div style={{ marginTop: 5, fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace", textAlign: "center", letterSpacing: "0.5px" }}>
                    Click to view full size ↗
                  </div>
                </a>
              </div>
            )}

            {/* Right: description + AI info */}
            <div>
              {/* Description */}
              {issue.description && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 10 }}>
                  {issue.description}
                </div>
              )}

              {/* Reporter info */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)" }}>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>Reporter</span><br />
                  {issue.reporter_name || "Anonymous"}
                </div>
                {issue.area && (
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)" }}>
                    <span style={{ color: "rgba(255,255,255,0.85)" }}>Area</span><br />
                    {issue.area}
                  </div>
                )}
                <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)" }}>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>Submitted</span><br />
                  {timeAgo(issue.created_at)}
                </div>
              </div>

              {/* AI detection info */}
              {issue.ai_label && (
                <div style={{
                  display: "inline-flex", gap: 12, padding: "7px 11px",
                  background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: 8, fontSize: 11, fontFamily: "'DM Mono',monospace",
                  color: "rgba(255,255,255,0.5)",
                }}>
                  <span style={{ color: "#60a5fa" }}>🤖 AI: {issue.ai_label}</span>
                  {issue.ai_confidence && <span>Confidence: {Math.round(issue.ai_confidence * 100)}%</span>}
                </div>
              )}
            </div>
          </div>

          {/* Status update row */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: 1, color: "rgba(255,255,255,0.25)", display: "block", marginBottom: 5 }}>UPDATE STATUS</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "8px 10px", color: STATUS_COLOR[newStatus], fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
                {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: 1, color: "rgba(255,255,255,0.25)", display: "block", marginBottom: 5 }}>ADMIN NOTE</label>
              <input value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder="Optional note for this update…"
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "8px 12px", color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'DM Sans',sans-serif", outline: "none" }} />
            </div>
            <button onClick={() => onStatusChange(issue.id, newStatus, adminNote)}
              disabled={updating === issue.id || newStatus === issue.status}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                background: newStatus !== issue.status ? "#3b82f6" : "rgba(255,255,255,0.06)",
                color: newStatus !== issue.status ? "white" : "rgba(255,255,255,0.3)",
                fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                transition: "all 0.15s", flexShrink: 0,
              }}>
              {updating === issue.id ? "Saving…" : "Save"}
            </button>
            <button onClick={() => onDelete(issue.id)}
              disabled={updating === issue.id}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(220,38,38,0.25)",
                background: "rgba(220,38,38,0.08)", color: "#f87171",
                fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
              }}>
              Delete
            </button>
          </div>

          {/* Existing admin note */}
          {issue.admin_note && (
            <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace", padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6, borderLeft: "2px solid rgba(255,255,255,0.1)" }}>
              Admin note: {issue.admin_note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [sosList, setSosList] = useState([]);
  const [activeTab, setActiveTab] = useState("issues");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ status: "all", severity: "all" });

  const user = getCurrentUser();

  // Auth guard
  useEffect(() => {
    if (!isAdmin()) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const opts = {};
      if (filters.status !== "all")   opts.status   = filters.status;
      if (filters.severity !== "all") opts.severity = filters.severity;
      
      const [issuesData, sosData] = await Promise.all([
        getIssues({ ...opts, limit: 100 }),
        getSosAlerts({ limit: 50 })
      ]);
      
      setIssues(issuesData.items || []);
      setTotal(issuesData.total || 0);
      setSosList(sosData.items || []);
    } catch (err) {
      showToast("Failed to load data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleStatusChange(id, newStatus, adminNote) {
    setUpdating(id);
    try {
      await updateIssueStatus(id, newStatus, adminNote);
      setIssues(prev => prev.map(i => i.id === id ? { ...i, status: newStatus, admin_note: adminNote || i.admin_note } : i));
      showToast(`Issue updated to "${newStatus}"`);
    } catch (err) {
      showToast("Update failed: " + err.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this report permanently?")) return;
    setUpdating(id);
    try {
      await deleteIssue(id);
      setIssues(prev => prev.filter(i => i.id !== id));
      setTotal(t => t - 1);
      showToast("Report deleted.");
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleSosDelete(id) {
    if (!window.confirm("Delete this SOS alert permanently?")) return;
    setUpdating(id);
    try {
      await deleteSosAlert(id);
      setSosList(prev => prev.filter(s => (s.alert_id || s.id) !== id));
      showToast("SOS alert deleted.");
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  // Compute summary stats
  const byStatus = {};
  const bySev = {};
  issues.forEach(i => {
    byStatus[i.status] = (byStatus[i.status] || 0) + 1;
    bySev[i.severity] = (bySev[i.severity] || 0) + 1;
  });

  return (
    <>
      <style>{FONTS}</style>
      <style>{`
        * { box-sizing: border-box; }
        select option { background: #0d111b; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#060810", color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif" }}>

        {/* Top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(6,8,16,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)", padding: "0 24px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
              <svg width="28" height="28" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="25" fill="#0d111b" stroke="rgba(220,38,38,0.3)" strokeWidth="1"/>
                <path d="M26 8 L40 15 L40 28 C40 36 26 44 26 44 C26 44 12 36 12 28 L12 15 Z" fill="#dc2626" fillOpacity="0.2" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/>
                <text x="26" y="32" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontFamily="'Bebas Neue',cursive" letterSpacing="2">RA</text>
              </svg>
            </div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 16, letterSpacing: 3, color: "#f1f5f9" }}>RAKSHA AI</div>
            <div style={{ padding: "3px 10px", borderRadius: 6, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", fontSize: 10, color: "#a78bfa", fontFamily: "'DM Mono',monospace", letterSpacing: 1 }}>
              ADMIN PANEL
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace" }}>
              {user?.name} · {user?.email}
            </div>
            <button onClick={() => navigate("/dashboard")} style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Dashboard
            </button>
            <button onClick={handleLogout} style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid rgba(220,38,38,0.25)", background: "rgba(220,38,38,0.08)", color: "#f87171", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Logout
            </button>
          </div>
        </div>

        <div style={{ padding: "28px 28px" }}>

          {/* Page header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>RAKSHA AI / ADMIN / REPORTED ISSUES</div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 30, letterSpacing: 3, color: "#f1f5f9" }}>Issue Management</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
              Review, verify, and update all reported road issues submitted by users.
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
            <button 
              onClick={() => setActiveTab("issues")}
              style={{
                background: "transparent", border: "none", color: activeTab === "issues" ? "#f1f5f9" : "rgba(255,255,255,0.4)",
                fontSize: 16, fontFamily: "'Bebas Neue',cursive", letterSpacing: 2, cursor: "pointer",
                padding: "4px 12px", borderBottom: activeTab === "issues" ? "2px solid #dc2626" : "2px solid transparent", transition: "all 0.2s"
              }}>
              REPORTED ISSUES
            </button>
            <button 
              onClick={() => setActiveTab("sos")}
              style={{
                background: "transparent", border: "none", color: activeTab === "sos" ? "#f1f5f9" : "rgba(255,255,255,0.4)",
                fontSize: 16, fontFamily: "'Bebas Neue',cursive", letterSpacing: 2, cursor: "pointer",
                padding: "4px 12px", borderBottom: activeTab === "sos" ? "2px solid #dc2626" : "2px solid transparent", transition: "all 0.2s"
              }}>
              SOS ALERTS
            </button>
          </div>

          {activeTab === "issues" ? (
            <>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 10, marginBottom: 24 }}>
                <StatCard label="Total Reports" value={total} color="#3b82f6" />
                <StatCard label="Pending" value={byStatus.pending || 0} color="#f97316" />
                <StatCard label="Verified" value={byStatus.verified || 0} color="#3b82f6" />
                <StatCard label="In Progress" value={byStatus["in-progress"] || 0} color="#eab308" />
                <StatCard label="Resolved" value={byStatus.resolved || 0} color="#22c55e" />
                <StatCard label="Critical" value={bySev.critical || 0} color="#dc2626" />
              </div>

              {/* Filter + refresh */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <FilterBar filters={filters} setFilters={setFilters} />
                <button onClick={fetchIssues} disabled={loading} style={{
                  padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                  background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12,
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: loading ? "spin 1s linear infinite" : "none" }}>
                    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              {/* Issues list */}
              {loading && issues.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)" }}>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, letterSpacing: 2 }}>Loading Reports…</div>
                </div>
              ) : issues.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "80px 0",
                  border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 14,
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 16 }}>
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
                  </svg>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: 2, color: "rgba(255,255,255,0.25)" }}>No Reports Found</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>
                    {filters.status !== "all" || filters.severity !== "all" ? "Try clearing filters" : "No issues have been reported yet"}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.2)", marginBottom: 12, letterSpacing: 1 }}>
                    SHOWING {issues.length} OF {total} REPORTS
                  </div>
                  {issues.map(issue => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      updating={updating}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* SOS list */}
              {loading && sosList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)" }}>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, letterSpacing: 2 }}>Loading SOS Alerts…</div>
                </div>
              ) : sosList.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "80px 0",
                  border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 14,
                }}>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: 2, color: "rgba(255,255,255,0.25)" }}>No SOS Alerts</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.2)", marginBottom: 12, letterSpacing: 1 }}>
                    {sosList.length} ACTIVE SOS ALERTS
                  </div>
                  {sosList.map(sos => (
                    <div key={sos.alert_id || sos.id} style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ padding: "4px 8px", background: "#dc2626", color: "white", fontSize: 10, fontFamily: "'DM Mono',monospace", borderRadius: 4, fontWeight: "bold" }}>SOS ALERT</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono',monospace" }}>{new Date(sos.timestamp || sos.created_at).toLocaleString()}</div>
                          </div>
                          <div style={{ fontSize: 14, color: "#f1f5f9", marginBottom: 4 }}><strong>Location:</strong> {sos.location ? (typeof sos.location === 'object' ? `Lat: ${sos.location.lat}, Lng: ${sos.location.lng}` : sos.location) : "Unknown"}</div>
                          <div style={{ fontSize: 14, color: "#f1f5f9" }}><strong>Device / Ref:</strong> {sos.user_id || "Unknown"}</div>
                        </div>
                        <button onClick={() => handleSosDelete(sos.alert_id || sos.id)}
                          disabled={updating === (sos.alert_id || sos.id)}
                          style={{
                            padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(220,38,38,0.25)",
                            background: "rgba(220,38,38,0.08)", color: "#f87171",
                            fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                            cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                          }}>
                          {updating === (sos.alert_id || sos.id) ? "Deleting..." : "Resolve & Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          padding: "12px 20px", borderRadius: 10,
          background: toast.type === "error" ? "rgba(220,38,38,0.9)" : "rgba(34,197,94,0.9)",
          color: "white", fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          fontFamily: "'DM Sans',sans-serif",
          animation: "toastIn 0.3s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
