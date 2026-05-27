import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "i18next";
import LanguageSelector from "../components/LanguageSelector";

/* ─────────────────────────────────────────────────────────────
   Home.jsx — Raksha AI landing page
   Dark tactical aesthetic · Bebas Neue display · DM Mono data
   ───────────────────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Dashboard",    path: "/dashboard"    },
  { label: "SOS",          path: "/sos"           },
  { label: "Report Issue", path: "/report-issue"  },
  { label: "Risk Alerts",  path: "/risk-alert"    },
  { label: "Legal Info",   path: "/legal-info"    },
];

const FEATURE_CARDS = [
  {
    icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-5 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    color: "#dc2626",
    label: "Smart SOS",
    desc: "One-tap emergency dispatch with live GPS, nearby hospitals, and simulated ambulance ETA.",
    path: "/sos",
    tag: "Emergency",
  },
  {
    icon: "M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7",
    color: "#f97316",
    label: "Road Issues",
    desc: "AI-powered pothole & damage detection from uploaded images. Confidence-scored classification.",
    path: "/report-issue",
    tag: "AI Detection",
  },
  {
    icon: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 0-2 2h-2a2 2 0 0 0-2-2z",
    color: "#3b82f6",
    label: "Dashboard",
    desc: "Accident hotspot maps, issue heatmaps, safety analytics and real-time zone insights.",
    path: "/dashboard",
    tag: "Analytics",
  },
  {
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    color: "#eab308",
    label: "Risk Alerts",
    desc: "ML-based zone risk prediction from time-of-day, conditions, and historical patterns.",
    path: "/risk-alert",
    tag: "Predictive",
  },
  {
    icon: "M3 6h18M3 12h18M3 18h18",
    color: "#8b5cf6",
    label: "Legal Info",
    desc: "Traffic laws, fines, and location-aware rule awareness for Indian roads.",
    path: "/legal-info",
    tag: "Prototype",
  },
];

const LIVE_STATS = [
  { label: "Active Alerts",   value: 14,    unit: "",     color: "#dc2626" },
  { label: "Issues Reported", value: 2847,  unit: "",     color: "#f97316" },
  { label: "Lives Assisted",  value: 10241, unit: "",     color: "#22c55e" },
  { label: "Zones Monitored", value: 186,   unit: "",     color: "#3b82f6" },
];

/* Animated SVG shield logo */
function ShieldLogo({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="25" fill="#0d111b" stroke="rgba(220,38,38,0.3)" strokeWidth="1"/>
      <path d="M26 8 L40 15 L40 28 C40 36 26 44 26 44 C26 44 12 36 12 28 L12 15 Z"
        fill="#dc2626" fillOpacity="0.15" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/>
      <text x="26" y="32" textAnchor="middle"
        fill="#f1f5f9" fontSize="14" fontFamily="'Bebas Neue',cursive" letterSpacing="2">
        RA
      </text>
    </svg>
  );
}

/* Animated counter */
function Counter({ target, duration = 1200 }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let start = null;
        const step = ts => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(target * ease));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString()}</span>;
}

