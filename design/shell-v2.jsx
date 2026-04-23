// Shell v2: icon library, darker sidebar with distinct color, bigger hero titles
const { useState } = React;

// --- Icon library (stroke-based, consistent 20px grid) ---
const Icon = ({ name, size = 18, stroke = "currentColor", style }) => {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none",
    stroke, strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", style };
  const paths = {
    overview: <><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></>,
    tenants:  <><path d="M3 21V8l6-4 6 4v13"/><path d="M15 12h6v9"/><path d="M7 12h0M7 16h0M11 12h0M11 16h0M18 16h0M18 19h0"/></>,
    users:    <><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="10" r="2.4"/><path d="M3.5 20c.6-3 3-5 5.5-5s4.9 2 5.5 5"/><path d="M15 20c.2-1.8 1.3-3.2 3-3.7"/></>,
    permissions: <><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></>,
    entities: <><ellipse cx="12" cy="5.5" rx="8" ry="2.5"/><path d="M4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13"/><path d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/></>,
    records:  <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/></>,
    automations: <><path d="M13 3L4 14h7l-1 7 9-11h-7z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    search:   <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
    bell:     <><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></>,
    help:     <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5A2.5 2.5 0 0114 11c0 1.5-2 2-2 3.5"/><path d="M12 18h0"/></>,
    plus:     <><path d="M12 5v14M5 12h14"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/></>,
    filter:   <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
    sort:     <><path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3"/></>,
    group:    <><rect x="3" y="4" width="8" height="7" rx="1"/><rect x="13" y="4" width="8" height="7" rx="1"/><rect x="3" y="13" width="18" height="7" rx="1"/></>,
    table:    <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16"/></>,
    kanban:   <><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/></>,
    cards:    <><rect x="3" y="4" width="8" height="7" rx="1.5"/><rect x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5"/></>,
    dots:     <><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></>,
    edit:     <><path d="M4 20h4l11-11-4-4L4 16z"/></>,
    drag:     <><circle cx="9" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="15" cy="18" r="1.3"/></>,
    chevron:  <><path d="M6 9l6 6 6-6"/></>,
    check:    <><path d="M5 12l5 5 9-11"/></>,
    x:        <><path d="M6 6l12 12M18 6L6 18"/></>,
    minus:    <><path d="M6 12h12"/></>,
    arrow:    <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    sparkle:  <><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></>,
    import:   <><path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 5h16"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    lightning:<><path d="M13 3L4 14h7l-1 7 9-11h-7z"/></>,
    shield:   <><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></>,
    logo:     <><path d="M12 3l9 5v8l-9 5-9-5V8z"/><path d="M12 12l9-4M12 12l-9-4M12 12v9"/></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
};

const MODULES = [
  { id: "overview",   label: "Overview",      icon: "overview",    group: "Workspace" },
  { id: "tenants",    label: "Tenants",       icon: "tenants",     group: "Workspace" },
  { id: "users",      label: "Usuários",      icon: "users",       group: "Pessoas" },
  { id: "permissions",label: "Permissões",    icon: "permissions", group: "Pessoas" },
  { id: "entities",   label: "Entidades",     icon: "entities",    group: "Dados" },
  { id: "records",    label: "Registros",     icon: "records",     group: "Dados" },
  { id: "automations",label: "Automações",    icon: "automations", group: "Dados" },
  { id: "settings",   label: "Configurações", icon: "settings",    group: "Sistema" },
];

const GROUP_ICONS = { Workspace: "logo", Pessoas: "users", Dados: "entities", Sistema: "settings" };

// --- Sidebar: distinctive deep-teal color ---
function Sidebar({ active, mode = "expanded", onSelect }) {
  const collapsed = mode === "collapsed";
  const width = collapsed ? 76 : 256;

  const groups = {};
  MODULES.forEach(m => { (groups[m.group] = groups[m.group] || []).push(m); });

  // Sidebar palette — deep teal that harmonizes with burnt orange accent
  const SB_BG     = "#0f2f38";     // deep teal
  const SB_BG2    = "#133b45";
  const SB_LINE   = "rgba(255,255,255,0.08)";
  const SB_TEXT   = "#e4ecea";
  const SB_MUTED  = "rgba(228,236,234,0.55)";
  const SB_ACTIVE = "#d36d3f";     // burnt orange pop
  const SB_ACTBG  = "rgba(211,109,63,0.14)";

  return (
    <aside style={{
      width, flexShrink: 0,
      background: `linear-gradient(180deg, ${SB_BG} 0%, ${SB_BG2} 100%)`,
      color: SB_TEXT,
      borderRight: `1px solid ${SB_LINE}`,
      display: "flex", flexDirection: "column",
      padding: collapsed ? "22px 10px" : "22px 16px",
      gap: 18, position: "relative",
    }}>
      {/* logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: collapsed ? 0 : "2px 4px" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: `linear-gradient(135deg, ${SB_ACTIVE}, #b44a1e)`,
          color: "#fff", display: "grid", placeItems: "center",
          boxShadow: "0 8px 18px rgba(211,109,63,0.35)",
        }}>
          <Icon name="logo" size={20}/>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily:'"Iowan Old Style",serif', fontSize: 18, lineHeight: 1, color: "#fff" }}>CRM Flow</div>
            <div style={{ fontSize: 10.5, color: SB_MUTED, marginTop: 4, letterSpacing: ".14em", textTransform: "uppercase" }}>Operations</div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${SB_LINE}`, borderRadius: 10,
          padding: "8px 10px", color: SB_MUTED, fontSize: 13,
        }}>
          <Icon name="search" size={15} stroke={SB_MUTED}/>
          <span style={{ flex: 1 }}>Buscar…</span>
          <kbd style={{
            fontFamily:"ui-monospace,monospace", fontSize: 10,
            background: "rgba(255,255,255,0.08)", padding:"2px 6px", borderRadius:6,
            color: SB_TEXT,
          }}>⌘K</kbd>
        </div>
      )}

      <nav style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "auto", flex: 1 }}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            {!collapsed && (
              <div style={{
                display: "flex", alignItems:"center", gap: 7,
                fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em",
                textTransform: "uppercase", color: SB_MUTED,
                padding: "0 8px 8px"
              }}>
                <Icon name={GROUP_ICONS[group] || "overview"} size={12} stroke={SB_MUTED}/>
                <span>{group}</span>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap: 2 }}>
              {items.map(m => {
                const isActive = m.id === active;
                return (
                  <button key={m.id} onClick={() => onSelect && onSelect(m.id)}
                    style={{
                      display: "flex", alignItems:"center", gap: 12,
                      padding: collapsed ? "11px 0" : "10px 11px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      border: 0, cursor: "pointer", textAlign: "left",
                      borderRadius: 10,
                      background: isActive ? SB_ACTBG : "transparent",
                      color: isActive ? "#ffd9c0" : SB_TEXT,
                      fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                      position: "relative",
                    }}
                    onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    {isActive && (
                      <span style={{ position:"absolute", left: collapsed ? 8 : 0, top: 8, bottom: 8, width: 3, borderRadius: 3, background: SB_ACTIVE }}/>
                    )}
                    <Icon name={m.icon} size={17} stroke={isActive ? SB_ACTIVE : SB_TEXT}/>
                    {!collapsed && <span>{m.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{
        borderTop: `1px solid ${SB_LINE}`, paddingTop: 14,
        display:"flex", alignItems:"center", gap: 10,
        padding: collapsed ? "14px 0 0" : "14px 8px 0",
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background:"#d9c6a8", color:"#0f2f38", display:"grid",
          placeItems:"center", fontWeight: 700, fontSize: 13,
        }}>GC</div>
        {!collapsed && (
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color:"#fff" }}>Gabriela C.</div>
            <div style={{ fontSize: 11, color: SB_MUTED }}>Admin • faculdadeunimed</div>
          </div>
        )}
      </div>
    </aside>
  );
}

// --- Topbar: bigger hero title, iconography ---
function Topbar({ title, subtitle, tenant, actions, breadcrumb, icon }) {
  return (
    <header style={{
      display: "flex", alignItems:"center", justifyContent:"space-between",
      padding: "26px 32px 22px", borderBottom: "1px solid var(--line)",
      background: "rgba(253,251,247,0.5)",
      gap: 20,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        {breadcrumb && (
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>{breadcrumb}</div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap: 14 }}>
          {icon && (
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg,#0f2f38,#133b45)",
              color: "#f6c79a", display:"grid", placeItems:"center",
              boxShadow: "0 10px 22px rgba(15,47,56,0.28)",
              flexShrink: 0,
            }}>
              <Icon name={icon} size={24}/>
            </div>
          )}
          <div>
            <h1 style={{
              fontFamily:'"Iowan Old Style",serif',
              fontSize: 40, margin: 0, color: "var(--foreground)",
              letterSpacing: "-0.02em", lineHeight: 1.05,
            }}>{title}</h1>
            {subtitle && <div style={{ fontSize: 13.5, color:"var(--muted)", marginTop: 4 }}>{subtitle}</div>}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
        {tenant && (
          <button style={{
            border:"1px solid var(--line)", background:"rgba(255,255,255,0.9)",
            borderRadius: 10, padding: "8px 12px",
            display:"flex", alignItems:"center", gap:10, cursor:"pointer",
          }}>
            <div style={{
              width:24, height:24, borderRadius:7,
              background:"linear-gradient(135deg,#d36d3f,#b44a1e)",
              color:"#fff", fontSize: 11, fontWeight:700,
              display:"grid", placeItems:"center"
            }}>{tenant.slice(0,2).toUpperCase()}</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{tenant}</span>
            <Icon name="chevron" size={13} stroke="var(--muted)"/>
          </button>
        )}
        <button style={iconBtn}><Icon name="help" size={16}/></button>
        <button style={iconBtn}><Icon name="bell" size={16}/></button>
        {actions}
      </div>
    </header>
  );
}

const iconBtn = {
  width: 38, height: 38, borderRadius: 10,
  border: "1px solid var(--line)", background: "rgba(255,255,255,0.9)",
  cursor:"pointer", color: "var(--foreground)",
  display:"inline-flex", alignItems:"center", justifyContent:"center",
};

function PrimaryBtn({ children, icon, ...p }) {
  return <button {...p} style={{
    border:0, borderRadius: 10,
    background: "linear-gradient(135deg,#0d1b26,#1f3a52)",
    color:"#fff", padding: "10px 16px", fontWeight: 600, fontSize: 13,
    cursor:"pointer", boxShadow:"0 10px 24px rgba(13,27,38,0.26)",
    display:"inline-flex", alignItems:"center", gap: 8,
    ...(p.style||{})
  }}>
    {icon && <Icon name={icon} size={15}/>}
    {children}
  </button>;
}
function GhostBtn({ children, icon, ...p }) {
  return <button {...p} style={{
    border:"1px solid var(--line)", borderRadius: 10,
    background:"rgba(255,255,255,0.92)",
    color: "var(--foreground)", padding: "9px 14px", fontWeight: 600, fontSize: 13,
    cursor:"pointer",
    display:"inline-flex", alignItems:"center", gap: 7,
    ...(p.style||{})
  }}>
    {icon && <Icon name={icon} size={15}/>}
    {children}
  </button>;
}
function AccentBtn({ children, icon, ...p }) {
  return <button {...p} style={{
    border:0, borderRadius: 10,
    background:"linear-gradient(135deg,#d36d3f,#b44a1e)",
    color:"#fff", padding: "10px 16px", fontWeight: 600, fontSize: 13,
    cursor:"pointer", boxShadow:"0 10px 24px rgba(211,109,63,0.34)",
    display:"inline-flex", alignItems:"center", gap: 8,
    ...(p.style||{})
  }}>
    {icon && <Icon name={icon} size={15}/>}
    {children}
  </button>;
}

function Pill({ children, tone = "neutral", icon }) {
  // Higher contrast / more saturated tones
  const tones = {
    neutral: { bg:"rgba(15,47,56,0.09)", c:"#0f2f38" },
    amber:   { bg:"rgba(211,109,63,0.16)", c:"#9d3f14" },
    green:   { bg:"rgba(22,87,78,0.15)",  c:"#155a52" },
    red:     { bg:"rgba(156,40,40,0.14)", c:"#7a2020" },
    blue:    { bg:"rgba(28,61,88,0.14)",  c:"#1c3d58" },
    violet:  { bg:"rgba(88,58,139,0.14)", c:"#4c3075" },
    muted:   { bg:"rgba(15,47,56,0.06)",  c:"#51616d" },
  };
  const t = tones[tone] || tones.neutral;
  return <span style={{
    display:"inline-flex", alignItems:"center", gap:5,
    background: t.bg, color: t.c,
    padding: "3px 9px", borderRadius: 999,
    fontSize: 11, fontWeight: 700, letterSpacing: ".04em",
  }}>
    {icon && <Icon name={icon} size={11} stroke={t.c}/>}
    {children}
  </span>;
}

function Card({ children, style }) {
  return <div style={{
    background:"rgba(255,255,255,0.86)",
    border:"1px solid var(--line)",
    borderRadius: 16, padding: 18,
    boxShadow: "0 2px 0 rgba(19,33,47,0.02)",
    ...(style||{})
  }}>{children}</div>;
}

function StatCard({ label, value, delta, sub, icon }) {
  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, letterSpacing:".12em", textTransform:"uppercase" }}>{label}</div>
        {icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(211,109,63,0.10)", color: "#b44a1e",
            display:"grid", placeItems:"center",
          }}><Icon name={icon} size={15}/></div>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginTop: 10 }}>
        <div style={{ fontFamily:'"Iowan Old Style",serif', fontSize: 34, color:"var(--foreground)", letterSpacing:"-0.02em" }}>{value}</div>
        {delta && <span style={{ fontSize: 12, fontWeight:700, color: delta.startsWith("-") ? "#7a2020" : "#155a52" }}>{delta}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color:"var(--muted)", marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

Object.assign(window, { Sidebar, Topbar, PrimaryBtn, GhostBtn, AccentBtn, Pill, Card, StatCard, MODULES, iconBtn, Icon });
