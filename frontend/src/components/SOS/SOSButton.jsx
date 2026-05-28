import { useState, useEffect, useRef } from "react";
import SOSModal from "./SOSModal";

/**
 * SOSButton — one-tap emergency trigger for Raksha AI
 *
 * Usage:
 *   <SOSButton />
 *
 * Props:
 *   onAlertSent(payload) — optional callback after SOS is dispatched
 */
export default function SOSButton({ onAlertSent }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pressed, setPressed]     = useState(false);
  const [ripples, setRipples]     = useState([]);
  const rippleId = useRef(0);

  // Spawn a new ripple ring on each press
  function addRipple() {
    const id = ++rippleId.current;
    setRipples(r => [...r, id]);
    setTimeout(() => setRipples(r => r.filter(x => x !== id)), 1400);
  }

  function handlePress() {
    setPressed(true);
    addRipple();
  }

  function handleRelease() {
    setPressed(false);
    setModalOpen(true);
  }

  function handleAlertSent(payload) {
    setModalOpen(false);
    onAlertSent?.(payload);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');

        .sos-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          font-family: 'DM Sans', sans-serif;
          user-select: none;
        }

        /* ── Orbit ring ── */
        .sos-orbit {
          position: relative;
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Ambient pulse rings (always running) */
        .sos-ambient {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid rgba(220, 38, 38, 0.35);
          animation: ambientPulse 2.4s ease-out infinite;
        }
        .sos-ambient:nth-child(2) { animation-delay: 0.8s; }
        .sos-ambient:nth-child(3) { animation-delay: 1.6s; }

        @keyframes ambientPulse {
          0%   { transform: scale(1);    opacity: 0.7; }
          100% { transform: scale(1.55); opacity: 0;   }
        }

        /* Tap-triggered ripples */
        .sos-ripple {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(220, 38, 38, 0.8);
          animation: rippleBurst 1.4s cubic-bezier(0.2, 0.6, 0.4, 1) forwards;
          pointer-events: none;
        }

        @keyframes rippleBurst {
          0%   { transform: scale(1);   opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        /* ── Main button ── */
        .sos-btn {
          position: relative;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          outline: none;
          -webkit-tap-highlight-color: transparent;

          /* Layered red radial gradient for depth */
          background:
            radial-gradient(circle at 38% 34%, rgba(255,100,100,0.55) 0%, transparent 55%),
            radial-gradient(circle at 62% 68%, rgba(120,0,0,0.4) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #dc2626 0%, #991b1b 60%, #7f1d1d 100%);

          box-shadow:
            0 0 0 4px rgba(220, 38, 38, 0.25),
            0 0 40px rgba(220, 38, 38, 0.4),
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 2px 4px rgba(255,255,255,0.15),
            inset 0 -4px 8px rgba(0,0,0,0.3);

          transition:
            transform      0.12s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow     0.12s ease,
            filter         0.12s ease;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .sos-btn:hover {
          transform: scale(1.04);
          box-shadow:
            0 0 0 5px rgba(220, 38, 38, 0.3),
            0 0 56px rgba(220, 38, 38, 0.55),
            0 12px 40px rgba(0, 0, 0, 0.45),
            inset 0 2px 4px rgba(255,255,255,0.18),
            inset 0 -4px 8px rgba(0,0,0,0.3);
          filter: brightness(1.08);
        }

        .sos-btn:active,
        .sos-btn.pressed {
          transform: scale(0.93);
          box-shadow:
            0 0 0 6px rgba(220, 38, 38, 0.5),
            0 0 72px rgba(220, 38, 38, 0.7),
            0 4px 16px rgba(0, 0, 0, 0.5),
            inset 0 4px 12px rgba(0,0,0,0.4),
            inset 0 -2px 4px rgba(255,255,255,0.08);
          filter: brightness(1.15);
        }

        /* Glossy top sheen */
        .sos-btn::before {
          content: '';
          position: absolute;
          top: 12%;
          left: 18%;
          width: 64%;
          height: 38%;
          border-radius: 50%;
          background: radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.28) 0%, transparent 80%);
          pointer-events: none;
        }

        /* SOS label */
        .sos-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px;
          letter-spacing: 4px;
          color: #ffffff;
          line-height: 1;
          text-shadow:
            0 1px 2px rgba(0,0,0,0.4),
            0 0 20px rgba(255,200,200,0.3);
          position: relative;
          z-index: 1;
        }

        .sos-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(255, 220, 220, 0.85);
          position: relative;
          z-index: 1;
        }

        /* ── Status text beneath button ── */
        .sos-status {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.5px;
          color: rgba(150, 150, 150, 0.8);
        }

        .sos-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
          animation: dotBlink 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        .sos-hint {
          font-size: 11px;
          color: rgba(120, 120, 120, 0.65);
          letter-spacing: 0.3px;
          text-align: center;
          max-width: 200px;
          line-height: 1.5;
        }
      `}</style>

      <div className="sos-root">
        <div className="sos-orbit">
          {/* Ambient rings */}
          <div className="sos-ambient" />
          <div className="sos-ambient" />
          <div className="sos-ambient" />

          {/* Tap ripples */}
          {ripples.map(id => (
            <div key={id} className="sos-ripple" />
          ))}

          {/* Main button */}
          <button
            className={`sos-btn${pressed ? " pressed" : ""}`}
            onPointerDown={handlePress}
            onPointerUp={handleRelease}
            onPointerLeave={() => setPressed(false)}
            aria-label="Send SOS emergency alert"
          >
            <span className="sos-label">SOS</span>
            <span className="sos-sub">Emergency</span>
          </button>
        </div>

        <div className="sos-status">
          <span className="sos-dot" />
          System active — GPS ready
        </div>

        <p className="sos-hint">
          Tap to send your location to emergency&nbsp;services &amp; nearby contacts
        </p>
      </div>

      {modalOpen && (
        <SOSModal
          onClose={() => setModalOpen(false)}
          onAlertSent={handleAlertSent}
        />
      )}
    </>
  );
}
