import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

/**
 * HospitalMarker — custom Google Maps OverlayView for Raksha AI
 *
 * Renders a glowing green cross-pin on the map with an info popup on click.
 * Uses Google Maps OverlayView for pixel-perfect custom DOM rendering.
 *
 * Props:
 *   map       {google.maps.Map}  The map instance to render on
 *   hospital  {object}           Hospital data — shape below
 *   onClick   {fn}               Called when marker or popup is clicked
 *
 * Hospital shape:
 *   {
 *     id:        string | number,
 *     name:      string,
 *     lat:       number,
 *     lng:       number,
 *     distance:  string,   // e.g. "1.2 km"
 *     eta:       string,   // e.g. "4 min"
 *     phone:     string,   // e.g. "011-26588500"
 *     beds:      number,   // optional — available beds
 *     type:      string,   // optional — "Government" | "Private" | "Trauma Centre"
 *     open24h:   boolean,  // optional
 *   }
 */

// ── Hospital icon SVG ────────────────────────────────────────────────────────
function HospitalIconSVG({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none"
      xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring glow */}
      <circle cx="14" cy="14" r="13" fill="#052e16" stroke="#16a34a" strokeWidth="1.2" strokeOpacity="0.8"/>
      {/* Cross */}
      <rect x="12" y="7" width="4" height="14" rx="1.5" fill="#22c55e"/>
      <rect x="7"  y="12" width="14" height="4"  rx="1.5" fill="#22c55e"/>
    </svg>
  );
}

