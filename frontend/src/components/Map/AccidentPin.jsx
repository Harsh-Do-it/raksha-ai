import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

/**
 * AccidentPin — custom Google Maps OverlayView for Raksha AI
 *
 * Renders a severity-coded warning pin for accident hotspots / reported incidents.
 * Severity drives color, animation intensity, and icon style.
 *
 * Props:
 *   map       {google.maps.Map}  The map instance to render on
 *   accident  {object}           Accident/hotspot data — shape below
 *   onClick   {fn}               Called when pin is clicked
 *
 * Accident shape:
 *   {
 *     id:          string | number,
 *     lat:         number,
 *     lng:         number,
 *     severity:    "critical" | "high" | "medium" | "low",
 *     title:       string,    // e.g. "Multi-vehicle collision"
 *     road:        string,    // e.g. "NH-48, Ring Road"
 *     time:        string,    // e.g. "2 hours ago"
 *     injuries:    number,    // optional
 *     fatalities:  number,    // optional
 *     status:      string,    // "active" | "cleared" | "under investigation"
 *     type:        string,    // "Collision" | "Pothole" | "Waterlogging" | "Breakdown"
 *   }
 */

// ── Severity config ───────────────────────────────────────────────────────────
const SEVERITY = {
  critical: {
    ring: "#dc2626", fill: "#1c0a0a", border: "#dc2626",
    text: "#f87171", glow: "rgba(220,38,38,0.35)",
    label: "Critical", pulseScale: 2.4, pulseDuration: "1.4s",
    iconColor: "#ef4444",
  },
  high: {
    ring: "#f97316", fill: "#1c0f05", border: "#f97316",
    text: "#fb923c", glow: "rgba(249,115,22,0.3)",
    label: "High Risk", pulseScale: 2.1, pulseDuration: "1.8s",
    iconColor: "#fb923c",
  },
  medium: {
    ring: "#eab308", fill: "#1a1500", border: "#ca8a04",
    text: "#facc15", glow: "rgba(234,179,8,0.25)",
    label: "Medium", pulseScale: 1.8, pulseDuration: "2.2s",
    iconColor: "#fbbf24",
  },
  low: {
    ring: "#6b7280", fill: "#111", border: "#4b5563",
    text: "#9ca3af", glow: "rgba(107,114,128,0.15)",
    label: "Low Risk", pulseScale: 1.5, pulseDuration: "3s",
    iconColor: "#9ca3af",
  },
};

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_STYLE = {
  "active":               { bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.3)",  color: "#f87171", dot: "#ef4444" },
  "cleared":              { bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.25)", color: "#4ade80", dot: "#22c55e" },
  "under investigation":  { bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.25)", color: "#fbbf24", dot: "#f59e0b" },
};

// ── Warning triangle icon SVG ─────────────────────────────────────────────────
function WarningIcon({ color = "#ef4444", size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        fill={color + "22"} stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      <line x1="12" y1="9"  x2="12" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="0.8" fill={color}/>
    </svg>
  );
}

// ── Incident type icons (path only) ──────────────────────────────────────────
const TYPE_ICONS = {
  "Collision":    "M3 3l18 18M10.5 10.67a4 4 0 1 0 5.65 5.65M14 6l4 4-4-4zM6 14l-4 4 4-4z",
  "Pothole":      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
  "Waterlogging": "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z",
  "Breakdown":    "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
};

// ── Popup card ────────────────────────────────────────────────────────────────
function AccidentPopup({ accident, onClose }) {
  const sev    = SEVERITY[accident.severity] || SEVERITY.medium;
  const status = STATUS_STYLE[accident.status] || STATUS_STYLE["active"];
  const typeIcon = TYPE_ICONS[accident.type] || TYPE_ICONS["Collision"];

  return (
    <div style={{
      position: "absolute",
      bottom: "calc(100% + 12px)",
      left: "50%",
      transform: "translateX(-50%)",
      width: 240,
      background: "#0a0a12",
      border: `1px solid ${sev.ring}44`,
      borderRadius: 14,
      boxShadow: `0 8px 32px rgba(0,0,0,0.75), 0 0 24px ${sev.glow}`,
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      overflow: "hidden",
      animation: "apopIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      zIndex: 100,
    }}>
      <style>{`
        @keyframes apopIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.86) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) scale(1)    translateY(0);   }
        }
      `}</style>

      {/* Severity stripe */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${sev.ring}, ${sev.ring}66)`,
      }} />

      {/* Header */}
      <div style={{
        padding: "11px 13px 9px",
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: sev.fill, border: `1px solid ${sev.border}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {accident.type ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={sev.iconColor} strokeWidth="1.8" strokeLinecap="round">
                <path d={typeIcon} />
              </svg>
            ) : (
              <WarningIcon color={sev.iconColor} size={16} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.3, marginBottom: 4 }}>
              {accident.title || "Road Incident"}
            </div>
            {/* Severity badge */}
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: "0.6px", padding: "1px 6px",
              borderRadius: 4, background: sev.fill, border: `1px solid ${sev.ring}55`,
              color: sev.text,
            }}>
              ▲ {sev.label.toUpperCase()}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 22, height: 22, borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
          color: "rgba(255,255,255,0.3)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 12, lineHeight: 1,
        }}>✕</button>
      </div>

      {/* Details */}
      <div style={{ padding: "10px 13px" }}>
        {/* Road */}
        {accident.road && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
            {accident.road}
          </div>
        )}

        {/* Time */}
        {accident.time && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 10,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {accident.time}
          </div>
        )}

        {/* Stats row */}
        {(accident.injuries != null || accident.fatalities != null) && (
          <div style={{
            display: "flex", gap: 8, marginBottom: 10,
          }}>
            {accident.injuries != null && (
              <div style={{
                flex: 1, padding: "7px 10px", borderRadius: 8,
                background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.18)",
              }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Injuries</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fb923c", lineHeight: 1 }}>
                  {accident.injuries}
                </div>
              </div>
            )}
            {accident.fatalities != null && (
              <div style={{
                flex: 1, padding: "7px 10px", borderRadius: 8,
                background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)",
              }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Fatalities</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f87171", lineHeight: 1 }}>
                  {accident.fatalities}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        {accident.status && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 10px", borderRadius: 8,
            background: status.bg, border: `1px solid ${status.border}`,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: status.dot, flexShrink: 0,
              boxShadow: `0 0 5px ${status.dot}`,
            }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: status.color, textTransform: "capitalize" }}>
              {accident.status}
            </span>
          </div>
        )}
      </div>

      {/* Tail */}
      <div style={{
        position: "absolute",
        bottom: -7, left: "50%", transform: "translateX(-50%)",
        width: 12, height: 7,
        background: "#0a0a12",
        clipPath: "polygon(0 0, 100% 0, 50% 100%)",
      }} />
    </div>
  );
}

