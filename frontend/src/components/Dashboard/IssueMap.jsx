import { useState, useMemo, useRef } from "react";

/**
 * IssueMap — Reported Road Issues panel for Raksha AI Dashboard
 *
 * Displays a filterable, sortable list of reported road issues (potholes,
 * waterlogging, damage, etc.) with status tracking and severity badges.
 * Designed to sit alongside MapView, not replace it.
 *
 * Props:
 *   issues        {Array}   Issue data objects — shape documented below
 *   onIssueClick  {fn}      Called with issue object when row is clicked
 *   onViewOnMap   {fn}      Called with issue when "View on map" is tapped
 *   loading       {boolean} Show skeleton loader
 *
 * Issue shape:
 *   {
 *     id:          string,
 *     type:        "Pothole" | "Damaged Road" | "Waterlogging" | "Broken Divider" | "Missing Sign",
 *     severity:    "critical" | "high" | "medium" | "low",
 *     road:        string,
 *     area:        string,
 *     reportedAt:  string,     // e.g. "2 hours ago"
 *     status:      "pending" | "verified" | "in-progress" | "resolved",
 *     upvotes:     number,
 *     imageUrl:    string,     // optional thumbnail
 *     reportedBy:  string,     // optional
 *   }
 */

// ── Demo issues ──────────────────────────────────────────────────────────────
const DEFAULT_ISSUES = [
  { id:"i1",  type:"Pothole",        severity:"critical", road:"NH-48, KM 14",       area:"Mahipalpur",    reportedAt:"18 min ago",  status:"verified",    upvotes:47, reportedBy:"Rahul S." },
  { id:"i2",  type:"Waterlogging",   severity:"high",     road:"Outer Ring Road",    area:"Nangloi",       reportedAt:"1 hr ago",    status:"in-progress", upvotes:31, reportedBy:"Priya K." },
  { id:"i3",  type:"Damaged Road",   severity:"high",     road:"Mathura Road",       area:"Badarpur",      reportedAt:"3 hrs ago",   status:"pending",     upvotes:22, reportedBy:"Amit T." },
  { id:"i4",  type:"Broken Divider", severity:"medium",   road:"Rohini Sec-3",       area:"Rohini",        reportedAt:"5 hrs ago",   status:"pending",     upvotes:14, reportedBy:"Sunita M." },
  { id:"i5",  type:"Missing Sign",   severity:"medium",   road:"DND Flyway Entry",   area:"Noida Link",    reportedAt:"8 hrs ago",   status:"verified",    upvotes:9,  reportedBy:"Vijay R." },
  { id:"i6",  type:"Pothole",        severity:"low",      road:"MG Road Sector-14",  area:"Gurgaon",       reportedAt:"12 hrs ago",  status:"resolved",    upvotes:6,  reportedBy:"Neha D." },
  { id:"i7",  type:"Waterlogging",   severity:"critical", road:"Palam Flyover Slip", area:"Palam",         reportedAt:"20 hrs ago",  status:"in-progress", upvotes:58, reportedBy:"Arjun P." },
  { id:"i8",  type:"Damaged Road",   severity:"medium",   road:"GT Karnal Rd N",     area:"Singhu Border", reportedAt:"1 day ago",   status:"resolved",    upvotes:11, reportedBy:"Kavita L." },
];

// ── Config maps ──────────────────────────────────────────────────────────────
const SEV = {
  critical: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",  border: "rgba(220,38,38,0.28)", label: "Critical" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)", label: "High"     },
  medium:   { color: "#eab308", bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.22)",  label: "Medium"   },
  low:      { color: "#6b7280", bg: "rgba(107,114,128,0.1)",border: "rgba(107,114,128,0.2)", label: "Low"      },
};

const STATUS = {
  "pending":     { color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.2)",  dot: "#f97316", label: "Pending"     },
  "verified":    { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)",  dot: "#3b82f6", label: "Verified"    },
  "in-progress": { color: "#eab308", bg: "rgba(234,179,8,0.1)",   border: "rgba(234,179,8,0.2)",   dot: "#eab308", label: "In Progress" },
  "resolved":    { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)",   dot: "#22c55e", label: "Resolved"    },
};

