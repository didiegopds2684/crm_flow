"use client";

import { StatCard, Card, Pill, Icon } from "@/components/ui/primitives";

const TENANTS_FOCUS = [
  { n: "Acme Operações",  s: "acme-operacoes", p: "ENTERPRISE", u: 42 },
  { n: "Norte Logística", s: "norte-log",       p: "PRO",        u: 18 },
  { n: "Atelier Vega",    s: "atelier-vega",    p: "FREE",       u: 6  },
  { n: "Porto Mídia",     s: "porto-midia",     p: "PRO",        u: 22 },
];

const EVENTS = [
  { t: "Entidade criada",          d: "lead · Acme Operações",       who: "Mariana L.", when: "há 4 min",  tone: "green"   },
  { t: "Política atualizada",      d: "MANAGER · opportunity:write", who: "Gabriela C.", when: "há 22 min", tone: "blue"    },
  { t: "Novo tenant provisionado", d: "porto-midia · PRO",           who: "Sistema",    when: "há 1h",     tone: "amber"   },
  { t: "Registro removido",        d: "contact#c2c1 · Norte Log",    who: "Rafael P.",  when: "há 2h",     tone: "red"     },
  { t: "Convite aceito",           d: "diego@porto.com",             who: "Diego M.",   when: "ontem",     tone: "muted"   },
] as const;

const NEXT_STEPS = [
  { t: "Editar políticas por role",    d: "Role MANAGER ainda herda escopo global",    cta: "Abrir permissões"   },
  { t: "Concluir builder de entidade", d: "opportunity: 3 campos sem label",           cta: "Revisar schema"     },
  { t: "Busca global de usuários",     d: "auth-service expõe /users/search",          cta: "Ativar integração"  },
];

function ActivityChart() {
  const W = 720, H = 200, P = 24;
  const entities = [30, 44, 38, 52, 49, 61, 58, 70, 66, 78, 72, 84, 88, 96];
  const users    = [52, 55, 58, 57, 60, 62, 61, 64, 66, 68, 70, 71, 73, 75];
  const recs     = [22, 28, 26, 34, 40, 38, 46, 52, 50, 60, 66, 64, 72, 80];
  const max = 100;

  const toPath = (arr: number[]) =>
    arr.map((v, i) => {
      const x = P + (i / (arr.length - 1)) * (W - P * 2);
      const y = H - P - (v / max) * (H - P * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

  const days = ["S", "T", "Q", "Q", "S", "S", "D", "S", "T", "Q", "Q", "S", "S", "D"];

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%", height: 220 }}>
      {[0, 25, 50, 75, 100].map((g) => (
        <line
          key={g}
          x1={P} x2={W - P}
          y1={H - P - (g / max) * (H - P * 2)}
          y2={H - P - (g / max) * (H - P * 2)}
          stroke="rgba(19,33,47,0.06)" strokeDasharray="2 4"
        />
      ))}
      <path d={toPath(entities)} fill="none" stroke="#13212f" strokeWidth="2" />
      <path d={toPath(users)}    fill="none" stroke="#d36d3f" strokeWidth="2" />
      <path d={toPath(recs)}     fill="none" stroke="#1f4d47" strokeWidth="2" strokeDasharray="3 3" />
      {days.map((d, i) => (
        <text
          key={i}
          x={P + (i / (14 - 1)) * (W - P * 2)}
          y={H + 12}
          textAnchor="middle" fontSize="10" fill="#51616d"
        >{d}</text>
      ))}
      <g transform={`translate(${P},${H + 24})`}>
        {([["Entidades", "#13212f"], ["Usuários", "#d36d3f"], ["Registros", "#1f4d47"]] as const).map(([l, c], i) => (
          <g key={l} transform={`translate(${i * 110},0)`}>
            <rect width="10" height="2" y="4" fill={c} />
            <text x="16" y="8" fontSize="11" fill="#51616d">{l}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function OverviewPage() {
  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22, overflow: "auto" }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard icon="tenants" label="Tenants ativos"  value="12"    delta="+2"  sub="este mês" />
        <StatCard icon="users"   label="Usuários"        value="148"   delta="+14" sub="7 pendentes de convite" />
        <StatCard icon="entities" label="Entidades"      value="36"    sub="distribuídas entre os tenants" />
        <StatCard icon="records" label="Registros hoje"  value="1.284" delta="+8%" sub="vs. ontem" />
      </div>

      {/* Chart + Tenants focus */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <Card style={{ padding: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}><Icon name="lightning" size={16} stroke="#b44a1e" />Atividade por módulo</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Últimos 14 dias · todos os tenants</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["14d", "30d", "90d"].map((t, i) => (
                <button
                  key={t}
                  style={{
                    border: "1px solid var(--line)", borderRadius: 8,
                    background: i === 0 ? "#13212f" : "rgba(255,255,255,0.8)",
                    color: i === 0 ? "#fff" : "var(--foreground)",
                    padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}
                >{t}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: 18 }}>
            <ActivityChart />
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}><Icon name="tenants" size={16} stroke="#b44a1e" />Tenants em foco</div>
            <button style={{ border: 0, background: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>Ver todos →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TENANTS_FOCUS.map((t) => (
              <div
                key={t.s}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 12,
                  background: "rgba(255,255,255,0.7)", border: "1px solid var(--line)",
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#13212f", color: "#f6c79a", display: "grid", placeItems: "center", fontFamily: '"Iowan Old Style",serif' }}>
                  {t.n[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.n}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "ui-monospace,monospace" }}>{t.s}</div>
                </div>
                <Pill tone={t.p === "ENTERPRISE" ? "amber" : t.p === "PRO" ? "blue" : "muted"}>{t.p}</Pill>
                <div style={{ fontSize: 12, color: "var(--muted)", width: 50, textAlign: "right" }}>{t.u} users</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Events + Next steps */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Icon name="bell" size={16} stroke="#b44a1e" />Eventos recentes</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {EVENTS.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 4px",
                  borderBottom: i === EVENTS.length - 1 ? "none" : "1px solid var(--line)",
                }}
              >
                <Pill tone={e.tone}>{e.t}</Pill>
                <div style={{ flex: 1, fontSize: 13 }}>{e.d}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>{e.who} · {e.when}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Icon name="sparkle" size={16} stroke="#b44a1e" />Próximos passos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {NEXT_STEPS.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex", gap: 12, padding: 12, borderRadius: 12,
                  background: "rgba(211,109,63,0.06)", border: "1px solid rgba(211,109,63,0.18)",
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#d36d3f", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.d}</div>
                </div>
                <button style={{ alignSelf: "center", border: 0, background: "none", color: "#b44a1e", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {s.cta} →
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