// ── Main AccidentPin ──────────────────────────────────────────────────────────
export default function AccidentPin({ map, accident, onClick }) {
  const containerRef = useRef(null);
  const overlayRef   = useRef(null);
  const [open, setOpen] = useState(false);

  const sev = SEVERITY[accident.severity] || SEVERITY.medium;

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    const container = document.createElement("div");
    container.style.cssText = "position:absolute;cursor:pointer;transform:translate(-50%,-100%);";
    containerRef.current = container;

    class AccidentOverlay extends window.google.maps.OverlayView {
      onAdd() {
        this.getPanes().overlayMouseTarget.appendChild(container);
        ReactDOM.render(<Pin />, container);
      }
      draw() {
        const proj = this.getProjection();
        if (!proj) return;
        const pt = proj.fromLatLngToDivPixel(
          new window.google.maps.LatLng(accident.lat, accident.lng)
        );
        if (pt) {
          container.style.left = pt.x + "px";
          container.style.top  = pt.y + "px";
        }
      }
      onRemove() {
        ReactDOM.unmountComponentAtNode(container);
        container.remove();
      }
    }

    const overlay = new AccidentOverlay();
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
  }, [map, accident]);

  useEffect(() => {
    if (!containerRef.current) return;
    ReactDOM.render(<Pin />, containerRef.current);
  }, [open]);

  function handleClick(e) {
    e.stopPropagation();
    setOpen(v => !v);
    onClick?.();
  }

  function Pin() {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

          .ap-wrap {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .ap-body {
            position: relative;
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: ${sev.fill};
            border: 1.5px solid ${sev.border};
            box-shadow: 0 0 0 3px ${sev.glow}, 0 4px 14px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
          }

          .ap-body:hover {
            transform: rotate(-45deg) scale(1.12);
            box-shadow: 0 0 0 6px ${sev.glow}, 0 6px 20px rgba(0,0,0,0.6);
          }

          .ap-inner {
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          /* Severity-driven pulse */
          .ap-pulse {
            position: absolute;
            inset: -3px;
            border-radius: 50% 50% 50% 0;
            border: 1.5px solid ${sev.ring};
            opacity: 0;
            animation: apPulse ${sev.pulseDuration} ease-out infinite;
          }
          .ap-pulse:nth-child(2) { animation-delay: calc(${sev.pulseDuration} * 0.4); }

          @keyframes apPulse {
            0%   { transform: scale(1);                        opacity: 0.7; }
            100% { transform: scale(${sev.pulseScale});        opacity: 0;   }
          }

          /* Critical: additional shake on the pin body */
          ${accident.severity === "critical" ? `
            .ap-body { animation: apShake 3s ease-in-out infinite; }
            @keyframes apShake {
              0%,100% { transform: rotate(-45deg) translateX(0); }
              92%      { transform: rotate(-45deg) translateX(0); }
              94%      { transform: rotate(-45deg) translateX(-1.5px); }
              96%      { transform: rotate(-45deg) translateX(1.5px); }
              98%      { transform: rotate(-45deg) translateX(-1px); }
            }
          ` : ""}

          .ap-dot {
            width: 5px; height: 5px;
            border-radius: 50%;
            background: ${sev.ring};
            box-shadow: 0 0 6px ${sev.ring};
            margin-top: 1px;
          }
        `}</style>

        <div className="ap-wrap" onClick={handleClick}>
          <div style={{ position: "relative" }}>
            {/* Pulse rings */}
            <div className="ap-pulse" />
            <div className="ap-pulse" />

            {/* Pin body */}
            <div className="ap-body">
              <div className="ap-inner">
                <WarningIcon color={sev.iconColor} size={16} />
              </div>
            </div>
          </div>

          {/* Anchor dot */}
          <div className="ap-dot" />

          {/* Popup */}
          {open && (
            <AccidentPopup
              accident={accident}
              onClose={e => { e?.stopPropagation(); setOpen(false); }}
            />
          )}
        </div>
      </>
    );
  }

  return null; // renders via OverlayView
}
