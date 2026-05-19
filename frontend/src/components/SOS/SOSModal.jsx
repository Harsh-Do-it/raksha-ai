import { useState, useEffect, useCallback } from "react";

/**
 * SOSModal — emergency alert flow for Raksha AI
 *
 * Stages:
 *   1. "confirm"   — 5-second countdown before auto-send (cancel option)
 *   2. "locating"  — acquiring GPS
 *   3. "sending"   — calling backend SOS API
 *   4. "sent"      — shows nearby hospitals + simulated ambulance ETA
 *
 * Props:
 *   onClose()              — dismiss modal
 *   onAlertSent(payload)   — called after successful dispatch
 */

const COUNTDOWN_SEC = 5;

// ── Simulated nearby hospitals (replace with Google Maps API results) ──
const MOCK_HOSPITALS = [
  { name: "AIIMS Trauma Centre",          distance: "1.2 km", eta: "4 min",  phone: "011-26588500" },
  { name: "Safdarjung Hospital",           distance: "2.7 km", eta: "8 min",  phone: "011-26707444" },
  { name: "Ram Manohar Lohia Hospital",    distance: "3.1 km", eta: "10 min", phone: "011-23404359" },
];

const MOCK_ETA = "6 min";

// ── Icons (inline SVG, no external dependency) ──
function Icon({ d, size = 20, color = "currentColor", strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const ICONS = {
  location:   "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  hospital:   "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10 M12 6v6 M9 9h6",
  ambulance:  "M10 3H4a1 1 0 0 0-1 1v13h2 M14 3h1l5 5v8h-2 M9 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M16 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M9 11V7h4 M12 7v4",
  phone:      "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  close:      "M18 6 6 18 M6 6l12 12",
  check:      "M20 6 9 17l-5-5",
  warning:    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  signal:     "M1.42 9a16 16 0 0 1 21.16 0 M5 12.55a11 11 0 0 1 14.08 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01",
};

export default function SOSModal({ onClose, onAlertSent }) {
  const [stage, setStage]       = useState("confirm"); // confirm → locating → sending → sent
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC);
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState(null);

  // ── Stage: confirm — auto-send countdown ──
  useEffect(() => {
    if (stage !== "confirm") return;
    if (countdown <= 0) { startLocating(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  // ── Stage: locating — get GPS ──
  function startLocating() {
    setStage("locating");
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported — using default location.");
      setLocation({ lat: 28.6139, lng: 77.2090, label: "New Delhi (default)" });
      setTimeout(() => setStage("sending"), 1200);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
          label: `${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`,
        });
        setStage("sending");
      },
      () => {
        setLocError("Could not access GPS — using approximate location.");
        setLocation({ lat: 28.6139, lng: 77.2090, label: "New Delhi (approx.)" });
        setStage("sending");
      },
      { timeout: 6000, maximumAge: 0 }
    );
  }

  // ── Stage: sending — simulate API call ──
  useEffect(() => {
    if (stage !== "sending") return;
    const t = setTimeout(() => {
      setStage("sent");
      onAlertSent?.({ location, hospitals: MOCK_HOSPITALS, eta: MOCK_ETA });
    }, 1800);
    return () => clearTimeout(t);
  }, [stage]);

  // Escape key closes
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && stage === "confirm") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        .sos-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(6px);
          animation: overlayIn 0.2s ease;
        }

        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .sos-modal {
          background: #0f0f0f;
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          font-family: 'DM Sans', sans-serif;
          color: #e8e8e8;
          animation: modalIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow:
            0 0 0 1px rgba(220,38,38,0.12),
            0 0 60px rgba(220, 38, 38, 0.2),
            0 24px 80px rgba(0, 0, 0, 0.7);
        }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }

        /* Header bar */
        .sm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .sm-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sm-badge {
          background: #dc2626;
          color: white;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 15px;
          letter-spacing: 2px;
          padding: 3px 10px;
          border-radius: 6px;
        }

        .sm-title {
          font-size: 15px;
          font-weight: 600;
          color: #f0f0f0;
          letter-spacing: 0.2px;
        }

        .sm-close {
          background: none;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .sm-close:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.8);
        }

        /* Body */
        .sm-body {
          padding: 24px 20px;
        }

        /* ── STAGE: confirm ── */
        .sm-confirm-ring {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 24px;
        }

        .sm-ring-svg {
          position: absolute;
          inset: 0;
          transform: rotate(-90deg);
        }

        .sm-ring-bg {
          fill: none;
          stroke: rgba(220,38,38,0.15);
          stroke-width: 5;
        }

        .sm-ring-progress {
          fill: none;
          stroke: #dc2626;
          stroke-width: 5;
          stroke-linecap: round;
          transition: stroke-dashoffset 1s linear;
        }

        .sm-ring-num {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .sm-countdown-n {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 44px;
          color: #dc2626;
          line-height: 1;
        }

        .sm-countdown-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-top: 2px;
        }

        .sm-confirm-text {
          text-align: center;
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .sm-confirm-text strong {
          color: #f5f5f5;
          font-weight: 600;
        }

        .sm-actions {
          display: flex;
          gap: 10px;
        }

        .sm-btn-cancel {
          flex: 1;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: rgba(255,255,255,0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.2px;
        }
        .sm-btn-cancel:hover {
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.2);
        }

        .sm-btn-send {
          flex: 2;
          padding: 13px;
          border-radius: 12px;
          border: none;
          background: #dc2626;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: all 0.15s;
          box-shadow: 0 4px 16px rgba(220,38,38,0.4);
        }
        .sm-btn-send:hover {
          background: #b91c1c;
          box-shadow: 0 6px 24px rgba(220,38,38,0.5);
          transform: translateY(-1px);
        }
        .sm-btn-send:active { transform: translateY(0); }

        /* ── STAGE: locating / sending ── */
        .sm-loader-wrap {
          text-align: center;
          padding: 12px 0 8px;
        }

        .sm-spinner {
          width: 52px;
          height: 52px;
          margin: 0 auto 18px;
          border-radius: 50%;
          border: 3px solid rgba(220,38,38,0.15);
          border-top-color: #dc2626;
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .sm-loader-title {
          font-size: 16px;
          font-weight: 600;
          color: #f0f0f0;
          margin-bottom: 6px;
        }

        .sm-loader-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }

        .sm-signal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 20px;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }

        /* ── STAGE: sent ── */
        .sm-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(34,197,94,0.12);
          border: 2px solid rgba(34,197,94,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          animation: successPop 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }

        @keyframes successPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }

        .sm-success-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 2px;
          color: #22c55e;
          text-align: center;
          margin-bottom: 4px;
        }

        .sm-success-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          text-align: center;
          margin-bottom: 24px;
        }

        /* Location chip */
        .sm-location-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 20px;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
        }

        .sm-location-chip span {
          color: #e8e8e8;
          font-weight: 500;
          font-size: 12px;
          word-break: break-all;
        }

        /* Ambulance ETA bar */
        .sm-eta-bar {
          background: rgba(220,38,38,0.08);
          border: 1px solid rgba(220,38,38,0.22);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }

        .sm-eta-icon {
          width: 40px;
          height: 40px;
          background: rgba(220,38,38,0.14);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sm-eta-info { flex: 1; min-width: 0; }

        .sm-eta-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 3px;
        }

        .sm-eta-value {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          color: #ef4444;
          letter-spacing: 1px;
          line-height: 1;
        }

        .sm-eta-dispatch {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          margin-top: 2px;
        }

        /* Section heading */
        .sm-section-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 10px;
        }

        /* Hospital list */
        .sm-hospitals {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .sm-hospital-row {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 11px 14px;
          transition: background 0.15s;
        }
        .sm-hospital-row:hover {
          background: rgba(255,255,255,0.05);
        }

        .sm-hospital-icon {
          width: 34px;
          height: 34px;
          background: rgba(59,130,246,0.12);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sm-hospital-info { flex: 1; min-width: 0; }

        .sm-hospital-name {
          font-size: 13px;
          font-weight: 500;
          color: #e8e8e8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }

        .sm-hospital-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
        }

        .sm-hospital-eta {
          font-size: 12px;
          font-weight: 600;
          color: #22c55e;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .sm-call-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .sm-call-btn:hover {
          background: rgba(34,197,94,0.1);
          border-color: rgba(34,197,94,0.3);
          color: #22c55e;
        }

        /* Footer */
        .sm-footer {
          padding: 14px 20px 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .sm-btn-done {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.7);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.2px;
        }
        .sm-btn-done:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.95);
        }

        /* Warning chip (geolocation fallback) */
        .sm-warn {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: rgba(234,179,8,0.08);
          border: 1px solid rgba(234,179,8,0.2);
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 12px;
          color: rgba(234,179,8,0.85);
          margin-bottom: 14px;
          line-height: 1.5;
        }
      `}</style>

      <div className="sos-overlay" onClick={e => { if (e.target === e.currentTarget && stage === "confirm") onClose(); }}>
        <div className="sos-modal" role="dialog" aria-modal="true" aria-label="SOS Emergency Alert">

          {/* Header */}
          <div className="sm-header">
            <div className="sm-header-left">
              <span className="sm-badge">SOS</span>
              <span className="sm-title">
                {stage === "confirm"  && "Emergency Alert"}
                {stage === "locating" && "Locating You…"}
                {stage === "sending"  && "Dispatching…"}
                {stage === "sent"     && "Alert Dispatched"}
              </span>
            </div>
            {(stage === "confirm" || stage === "sent") && (
              <button className="sm-close" onClick={onClose} aria-label="Close">
                <Icon d={ICONS.close} size={16} />
              </button>
            )}
          </div>

          {/* ── STAGE: confirm ── */}
          {stage === "confirm" && (
            <div className="sm-body">
              <div className="sm-confirm-ring">
                <svg className="sm-ring-svg" viewBox="0 0 120 120">
                  <circle className="sm-ring-bg" cx="60" cy="60" r="52" />
                  <circle
                    className="sm-ring-progress"
                    cx="60" cy="60" r="52"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - countdown / COUNTDOWN_SEC)}`}
                  />
                </svg>
                <div className="sm-ring-num">
                  <span className="sm-countdown-n">{countdown}</span>
                  <span className="sm-countdown-label">seconds</span>
                </div>
              </div>

              <p className="sm-confirm-text">
                An SOS alert with your <strong>live location</strong> will be sent to
                emergency services and your <strong>emergency contacts</strong>.
              </p>

              <div className="sm-actions">
                <button className="sm-btn-cancel" onClick={onClose}>Cancel</button>
                <button className="sm-btn-send" onClick={startLocating}>Send Now</button>
              </div>
            </div>
          )}

          {/* ── STAGE: locating ── */}
          {stage === "locating" && (
            <div className="sm-body">
              <div className="sm-loader-wrap">
                <div className="sm-spinner" />
                <div className="sm-loader-title">Acquiring GPS Signal</div>
                <div className="sm-loader-sub">Please keep the app open…</div>
                <div className="sm-signal">
                  <Icon d={ICONS.signal} size={14} color="rgba(255,255,255,0.3)" />
                  Searching for satellites
                </div>
              </div>
            </div>
          )}

          {/* ── STAGE: sending ── */}
          {stage === "sending" && (
            <div className="sm-body">
              <div className="sm-loader-wrap">
                <div className="sm-spinner" />
                <div className="sm-loader-title">Contacting Emergency Services</div>
                <div className="sm-loader-sub">Notifying nearby units &amp; your contacts…</div>
              </div>
            </div>
          )}

          {/* ── STAGE: sent ── */}
          {stage === "sent" && (
            <>
              <div className="sm-body">
                {/* Success icon */}
                <div className="sm-success-icon">
                  <Icon d={ICONS.check} size={28} color="#22c55e" strokeWidth={2.2} />
                </div>
                <div className="sm-success-title">Alert Sent</div>
                <div className="sm-success-sub">Emergency services have been notified</div>

                {/* Geolocation warning */}
                {locError && (
                  <div className="sm-warn">
                    <Icon d={ICONS.warning} size={14} color="rgba(234,179,8,0.9)" />
                    {locError}
                  </div>
                )}

                {/* Location */}
                {location && (
                  <div className="sm-location-chip">
                    <Icon d={ICONS.location} size={16} color="#ef4444" />
                    <span>{location.label}</span>
                  </div>
                )}

                {/* Ambulance ETA */}
                <div className="sm-eta-bar">
                  <div className="sm-eta-icon">
                    <Icon d={ICONS.ambulance} size={20} color="#ef4444" />
                  </div>
                  <div className="sm-eta-info">
                    <div className="sm-eta-label">Ambulance ETA</div>
                    <div className="sm-eta-value">{MOCK_ETA}</div>
                    <div className="sm-eta-dispatch">Unit dispatched — tracking live</div>
                  </div>
                </div>

                {/* Nearby hospitals */}
                <div className="sm-section-title">Nearby Hospitals</div>
                <div className="sm-hospitals">
                  {MOCK_HOSPITALS.map((h, i) => (
                    <div className="sm-hospital-row" key={i}>
                      <div className="sm-hospital-icon">
                        <Icon d={ICONS.hospital} size={17} color="#60a5fa" />
                      </div>
                      <div className="sm-hospital-info">
                        <div className="sm-hospital-name">{h.name}</div>
                        <div className="sm-hospital-meta">{h.distance} away</div>
                      </div>
                      <div className="sm-hospital-eta">{h.eta}</div>
                      <a href={`tel:${h.phone}`} className="sm-call-btn" aria-label={`Call ${h.name}`}>
                        <Icon d={ICONS.phone} size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sm-footer">
                <button className="sm-btn-done" onClick={onClose}>Done</button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
