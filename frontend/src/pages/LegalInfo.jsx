import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";

/* ─────────────────────────────────────────────────────────────
   LegalInfo.jsx — Traffic laws & fines awareness module
   Prototype — Indian Motor Vehicle Act reference
   ───────────────────────────────────────────────────────────── */

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
    <div style={{ minHeight:"100vh",background:"#060810",color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column" }}>
      <div style={{ position:"sticky",top:0,zIndex:100,background:"rgba(6,8,16,0.96)",borderBottom:"1px solid rgba(255,255,255,0.06)",backdropFilter:"blur(12px)",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16 }}>
        <div style={{ display:"flex",alignItems:"center",gap:20 }}>
          <div style={{ cursor:"pointer",display:"flex",alignItems:"center",gap:10 }} onClick={() => navigate("/")}>
            <svg width="36" height="36" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="25" fill="#0d111b" stroke="rgba(220,38,38,0.3)" strokeWidth="1"/><path d="M26 8 L40 15 L40 28 C40 36 26 44 26 44 C26 44 12 36 12 28 L12 15 Z" fill="#dc2626" fillOpacity="0.15" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round"/><text x="26" y="32" textAnchor="middle" fill="#f1f5f9" fontSize="14" fontFamily="'Bebas Neue',cursive" letterSpacing="2">RA</text></svg>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:18,letterSpacing:3,color:"#f1f5f9",lineHeight:1 }}>RAKSHA AI</div>
              <div style={{ fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"1.5px",fontFamily:"'DM Mono',monospace" }}>ROAD SAFETY ECOSYSTEM</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:2,borderLeft:"1px solid rgba(255,255,255,0.06)",paddingLeft:16 }}>
            {links.map(l => <button key={l.key} onClick={()=>navigate(l.path)} style={{ background:activeNav===l.key?"rgba(220,38,38,0.12)":"none",border:activeNav===l.key?"1px solid rgba(220,38,38,0.25)":"1px solid transparent",borderRadius:6,cursor:"pointer",padding:"6px 13px",fontSize:12,fontWeight:500,color:activeNav===l.key?"#f87171":"rgba(255,255,255,0.85)",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",whiteSpace:"nowrap" }}>{t(l.labelKey)}</button>)}
          </div>
        </div>
        <LanguageSelector />
        <button onClick={()=>navigate("/sos")} style={{ padding:"7px 18px",borderRadius:8,background:"#dc2626",border:"none",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:"0.5px",boxShadow:"0 0 20px rgba(220,38,38,0.35)",fontFamily:"'DM Sans',sans-serif",flexShrink:0 }}>SOS</button>
      </div>
      <div style={{ padding:"28px 28px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:2,color:"rgba(255,255,255,0.25)",marginBottom:6 }}>RAKSHA AI / {t(title).toUpperCase()}</div>
        <div style={{ fontFamily:"'Bebas Neue',cursive",fontSize:28,letterSpacing:3,color:"#f1f5f9",lineHeight:1 }}>{t(title)}</div>
        {subtitle && <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:5 }}>{t(subtitle)}</div>}
      </div>
      <div style={{ flex:1,padding:"24px 28px",overflowY:"auto" }}>
        <div style={{ maxWidth:1100,margin:"0 auto",width:"100%" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Law data (Motor Vehicles Act 2019 amended fines) ───────── */
const LAWS = [
  {
    id:"L1", section:"Section 183", category:"Speed", transKey:"speeding",
    first: "₹1,000–2,000", repeat: "₹2,000+", imprisonment: null,
    tags:["highway","urban","school zone"], severity:"high",
  },
  {
    id:"L2", section:"Section 184", category:"Driving", transKey:"dangerous",
    first: "₹1,000–5,000", repeat: "₹10,000", imprisonment: "6 months–1 year",
    tags:["racing","rash driving"], severity:"critical",
  },
  {
    id:"L3", section:"Section 185", category:"Impairment", transKey:"dui",
    first: "₹10,000", repeat: "₹15,000", imprisonment: "6 months–2 years",
    tags:["alcohol","BAC","impairment"], severity:"critical",
  },
  {
    id:"L4", section:"Section 194B", category:"Safety", transKey:"seatbelt",
    first: "₹1,000", repeat: "₹1,000", imprisonment: null,
    tags:["seatbelt","safety"], severity:"medium",
  },
  {
    id:"L5", section:"Section 194C", category:"Safety", transKey:"helmet",
    first: "₹1,000 + 3-month licence suspension", repeat: "₹2,000", imprisonment: null,
    tags:["helmet","two-wheeler","motorcycle"], severity:"medium",
  },
  {
    id:"L6", section:"Section 177A", category:"Signals", transKey:"redLight",
    first: "₹5,000", repeat: "₹10,000", imprisonment: null,
    tags:["traffic light","signal","red light"], severity:"high",
  },
  {
    id:"L7", section:"Section 194D", category:"Mobile", transKey:"mobile",
    first: "₹5,000", repeat: "₹10,000", imprisonment: null,
    tags:["mobile","phone","distraction"], severity:"high",
  },
  {
    id:"L8", section:"Section 119", category:"Lane", transKey:"wrongSide",
    first: "₹1,000", repeat: "₹2,000", imprisonment: null,
    tags:["one-way","wrong-side","lane"], severity:"high",
  },
  {
    id:"L9", section:"Section 194A", category:"Overloading", transKey:"overloading",
    first: "₹20,000 + ₹2,000 per extra tonne", repeat: "Double fine", imprisonment: null,
    tags:["cargo","passengers","capacity"], severity:"medium",
  },
  {
    id:"L10", section:"Section 196", category:"Insurance", transKey:"insurance",
    first: "₹2,000 or 3 months imprisonment", repeat: "₹4,000 or 3 months", imprisonment: "3 months",
    tags:["insurance","uninsured"], severity:"high",
  },
  {
    id:"L11", section:"Section 130", category:"Documents", transKey:"licence",
    first: "₹5,000", repeat: "₹10,000", imprisonment: "3 months",
    tags:["licence","DL","documents"], severity:"critical",
  },
  {
    id:"L12", section:"Section 112", category:"Speed", transKey:"racing",
    first: "₹5,000", repeat: "₹10,000", imprisonment: "3 months",
    tags:["racing","speed","competition"], severity:"critical",
  },
];

const CATEGORIES = ["All", "Speed", "Safety", "Signals", "Driving", "Mobile", "Lane", "Overloading", "Insurance", "Documents", "Impairment"];
const SEV = {
  critical:{ color:"#dc2626", bg:"rgba(220,38,38,0.1)",  border:"rgba(220,38,38,0.25)",  label:"Critical" },
  high:    { color:"#f97316", bg:"rgba(249,115,22,0.1)",  border:"rgba(249,115,22,0.22)", label:"High"     },
  medium:  { color:"#eab308", bg:"rgba(234,179,8,0.1)",   border:"rgba(234,179,8,0.2)",   label:"Medium"   },
};

function LawCard({ law, expanded, onToggle }) {
  const sev = SEV[law.severity] || SEV.medium;

  return (
    <div style={{
      background:"#080c14",
      border:`1px solid ${expanded ? sev.border : "rgba(255,255,255,0.06)"}`,
      borderRadius:12,
      overflow:"hidden",
      transition:"border-color 0.18s",
      animation:"cardIn 0.3s ease both",
    }}>
      <div
        onClick={onToggle}
        style={{ padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:14,transition:"background 0.15s" }}
        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
      >
        {/* Severity dot */}
        <div style={{ width:10,height:10,borderRadius:"50%",background:sev.color,boxShadow:`0 0 6px ${sev.color}`,marginTop:4,flexShrink:0 }} />

        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:5 }}>
            <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:16,letterSpacing:1.5,color:"#f1f5f9" }}>{law.t(`legalPage.laws.${law.transKey}Title`)}</span>
            <span style={{ fontSize:9,padding:"1px 7px",borderRadius:4,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.35)",fontFamily:"'DM Mono',monospace",letterSpacing:1 }}>{law.section}</span>
            <span style={{ fontSize:9,padding:"1px 7px",borderRadius:4,background:sev.bg,border:`1px solid ${sev.border}`,color:sev.color,fontFamily:"'DM Mono',monospace",letterSpacing:"0.5px" }}>{law.t(`legalPage.labels.${law.severity}`) || sev.label}</span>
          </div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.85)",lineHeight:1.55,marginBottom:8 }}>{law.t(`legalPage.laws.${law.transKey}Desc`)}</div>

          <div style={{ display:"flex",gap:16 }}>
            <div>
              <div style={{ fontSize:9,fontFamily:"'DM Mono',monospace",color:"rgba(255,255,255,0.25)",letterSpacing:1,marginBottom:2 }}>{law.t('legalPage.firstOffence').toUpperCase()}</div>
              <div style={{ fontSize:13,fontFamily:"'Bebas Neue',cursive",color:"#f97316",letterSpacing:1 }}>{law.first}</div>
            </div>
            <div>
              <div style={{ fontSize:9,fontFamily:"'DM Mono',monospace",color:"rgba(255,255,255,0.25)",letterSpacing:1,marginBottom:2 }}>{law.t('legalPage.repeatOffence').toUpperCase()}</div>
              <div style={{ fontSize:13,fontFamily:"'Bebas Neue',cursive",color:"#dc2626",letterSpacing:1 }}>{law.repeat}</div>
            </div>
          </div>
        </div>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink:0,marginTop:2,transition:"transform 0.2s",transform:expanded?"rotate(180deg)":"none" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {expanded && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)",padding:"14px 18px 18px 42px",animation:"expandIn 0.2s ease" }}>
          {law.imprisonment && (
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"8px 12px",borderRadius:8,background:"rgba(220,38,38,0.06)",border:"1px solid rgba(220,38,38,0.18)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize:11,color:"#f87171",fontFamily:"'DM Mono',monospace" }}>{law.t('legalPage.imprisonment', {term: law.imprisonment})}</span>
            </div>
          )}

          <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
            {law.tags.map(t => (
              <span key={t} style={{ fontSize:9,padding:"2px 8px",borderRadius:5,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.35)",fontFamily:"'DM Mono',monospace" }}>
                #{t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LegalInfo() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch]   = useState("");
  const [cat, setCat]         = useState("All");
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    let list = LAWS;
    if (cat !== "All") list = list.filter(l => l.category === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        [t(`legalPage.laws.${l.transKey}Title`), l.section, t(`legalPage.laws.${l.transKey}Desc`), ...l.tags].join(" ").toLowerCase().includes(q)
      );
    }
    return list.map(l => ({ ...l, t }));
  }, [search, cat, t]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes cardIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes expandIn { from{opacity:0;max-height:0} to{opacity:1;max-height:200px} }
        .li-search { width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:9px 12px 9px 34px;font-size:12px;font-family:'DM Mono',monospace;color:rgba(255,255,255,0.7);outline:none;transition:border-color 0.15s;box-sizing:border-box; }
        .li-search:focus{border-color:rgba(220,38,38,0.4);}
        .li-search::placeholder{color:rgba(255,255,255,0.2);}
      `}</style>

      <PageShell title={t("legalPage.title")} subtitle={t("legalPage.subtitle")} navigate={navigate} activeNav="legal-info">
        <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",gap:32,alignItems:"flex-start",flexWrap:"wrap" }}>
          
          {/* Left Sidebar */}
          <div style={{ width:280,flexShrink:0,display:"flex",flexDirection:"column",gap:24,position:"sticky",top:100 }}>
            {/* Disclaimer */}
            <div style={{ background:"rgba(234,179,8,0.06)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:12,padding:16 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,color:"#eab308",marginBottom:8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span style={{ fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,letterSpacing:0.5 }}>{t('legalPage.prototypeTitle')}</span>
              </div>
              <div style={{ fontSize:11,color:"rgba(234,179,8,0.8)",lineHeight:1.6 }}>
                {t('legalPage.prototype')}
              </div>
            </div>

            <div style={{ position:"relative" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:"absolute",left:12,top:9 }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder={t('legalPage.searchPlaceholder')}
                value={search}
                onChange={e=>setSearch(e.target.value)}
                className="li-search"
              />
            </div>

            <div style={{ background:"#080c14",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:16 }}>
              <div style={{ fontSize:10,fontFamily:"'DM Mono',monospace",color:"rgba(255,255,255,0.3)",letterSpacing:2,marginBottom:12 }}>{t('legalPage.category').toUpperCase()}</div>
              <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={()=>setCat(c)} style={{ textAlign:"left",padding:"8px 12px",borderRadius:8,background:cat===c?"rgba(220,38,38,0.1)":"transparent",border:cat===c?"1px solid rgba(220,38,38,0.2)":"1px solid transparent",color:cat===c?"#f87171":"rgba(255,255,255,0.7)",fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all 0.15s",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span>{t(`legalPage.categories.${c.toLowerCase()}`)}</span>
                    <span style={{ fontSize:10,fontFamily:"'DM Mono',monospace",color:cat===c?"rgba(248,113,113,0.5)":"rgba(255,255,255,0.2)" }}>
                      {c==="All" ? "" : LAWS.filter(l=>l.category===c).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:16 }}>
              <div style={{ fontSize:10,fontFamily:"'DM Mono',monospace",color:"rgba(255,255,255,0.3)",letterSpacing:2,marginBottom:12 }}>{t('legalPage.quickFacts').toUpperCase()}</div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12 }}><span style={{ color:"rgba(255,255,255,0.5)" }}>{t('legalPage.facts.maxFine')}</span><span style={{ color:"#f1f5f9" }}>₹20,000+</span></div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12 }}><span style={{ color:"rgba(255,255,255,0.5)" }}>{t('legalPage.facts.drunkMax')}</span><span style={{ color:"#f1f5f9" }}>₹15,000</span></div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12 }}><span style={{ color:"rgba(255,255,255,0.5)" }}>{t('legalPage.facts.listed')}</span><span style={{ color:"#f1f5f9" }}>12</span></div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12 }}><span style={{ color:"rgba(255,255,255,0.5)" }}>{t('legalPage.facts.actVersion')}</span><span style={{ color:"#f1f5f9" }}>2019 AMD</span></div>
              </div>
            </div>

            <div style={{ background:"rgba(59,130,246,0.05)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:12,padding:16 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,color:"#60a5fa",marginBottom:8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span style={{ fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600,letterSpacing:0.5 }}>{t('legalPage.futureScope').toUpperCase()}</span>
              </div>
              <div style={{ fontSize:11,color:"rgba(96,165,250,0.8)",lineHeight:1.6 }}>
                {t('legalPage.futureScopeText')}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ flex:1,minWidth:300 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,borderBottom:"1px solid rgba(255,255,255,0.06)",paddingBottom:12 }}>
              <div style={{ fontSize:12,fontFamily:"'DM Mono',monospace",color:"rgba(255,255,255,0.4)" }}>
                {t('legalPage.showing')} <strong style={{ color:"#f1f5f9" }}>{filtered.length}</strong> {t('legalPage.ofRules', {count: LAWS.length})}
              </div>
              {search && (
                <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",color:"#f87171",fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer" }}>{t('legalPage.clearSearch')}</button>
              )}
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,0.3)",fontSize:13,fontFamily:"'DM Mono',monospace" }}>
                  {t('legalPage.noMatch')}
                </div>
              ) : (
                filtered.map(law => (
                  <LawCard
                    key={law.id}
                    law={law}
                    expanded={expanded === law.id}
                    onToggle={() => setExpanded(expanded === law.id ? null : law.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
