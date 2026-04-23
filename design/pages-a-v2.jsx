// Overview, Tenants, Users modules
const OverviewPage = () => (
  <div style={{ padding: 28, display:"flex", flexDirection:"column", gap: 22, overflow:"auto" }}>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 14 }}>
      <StatCard icon="tenants" label="Tenants ativos" value="12" delta="+2" sub="este mês"/>
      <StatCard icon="users" label="Usuários" value="148" delta="+14" sub="7 pendentes de convite"/>
      <StatCard icon="entities" label="Entidades" value="36" sub="distribuídas entre os tenants"/>
      <StatCard icon="records" label="Registros hoje" value="1.284" delta="+8%" sub="vs. ontem"/>
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap: 14 }}>
      <Card style={{ padding: 0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 18px", borderBottom:"1px solid var(--line)" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, display:"flex", alignItems:"center", gap:8 }}><Icon name="lightning" size={16} stroke="#b44a1e"/>Atividade por módulo</div>
            <div style={{ fontSize: 12, color:"var(--muted)", marginTop: 2 }}>Últimos 14 dias · todos os tenants</div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {["14d","30d","90d"].map((t,i) => (
              <button key={t} style={{
                border:"1px solid var(--line)", borderRadius:8,
                background: i===0 ? "#13212f":"rgba(255,255,255,0.8)",
                color: i===0 ? "#fff":"var(--foreground)",
                padding:"4px 10px", fontSize:12, fontWeight:600, cursor:"pointer"
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <Chart/>
        </div>
      </Card>

      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600, display:"flex", alignItems:"center", gap:8 }}><Icon name="tenants" size={16} stroke="#b44a1e"/>Tenants em foco</div>
          <button style={{ border:0, background:"none", color:"var(--muted)", fontSize: 12, cursor:"pointer" }}>Ver todos →</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
          {[
            { n:"Acme Operações", s:"acme-operacoes", p:"ENTERPRISE", u: 42 },
            { n:"Norte Logística", s:"norte-log", p:"PRO", u: 18 },
            { n:"Atelier Vega",   s:"atelier-vega",  p:"FREE", u: 6 },
            { n:"Porto Mídia",    s:"porto-midia",   p:"PRO", u: 22 },
          ].map(t => (
            <div key={t.s} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"10px 12px", borderRadius: 12,
              background:"rgba(255,255,255,0.7)", border:"1px solid var(--line)"
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background:"#13212f", color:"#f6c79a", display:"grid", placeItems:"center", fontFamily:'"Iowan Old Style",serif' }}>{t.n[0]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.n}</div>
                <div style={{ fontSize: 11, color:"var(--muted)", fontFamily:"ui-monospace,monospace" }}>{t.s}</div>
              </div>
              <Pill tone={t.p==="ENTERPRISE"?"amber":t.p==="PRO"?"blue":"muted"}>{t.p}</Pill>
              <div style={{ fontSize: 12, color:"var(--muted)", width: 50, textAlign:"right" }}>{t.u} users</div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 14 }}>
      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display:"flex", alignItems:"center", gap:8 }}><Icon name="bell" size={16} stroke="#b44a1e"/>Eventos recentes</div>
        <div style={{ display:"flex", flexDirection:"column" }}>
          {[
            { t:"Entidade criada", d:"lead · Acme Operações", who:"Mariana L.", when:"há 4 min", tone:"green" },
            { t:"Política atualizada", d:"MANAGER · opportunity:write", who:"Gabriela C.", when:"há 22 min", tone:"blue" },
            { t:"Novo tenant provisionado", d:"porto-midia · PRO", who:"Sistema", when:"há 1h", tone:"amber" },
            { t:"Registro removido", d:"contact#c2c1 · Norte Log", who:"Rafael P.", when:"há 2h", tone:"red" },
            { t:"Convite aceito", d:"diego@porto.com", who:"Diego M.", when:"ontem", tone:"muted" },
          ].map((e,i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap: 12,
              padding: "12px 4px", borderBottom: i===4?"none":"1px solid var(--line)"
            }}>
              <Pill tone={e.tone}>{e.t}</Pill>
              <div style={{ flex:1, fontSize: 13 }}>{e.d}</div>
              <div style={{ fontSize: 12, color:"var(--muted)" }}>{e.who} · {e.when}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display:"flex", alignItems:"center", gap:8 }}><Icon name="sparkle" size={16} stroke="#b44a1e"/>Próximos passos</div>
        <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
          {[
            { t:"Editar políticas por role", d:"Role MANAGER ainda herda escopo global", cta:"Abrir permissões" },
            { t:"Concluir builder de entidade", d:"opportunity: 3 campos sem label", cta:"Revisar schema" },
            { t:"Busca global de usuários", d:"auth-service expõe /users/search", cta:"Ativar integração" },
          ].map((s,i) => (
            <div key={i} style={{
              display:"flex", gap: 12, padding: 12,
              borderRadius: 12, background:"rgba(211,109,63,0.06)",
              border:"1px solid rgba(211,109,63,0.18)"
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background:"#d36d3f", color:"#fff", display:"grid", placeItems:"center", fontWeight:700, fontSize: 13 }}>{i+1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.t}</div>
                <div style={{ fontSize: 12, color:"var(--muted)", marginTop: 2 }}>{s.d}</div>
              </div>
              <button style={{ alignSelf:"center", border:0, background:"none", color:"#b44a1e", fontSize: 12, fontWeight: 600, cursor:"pointer" }}>{s.cta} →</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

function Chart() {
  // synthetic multi-line chart
  const W = 720, H = 200, P = 24;
  const entities = [30,44,38,52,49,61,58,70,66,78,72,84,88,96];
  const users    = [52,55,58,57,60,62,61,64,66,68,70,71,73,75];
  const recs     = [22,28,26,34,40,38,46,52,50,60,66,64,72,80];
  const max = 100;
  const toPath = (arr) => arr.map((v,i) => {
    const x = P + (i/(arr.length-1))*(W-P*2);
    const y = H - P - (v/max)*(H-P*2);
    return `${i===0?"M":"L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H+30}`} style={{ width:"100%", height: 220 }}>
      {[0,25,50,75,100].map((g,i) => (
        <line key={i} x1={P} x2={W-P} y1={H-P-(g/max)*(H-P*2)} y2={H-P-(g/max)*(H-P*2)} stroke="rgba(19,33,47,0.06)" strokeDasharray="2 4"/>
      ))}
      <path d={toPath(entities)} fill="none" stroke="#13212f" strokeWidth="2"/>
      <path d={toPath(users)} fill="none" stroke="#d36d3f" strokeWidth="2"/>
      <path d={toPath(recs)} fill="none" stroke="#1f4d47" strokeWidth="2" strokeDasharray="3 3"/>
      {["S","T","Q","Q","S","S","D","S","T","Q","Q","S","S","D"].map((d,i) => {
        const x = P + (i/(14-1))*(W-P*2);
        return <text key={i} x={x} y={H+12} textAnchor="middle" fontSize="10" fill="#51616d">{d}</text>;
      })}
      <g transform={`translate(${P},${H+24})`}>
        {[["Entidades","#13212f"],["Usuários","#d36d3f"],["Registros","#1f4d47"]].map(([l,c],i) => (
          <g key={l} transform={`translate(${i*110},0)`}>
            <rect width="10" height="2" y="4" fill={c}/>
            <text x="16" y="8" fontSize="11" fill="#51616d">{l}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// -----------------  TENANTS ---------------------
const TENANTS = [
  { n:"Acme Operações", s:"acme-operacoes", p:"ENTERPRISE", st:"ACTIVE", u: 42, e: 9, dt:"12/02/2026" },
  { n:"Norte Logística", s:"norte-log", p:"PRO", st:"ACTIVE", u: 18, e: 5, dt:"03/03/2026" },
  { n:"Atelier Vega",   s:"atelier-vega",  p:"FREE", st:"TRIAL", u: 6, e: 2, dt:"18/03/2026" },
  { n:"Porto Mídia",    s:"porto-midia",   p:"PRO", st:"ACTIVE", u: 22, e: 6, dt:"09/04/2026" },
  { n:"Solar Energia", s:"solar-energia", p:"ENTERPRISE", st:"ACTIVE", u: 38, e: 8, dt:"15/01/2026" },
  { n:"Lumen Saúde", s:"lumen-saude", p:"PRO", st:"PAUSED", u: 12, e: 4, dt:"22/11/2025" },
];

const TenantsPage = () => (
  <div style={{ padding: 28, display:"flex", flexDirection:"column", gap: 18, overflow:"auto" }}>
    <div style={{ display:"flex", alignItems:"center", gap: 10, flexWrap:"wrap" }}>
      <FilterChip icon="filter" label="Todos" count={TENANTS.length} active/>
      <FilterChip icon="check" label="Ativos" count={4}/>
      <FilterChip icon="sparkle" label="Trial" count={1}/>
      <FilterChip icon="minus" label="Pausados" count={1}/>
      <div style={{ flex: 1 }}/>
      <SearchInput placeholder="Buscar por nome ou slug"/>
      <GhostBtn icon="download">Exportar CSV</GhostBtn>
      <GhostBtn icon="filter">Filtros</GhostBtn>
      <PrimaryBtn icon="plus">Novo tenant</PrimaryBtn>
    </div>

    <Card style={{ padding: 0, overflow:"hidden" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background:"rgba(19,33,47,0.03)", textAlign:"left" }}>
            {["", "Tenant","Slug","Plano","Status","Usuários","Entidades","Criado","Ações"].map((h,i) => (
              <th key={i} style={{ padding:"12px 14px", fontSize: 11, fontWeight: 700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--muted)", borderBottom:"1px solid var(--line)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TENANTS.map((t,i) => (
            <tr key={t.s} style={{ borderBottom: i===TENANTS.length-1?"none":"1px solid var(--line)" }}>
              <td style={{ padding:"14px 14px", width: 28 }}><input type="checkbox"/></td>
              <td style={{ padding:"14px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                  <div style={{ width:32, height:32, borderRadius: 8, background: ["#13212f","#24455f","#d36d3f","#1f4d47","#5a4282","#8a2f2f"][i%6], color:"#fff", display:"grid", placeItems:"center", fontFamily:'"Iowan Old Style",serif', fontSize:14 }}>{t.n[0]}</div>
                  <div style={{ fontWeight: 600 }}>{t.n}</div>
                </div>
              </td>
              <td style={{ padding:"14px 14px", fontFamily:"ui-monospace,monospace", color:"var(--muted)", fontSize: 12 }}>{t.s}</td>
              <td style={{ padding:"14px 14px" }}><Pill tone={t.p==="ENTERPRISE"?"amber":t.p==="PRO"?"blue":"muted"}>{t.p}</Pill></td>
              <td style={{ padding:"14px 14px" }}><Pill tone={t.st==="ACTIVE"?"green":t.st==="TRIAL"?"amber":"red"}>{t.st}</Pill></td>
              <td style={{ padding:"14px 14px" }}>{t.u}</td>
              <td style={{ padding:"14px 14px" }}>{t.e}</td>
              <td style={{ padding:"14px 14px", color:"var(--muted)" }}>{t.dt}</td>
              <td style={{ padding:"14px 14px" }}>
                <button style={{ border:0, background:"none", cursor:"pointer", color:"var(--muted)", fontSize: 16 }}>⋯</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

function FilterChip({ label, count, active, icon }) {
  return (
    <button style={{
      display:"inline-flex", alignItems:"center", gap: 8,
      padding: "7px 12px", borderRadius: 999,
      border: active ? "1px solid #0d1b26" : "1px solid var(--line)",
      background: active ? "#0d1b26" : "rgba(255,255,255,0.9)",
      color: active ? "#fff" : "var(--foreground)",
      fontSize: 12, fontWeight: 600, cursor:"pointer"
    }}>
      {icon && <Icon name={icon} size={13} stroke={active?"#f6c79a":"var(--muted)"}/>}
      <span>{label}</span>
      <span style={{
        background: active ? "rgba(255,255,255,0.2)" : "rgba(19,33,47,0.06)",
        color: active ? "#fff" : "var(--muted)",
        padding:"1px 6px", borderRadius: 999, fontSize: 11
      }}>{count}</span>
    </button>
  );
}
function SearchInput({ placeholder }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap: 8,
      background:"rgba(255,255,255,0.88)",
      border:"1px solid var(--line)", borderRadius: 10,
      padding:"8px 12px", width: 280
    }}>
      <Icon name="search" size={15} stroke="var(--muted)"/>
      <input placeholder={placeholder} style={{ border:0, outline:"none", background:"transparent", flex:1, fontSize: 13 }}/>
    </div>
  );
}

// -----------------  USERS ---------------------
const USERS = [
  { name:"Mariana Lopes", email:"mariana@acme.com", role:"TENANT_ADMIN", tenant:"Acme Operações", status:"Ativo", last:"há 2 min" },
  { name:"Diego Martins", email:"diego@porto.com", role:"MANAGER", tenant:"Porto Mídia", status:"Ativo", last:"há 1h" },
  { name:"Rafael Prado", email:"rafael@norte.com", role:"OPERATOR", tenant:"Norte Logística", status:"Ativo", last:"ontem" },
  { name:"Júlia Andrade", email:"julia@atelier.com", role:"VIEWER", tenant:"Atelier Vega", status:"Convite", last:"—" },
  { name:"Bruno Sá", email:"bruno@solar.com", role:"MANAGER", tenant:"Solar Energia", status:"Ativo", last:"há 15 min" },
  { name:"Camila Rocha", email:"camila@lumen.com", role:"OPERATOR", tenant:"Lumen Saúde", status:"Suspenso", last:"14 dias" },
  { name:"Felipe Nunes", email:"felipe@acme.com", role:"VIEWER", tenant:"Acme Operações", status:"Ativo", last:"há 3h" },
];

const UsersPage = () => (
  <div style={{ padding: 28, display:"flex", flexDirection:"column", gap: 18, overflow:"auto" }}>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 14 }}>
      <StatCard icon="users" label="Total" value="148"/>
      <StatCard icon="check" label="Ativos" value="132" sub="89% da base"/>
      <StatCard icon="bell" label="Convites" value="11" delta="+3" sub="pendentes há >3d"/>
      <StatCard icon="x" label="Suspensos" value="5"/>
    </div>

    <div style={{ display:"flex", alignItems:"center", gap: 10, flexWrap:"wrap" }}>
      <FilterChip icon="users" label="Todos" count={148} active/>
      <FilterChip icon="shield" label="Admins" count={9}/>
      <FilterChip icon="sparkle" label="Managers" count={24}/>
      <FilterChip icon="lightning" label="Operators" count={78}/>
      <FilterChip icon="table" label="Viewers" count={37}/>
      <div style={{ flex: 1 }}/>
      <SearchInput placeholder="Nome, email ou tenant"/>
      <GhostBtn icon="import">Importar</GhostBtn>
      <AccentBtn icon="plus">Convidar usuário</AccentBtn>
    </div>

    <Card style={{ padding: 0 }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background:"rgba(19,33,47,0.03)", textAlign:"left" }}>
            {["Usuário","Email","Role","Tenant","Status","Último acesso",""].map((h,i) => (
              <th key={i} style={{ padding:"12px 14px", fontSize: 11, fontWeight: 700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--muted)", borderBottom:"1px solid var(--line)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {USERS.map((u,i) => {
            const initials = u.name.split(" ").map(p=>p[0]).slice(0,2).join("");
            return (
              <tr key={u.email} style={{ borderBottom: i===USERS.length-1?"none":"1px solid var(--line)" }}>
                <td style={{ padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background:"#e7dac8", color:"#13212f", display:"grid", placeItems:"center", fontWeight:700, fontSize: 12 }}>{initials}</div>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                  </div>
                </td>
                <td style={{ padding:"12px 14px", color:"var(--muted)", fontSize: 12 }}>{u.email}</td>
                <td style={{ padding:"12px 14px" }}><Pill tone={u.role==="TENANT_ADMIN"?"amber":u.role==="MANAGER"?"blue":u.role==="VIEWER"?"muted":"green"}>{u.role}</Pill></td>
                <td style={{ padding:"12px 14px" }}>{u.tenant}</td>
                <td style={{ padding:"12px 14px" }}><Pill tone={u.status==="Ativo"?"green":u.status==="Convite"?"amber":"red"}>{u.status}</Pill></td>
                <td style={{ padding:"12px 14px", color:"var(--muted)" }}>{u.last}</td>
                <td style={{ padding:"12px 14px", textAlign:"right" }}>
                  <button style={{ border:"1px solid var(--line)", background:"rgba(255,255,255,0.8)", borderRadius: 8, padding:"5px 10px", fontSize: 12, cursor:"pointer" }}>Abrir</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  </div>
);

Object.assign(window, { OverviewPage, TenantsPage, UsersPage });