// ── Popup card rendered inside the marker DOM node ───────────────────────────
function HospitalPopup({ hospital, onClose, onCallClick }) {
  const typeColors = {
    "Government":    { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.28)",  text: "#60a5fa" },
    "Private":       { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.28)",  text: "#a78bfa" },
    "Trauma Centre": { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.28)",   text: "#f87171" },
  };
  const typeStyle = typeColors[hospital.type] || typeColors["Government"];

  return (
    <div style={{
      position: "absolute",
      bottom: "calc(100% + 10px)",
      left: "50%",
      transform: "translateX(-50%)",
      width: 230,
      background: "#0d111b",
      border: "1px solid rgba(34,197,94,0.22)",
      borderRadius: 14,
      boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(34,197,94,0.08)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      overflow: "hidden",
      animation: "popupIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      zIndex: 100,
    }}>
      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.88) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) scale(1)    translateY(0);   }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "12px 14px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30,
            borderRadius: 8,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <HospitalIconSVG size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "#f1f5f9",
              lineHeight: 1.3, marginBottom: 3,
            }}>
              {hospital.name}
            </div>
            {hospital.type && (
              <span style={{
                fontSize: 10, fontWeight: 500, letterSpacing: "0.5px",
                padding: "2px 7px", borderRadius: 5,
                background: typeStyle.bg, border: `1px solid ${typeStyle.border}`,
                color: typeStyle.text,
              }}>
                {hospital.type}
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 22, height: 22, borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent", color: "rgba(255,255,255,0.3)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 12, lineHeight: 1,
        }}>✕</button>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 1, background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {[
          { label: "Distance", value: hospital.distance || "—" },
          { label: "ETA",      value: hospital.eta       || "—", highlight: true },
          hospital.beds != null && { label: "Beds free",  value: hospital.beds },
          hospital.open24h != null && { label: "Hours", value: hospital.open24h ? "24 / 7" : "Check hours" },
        ].filter(Boolean).map(({ label, value, highlight }) => (
          <div key={label} style={{ padding: "9px 14px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2, letterSpacing: "0.4px" }}>
              {label}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 600,
              color: highlight ? "#22c55e" : "#e2e8f0",
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
        <a
          href={`tel:${hospital.phone}`}
          onClick={e => { e.stopPropagation(); onCallClick?.(); }}
          style={{
            flex: 1, padding: "8px 0",
            borderRadius: 8, border: "1px solid rgba(34,197,94,0.25)",
            background: "rgba(34,197,94,0.08)",
            color: "#22c55e", fontSize: 12, fontWeight: 600,
            textDecoration: "none", textAlign: "center",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            transition: "all 0.15s",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Call
        </a>
        <a
          href={`https://maps.google.com/?q=${hospital.lat},${hospital.lng}`}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            flex: 1, padding: "8px 0",
            borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
            background: "transparent",
            color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 500,
            textDecoration: "none", textAlign: "center",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            transition: "all 0.15s",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Navigate
        </a>
      </div>

      {/* Tail */}
      <div style={{
        position: "absolute",
        bottom: -7, left: "50%", transform: "translateX(-50%)",
        width: 12, height: 7,
        background: "#0d111b",
        clipPath: "polygon(0 0, 100% 0, 50% 100%)",
        borderLeft: "1px solid rgba(34,197,94,0.22)",
        borderRight: "1px solid rgba(34,197,94,0.22)",
      }} />
    </div>
  );
}

// ── Main HospitalMarker ──────────────────────────────────────────────────────
export default function HospitalMarker({ map, hospital, onClick }) {
  const containerRef = useRef(null);
  const overlayRef   = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Create a container div for the custom overlay
    const container = document.createElement("div");
    container.style.cssText = "position:absolute;cursor:pointer;transform:translate(-50%,-50%);";
    containerRef.current = container;

    // Build OverlayView
    class HospitalOverlay extends window.google.maps.OverlayView {
      onAdd() {
        this.getPanes().overlayMouseTarget.appendChild(container);
        ReactDOM.render(<MarkerPin />, container);
      }
      draw() {
        const proj = this.getProjection();
        if (!proj) return;
        const pt = proj.fromLatLngToDivPixel(
          new window.google.maps.LatLng(hospital.lat, hospital.lng)
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

    const overlay = new HospitalOverlay();
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
  }, [map, hospital]);

  // Re-render when open state changes
  useEffect(() => {
    if (!containerRef.current) return;
    ReactDOM.render(<MarkerPin />, containerRef.current);
  }, [open]);

  function handleClick(e) {
    e.stopPropagation();
    setOpen(v => !v);
    onClick?.();
  }

  function MarkerPin() {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
          .hm-pin {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hm-icon-wrap {
            width: 36px; height: 36px;
            border-radius: 50%;
            background: #052e16;
            border: 1.5px solid #16a34a;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 0 4px rgba(34,197,94,0.12), 0 4px 12px rgba(0,0,0,0.5);
            transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
            position: relative;
            z-index: 2;
          }
          .hm-icon-wrap:hover {
            transform: scale(1.15);
            box-shadow: 0 0 0 7px rgba(34,197,94,0.18), 0 6px 18px rgba(0,0,0,0.6);
          }
          .hm-pulse {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%,-50%);
            width: 36px; height: 36px;
            border-radius: 50%;
            border: 1.5px solid rgba(34,197,94,0.5);
            animation: hmPulse 2s ease-out infinite;
            z-index: 1;
          }
          .hm-pulse:nth-child(2) { animation-delay: 0.7s; }
          @keyframes hmPulse {
            0%   { transform: translate(-50%,-50%) scale(1);    opacity: 0.8; }
            100% { transform: translate(-50%,-50%) scale(2.1);  opacity: 0;   }
          }
          .hm-stem {
            width: 2px; height: 8px;
            background: linear-gradient(to bottom, #16a34a, transparent);
            margin-top: -1px;
            z-index: 1;
          }
          .hm-dot {
            width: 5px; height: 5px;
            border-radius: 50%;
            background: #16a34a;
            box-shadow: 0 0 6px #16a34a;
            margin-top: -1px;
          }
        `}</style>
        <div className="hm-pin" onClick={handleClick}>
          <div style={{ position: "relative" }}>
            <div className="hm-pulse" />
            <div className="hm-pulse" />
            <div className="hm-icon-wrap">
              <HospitalIconSVG size={22} />
            </div>
          </div>
          <div className="hm-stem" />
          <div className="hm-dot"  />
          {open && (
            <HospitalPopup
              hospital={hospital}
              onClose={e => { e?.stopPropagation(); setOpen(false); }}
              onCallClick={() => {}}
            />
          )}
        </div>
      </>
    );
  }

  return null; // renders via OverlayView
}