const TYPE_ICONS = {
  "Pothole":        { bg: "rgba(239,68,68,0.12)",  icon: "#ef4444", path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M9 14s.5 1.5 3 1.5 3-1.5 3-1.5 M9.5 9h.01 M14.5 9h.01" },
  "Damaged Road":   { bg: "rgba(249,115,22,0.12)", icon: "#fb923c", path: "M3 6h18M3 12h18M3 18h18 M7 6v12 M17 6v12" },
  "Waterlogging":   { bg: "rgba(59,130,246,0.12)", icon: "#60a5fa", path: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" },
  "Broken Divider": { bg: "rgba(234,179,8,0.12)",  icon: "#fbbf24", path: "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3 M12 8v8 M8 12h8" },
  "Missing Sign":   { bg: "rgba(168,85,247,0.12)", icon: "#c084fc", path: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" },
};

const FILTER_TYPES = ["All", "Pothole", "Damaged Road", "Waterlogging", "Broken Divider", "Missing Sign"];
const SORT_OPTIONS = [
  { key: "recent",  label: "Newest"   },
  { key: "upvotes", label: "Popular"  },
  { key: "severity",label: "Severity" },
];
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          height: 70, borderRadius: 10,
          background: "rgba(255,255,255,0.04)",
          animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite alternate`,
        }} />
      ))}
      <style>{`
        @keyframes shimmer {
          from { opacity: 0.5; }
          to   { opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

// ── Single issue row ──────────────────────────────────────────────────────────
function IssueRow({ issue, onIssueClick, onViewOnMap, animDelay }) {
  const [hovered, setHovered] = useState(false);
  const sev    = SEV[issue.severity]    || SEV.medium;
  const status = STATUS[issue.status]   || STATUS.pending;
  const typeConf = TYPE_ICONS[issue.type] || TYPE_ICONS["Pothole"];

  return (
    <div
      onClick={() => onIssueClick?.(issue)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "11px 14px",
        borderRadius: 10,
        border: `1px solid ${hovered ? sev.border : "rgba(255,255,255,0.05)"}`,
        background: hovered ? sev.bg : "rgba(255,255,255,0.025)",
        cursor: "pointer",
        transition: "all 0.17s",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        animation: `issueSlide 0.35s ease both`,
        animationDelay: animDelay,
      }}
    >
      <style>{`
        @keyframes issueSlide {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
      `}</style>

      {/* Type icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: typeConf.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={typeConf.icon} strokeWidth="1.8" strokeLinecap="round">
          {issue.type === "Pothole" ? (
            <>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M9 14s.5 1.5 3 1.5 3-1.5 3-1.5"/><circle cx="9.5" cy="9" r=".5" fill={typeConf.icon}/><circle cx="14.5" cy="9" r=".5" fill={typeConf.icon}/>
            </>
          ) : (
            <path d={typeConf.path} />
          )}
        </svg>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: type + severity */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: hovered ? "#f1f5f9" : "rgba(255,255,255,0.75)",
            transition: "color 0.17s",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {issue.type}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
            background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color,
            letterSpacing: "0.4px",
          }}>
            {sev.label.toUpperCase()}
          </span>
        </div>

        {/* Row 2: road + area */}
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.38)",
          fontFamily: "'DM Mono', monospace",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          marginBottom: 6,
        }}>
          {issue.road} · {issue.area}
        </div>

        {/* Row 3: status + time + upvotes */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 500,
            padding: "2px 7px", borderRadius: 5,
            background: status.bg, border: `1px solid ${status.border}`,
            color: status.color,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: status.dot,
              boxShadow: `0 0 4px ${status.dot}`,
              flexShrink: 0,
            }} />
            {status.label}
          </span>

          <span style={{
            fontSize: 10, color: "rgba(255,255,255,0.25)",
            fontFamily: "'DM Mono', monospace",
          }}>
            {issue.reportedAt}
          </span>

          <span style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 10, color: "rgba(255,255,255,0.3)",
            fontFamily: "'DM Mono', monospace",
            marginLeft: "auto",
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            {issue.upvotes}
          </span>
        </div>
      </div>

      {/* Map button — appears on hover */}
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onViewOnMap?.(issue); }}
          style={{
            flexShrink: 0, alignSelf: "center",
            padding: "5px 9px", borderRadius: 7,
            border: "1px solid rgba(59,130,246,0.3)",
            background: "rgba(59,130,246,0.1)",
            color: "#60a5fa", fontSize: 11, fontWeight: 500,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            display: "flex", alignItems: "center", gap: 4,
            transition: "all 0.15s",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Map
        </button>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>
    </div>
  );
}

