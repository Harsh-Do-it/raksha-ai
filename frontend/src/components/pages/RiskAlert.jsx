import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────────────────────
   RiskAlert.jsx — Accident risk prediction & alert page
   ───────────────────────────────────────────────────────────── */

function PageShell({ title, subtitle, children, navigate, activeNav }) {
  const links = [
    { key:"home",label:"Home",path:"/" },{ key:"dashboard",label:"Dashboard",path:"/dashboard" },
    { key:"sos",label:"SOS",path:"/sos" },{ key:"report-issue",label:"Report Issue",path:"/report-issue" },
    { key:"risk-alert",label:"Risk Alerts",path:"/risk-alert" },{ key:"legal-info",label:"Legal Info",path:"/legal-info" },
  ];
  return (
    <div style={{ minHeight:"100vh",background:"#060810",color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column" }}>
      <div style={{ position:"sticky",top:0,zIndex:100,background:"rgba(6,8,16,0.96)",borderBottom:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(12px)",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16 }}>
        <div style={{ display:"flex",alignItems:"center",gap:20 }}>
          <div style={{ cursor:"pointer",display:"flex",alignItems:"center",gap:8 }} onClick={() => navigate("/")}>
            <svg width="28" height="28" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="25" fill="#0d111b" stroke="rgba(220,38,38,0.3)" strokeWidth="1"/><path d="M26 8 L40 15 L40 28 C40 36 26 44 26 44 C26 44 12 36 12 28 L12 15 Z" fill="#dc2626" fillOpacity="0.2" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/><text x="26" y="32" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontFamily="'Bebas Neue',cursive" letterSpacing="2">RA</text></svg>
            <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:15,letterSpacing:2.5,color:"#f1f5f9" }}>RAKSHA AI</span>
          </div>
          <div style={{ display:"flex",gap:2,borderLeft:"1px solid rgba(255,255,255,0.06)",paddingLeft:16 }}>
            {links.map(l => <button key={l.key} onClick={()=>navigate(l.path)} style={{ background:activeNav===l.key?"rgba(220,38,38,0.12)":"none",border:activeNav===l.key?"1px solid rgba(220,38,38,0.25)":"1px solid transparent",borderRadius:6,cursor:"pointer",padding:"4px 11px",fontSize:11,fontWeight:500,color:activeNav===l.key?"#f87171":"rgba(255,255,255,0.4)",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",whiteSpace:"nowrap" }}>{l.label}</button>)}
          </div>
        </div>
        <button onClick={()=>navigate("/sos")} style={{ padding:"6px 16px",borderRadius:7,background:"#dc2626",border:"none",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:"0.5px",boxShadow:"0 0 16px rgba(220,38,38,0.35)",fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>SOS</button>
      </div>
      <div style={{ padding:"20px 28px 8px",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"rgba(255,255,255,0.25)",marginBottom:6 }}>RAKSHA AI / {title.toUpperCase()}</div>
        <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:28,letterSpacing:3,color:"#f1f5f9",lineHeight:1 }}>{title}</div>
        {subtitle && <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:5 }}>{subtitle}</div>}
      </div>
      <div style={{ flex:1,padding:"24px 28px",overflowY:"auto" }}>{children}</div>
    </div>
  );
}

/* Risk score gauge */
function RiskGauge({ score, label, color }) {
  const r = 52, circ = Math.PI * r; // half-circle
  const pct = Math.min(score / 100, 1);

  return (
    <div style={{ textAlign:"center" }}>
      <svg width="140" height="80" viewBox="0 0 140 80">
        {/* Track */}
        <path d={`M 14 70 A 56 56 0 0 1 126 70`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
        {/* Fill */}
        <path d={`M 14 70 A 56 56 0 0 1 126 70`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)", filter:`drop-shadow(0 0 6px ${color}80)` }}
        />
        {/* Needle */}
        <circle cx="70" cy="70" r="4" fill={color}/>
        {/* Score */}
        <text x="70" y="58" textAnchor="middle" fill="#f1f5f9" fontSize="22" fontFamily="'Bebas Neue',cursive" letterSpacing="1">{score}</text>
        <text x="70" y="70" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="'DM Mono',monospace">/100</text>
      </svg>
      <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:14,letterSpacing:2,color,marginTop:4 }}>{label}</div>
    </div>
  );
}

/* Risk factor row */
function FactorRow({ label, value, max, color, icon }) {
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center" }}>
        <div style={{ display:"flex",alignItems:"center",gap:7 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><path d={icon}/></svg>
          <span style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontFamily:"'DM Mono',monospace" }}>{label}</span>
        </div>
        <span style={{ fontSize:11,fontFamily:"'Bebas Neue',cursive",color,letterSpacing:1 }}>{value}/{max}</span>
      </div>
      <div style={{ height:3,borderRadius:2,background:"rgba(255,255,255,0.05)" }}>
        <div style={{ height:"100%",width:`${(value/max)*100}%`,borderRadius:2,background:color,boxShadow:`0 0 6px ${color}60`,transition:"width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
    </div>
  );
}

/* Live alert feed item */
function AlertItem({ alert, i }) {
  const SEV = { critical:"#dc2626", high:"#f97316", medium:"#eab308", low:"#22c55e" };
  const c = SEV[alert.severity] || "#6b7280";
  return (
    <div style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",animation:`alertIn 0.3s ease ${i*60}ms both`,cursor:"pointer",transition:"background 0.15s" }}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{ width:8,height:8,borderRadius:"50%",background:c,boxShadow:`0 0 6px ${c}`,marginTop:4,flexShrink:0,animation:alert.severity==="critical"?"critBlink 1.2s ease-in-out infinite":"none" }} />
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.75)",marginBottom:2 }}>{alert.zone}</div>
        <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",fontFamily:"'DM Mono',monospace" }}>{alert.reason} · {alert.time}</div>
      </div>
      <span style={{ fontSize:9,padding:"2px 7px",borderRadius:4,background:c+"18",border:`1px solid ${c}33`,color:c,fontFamily:"'DM Mono',monospace",letterSpacing:"0.5px",flexShrink:0 }}>
        {alert.severity.toUpperCase()}
      </span>
    </div>
  );
}

/* Input conditions form */
const CONDITIONS = [
  { key:"time",    label:"Time of Day",   options:["Peak Morning (7–10AM)","Afternoon","Peak Evening (5–9PM)","Late Night","Early Morning"],   icon:"M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l4 2" },
  { key:"weather", label:"Weather",       options:["Clear","Light Rain","Heavy Rain","Fog","Dense Fog","Extreme Heat"],                          icon:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" },
  { key:"road",    label:"Road Condition",options:["Good","Minor Damage","Potholes","Waterlogged","Construction Zone","Severely Damaged"],       icon:"M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" },
  { key:"traffic", label:"Traffic Level", options:["Low","Moderate","Heavy","Stop-and-Go","Accident-Induced"],                                    icon:"M12 22V12 M12 12l-4-4 M12 12l4-4 M2 17l4-4 4 4 M14 17l4-4 4 4" },
];

function riskScore(cond) {
  let score = 20;
  if (cond.time?.includes("Night") || cond.time?.includes("Peak")) score += 25;
  if (cond.weather?.includes("Rain") || cond.weather?.includes("Fog")) score += 20;
  if (cond.road?.includes("Pothole") || cond.road?.includes("Damaged")) score += 20;
  if (cond.traffic?.includes("Heavy") || cond.traffic?.includes("Stop")) score += 15;
  return Math.min(score, 99);
}

const ALERTS = [
  { zone:"NH-48 Ring Road",      severity:"critical", reason:"Peak hour + wet road", time:"Now"       },
  { zone:"Outer Ring Road N",    severity:"high",     reason:"Night + poor visibility", time:"8m ago" },
  { zone:"DND Flyway",           severity:"high",     reason:"Construction zone active", time:"14m ago"},
  { zone:"Mathura Rd Flyover",   severity:"medium",   reason:"Moderate traffic build-up","time":"22m ago"},
  { zone:"Rohtak Road NH-9",     severity:"medium",   reason:"Light rain, slick surface", time:"31m ago"},
  { zone:"GT Karnal Expressway", severity:"low",      reason:"Visibility slightly reduced","time":"45m ago"},
];

export default function RiskAlert() {
  const navigate = useNavigate();
  const [cond, setCond] = useState({});
  const [score, setScore] = useState(42);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const RISK_LABEL = score >= 75 ? "Critical" : score >= 50 ? "High Risk" : score >= 30 ? "Moderate" : "Low Risk";
  const RISK_COLOR = score >= 75 ? "#dc2626" : score >= 50 ? "#f97316" : score >= 30 ? "#eab308" : "#22c55e";

  function analyze() {
    setAnalyzing(true);
    setTimeout(() => {
      setScore(riskScore(cond));
      setAnalyzing(false);
      setAnalyzed(true);
    }, 1600);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes alertIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes critBlink { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes spin { to{transform:rotate(360deg)} }
        select.ri-sel { width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:9px 12px;font-size:12px;font-family:'DM Mono',monospace;color:rgba(255,255,255,0.7);outline:none;transition:border-color 0.15s;cursor:pointer;appearance:none;-webkit-appearance:none; }
        select.ri-sel:focus{border-color:rgba(220,38,38,0.4);}
        .ri-label{font-size:10px;font-family:'DM Mono',monospace;letter-spacing:1.2px;color:rgba(255,255,255,0.3);text-transform:uppercase;margin-bottom:5px;display:block;}
      `}</style>
      <PageShell title="Risk Alerts" subtitle="ML-based accident risk prediction for your route" navigate={navigate} activeNav="risk-alert">

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:960,margin:"0 auto" }}>

          {/* ── Left: prediction form ── */}
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

            <div style={{ background:"#080c14",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:20 }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:17,letterSpacing:2,color:"#f1f5f9",marginBottom:4 }}>Risk Predictor</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace",marginBottom:18 }}>
                Set conditions — model returns zone risk score
              </div>

              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {CONDITIONS.map(c => (
                  <div key={c.key}>
                    <label className="ri-label">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ display:"inline",marginRight:5,verticalAlign:"middle" }}><path d={c.icon}/></svg>
                      {c.label}
                    </label>
                    <div style={{ position:"relative" }}>
                      <select className="ri-sel" value={cond[c.key]||""} onChange={e => setCond(p=>({...p,[c.key]:e.target.value}))}>
                        <option value="">Select…</option>
                        {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={analyze} disabled={Object.keys(cond).length < 2} style={{
                marginTop:18, width:"100%", padding:"12px",
                borderRadius:9, border:"none", fontFamily:"'DM Sans',sans-serif",
                fontSize:13, fontWeight:700, letterSpacing:"0.5px",
                cursor: Object.keys(cond).length >= 2 ? "pointer" : "not-allowed",
                background: Object.keys(cond).length >= 2 ? "#dc2626" : "rgba(255,255,255,0.05)",
                color: Object.keys(cond).length >= 2 ? "white" : "rgba(255,255,255,0.2)",
                boxShadow: Object.keys(cond).length >= 2 ? "0 4px 20px rgba(220,38,38,0.35)" : "none",
                transition:"all 0.18s",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              }}>
                {analyzing ? <><div style={{ width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"white",animation:"spin 0.8s linear infinite" }} />Analyzing…</> : "▶ Run Risk Analysis"}
              </button>
            </div>

            {/* Factors breakdown (after analysis) */}
            {analyzed && (
              <div style={{ background:"#080c14",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:20,animation:"slideIn 0.3s ease" }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:15,letterSpacing:2,color:"#f1f5f9",marginBottom:14 }}>
                  Risk Factors
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:11 }}>
                  <FactorRow label="Time of Day"    value={cond.time?.includes("Peak")||cond.time?.includes("Night")?8:4}    max={10} color="#f97316" icon="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l4 2"/>
                  <FactorRow label="Weather"        value={cond.weather?.includes("Rain")||cond.weather?.includes("Fog")?7:3} max={10} color="#3b82f6" icon="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
                  <FactorRow label="Road Condition" value={cond.road?.includes("Damage")||cond.road?.includes("Pothole")?8:3} max={10} color="#dc2626" icon="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  <FactorRow label="Traffic Level"  value={cond.traffic?.includes("Heavy")||cond.traffic?.includes("Stop")?7:4} max={10} color="#eab308" icon="M12 22V12 M12 12l-4-4 M12 12l4-4"/>
                </div>
                <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
              </div>
            )}
          </div>

          {/* ── Right: gauge + live alerts ── */}
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

            {/* Risk gauge */}
            <div style={{ background:"#080c14",border:`1px solid ${RISK_COLOR}22`,borderRadius:12,padding:24,textAlign:"center",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${RISK_COLOR},transparent)` }} />
              <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"rgba(255,255,255,0.25)",marginBottom:16,textTransform:"uppercase" }}>Current Zone Risk Score</div>
              <RiskGauge score={score} label={RISK_LABEL} color={RISK_COLOR} />
              <div style={{ marginTop:12,fontSize:12,color:"rgba(255,255,255,0.3)",fontFamily:"'DM Mono',monospace",lineHeight:1.6 }}>
                {score >= 75 && "⚠ Avoid this zone if possible. High accident probability detected."}
                {score >= 50 && score < 75 && "Drive with extreme caution. Multiple risk factors active."}
                {score >= 30 && score < 50 && "Normal precautions advised. Monitor conditions."}
                {score < 30 && "Zone appears safe. Standard driving precautions apply."}
              </div>
            </div>

            {/* Live alert feed */}
            <div style={{ background:"#080c14",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,overflow:"hidden",flex:1 }}>
              <div style={{ padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:17,letterSpacing:2,color:"#f1f5f9" }}>Live Alert Feed</div>
                <span style={{ fontSize:9,padding:"3px 8px",borderRadius:4,background:"rgba(220,38,38,0.1)",border:"1px solid rgba(220,38,38,0.2)",color:"#f87171",fontFamily:"'DM Mono',monospace",letterSpacing:1 }}>
                  ● LIVE
                </span>
              </div>
              {ALERTS.map((a, i) => <AlertItem key={i} alert={a} i={i} />)}
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}