import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import { getIssues } from "../services/roadService";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Dashboard.jsx â€” Raksha AI analytics command centre
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* â”€â”€ Shared layout shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PageShell({ title, subtitle, children, navigate, activeNav = "dashboard" }) {
  const { t } = useTranslation();
  const links = [
    { key: "home", labelKey: "navigation.home", path: "/" },
    { key: "dashboard", labelKey: "navigation.dashboard", path: "/dashboard" },
    { key: "sos", labelKey: "navigation.sos", path: "/sos" },
    { key: "report-issue", labelKey: "navigation.reportIssue", path: "/report-issue" },
    { key: "risk-alert", labelKey: "navigation.riskAlertPlural", path: "/risk-alert" },
    { key: "legal-info", labelKey: "navigation.legal", path: "/legal-info" },
    { key: "status", labelKey: "navigation.checkStatus", path: "/status" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060810",
      color: "#e2e8f0",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,8,16,0.96)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
        padding: "0 24px",
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            onClick={() => navigate("/")}>
            <svg width="28" height="28" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="25" fill="#0d111b" stroke="rgba(220,38,38,0.3)" strokeWidth="1"/>
              <path d="M26 8 L40 15 L40 28 C40 36 26 44 26 44 C26 44 12 36 12 28 L12 15 Z"
                fill="#dc2626" fillOpacity="0.2" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/>
              <text x="26" y="32" textAnchor="middle" fill="#f1f5f9" fontSize="13"
                fontFamily="'Bebas Neue',cursive" letterSpacing="2">RA</text>
            </svg>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 15, letterSpacing: 2.5, color: "#f1f5f9" }}>
              RAKSHA AI
            </span>
          </div>

          <div style={{
            display: "flex", gap: 2,
            borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: 16,
          }}>
            {links.map(l => (
              <button key={l.key} onClick={() => navigate(l.path)} style={{
                background: activeNav === l.key ? "rgba(220,38,38,0.12)" : "none",
                border: activeNav === l.key ? "1px solid rgba(220,38,38,0.25)" : "1px solid transparent",
                borderRadius: 6, cursor: "pointer",
                padding: "4px 11px",
                fontSize: 11, fontWeight: 500,
                color: activeNav === l.key ? "#f87171" : "rgba(255,255,255,0.85)",
                fontFamily: "'DM Sans',sans-serif",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}>
                {t(l.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <LanguageSelector />
        <button onClick={() => navigate("/sos")} style={{
          padding: "6px 16px", borderRadius: 7,
          background: "#dc2626", border: "none",
          color: "white", fontSize: 12, fontWeight: 700,
          cursor: "pointer", letterSpacing: "0.5px",
          boxShadow: "0 0 16px rgba(220,38,38,0.35)",
          fontFamily: "'DM Sans',sans-serif",
          flexShrink: 0,
        }}>SOS</button>
      </div>

      {/* Page header */}
      <div style={{
        padding: "28px 28px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{
          fontFamily: "'DM Mono',monospace",
          fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.25)",
          marginBottom: 6,
        }}>
          RAKSHA AI / {title.toUpperCase()}
        </div>
        <div style={{
          fontFamily: "'Bebas Neue',cursive",
          fontSize: 28, letterSpacing: 3, color: "#f1f5f9", lineHeight: 1,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 5 }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

/* â”€â”€ Stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: "#080c14",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      padding: "18px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: 1.2,
          color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: color + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={color} strokeWidth="1.8" strokeLinecap="round">
            <path d={icon} />
          </svg>
        </div>
      </div>
      <div style={{
        fontFamily: "'Bebas Neue',cursive",
        fontSize: 36, letterSpacing: 1, color: "#f1f5f9", lineHeight: 1,
        marginBottom: 4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>
        {sub}
      </div>
    </div>
  );
}

/* â”€â”€ Hotspot bar (mini inline chart) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function MiniHotspotChart({ zones }) {
  const { t } = useTranslation();
  const max = Math.max(...zones.map(z => z.count));
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      background: "#080c14",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      padding: "20px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 18,
      }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 17, letterSpacing: 2, color: "#f1f5f9" }}>
            {t("dashboardLive.accidentHotspots")}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
            {t("dashboardLive.topZones")}
          </div>
        </div>
        <span style={{
          fontSize: 9, padding: "3px 8px", borderRadius: 4,
          background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)",
          color: "#f87171", fontFamily: "'DM Mono',monospace", letterSpacing: 1,
        }}>{t("dashboardLive.live")}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {zones.map((z, i) => (
          <div key={z.name}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: hovered === i ? "#f1f5f9" : "rgba(255,255,255,0.5)",
                fontFamily: "'DM Mono',monospace", transition: "color 0.15s" }}>
                {z.name}
              </span>
              <span style={{ fontSize: 12, fontFamily: "'Bebas Neue',cursive",
                color: z.count / max > 0.7 ? "#dc2626" : z.count / max > 0.45 ? "#f97316" : "#eab308",
                letterSpacing: 1 }}>
                {z.count}
              </span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(z.count / max) * 100}%`,
                borderRadius: 2,
                background: z.count / max > 0.7 ? "#dc2626" : z.count / max > 0.45 ? "#f97316" : "#eab308",
                transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* â”€â”€ Recent issues list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function RecentIssues({ issues }) {
  const { t } = useTranslation();
  const SEV_COLOR = { critical: "#dc2626", high: "#f97316", medium: "#eab308", low: "#6b7280" };
  const STATUS_COLOR = {
    pending: "#f97316", verified: "#3b82f6", "in-progress": "#eab308", resolved: "#22c55e"
  };

  return (
    <div style={{
      background: "#080c14",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        fontFamily: "'Bebas Neue',cursive",
        fontSize: 17, letterSpacing: 2, color: "#f1f5f9",
      }}>
        {t("dashboardLive.recentReports")}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {issues.map((issue, i) => (
          <div key={issue.id} style={{
            padding: "12px 20px",
            borderBottom: i < issues.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            display: "flex", alignItems: "center", gap: 12,
            transition: "background 0.15s",
            cursor: "pointer",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: SEV_COLOR[issue.severity],
              boxShadow: `0 0 6px ${SEV_COLOR[issue.severity]}`,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.75)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t(`dashboardLive.issueTypes.${issue.typeKey}`)} - {issue.road}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace", marginTop: 2 }}>
                {issue.area} Â· {issue.reportedAt}
              </div>
            </div>
            <span style={{
              fontSize: 9, padding: "2px 7px", borderRadius: 4, flexShrink: 0,
              background: STATUS_COLOR[issue.status] + "18",
              border: `1px solid ${STATUS_COLOR[issue.status]}33`,
              color: STATUS_COLOR[issue.status],
              fontFamily: "'DM Mono',monospace", letterSpacing: "0.5px",
            }}>
              {t(`dashboardLive.status.${issue.statusKey}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* â”€â”€ Map placeholder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function MapPlaceholder({ navigate }) {
  const { t } = useTranslation();
  return (
    <div style={{
      background: "#080c14",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      overflow: "hidden",
      height: 320,
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
    }}
      onClick={() => navigate("/dashboard")}
    >
      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />
      {/* Corner markers */}
      {[["top:12px;left:12px","borderTop","borderLeft"],
        ["top:12px;right:12px","borderTop","borderRight"],
        ["bottom:12px;left:12px","borderBottom","borderLeft"],
        ["bottom:12px;right:12px","borderBottom","borderRight"]].map(([pos], i) => (
        <div key={i} style={{
          position: "absolute", ...Object.fromEntries(pos.split(";").map(p=>p.split(":"))),
          width: 16, height: 16,
          borderTop: pos.includes("top:") ? "1.5px solid rgba(59,130,246,0.4)" : "none",
          borderBottom: pos.includes("bottom:") ? "1.5px solid rgba(59,130,246,0.4)" : "none",
          borderLeft: pos.includes("left:") ? "1.5px solid rgba(59,130,246,0.4)" : "none",
          borderRight: pos.includes("right:") ? "1.5px solid rgba(59,130,246,0.4)" : "none",
        }} />
      ))}

      {/* Pulsing dots */}
      {[
        { top: "35%", left: "28%", color: "#dc2626" },
        { top: "55%", left: "55%", color: "#f97316" },
        { top: "25%", left: "65%", color: "#dc2626" },
        { top: "65%", left: "35%", color: "#eab308" },
        { top: "45%", left: "75%", color: "#22c55e" },
      ].map((dot, i) => (
        <div key={i} style={{
          position: "absolute",
          top: dot.top, left: dot.left,
          width: 10, height: 10,
          borderRadius: "50%",
          background: dot.color,
          boxShadow: `0 0 12px ${dot.color}`,
          animation: `mapDotPulse 2s ease-in-out ${i * 0.4}s infinite`,
        }} />
      ))}

      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Bebas Neue',cursive",
          fontSize: 18, letterSpacing: 3,
          color: "rgba(255,255,255,0.3)",
          marginBottom: 8,
        }}>
          {t("dashboardLive.liveMapView")}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace" }}>
          {t("dashboardLive.connectMaps")}
        </div>
      </div>

      <style>{`
        @keyframes mapDotPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/* â”€â”€ Main Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const FALLBACK_ZONES = [
  { name: "NH-48 Ring Road",      count: 142 },
  { name: "Mathura Road Flyover", count: 118 },
  { name: "Outer Ring Road N",    count: 97  },
  { name: "DND Flyway",           count: 83  },
  { name: "Mehrauli-Gurgaon Rd",  count: 71  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [time, setTime] = useState(new Date());
  const [liveIssues, setLiveIssues] = useState([]);
  const [zones, setZones] = useState(FALLBACK_ZONES);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loadingIssues, setLoadingIssues] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoadingIssues(true);
      try {
        const data = await getIssues({ limit: 10 });
        const items = data.items || [];
        setLiveIssues(items);
        // Build hotspot zones from UNRESOLVED road names only
        const areaCounts = {};
        items
          .filter(r => r.status !== "resolved")
          .forEach(r => {
            const key = r.road || r.area || "Unknown";
            areaCounts[key] = (areaCounts[key] || 0) + 1;
          });
        const sortedZones = Object.entries(areaCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        if (sortedZones.length > 0) setZones(sortedZones);
        // Stats
        const pending = items.filter(i => i.status === "pending").length;
        const resolved = items.filter(i => i.status === "resolved").length;
        setStats({ total: data.total || items.length, pending, resolved });
      } catch {
        // Fall back to static data silently
      } finally {
        setLoadingIssues(false);
      }
    }
    fetchData();
  }, []);

  // Normalize live issues for the RecentIssues component
  const SEV_MAP = { critical: "critical", high: "high", medium: "medium", low: "low" };
  const STATUS_KEY_MAP = { pending: "pending", verified: "verified", "in-progress": "inProgress", resolved: "resolved" };
  const TYPE_KEY_MAP = { Pothole: "pothole", "Damaged Road": "damagedRoad", Waterlogging: "waterlogging", "Broken Divider": "brokenDivider", "Missing Sign": "missingSign", Other: "other" };

  function timeAgo(isoStr) {
    if (!isoStr) return "";
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  }

  const displayIssues = liveIssues.length > 0
    ? liveIssues.slice(0, 5).map(r => ({
        id: r.id,
        typeKey: TYPE_KEY_MAP[r.type] || "other",
        severity: SEV_MAP[r.severity] || "medium",
        road: r.road,
        area: r.area || "",
        reportedAt: timeAgo(r.created_at),
        status: r.status,
        statusKey: STATUS_KEY_MAP[r.status] || "pending",
      }))
    : [];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      <PageShell
        title={t("dashboard.title")}
        subtitle={`${t("dashboardLive.subtitlePrefix")} · ${time.toLocaleTimeString(i18n.language)}`}
        navigate={navigate}
        activeNav="dashboard"
      >
        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
          <StatCard label={t("dashboardLive.activeIncidents")} value={stats.pending || "—"} sub={`${stats.pending} pending review`} color="#dc2626"
            icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          <StatCard label={t("dashboardLive.issuesReported")} value={stats.total || "—"} sub="All time total" color="#f97316"
            icon="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
          <StatCard label={t("dashboardLive.sosActivations")} value="341" sub={t("dashboardLive.thisMonth")} color="#22c55e"
            icon="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-5 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
          <StatCard label={t("dashboardLive.resolvedIssues")} value={stats.resolved || "—"} sub="Issues resolved" color="#3b82f6"
            icon="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 0-2 2h-2a2 2 0 0 0-2-2z" />
        </div>

        {/* Map + Hotspot row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 12, marginBottom: 20 }}>
          <MapPlaceholder navigate={navigate} />
          <MiniHotspotChart zones={zones} />
        </div>

        {/* Recent issues */}
        {loadingIssues ? (
          <div style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: "'DM Mono',monospace", letterSpacing: 1 }}>Loading reports…</div>
        ) : displayIssues.length > 0 ? (
          <RecentIssues issues={displayIssues} />
        ) : (
          <div style={{
            background: "#080c14", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 12,
            padding: "48px 24px", textAlign: "center",
          }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 18, letterSpacing: 2, color: "rgba(255,255,255,0.2)", marginBottom: 8 }}>No Reports Yet</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginBottom: 20 }}>Be the first to report a road issue in your area.</div>
            <button onClick={() => navigate("/report-issue")} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "#dc2626", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Report an Issue →
            </button>
          </div>
        )}
      </PageShell>
    </>
  );
}
