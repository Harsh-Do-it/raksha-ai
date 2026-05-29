import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../components/RoadIssue/ImageUploader";
import DetectionResult from "../components/RoadIssue/DetectionResult";
import { submitIssue, uploadAndDetect } from "../services/roadService";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ReportIssue.jsx â€” AI-powered road issue reporting page
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function PageShell({ title, subtitle, children, navigate, activeNav }) {
  const { t } = useTranslation();
  const links = [
    { key:"home",labelKey:"navigation.home",path:"/" },{ key:"dashboard",labelKey:"navigation.dashboard",path:"/dashboard" },
    { key:"sos",labelKey:"navigation.sos",path:"/sos" },{ key:"report-issue",labelKey:"navigation.reportIssue",path:"/report-issue" },
    { key:"risk-alert",labelKey:"navigation.riskAlertPlural",path:"/risk-alert" },
    { key:"legal-info",labelKey:"navigation.legal",path:"/legal-info" },
    { key:"status",labelKey:"navigation.checkStatus",path:"/status" },
  ];
  return (
    <div style={{ minHeight:"100vh", background:"#060810", color:"#e2e8f0", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>
      <div style={{ position:"sticky",top:0,zIndex:100,background:"rgba(6,8,16,0.96)",borderBottom:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(12px)",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16 }}>
        <div style={{ display:"flex",alignItems:"center",gap:20 }}>
          <div style={{ cursor:"pointer",display:"flex",alignItems:"center",gap:8 }} onClick={() => navigate("/")}>
            <svg width="28" height="28" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="25" fill="#0d111b" stroke="rgba(220,38,38,0.3)" strokeWidth="1"/><path d="M26 8 L40 15 L40 28 C40 36 26 44 26 44 C26 44 12 36 12 28 L12 15 Z" fill="#dc2626" fillOpacity="0.2" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/><text x="26" y="32" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontFamily="'Bebas Neue',cursive" letterSpacing="2">RA</text></svg>
            <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:15,letterSpacing:2.5,color:"#f1f5f9" }}>RAKSHA AI</span>
          </div>
          <div style={{ display:"flex",gap:2,borderLeft:"1px solid rgba(255,255,255,0.06)",paddingLeft:16 }}>
            {links.map(l => <button key={l.key} onClick={()=>navigate(l.path)} style={{ background:activeNav===l.key?"rgba(220,38,38,0.12)":"none",border:activeNav===l.key?"1px solid rgba(220,38,38,0.25)":"1px solid transparent",borderRadius:6,cursor:"pointer",padding:"4px 11px",fontSize:11,fontWeight:500,color:activeNav===l.key?"#f87171":"rgba(255,255,255,0.85)",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",whiteSpace:"nowrap" }}>{t(l.labelKey)}</button>)}
          </div>
        </div>
        <LanguageSelector />
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

const ISSUE_TYPES = [
  { key:"pothole",   label:"Pothole",        color:"#dc2626", icon:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" },
  { key:"damage",    label:"Damaged Road",   color:"#f97316", icon:"M3 6h18M3 12h18M3 18h18" },
  { key:"water",     label:"Waterlogging",   color:"#3b82f6", icon:"M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" },
  { key:"divider",   label:"Broken Divider", color:"#eab308", icon:"M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" },
  { key:"sign",      label:"Missing Sign",   color:"#8b5cf6", icon:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" },
  { key:"other",     label:"Other",          color:"#6b7280", icon:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M8 12h8 M12 8v8" },
];

const SEVERITY_LEVELS = [
  { key:"critical", label:"Critical", desc:"Immediate danger", color:"#dc2626" },
  { key:"high",     label:"High",     desc:"Serious hazard",   color:"#f97316" },
  { key:"medium",   label:"Medium",   desc:"Moderate risk",    color:"#eab308" },
  { key:"low",      label:"Low",      desc:"Minor issue",      color:"#22c55e" },
];

/* Simulated AI detection result */
function simulateDetection(fileName) {
  const lowerName = (fileName || "").toLowerCase();
  
  if (lowerName.includes("divider")) {
    return { labelKey: "reportIssuePage.issueTypes.divider", label: "Broken Divider", confidence: 0.92, severity: "high", descriptionKey: "Broken road divider detected. Potential hazard for traffic." };
  } else if (lowerName.includes("sign")) {
    return { labelKey: "reportIssuePage.issueTypes.sign", label: "Missing Sign", confidence: 0.88, severity: "medium", descriptionKey: "Traffic sign appears to be missing or unreadable." };
  } else if (lowerName.includes("water") || lowerName.includes("flood")) {
    return { labelKey: "reportIssuePage.issueTypes.water", label: "Waterlogging", confidence: 0.91, severity: "high", descriptionKey: "reportIssuePage.simulated.water" };
  } else if (lowerName.includes("damage") || lowerName.includes("crack")) {
    return { labelKey: "reportIssuePage.issueTypes.damage", label: "Damaged Road", confidence: 0.87, severity: "high", descriptionKey: "reportIssuePage.simulated.damage" };
  } else if (lowerName.includes("pothole")) {
    return { labelKey: "reportIssuePage.issueTypes.pothole", label: "Pothole", confidence: 0.94, severity: "critical", descriptionKey: "reportIssuePage.simulated.pothole" };
  }
  
  const results = [
    { labelKey:"reportIssuePage.issueTypes.pothole", label: "Pothole", confidence:0.94, severity:"critical", descriptionKey:"reportIssuePage.simulated.pothole" },
    { labelKey:"reportIssuePage.issueTypes.damage", label: "Damaged Road", confidence:0.87, severity:"high", descriptionKey:"reportIssuePage.simulated.damage" },
    { labelKey:"reportIssuePage.issueTypes.water", label: "Waterlogging", confidence:0.91, severity:"high", descriptionKey:"reportIssuePage.simulated.water" },
    { labelKey:"reportIssuePage.issueTypes.damage", label: "Damaged Road", confidence:0.78, severity:"medium", descriptionKey:"reportIssuePage.simulated.surface" },
  ];
  return results[Math.floor(Math.random() * results.length)];
}

export default function ReportIssue() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [preview, setPreview] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);
  const [savedFilename, setSavedFilename] = useState(null); // server-side image filename
  const [issueType, setIssueType] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [road, setRoad] = useState("");
  const [area, setArea] = useState("");
  const [desc, setDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reportId, setReportId] = useState("");

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setResult(null);
    setSavedFilename(null);
    setDetecting(true);
    try {
      // Try real backend first; fall back to simulation if unavailable
      const det = await uploadAndDetect(file);
      const key = det.label?.toLowerCase() || "";
      const matchedType = ISSUE_TYPES.find(type =>
          key.includes(type.key) || key.includes(type.label?.toLowerCase())
      ) || ISSUE_TYPES[0];

      setResult({
        labelKey: `reportIssuePage.issueTypes.${matchedType.key}`,
        label: det.label,
        confidence: det.confidence,
        severity: det.severity,
        description: det.description,
        descriptionKey: `reportIssuePage.simulated.${matchedType.key}`,
      });
      if (det.savedFilename) setSavedFilename(det.savedFilename);
      
      setIssueType(matchedType);
      setSeverity(det.severity || "medium");
      setDesc(det.description || t(`reportIssuePage.simulated.${matchedType.key}`));
    } catch {
      // Fallback to simulation if backend unavailable
      const det = simulateDetection(file.name);
      setResult({ ...det, label: t(det.labelKey), description: t(det.descriptionKey) });
      setIssueType(
        ISSUE_TYPES.find(type =>
          type.key === (det.labelKey.includes("water") ? "water" : det.labelKey.includes("pothole") ? "pothole" : "damage")
        ) || ISSUE_TYPES[0]
      );
      setSeverity(det.severity);
      setDesc(t(det.descriptionKey));
    } finally {
      setDetecting(false);
    }
  }

  async function handleSubmit() {
    if (!road.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const data = await submitIssue({
        type: issueType?.label || "Other",
        severity: severity || "medium",
        road: road.trim(),
        area: area.trim(),
        description: desc.trim(),
        aiLabel: result?.label || null,
        aiConfidence: result?.confidence || null,
        imageFilename: savedFilename || null,
      });
      setReportId(data.issueId || "");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const sevConf = SEVERITY_LEVELS.find(s => s.key === severity) || SEVERITY_LEVELS[2];

  if (submitted) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
        <PageShell title={t("reportIssuePage.title")} navigate={navigate} activeNav="report-issue">
          <div style={{ maxWidth:480, margin:"60px auto", textAlign:"center" }}>
            <div style={{ width:80,height:80,borderRadius:"50%",background:"rgba(34,197,94,0.1)",border:"2px solid rgba(34,197,94,0.35)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"pop 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:32,letterSpacing:3,color:"#22c55e",marginBottom:8 }}>{t("reportIssuePage.submittedTitle")}</div>
            {reportId && (
              <div style={{ fontFamily:"'DM Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:8,letterSpacing:1 }}>
                Report ID: {reportId}
              </div>
            )}
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.85)",lineHeight:1.7,marginBottom:28 }}>
              {t("reportIssuePage.submittedMessage")}
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
              <button onClick={() => { setSubmitted(false); setPreview(null); setResult(null); setRoad(""); setArea(""); setDesc(""); setReportId(""); }}
                style={{ padding:"10px 22px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>
                {t("reportIssuePage.reportAnother")}
              </button>
              <button onClick={() => navigate("/dashboard")}
                style={{ padding:"10px 22px",borderRadius:8,border:"none",background:"#dc2626",color:"white",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif" }}>
                {t("reportIssuePage.viewDashboard")}
              </button>
            </div>
            <style>{`@keyframes pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
          </div>
        </PageShell>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        .ri-input { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px 13px; font-size:13px; font-family:'DM Sans',sans-serif; color:rgba(255,255,255,0.75); outline:none; transition:border-color 0.15s; box-sizing:border-box; }
        .ri-input:focus { border-color:rgba(220,38,38,0.4); }
        .ri-input::placeholder { color:rgba(255,255,255,0.2); }
        textarea.ri-input { resize:vertical; min-height:80px; }
        .ri-label { font-size:10px; font-family:'DM Mono',monospace; letter-spacing:1.2px; color:rgba(255,255,255,0.3); text-transform:uppercase; margin-bottom:6px; display:block; }
      `}</style>
      <PageShell title={t("reportIssuePage.title")} subtitle={t("reportIssuePage.subtitle")} navigate={navigate} activeNav="report-issue">

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, maxWidth:960, margin:"0 auto" }}>

          {/* â”€â”€ Left: Upload + AI result â”€â”€ */}
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
            <ImageUploader
              onImageSelected={(file) => handleFile(file)}
              onPreview={setPreview}
              title={t("reportIssuePage.uploadTitle")}
              subtitle={t("reportIssuePage.uploadSubtitle")}
            />
            <DetectionResult
              detection={result}
              imagePreview={preview}
              loading={detecting}
            />
          </div>

          {/* â”€â”€ Right: Form â”€â”€ */}
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

            {/* Issue type picker */}
            <div>
              <label className="ri-label">{t("reportIssuePage.issueType")}</label>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6 }}>
                {ISSUE_TYPES.map(type => (
                  <button key={type.key} onClick={() => setIssueType(type)} style={{
                    padding:"10px 8px", borderRadius:9,
                    border:`1px solid ${issueType?.key===type.key ? type.color+"55" : "rgba(255,255,255,0.07)"}`,
                    background: issueType?.key===type.key ? type.color+"14" : "rgba(255,255,255,0.02)",
                    cursor:"pointer", transition:"all 0.15s",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:5,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke={issueType?.key===type.key ? type.color : "rgba(255,255,255,0.3)"}
                      strokeWidth="1.7" strokeLinecap="round">
                      <path d={type.icon} />
                    </svg>
                    <span style={{ fontSize:9,fontFamily:"'DM Mono',monospace",color:issueType?.key===type.key?type.color:"rgba(255,255,255,0.3)",letterSpacing:"0.5px",textAlign:"center" }}>
                      {t(`reportIssuePage.issueTypes.${type.key}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="ri-label">{t("reportIssuePage.severity")}</label>
              <div style={{ display:"flex",gap:6 }}>
                {SEVERITY_LEVELS.map(s => (
                  <button key={s.key} onClick={() => setSeverity(s.key)} style={{
                    flex:1, padding:"8px 4px", borderRadius:8,
                    border:`1px solid ${severity===s.key ? s.color+"55" : "rgba(255,255,255,0.07)"}`,
                    background: severity===s.key ? s.color+"14" : "rgba(255,255,255,0.02)",
                    cursor:"pointer", transition:"all 0.15s",
                    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                  }}>
                    <span style={{ width:6,height:6,borderRadius:"50%",background:s.color,boxShadow:severity===s.key?`0 0 6px ${s.color}`:"none" }} />
                    <span style={{ fontSize:9,fontFamily:"'DM Mono',monospace",color:severity===s.key?s.color:"rgba(255,255,255,0.3)",letterSpacing:"0.5px" }}>
                      {t(`reportIssuePage.severityLevels.${s.key}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Road */}
            <div>
              <label className="ri-label">{t("reportIssuePage.roadLocation")}</label>
              <input className="ri-input" placeholder={t("reportIssuePage.roadPlaceholder")}
                value={road} onChange={e => setRoad(e.target.value)} />
            </div>

            {/* Area */}
            <div>
              <label className="ri-label">{t("reportIssuePage.area")}</label>
              <input className="ri-input" placeholder={t("reportIssuePage.areaPlaceholder")}
                value={area} onChange={e => setArea(e.target.value)} />
            </div>

            {/* Description */}
            <div>
              <label className="ri-label">{t("reportIssuePage.notes")}</label>
              <textarea className="ri-input" placeholder={t("reportIssuePage.notesPlaceholder")}
                value={desc} onChange={e => setDesc(e.target.value)} />
            </div>

            {submitError && (
              <div style={{ padding:"10px 14px",borderRadius:8,background:"rgba(220,38,38,0.08)",border:"1px solid rgba(220,38,38,0.25)",color:"#f87171",fontSize:12.5,fontFamily:"'DM Sans',sans-serif",marginBottom:6 }}>
                {submitError}
              </div>
            )}
            <button onClick={handleSubmit} disabled={!road.trim() || submitting} style={{
              width:"100%", padding:"13px", borderRadius:10,
              border:"none", cursor: (road.trim() && !submitting) ? "pointer" : "not-allowed",
              background: road.trim() ? "#dc2626" : "rgba(255,255,255,0.06)",
              color: road.trim() ? "white" : "rgba(255,255,255,0.2)",
              fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif",
              letterSpacing:"0.5px",
              boxShadow: road.trim() ? "0 4px 20px rgba(220,38,38,0.35)" : "none",
              transition:"all 0.18s",
            }}>
              {submitting ? "Submitting…" : t("reportIssuePage.submit")}
            </button>
          </div>
        </div>
      </PageShell>
    </>
  );
}