// ── Main IssueMap ────────────────────────────────────────────────────────────
export default function IssueMap({
  issues      = DEFAULT_ISSUES,
  onIssueClick,
  onViewOnMap,
  loading     = false,
}) {
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy]         = useState("recent");
  const [search, setSearch]         = useState("");

  const filtered = useMemo(() => {
    let list = [...issues];
    if (typeFilter !== "All")   list = list.filter(i => i.type === typeFilter);
    if (statusFilter !== "All") list = list.filter(i => i.status === statusFilter);
    if (search.trim())          list = list.filter(i =>
      [i.type, i.road, i.area, i.status].join(" ").toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === "upvotes")   list.sort((a, b) => b.upvotes - a.upvotes);
    if (sortBy === "severity")  list.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
    return list;
  }, [issues, typeFilter, statusFilter, sortBy, search]);

  const counts = useMemo(() => {
    const c = { pending: 0, verified: 0, "in-progress": 0, resolved: 0 };
    issues.forEach(i => { if (c[i.status] !== undefined) c[i.status]++; });
    return c;
  }, [issues]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');

        .im-root {
          background: #080c14;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          max-height: 720px;
        }

        .im-header {
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }

        .im-title {
          font-family: 'Bebas Neue', cursive;
          font-size: 20px;
          letter-spacing: 2.5px;
          color: #f1f5f9;
          margin-bottom: 12px;
        }

        /* Status counters */
        .im-status-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .im-status-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          font-family: 'DM Mono', monospace;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }

        /* Search */
        .im-search {
          position: relative;
          margin-bottom: 10px;
        }

        .im-search-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 8px 12px 8px 34px;
          font-size: 12px;
          font-family: 'DM Mono', monospace;
          color: rgba(255,255,255,0.7);
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .im-search-input::placeholder { color: rgba(255,255,255,0.2); }
        .im-search-input:focus { border-color: rgba(220,38,38,0.4); }

        .im-search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          opacity: 0.3;
        }

        /* Filter chips */
        .im-filters {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .im-filters::-webkit-scrollbar { display: none; }

        .im-filter-chip {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          white-space: nowrap;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.85);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .im-filter-chip.active {
          background: rgba(220,38,38,0.14);
          border-color: rgba(220,38,38,0.32);
          color: #f87171;
        }
        .im-filter-chip:hover:not(.active) {
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.7);
        }

        /* Sort row */
        .im-sort-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          flex-shrink: 0;
        }

        .im-sort-label {
          font-size: 10px;
          color: rgba(255,255,255,0.25);
          font-family: 'DM Mono', monospace;
          letter-spacing: 1px;
          flex-shrink: 0;
        }

        .im-sort-btn {
          padding: 3px 9px;
          border-radius: 5px;
          font-size: 10px;
          font-family: 'DM Mono', monospace;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
        }
        .im-sort-btn.active  { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); border-color: rgba(255,255,255,0.1); }
        .im-sort-btn.inactive { background: transparent; color: rgba(255,255,255,0.3); }
        .im-sort-btn.inactive:hover { color: rgba(255,255,255,0.55); }

        .im-count {
          margin-left: auto;
          font-size: 10px;
          color: rgba(255,255,255,0.2);
          font-family: 'DM Mono', monospace;
        }

        /* Scrollable list */
        .im-list {
          padding: 14px 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 7px;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .im-list::-webkit-scrollbar { width: 4px; }
        .im-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        .im-empty {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255,255,255,0.2);
          font-size: 13px;
          font-family: 'DM Mono', monospace;
        }
      `}</style>

      <div className="im-root">

        {/* Header */}
        <div className="im-header">
          <div className="im-title">Reported Issues</div>

          {/* Status filter chips */}
          <div className="im-status-row">
            <div
              className="im-status-chip"
              onClick={() => setStatusFilter("All")}
              style={{
                background: statusFilter === "All" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${statusFilter === "All" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
                color: statusFilter === "All" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
              }}
            >
              All&nbsp;<span style={{ opacity: 0.5 }}>{issues.length}</span>
            </div>
            {Object.entries(counts).map(([key, count]) => {
              const s = STATUS[key];
              const active = statusFilter === key;
              return (
                <div
                  key={key}
                  className="im-status-chip"
                  onClick={() => setStatusFilter(active ? "All" : key)}
                  style={{
                    background: active ? s.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? s.border : "rgba(255,255,255,0.07)"}`,
                    color: active ? s.color : "rgba(255,255,255,0.3)",
                  }}
                >
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: s.dot, flexShrink: 0,
                    boxShadow: active ? `0 0 4px ${s.dot}` : "none",
                  }} />
                  {s.label}&nbsp;<span style={{ opacity: 0.5 }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Search */}
          <div className="im-search">
            <svg className="im-search-icon" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="im-search-input"
              placeholder="Search road, area, type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Type filters */}
          <div className="im-filters">
            {FILTER_TYPES.map(t => (
              <div
                key={t}
                className={`im-filter-chip ${typeFilter === t ? "active" : ""}`}
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Sort bar */}
        <div className="im-sort-row">
          <span className="im-sort-label">SORT</span>
          {SORT_OPTIONS.map(s => (
            <button
              key={s.key}
              className={`im-sort-btn ${sortBy === s.key ? "active" : "inactive"}`}
              onClick={() => setSortBy(s.key)}
            >
              {s.label}
            </button>
          ))}
          <span className="im-count">{filtered.length} issues</span>
        </div>

        {/* List */}
        <div className="im-list">
          {loading ? (
            <Skeleton />
          ) : filtered.length === 0 ? (
            <div className="im-empty">
              No issues match the current filters
            </div>
          ) : (
            filtered.map((issue, i) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                onIssueClick={onIssueClick}
                onViewOnMap={onViewOnMap}
                animDelay={`${i * 40}ms`}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
