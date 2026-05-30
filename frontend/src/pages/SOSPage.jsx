import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import { sendSOS } from "../services/sosService";

/* ─────────────────────────────────────────────────────────────
   SOSPage.jsx — Emergency SOS activation page
   Full-page emergency command interface
   ───────────────────────────────────────────────────────────── */

/* PageShell re-export (shared across pages) */
function PageShell({ title, subtitle, children, navigate, activeNav }) {
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
    <div style={{ minHeight:"100vh", background:"#060810", color:"#e2e8f0", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>
      <div style={{ position:"sticky", top:0, zIndex:100, background:"rgba(6,8,16,0.96)", borderBottom:"1px solid rgba(255,255,255,0.06)", backdropFilter:"blur(12px)", padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:10 }} onClick={() => navigate("/")}>
            <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="25" fill="#0d111b" stroke="rgba(220,38,38,0.3)" strokeWidth="1"/>
              <path d="M26 8 L40 15 L40 28 C40 36 26 44 26 44 C26 44 12 36 12 28 L12 15 Z" fill="#dc2626" fillOpacity="0.15" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/>
              <text x="26" y="32" textAnchor="middle" fill="#f1f5f9" fontSize="14" fontFamily="'Bebas Neue',cursive" letterSpacing="2">RA</text>
            </svg>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:18, letterSpacing:3, color:"#f1f5f9", lineHeight:1 }}>RAKSHA AI</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"1.5px", fontFamily:"'DM Mono',monospace" }}>ROAD SAFETY ECOSYSTEM</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:2, borderLeft:"1px solid rgba(255,255,255,0.06)", paddingLeft:16 }}>
            {links.map(l => (
              <button key={l.key} onClick={() => navigate(l.path)} style={{ background:activeNav===l.key?"rgba(220,38,38,0.12)":"none", border:activeNav===l.key?"1px solid rgba(220,38,38,0.25)":"1px solid transparent", borderRadius:6, cursor:"pointer", padding:"6px 13px", fontSize:12, fontWeight:500, color:activeNav===l.key?"#f87171":"rgba(255,255,255,0.85)", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s", whiteSpace:"nowrap" }}>{t(l.labelKey)}</button>
            ))}
          </div>
        </div>
        <LanguageSelector />
        <button onClick={() => navigate("/sos")} style={{ padding:"7px 18px", borderRadius:8, background:"#dc2626", border:"none", color:"white", fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:"0.5px", boxShadow:"0 0 20px rgba(220,38,38,0.35)", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>SOS</button>
      </div>
      <div style={{ padding:"28px 28px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:2, color:"rgba(255,255,255,0.25)", marginBottom:6 }}>RAKSHA AI / {title.toUpperCase()}</div>
        <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:28, letterSpacing:3, color:"#f1f5f9", lineHeight:1 }}>{title}</div>
        {subtitle && <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:5 }}>{subtitle}</div>}
      </div>
      <div style={{ flex:1, padding:"24px 28px", overflowY:"auto" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", width:"100%" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* Inline SOS button (no external import needed) */
function InlineSOS({ onActivate }) {
  const [pressed, setPressed] = useState(false);
  const [ripples, setRipples] = useState([]);
  let ripId = 0;

  function addRipple() {
    const id = ++ripId;
    setRipples(r => [...r, id]);
    setTimeout(() => setRipples(r => r.filter(x => x !== id)), 1400);
  }

  return (
    <>
      <style>{`
        @keyframes ambPulse { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.6);opacity:0} }
        @keyframes ripBurst { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.3);opacity:0} }
      `}</style>
      <div style={{ position:"relative", width:200, height:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {[0,0.8,1.6].map((d,i) => (
          <div key={i} style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1.5px solid rgba(220,38,38,0.35)", animation:`ambPulse 2.4s ease-out ${d}s infinite` }} />
        ))}
        {ripples.map(id => (
          <div key={id} style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid rgba(220,38,38,0.8)", animation:"ripBurst 1.4s cubic-bezier(0.2,0.6,0.4,1) forwards", pointerEvents:"none" }} />
        ))}
        <button
          onPointerDown={() => { setPressed(true); addRipple(); }}
          onPointerUp={() => { setPressed(false); onActivate(); }}
          onPointerLeave={() => setPressed(false)}
          style={{
            width:148, height:148, borderRadius:"50%",
            border:"none", cursor:"pointer",
            background:"radial-gradient(circle at 38% 34%, rgba(255,100,100,0.5) 0%,transparent 55%), radial-gradient(circle at 50% 50%, #dc2626 0%,#991b1b 60%,#7f1d1d 100%)",
            boxShadow: pressed ? "0 0 0 6px rgba(220,38,38,0.5),0 0 72px rgba(220,38,38,0.7),inset 0 4px 12px rgba(0,0,0,0.4)" : "0 0 0 4px rgba(220,38,38,0.25),0 0 40px rgba(220,38,38,0.4),0 8px 32px rgba(0,0,0,0.4)",
            transform: pressed ? "scale(0.93)" : "scale(1)",
            transition:"all 0.12s cubic-bezier(0.34,1.56,0.64,1)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          }}
        >
          <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:44, letterSpacing:4, color:"white", lineHeight:1 }}>SOS</span>
          <span style={{ fontSize:10, fontWeight:600, letterSpacing:"2.5px", color:"rgba(255,220,220,0.85)" }}>Emergency</span>
        </button>
      </div>
    </>
  );
}

/* Emergency contacts */
const CONTACTS = [
  { name: "Police",        num: "100",  icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", color:"#3b82f6" },
  { name: "Ambulance",     num: "108",  icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10 M12 6v6 M9 9h6", color:"#dc2626" },
  { name: "Fire Brigade",  num: "101",  icon: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z", color:"#f97316" },
  { name: "Road Helpline", num: "1033", icon: "M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7", color:"#22c55e" },
];

/* ── Main SOSPage ──────────────────────────────────────────────── */
export default function SOSPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activated, setActivated] = useState(false);
  const [location, setLocation] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | locating | dispatched

  async function handleActivate() {
    setStage("locating");
    
    // Default location
    let locObj = { lat: "28.61390", lng: "77.20900" };
    
    // Try to get actual location
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
        });
        locObj = { lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) };
        setLocation(locObj);
      } catch (err) {
        setLocation(locObj);
      }
    } else {
      setLocation(locObj);
    }

    try {
      await sendSOS({ location: locObj, note: "Emergency from SOS Page" });
    } catch (err) {
      console.error("SOS call failed", err);
    }
    
    setStage("dispatched");
    setActivated(true);
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      <PageShell title={t("sosPage.title")} subtitle={t("sosPage.subtitle")} navigate={navigate} activeNav="sos">

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, maxWidth:1100, margin:"0 auto" }}>

          {/* ── Left: SOS button + status ── */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>

            {/* Status bar */}
            <div style={{ width:"100%", padding:"10px 16px", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background: stage==="dispatched" ? "#22c55e" : stage==="locating" ? "#eab308" : "#3b82f6", boxShadow:`0 0 6px ${stage==="dispatched"?"#22c55e":stage==="locating"?"#eab308":"#3b82f6"}`, animation:`${stage==="locating"?"blink 0.8s ease infinite":"none"}` }} />
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.5)" }}>
                {stage==="idle" && t("sosPage.ready")}
                {stage==="locating" && t("sosPage.locating")}
                {stage==="dispatched" && t("sosPage.dispatched")}
              </span>
              <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
            </div>

            {/* Big SOS button */}
            {!activated ? (
              <InlineSOS onActivate={handleActivate} />
            ) : (
              <div style={{ textAlign:"center" }}>
                <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(34,197,94,0.1)", border:"2px solid rgba(34,197,94,0.4)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", animation:"successPop 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:28, letterSpacing:2, color:"#22c55e", marginBottom:6 }}>{t("sosPage.alertSent")}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.85)", fontFamily:"'DM Mono',monospace" }}>
                  {t("sosPage.servicesEta")}
                </div>
                <button onClick={() => { setActivated(false); setStage("idle"); }} style={{ marginTop:20, padding:"8px 20px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>{t("sosPage.reset")}</button>
                <style>{`@keyframes successPop { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }`}</style>
              </div>
            )}

            <p style={{ fontSize:12, color:"rgba(255,255,255,0.25)", textAlign:"center", maxWidth:240, lineHeight:1.6, fontFamily:"'DM Sans',sans-serif" }}>
              {t("sosPage.helper")}
            </p>

            {/* Location chip */}
            {location && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:9, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", fontSize:12, color:"rgba(255,255,255,0.5)", fontFamily:"'DM Mono',monospace", width:"100%" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>
                {location.lat}°N, {location.lng}°E
              </div>
            )}
          </div>

          {/* ── Right: Emergency contacts + info ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Emergency numbers */}
            <div style={{ background:"#080c14", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.05)", fontFamily:"'Bebas Neue',cursive", fontSize:16, letterSpacing:2, color:"#f1f5f9" }}>
                {t("sosPage.numbers")}
              </div>
              <div style={{ padding:"12px" }}>
                {CONTACTS.map(c => (
                  <a key={c.num} href={`tel:${c.num}`} style={{
                    display:"flex", alignItems:"center", gap:12, padding:"10px 8px",
                    borderRadius:8, textDecoration:"none",
                    transition:"background 0.15s",
                    marginBottom:4,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ width:36, height:36, borderRadius:9, background:c.color+"15", border:`1px solid ${c.color}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="1.8" strokeLinecap="round"><path d={c.icon}/></svg>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.7)" }}>{c.name}</div>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:20, color:c.color, letterSpacing:2, lineHeight:1 }}>{c.num}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </a>
                ))}
              </div>
            </div>

            {/* What happens next */}
            <div style={{ background:"#080c14", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"18px" }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:16, letterSpacing:2, color:"#f1f5f9", marginBottom:14 }}>{t("sosPage.whatNext")}</div>
              {[
                { step:"01", text:"Your GPS coordinates are captured and sent to the backend.", color:"#3b82f6" },
                { step:"02", text:"Nearest hospitals and emergency units are identified.", color:"#f97316" },
                { step:"03", text:"Ambulance dispatch is triggered with estimated arrival time.", color:"#dc2626" },
                { step:"04", text:"Your emergency contacts receive an SMS with your location.", color:"#22c55e" },
              ].map(s => (
                <div key={s.step} style={{ display:"flex", gap:12, marginBottom:12, alignItems:"flex-start" }}>
                  <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:18, color:s.color, letterSpacing:1, lineHeight:1, flexShrink:0, width:24 }}>{s.step}</span>
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.6 }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
