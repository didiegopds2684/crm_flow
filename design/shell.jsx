// Shell: sidebar + topbar used by every module artboard
const { useState } = React;

const MODULES = [
  { id: "overview",   label: "Overview",     glyph: "◧", group: "Workspace" },
  { id: "tenants",    label: "Tenants",      glyph: "◈", group: "Workspace" },
  { id: "users",      label: "Usuários",     glyph: "◉", group: "Pessoas" },
  { id: "permissions",label: "Permissões",   glyph: "◇", group: "Pessoas" },
  { id: "entities",   label: "Entidades",    glyph: "▤", group: "Dados" },
  { id: "records",    label: "Registros",    glyph: "▦", group: "Dados" },
  { id: "automations",label: "Automações",   glyph: "◎", group: "Dados" },
  { id: "settings",   label: "Configurações",glyph: "◌", group: "Sistema" },
];

function Sidebar({ active, mode = "expanded", onSelect }) {
  const collapsed = mode === "collapsed";
  const width = collapsed ? 72 : 248;

  const groups = {};
  MODULES.forEach(m => {
    groups[m.group] = groups[m.group] || [];
    groups[m.group].push(m);
  });

  return (
    <aside style={{
      width, flexShrink: 0,
      background: "rgba(253,251,247,0.82)",
      borderRight: "1px solid var(--line)",
      display: "flex", flexDirection: "column",
      padding: collapsed ? "20px 10px" : "20px 16px",
      gap: 18,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? 0 : "4px 6px" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "linear-gradient(135deg,#13212f,#24455f)",
          color: "#fff", display: "grid", placeItems: "center",
          fontFamily: '"Iowan Old Style",serif', fontWeight: 700, fontSize: 17,
        }}>C</div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily:'"Iowan Old Style",serif', fontSize: 17, color: "var(--foreground)", lineHeight: 1 }}>CRM Flow</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, letterSpacing: ".08em", textTransform: "uppercase" }}>Operations</div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.85)",
          border: "1px solid var(--line)", borderRadius: 12,
          padding: "8px 10px", color: "var(--muted)", fontSize: 13,
        }}>
          <span style={{ fontSize: 13 }}>⌕</span>
          <span style={{ flex: 1 }}>Buscar…</span>
          <kbd style={{
            fontFamily:"ui-monospace,monospace", fontSize: 10,
            background:"rgba(19,33,47,0.06)", padding:"2px 6px", borderRadius:6
          }}>⌘K</kbd>
        </div>
      )}

      <nav style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "auto", flex: 1 }}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            {!collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: ".14em",
                textTransform: "uppercase", color: "var(--muted)",
                padding: "0 8px 6px"
              }}>{group}</div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap: 2 }}>
              {items.map(m => {
                const isActive = m.id === active;
                return (
                  <button key={m.id} onClick={() => onSelect && onSelect(m.id)}
                    style={{
                      display: "flex", alignItems:"center", gap: 12,
                      padding: collapsed ? "10px 0" : "9px 10px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      border: 0, cursor: "pointer", textAlign: "left",
                      borderRadius: 10,
                      background: isActive ? "rgba(19,33,47,0.92)" : "transparent",
                      color: isActive ? "#fff" : "var(--foreground)",
                      fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                      position: "relative",
                    }}>
                    <span style={{
                      width: 22, height: 22, display:"grid", placeItems:"center",
                      fontSize: 14,
                      color: isActive ? "#f6c79a" : "var(--muted)",
                    }}>{m.glyph}</span>
                    {!collapsed && <span>{m.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{
        borderTop: "1px solid var(--line)", paddingTop: 14,
        display:"flex", alignItems:"center", gap: 10,
        padding: collapsed ? "14px 0 0" : "14px 8px 0",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background:"#e7dac8", color:"#13212f", display:"grid",
          placeItems:"center", fontWeight: 700, fontSize: 13,
        }}>GC</div>
        {!collapsed && (
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Gabriela C.</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>Admin • faculdadeunimed</div>
          </div>
        )}
      </div>
    </aside>
  );
}

function Topbar({ title, subtitle, tenant, actions, breadcrumb }) {
  return (
    <header style={{
      display: "flex", alignItems:"center", justifyContent:"space-between",
      padding: "18px 28px", borderBottom: "1px solid var(--line)",
      background: "rgba(253,251,247,0.6)",
      gap: 20,
    }}>
      <div style={{ minWidth: 0 }}>
        {breadcrumb && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{breadcrumb}</div>
        )}
        <div style={{ display:"flex", alignItems:"baseline", gap: 14 }}>
          <h1 style={{
            fontFamily:'"Iowan Old Style",serif',
            fontSize: 28, margin: 0, color: "var(--foreground)",
            letterSpacing: "-0.01em",
          }}>{title}</h1>
          {subtitle && <span style={{ fontSize: 13, color:"var(--muted)" }}>{subtitle}</span>}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
        {tenant && (
          <button style={{
            border:"1px solid var(--line)", background:"rgba(255,255,255,0.8)",
            borderRadius: 10, padding: "8px 12px",
            display:"flex", alignItems:"center", gap:10, cursor:"pointer",
          }}>
            <div style={{
              width:22, height:22, borderRadius:6,
              background:"linear-gradient(135deg,#d36d3f,#b44a1e)",
              color:"#fff", fontSize: 11, fontWeight:700,
              display:"grid", placeItems:"center"
            }}>{tenant.slice(0,2).toUpperCase()}</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{tenant}</span>
            <span style={{ fontSize: 10, color:"var(--muted)" }}>▾</span>
          </button>
        )}
        <button style={iconBtn}>⎙</button>
        <button style={iconBtn}>◔</button>
        {actions}
      </div>
    </header>
  );
}

const iconBtn = {
  width: 36, height: 36, borderRadius: 10,
  border: "1px solid var(--line)", background: "rgba(255,255,255,0.8)",
  cursor:"pointer", color: "var(--foreground)", fontSize: 15,
};

function PrimaryBtn({ children, ...p }) {
  return <button {...p} style={{
    border:0, borderRadius: 10,
    background: "linear-gradient(135deg,#13212f,#24455f)",
    color:"#fff", padding: "9px 16px", fontWeight: 600, fontSize: 13,
    cursor:"pointer", boxShadow:"0 10px 24px rgba(19,33,47,0.18)",
    ...(p.style||{})
  }}>{children}</button>;
}
function GhostBtn({ children, ...p }) {
  return <button {...p} style={{
    border:"1px solid var(--line)", borderRadius: 10,
    background:"rgba(255,255,255,0.85)",
    color: "var(--foreground)", padding: "8px 14px", fontWeight: 600, fontSize: 13,
    cursor:"pointer",
    ...(p.style||{})
  }}>{children}</button>;
}
function AccentBtn({ children, ...p }) {
  return <button {...p} style={{
    border:0, borderRadius: 10,
    background:"#d36d3f",
    color:"#fff", padding: "9px 16px", fontWeight: 600, fontSize: 13,
    cursor:"pointer", boxShadow:"0 10px 24px rgba(211,109,63,0.28)",
    ...(p.style||{})
  }}>{children}</button>;
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg:"rgba(19,33,47,0.06)", c:"#13212f" },
    amber:   { bg:"rgba(211,109,63,0.12)", c:"#b44a1e" },
    green:   { bg:"rgba(31,77,71,0.12)",  c:"#1f4d47" },
    red:     { bg:"rgba(138,47,47,0.12)", c:"#8a2f2f" },
    blue:    { bg:"rgba(36,69,95,0.12)",  c:"#24455f" },
    violet:  { bg:"rgba(103,75,148,0.12)",c:"#5a4282" },
    muted:   { bg:"rgba(19,33,47,0.04)",  c:"#51616d" },
  };
  const t = tones[tone] || tones.neutral;
  return <span style={{
    display:"inline-flex", alignItems:"center", gap:6,
    background: t.bg, color: t.c,
    padding: "3px 9px", borderRadius: 999,
    fontSize: 11, fontWeight: 700, letterSpacing: ".04em",
  }}>{children}</span>;
}

function Card({ children, style }) {
  return <div style={{
    background:"rgba(255,255,255,0.78)",
    border:"1px solid var(--line)",
    borderRadius: 16, padding: 18,
    ...(style||{})
  }}>{children}</div>;
}

function StatCard({ label, value, delta, sub }) {
  return (
    <Card>
      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, letterSpacing:".12em", textTransform:"uppercase" }}>{label}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:10, marginTop: 10 }}>
        <div style={{ fontFamily:'"Iowan Old Style",serif', fontSize: 32, color:"var(--foreground)" }}>{value}</div>
        {delta && <span style={{ fontSize: 12, fontWeight:700, color: delta.startsWith("-") ? "#8a2f2f" : "#1f4d47" }}>{delta}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color:"var(--muted)", marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

Object.assign(window, { Sidebar, Topbar, PrimaryBtn, GhostBtn, AccentBtn, Pill, Card, StatCard, MODULES, iconBtn });