/* Navbar */
function Navbar({ navigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen]  = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
      padding: "0 24px",
      height: 60,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(6,8,16,0.96)" : "transparent",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      transition: "all 0.3s",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        onClick={() => navigate("/")}>
        <ShieldLogo size={36} />
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 18, letterSpacing: 3, color: "#f1f5f9", lineHeight: 1,
          }}>RAKSHA AI</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", fontFamily: "'DM Mono',monospace" }}>
            ROAD SAFETY ECOSYSTEM
          </div>
        </div>
      </div>

      {/* Desktop links */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}
        className="nav-desktop">
        {NAV_LINKS.map(l => (
          <button key={l.path} onClick={() => navigate(l.path)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "6px 13px", borderRadius: 7,
            fontSize: 12, fontWeight: 500, letterSpacing: "0.3px",
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'DM Sans',sans-serif",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => e.target.style.color = "#f1f5f9"}
            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
          >
            {l.label}
          </button>
        ))}
        <LanguageSelector />
        <button onClick={() => navigate("/sos")} style={{
          padding: "7px 18px", borderRadius: 8,
          background: "#dc2626", border: "none",
          color: "white", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
          letterSpacing: "0.5px",
          boxShadow: "0 0 20px rgba(220,38,38,0.35)",
          transition: "all 0.15s",
        }}>
          SOS
        </button>
      </div>

      <style>{`.nav-desktop { } @media(max-width:640px){ .nav-desktop { display:none !important; } }`}</style>
    </nav>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          min-height: 100vh;
          background: #060810;
          color: #e2e8f0;
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        /* ── Hero ── */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px 60px;
          position: relative;
          text-align: center;
        }

        /* Radial red glow */
        .hero::before {
          content: '';
          position: absolute;
          top: 20%; left: 50%;
          transform: translate(-50%, -50%);
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Grid lines */
        .hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
        }

        .hero-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #dc2626;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: fadeUp 0.6s ease both;
        }

        .hero-eyebrow-line {
          width: 32px; height: 1px;
          background: #dc2626;
          opacity: 0.6;
        }

        .hero-headline {
          font-family: 'Bebas Neue', cursive;
          font-size: clamp(52px, 10vw, 110px);
          letter-spacing: 4px;
          line-height: 0.92;
          color: #f8fafc;
          margin-bottom: 12px;
          animation: fadeUp 0.6s ease 0.1s both;
        }

        .hero-headline span {
          color: #dc2626;
          position: relative;
        }

        .hero-sub {
          font-size: clamp(14px, 2vw, 17px);
          color: rgba(255,255,255,0.45);
          max-width: 520px;
          line-height: 1.7;
          margin: 20px auto 40px;
          animation: fadeUp 0.6s ease 0.2s both;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          animation: fadeUp 0.6s ease 0.3s both;
        }

        .btn-primary {
          padding: 14px 32px;
          border-radius: 10px;
          background: #dc2626;
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.8px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 0 30px rgba(220,38,38,0.4), 0 4px 16px rgba(0,0,0,0.4);
          transition: all 0.18s;
        }
        .btn-primary:hover {
          background: #b91c1c;
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(220,38,38,0.5), 0 8px 24px rgba(0,0,0,0.5);
        }

        .btn-secondary {
          padding: 13px 28px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.18s;
          backdrop-filter: blur(8px);
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.95);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }

        /* ── Stats strip ── */
        .stats-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(255,255,255,0.05);
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        @media (max-width: 640px) {
          .stats-strip { grid-template-columns: repeat(2, 1fr); }
        }

        .stat-cell {
          background: #060810;
          padding: 28px 24px;
          text-align: center;
        }

        .stat-value {
          font-family: 'Bebas Neue', cursive;
          font-size: 40px;
          letter-spacing: 2px;
          line-height: 1;
          margin-bottom: 6px;
        }

        .stat-label {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-family: 'DM Mono', monospace;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        /* ── Features ── */
        .features-section {
          padding: 80px 24px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          margin-bottom: 12px;
        }

        .section-title {
          font-family: 'Bebas Neue', cursive;
          font-size: clamp(32px, 5vw, 52px);
          letter-spacing: 3px;
          color: #f1f5f9;
          margin-bottom: 48px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 12px;
        }

        .feature-card {
          padding: 24px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.025);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .feature-card:hover {
          border-color: rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          transform: translateY(-3px);
        }
        .feature-card:hover::before { opacity: 1; }

        .feature-icon-wrap {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }

        .feature-tag {
          font-size: 9px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 1.5px;
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 10px;
          display: inline-block;
          font-weight: 500;
        }

        .feature-name {
          font-family: 'Bebas Neue', cursive;
          font-size: 22px;
          letter-spacing: 2px;
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .feature-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          line-height: 1.65;
        }

        .feature-arrow {
          position: absolute;
          bottom: 20px; right: 20px;
          opacity: 0;
          transition: all 0.2s;
          color: rgba(255,255,255,0.4);
        }
        .feature-card:hover .feature-arrow { opacity: 1; transform: translateX(3px); }

        /* ── Problem strip ── */
        .problem-section {
          background: rgba(220,38,38,0.04);
          border-top: 1px solid rgba(220,38,38,0.1);
          border-bottom: 1px solid rgba(220,38,38,0.1);
          padding: 60px 24px;
        }

        .problem-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        @media (max-width: 768px) {
          .problem-inner { grid-template-columns: 1fr; }
        }

        .problem-stat {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .problem-stat:last-child { border-bottom: none; }

        .problem-num {
          font-family: 'Bebas Neue', cursive;
          font-size: 36px;
          color: #dc2626;
          letter-spacing: 2px;
          line-height: 1;
          flex-shrink: 0;
          width: 80px;
        }

        .problem-text {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
          padding-top: 4px;
        }

        /* ── Footer ── */
        .footer {
          padding: 40px 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .footer-copy {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          font-family: 'DM Mono', monospace;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <div className="home-root">
        <Navbar navigate={navigate} />

        {/* ── Hero ──────────────────────────────────────── */}
        <section className="hero">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-line" />
            India's Road Safety Intelligence Platform
            <div className="hero-eyebrow-line" />
          </div>

          <h1 className="hero-headline">
            PROTECTING<br />
            <span>EVERY ROAD.</span><br />
            EVERY LIFE.
          </h1>

          <p className="hero-sub">
            Raksha AI unifies emergency response, AI road-issue detection,
            and predictive accident analytics into one platform built for
            Indian roads.
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate("/sos")}>
              🚨 Activate SOS
            </button>
            <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
              View Dashboard →
            </button>
          </div>
        </section>

        {/* ── Live stats strip ──────────────────────────── */}
        <div className="stats-strip">
          {LIVE_STATS.map((s, i) => (
            <div className="stat-cell" key={s.label}
              style={{ animationDelay: `${i * 80}ms` }}>
              <div className="stat-value" style={{ color: s.color }}>
                <Counter target={s.value} duration={1000 + i * 200} />
                {s.unit}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Features ──────────────────────────────────── */}
        <section className="features-section">
          <div className="section-eyebrow">What We Do</div>
          <div className="section-title">CORE CAPABILITIES</div>

          <div className="features-grid">
            {FEATURE_CARDS.map((f, i) => (
              <div
                key={f.label}
                className="feature-card"
                onClick={() => navigate(f.path)}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Top gradient bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${f.color}, ${f.color}44)`,
                }} />

                <div className="feature-icon-wrap"
                  style={{ background: f.color + "15" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke={f.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>

                <div className="feature-tag"
                  style={{ background: f.color + "18", color: f.color, border: `1px solid ${f.color}33` }}>
                  {f.tag}
                </div>

                <div className="feature-name">{f.label}</div>
                <div className="feature-desc">{f.desc}</div>

                <div className="feature-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Problem section ───────────────────────────── */}
        <section className="problem-section">
          <div className="problem-inner">
            <div>
              <div className="section-eyebrow">The Problem</div>
              <div className="section-title" style={{ marginBottom: 8 }}>
                INDIA'S ROAD<br />SAFETY CRISIS
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
                Every year, lakhs of lives are affected by preventable road accidents.
                Delayed response, poor infrastructure monitoring, and lack of real-time
                data are the three pillars of this crisis — Raksha AI addresses all three.
              </p>
            </div>
            <div>
              {[
                { num: "153K+", text: "Road accident fatalities annually in India — one of the highest globally." },
                { num: "~50%",  text: "Deaths occur due to delayed emergency response after the accident." },
                { num: "40%",   text: "Accidents attributed to poor road conditions — potholes, unmarked hazards." },
                { num: "6 MIN", text: "Average time saved per emergency response with AI-assisted dispatch routing." },
              ].map(s => (
                <div className="problem-stat" key={s.num}>
                  <div className="problem-num">{s.num}</div>
                  <div className="problem-text">{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────── */}
        <section style={{ padding: "80px 24px", textAlign: "center" }}>
          <div style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: "clamp(32px,6vw,64px)",
            letterSpacing: 4,
            color: "#f1f5f9",
            marginBottom: 16,
          }}>
            SAVE A LIFE TODAY
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 36, maxWidth: 400, margin: "0 auto 36px" }}>
            Report a road hazard, share a hotspot, or activate emergency assistance — every action counts.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/sos")}>Emergency SOS</button>
            <button className="btn-secondary" onClick={() => navigate("/report-issue")}>Report an Issue</button>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="footer">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldLogo size={28} />
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 15, letterSpacing: 2, color: "rgba(255,255,255,0.5)" }}>
                RAKSHA AI
              </span>
            </div>
            <div className="footer-copy">
              Built for India · Road Safety Ecosystem · 2024
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {["Dashboard", "SOS", "Report", "Legal"].map(l => (
                <span key={l} style={{
                  fontSize: 11, color: "rgba(255,255,255,0.2)",
                  cursor: "pointer", fontFamily: "'DM Mono',monospace",
                  transition: "color 0.15s",
                }}
                  onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.2)"}
                >{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}