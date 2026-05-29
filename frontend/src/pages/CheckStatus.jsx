import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getIssueById } from "../services/roadService";

function PageShell({ title, subtitle, children, navigate, activeNav }) {
  const { t } = useTranslation();
  const links = [
    { key:"home",labelKey:"navigation.home",path:"/" },
    { key:"dashboard",labelKey:"navigation.dashboard",path:"/dashboard" },
    { key:"sos",labelKey:"navigation.sos",path:"/sos" },
    { key:"report-issue",labelKey:"navigation.reportIssue",path:"/report-issue" },
    { key:"risk-alert",labelKey:"navigation.riskAlertPlural",path:"/risk-alert" },
    { key:"legal-info",labelKey:"navigation.legal",path:"/legal-info" },
    { key:"status",labelKey:"navigation.checkStatus",path:"/status" },
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
            {links.map(l => <button key={l.key} onClick={()=>navigate(l.path)} style={{ background:activeNav===l.key?"rgba(220,38,38,0.12)":"none",border:activeNav===l.key?"1px solid rgba(220,38,38,0.25)":"1px solid transparent",borderRadius:6,cursor:"pointer",padding:"4px 11px",fontSize:11,fontWeight:500,color:activeNav===l.key?"#f87171":"rgba(255,255,255,0.85)",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",whiteSpace:"nowrap" }}>{t(l.labelKey, l.labelKey.split('.').pop())}</button>)}
          </div>
        </div>
        <button onClick={()=>navigate("/sos")} style={{ padding:"6px 16px",borderRadius:7,background:"#dc2626",border:"none",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:"0.5px",boxShadow:"0 0 16px rgba(220,38,38,0.35)",fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>SOS</button>
      </div>
      <div style={{ padding:"20px 28px 8px",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"rgba(255,255,255,0.25)",marginBottom:6 }}>RAKSHA AI / {t(title).toUpperCase()}</div>
        <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:28,letterSpacing:3,color:"#f1f5f9",lineHeight:1 }}>{t(title)}</div>
        {subtitle && <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:5 }}>{t(subtitle)}</div>}
      </div>
      <div style={{ flex:1,padding:"24px 28px",overflowY:"auto" }}>{children}</div>
    </div>
  );
}

const STATUS_STAGES = ["pending", "verified", "in-progress", "resolved"];
const STATUS_LABELS = {
  "pending": "Pending Review",
  "verified": "Verified",
  "in-progress": "In Progress",
  "resolved": "Resolved"
};

export default function CheckStatus() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reportId, setReportId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [issue, setIssue] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!reportId.trim()) return;
    
    setLoading(true);
    setError(null);
    setIssue(null);
    
    try {
      const data = await getIssueById(reportId.trim());
      setIssue(data);
    } catch (err) {
      setError(t("checkStatusPage.errorNotFound"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        .status-input { width:100%;max-width:400px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 16px;font-size:14px;font-family:'DM Mono',monospace;color:rgba(255,255,255,0.9);outline:none;transition:border-color 0.15s; }
        .status-input:focus { border-color:rgba(59,130,246,0.4); }
        .status-btn { padding:12px 24px;border-radius:8px;background:#3b82f6;border:none;color:white;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:background 0.2s; }
        .status-btn:hover { background:#2563eb; }
        .status-btn:disabled { background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.3); cursor:not-allowed; }
      `}</style>
      <PageShell title="checkStatusPage.title" subtitle="checkStatusPage.subtitle" navigate={navigate} activeNav="status">
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 0" }}>
          
          <form onSubmit={handleSearch} style={{ display:"flex", gap:12, marginBottom:40 }}>
            <input 
              type="text" 
              className="status-input" 
              placeholder={t("checkStatusPage.placeholder")} 
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
            />
            <button type="submit" className="status-btn" disabled={loading || !reportId.trim()}>
              {loading ? t("checkStatusPage.searching") : t("checkStatusPage.trackBtn")}
            </button>
          </form>

          {error && (
            <div style={{ padding:16, borderRadius:8, background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.2)", color:"#f87171", fontFamily:"'DM Mono',monospace" }}>
              {error}
            </div>
          )}

          {issue && (
            <div style={{ background:"#080c14", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:30 }}>
                <div>
                  <div style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:"rgba(255,255,255,0.3)", marginBottom:4 }}>{t("checkStatusPage.reportId").toUpperCase()}</div>
                  <div style={{ fontSize:18, fontFamily:"'DM Mono',monospace", color:"#f1f5f9" }}>{issue.id}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:"rgba(255,255,255,0.3)", marginBottom:4 }}>{t("checkStatusPage.dateSubmitted").toUpperCase()}</div>
                  <div style={{ fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"rgba(255,255,255,0.7)" }}>
                    {new Date(issue.created_at).toLocaleDateString()} {new Date(issue.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:8, padding:16, marginBottom:40 }}>
                <div style={{ fontSize:15, fontWeight:600, color:"#f1f5f9", marginBottom:8 }}>{issue.type || t("checkStatusPage.reportDetails")}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>
                  {issue.description || t("checkStatusPage.noDescription")}
                </div>
                {issue.admin_note && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(59,130,246,0.1)", borderLeft: "3px solid #3b82f6", borderRadius: "0 6px 6px 0", fontSize: 13, color: "#93c5fd" }}>
                    <strong>{t("checkStatusPage.adminNote")}</strong> {issue.admin_note}
                  </div>
                )}
              </div>

              <div style={{ position:"relative", paddingTop:20, paddingBottom:20 }}>
                <div style={{ position:"absolute", left:24, top:0, bottom:0, width:2, background:"rgba(255,255,255,0.05)" }} />
                
                {STATUS_STAGES.map((stage, idx) => {
                  const currentIdx = STATUS_STAGES.indexOf(issue.status || "pending");
                  const isCompleted = idx <= currentIdx;
                  const isActive = idx === currentIdx;
                  
                  return (
                    <div key={stage} style={{ display:"flex", gap:20, position:"relative", marginBottom: idx === STATUS_STAGES.length - 1 ? 0 : 40 }}>
                      <div style={{ 
                        width: 50, height: 50, borderRadius:"50%", 
                        background: isActive ? "rgba(59,130,246,0.1)" : isCompleted ? "#3b82f6" : "#080c14", 
                        border: `2px solid ${isActive ? "#3b82f6" : isCompleted ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                        display:"flex", alignItems:"center", justifyContent:"center", zIndex:2,
                        boxShadow: isActive ? "0 0 20px rgba(59,130,246,0.4)" : "none"
                      }}>
                        {isCompleted && !isActive ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        ) : (
                          <div style={{ width:12, height:12, borderRadius:"50%", background: isActive ? "#3b82f6" : "rgba(255,255,255,0.1)" }} />
                        )}
                      </div>
                      <div style={{ paddingTop:12 }}>
                        <div style={{ fontSize:16, fontWeight:isActive ? 700 : 500, color: isActive ? "#60a5fa" : isCompleted ? "#f1f5f9" : "rgba(255,255,255,0.3)", fontFamily:"'DM Sans',sans-serif" }}>
                          {t(`checkStatusPage.status.${stage === 'in-progress' ? 'inProgress' : stage}`)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </PageShell>
    </>
  );
}
