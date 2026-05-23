import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────────────────────
   LegalInfo.jsx — Traffic laws & fines awareness module
   Prototype — Indian Motor Vehicle Act reference
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

/* ── Law data (Motor Vehicles Act 2019 amended fines) ───────── */
const LAWS = [
  {
    id:"L1", section:"Section 183", category:"Speed",
    title:"Over-speeding",
    desc:"Driving above prescribed speed limits on highways, urban roads, or school zones.",
    first: "₹1,000–2,000", repeat: "₹2,000+", imprisonment: null,
    tags:["highway","urban","school zone"],
    severity:"high",
  },
  {
    id:"L2", section:"Section 184", category:"Driving",
    title:"Dangerous Driving",
    desc:"Driving in a manner that endangers life or property of others. Includes racing and rash driving.",
    first: "₹1,000–5,000", repeat: "₹10,000", imprisonment: "6 months–1 year",
    tags:["racing","rash driving"],
    severity:"critical",
  },
  {
    id:"L3", section:"Section 185", category:"Impairment",
    title:"Drunken Driving (DUI)",
    desc:"Driving with blood alcohol content exceeding 30mg/100ml of blood.",
    first: "₹10,000", repeat: "₹15,000", imprisonment: "6 months–2 years",
    tags:["alcohol","BAC","impairment"],
    severity:"critical",
  },
  {
    id:"L4", section:"Section 194B", category:"Safety",
    title:"Seatbelt Violation",
    desc:"Driver or front-seat passenger not wearing seatbelt while vehicle is in motion.",
    first: "₹1,000", repeat: "₹1,000", imprisonment: null,
    tags:["seatbelt","safety"],
    severity:"medium",
  },
  {
    id:"L5", section:"Section 194C", category:"Safety",
    title:"Helmet Not Worn",
    desc:"Two-wheeler rider or pillion not wearing an ISI-certified helmet.",
    first: "₹1,000 + 3-month licence suspension", repeat: "₹2,000", imprisonment: null,
    tags:["helmet","two-wheeler","motorcycle"],
    severity:"medium",
  },
  {
    id:"L6", section:"Section 177A", category:"Signals",
    title:"Jumping Red Light",
    desc:"Proceeding past a red traffic signal without stopping at the designated stop line.",
    first: "₹5,000", repeat: "₹10,000", imprisonment: null,
    tags:["traffic light","signal","red light"],
    severity:"high",
  },
  {
    id:"L7", section:"Section 194D", category:"Mobile",
    title:"Mobile Phone Use While Driving",
    desc:"Using a handheld mobile phone for talking, texting, or any purpose while driving.",
    first: "₹5,000", repeat: "₹10,000", imprisonment: null,
    tags:["mobile","phone","distraction"],
    severity:"high",
  },
  {
    id:"L8", section:"Section 119", category:"Lane",
    title:"Wrong-side Driving",
    desc:"Driving on the incorrect side of the road or against traffic flow on a one-way street.",
    first: "₹1,000", repeat: "₹2,000", imprisonment: null,
    tags:["one-way","wrong-side","lane"],
    severity:"high",
  },
  {
    id:"L9", section:"Section 194A", category:"Overloading",
    title:"Vehicle Overloading",
    desc:"Carrying passengers or cargo beyond the registered capacity of the vehicle.",
    first: "₹20,000 + ₹2,000 per extra tonne", repeat: "Double fine", imprisonment: null,
    tags:["cargo","passengers","capacity"],
    severity:"medium",
  },
  {
    id:"L10", section:"Section 196", category:"Insurance",
    title:"Driving Without Insurance",
    desc:"Operating a motor vehicle on a public road without valid third-party insurance.",
    first: "₹2,000 or 3 months imprisonment", repeat: "₹4,000 or 3 months", imprisonment: "3 months",
    tags:["insurance","uninsured"],
    severity:"high",
  },
  {
    id:"L11", section:"Section 130", category:"Documents",
    title:"Driving Without Licence",
    desc:"Operating a motor vehicle without a valid driving licence or a learner's licence.",
    first: "₹5,000", repeat: "₹10,000", imprisonment: "3 months",
    tags:["licence","DL","documents"],
    severity:"critical",
  },
  {
    id:"L12", section:"Section 112", category:"Speed",
    title:"Unauthorised Racing / Trials",
    desc:"Participating in any speed contest or trial on a public road without prior written government permission.",
    first: "₹5,000", repeat: "₹10,000", imprisonment: "3 months",
    tags:["racing","speed","competition"],
    severity:"critical",
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
            <span style={{ fontFamily:"'Bebas Neue',cursive",fontSize:16,letterSpacing:1.5,color:"#f1f5f9" }}>{law.title}</span>
            <span style={{ fontSize:9,padding:"1px 7px",borderRadius:4,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.35)",fontFamily:"'DM Mono',monospace",letterSpacing:1 }}>{law.section}</span>
            <span style={{ fontSize:9,padding:"1px 7px",borderRadius:4,background:sev.bg,border:`1px solid ${sev.border}`,color:sev.color,fontFamily:"'DM Mono',monospace",letterSpacing:"0.5px" }}>{sev.label}</span>
          </div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.55,marginBottom:8 }}>{law.desc}</div>

          <div style={{ display:"flex",gap:16 }}>
            <div>
              <div style={{ fontSize:9,fontFamily:"'DM Mono',monospace",color:"rgba(255,255,255,0.25)",letterSpacing:1,marginBottom:2 }}>FIRST OFFENCE</div>
              <div style={{ fontSize:13,fontFamily:"'Bebas Neue',cursive",color:"#f97316",letterSpacing:1 }}>{law.first}</div>
            </div>
            <div>
              <div style={{ fontSize:9,fontFamily:"'DM Mono',monospace",color:"rgba(255,255,255,0.25)",letterSpacing:1,marginBottom:2 }}>REPEAT OFFENCE</div>
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
              <span style={{ fontSize:11,color:"#f87171",fontFamily:"'DM Mono',monospace" }}>Imprisonment: {law.imprisonment}</span>
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
  const [search, setSearch]   = useState("");
  const [cat, setCat]         = useState("All");
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    let list = LAWS;
    if (cat !== "All") list = list.filter(l => l.category === cat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        [l.title, l.section, l.desc, ...l.tags].join(" ").toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, cat]);

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

      <PageShell title="Legal Info" subtitle="Traffic laws & fines under Indian Motor Vehicles Act 2019" navigate={navigate} activeNav="legal-info">

        {/* Prototype notice */}
        <div style={{ marginBottom:20,padding:"10px 16px",borderRadius:9,border:"1px solid rgba(234,179,8,0.25)",background:"rgba(234,179,8,0.06)",display:"flex",alignItems:"flex-start",gap:10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" style={{ marginTop:2,flexShrink:0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div style={{ fontSize:11,color:"rgba(234,179,8,0.8)",lineHeight:1.6,fontFamily:"'DM Mono',monospace" }}>
            <strong>Prototype Module</strong> — This is a static reference. Location-based rule personalisation is planned for a future release. Always verify with official MORTH sources.
          </div>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"260px 1fr",gap:20,maxWidth:1060,margin:"0 auto" }}>

          {/* ── Left sidebar: filters + quick stats ── */}
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

            {/* Search */}
            <div style={{ position:"relative" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input className="li-search" placeholder="Search laws, sections, tags…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Category filter */}
            <div style={{ background:"#080c14",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"14px",display:"flex",flexDirection:"column",gap:4 }}>
              <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"rgba(255,255,255,0.25)",marginBottom:8,textTransform:"uppercase" }}>Category</div>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{
                  padding:"7px 12px",borderRadius:7,border:"none",
                  background: cat===c ? "rgba(220,38,38,0.14)" : "transparent",
                  color: cat===c ? "#f87171" : "rgba(255,255,255,0.4)",
                  fontSize:12, fontFamily:"'DM Sans',sans-serif",
                  cursor:"pointer",textAlign:"left",transition:"all 0.15s",
                  fontWeight: cat===c ? 600 : 400,
                }}>
                  {c}
                  {c!=="All" && <span style={{ marginLeft:8,fontSize:10,color:"rgba(255,255,255,0.2)" }}>
                    {LAWS.filter(l=>l.category===c).length}
                  </span>}
                </button>
              ))}
            </div>

            {/* Quick facts */}
            <div style={{ background:"#080c14",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:16 }}>
              <div style={{ fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:2,color:"rgba(255,255,255,0.25)",marginBottom:12,textTransform:"uppercase" }}>Quick Facts</div>
              {[
                { label:"Max single fine",  value:"₹20,000", color:"#dc2626" },
                { label:"Drunk driving max", value:"₹15,000+", color:"#f97316" },
                { label:"Offences listed",   value:`${LAWS.length} laws`,   color:"#3b82f6" },
                { label:"Act version",       value:"MV Act 2019", color:"#22c55e" },
              ].map(f => (
                <div key={f.label} style={{ display:"flex",justifyContent:"space-between",marginBottom:9,alignItems:"center" }}>
                  <span style={{ fontSize:11,color:"rgba(255,255,255,0.35)",fontFamily:"'DM Mono',monospace" }}>{f.label}</span>
                  <span style={{ fontSize:11,fontFamily:"'Bebas Neue',cursive",color:f.color,letterSpacing:1 }}>{f.value}</span>
                </div>
              ))}
            </div>

            {/* Future scope callout */}
            <div style={{ padding:14,borderRadius:12,border:"1px solid rgba(59,130,246,0.2)",background:"rgba(59,130,246,0.06)" }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#60a5fa",marginBottom:4,fontFamily:"'DM Sans',sans-serif" }}>Future Scope</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",lineHeight:1.6 }}>
                Location-based rule personalisation — show state-specific speed limits, city-level restrictions, and time-sensitive rules based on GPS.
              </div>
            </div>
          </div>

          {/* ── Right: law cards ── */}
          <div>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <div style={{ fontFamily:"'DM Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.3)" }}>
                Showing <strong style={{ color:"rgba(255,255,255,0.6)" }}>{filtered.length}</strong> of {LAWS.length} rules
              </div>
              {search && (
                <button onClick={() => setSearch("")} style={{ fontSize:11,color:"rgba(255,255,255,0.3)",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",textDecoration:"underline" }}>
                  Clear search
                </button>
              )}
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign:"center",padding:"48px 0",color:"rgba(255,255,255,0.2)",fontFamily:"'DM Mono',monospace",fontSize:13 }}>
                  No laws match your search
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