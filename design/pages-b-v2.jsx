// Permissions, Entities (schema builder), Records modules

const ROLES = [
  { n:"TENANT_ADMIN", c:"Acesso total ao tenant", users: 3, policies: 42, tone:"amber", system: true },
  { n:"MANAGER", c:"Gestão de pipeline e equipe", users: 8, policies: 28, tone:"blue", system: true },
  { n:"OPERATOR", c:"Operação do dia-a-dia", users: 24, policies: 14, tone:"green", system: true },
  { n:"VIEWER", c:"Somente leitura", users: 7, policies: 6, tone:"muted", system: true },
  { n:"FINANCE", c:"Custom · acesso a billing e faturas", users: 2, policies: 9, tone:"violet", system: false },
];

const ENTITIES = ["lead","contact","opportunity","task","invoice","account"];
const ACTIONS = ["read","write","delete","export"];

const PermissionsPage = () => {
  const [activeRole, setActiveRole] = useState("MANAGER");
  return (
    <div style={{ padding: 28, display:"grid", gridTemplateColumns: "320px 1fr", gap: 18, overflow:"auto", height:"100%" }}>
      <Card style={{ padding: 0 }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontWeight: 600 }}>Roles</div>
          <button style={{ border:0, background:"none", color:"#b44a1e", fontSize: 13, fontWeight: 600, cursor:"pointer" }}>+ Nova role</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", padding: 8 }}>
          {ROLES.map(r => {
            const active = r.n === activeRole;
            return (
              <button key={r.n} onClick={() => setActiveRole(r.n)} style={{
                display:"flex", alignItems:"center", gap: 12,
                padding: "12px 12px", border: 0, borderRadius: 10, cursor:"pointer",
                background: active ? "rgba(19,33,47,0.06)" : "transparent",
                textAlign: "left"
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background:"rgba(211,109,63,0.1)", color:"#b44a1e", display:"grid", placeItems:"center", fontSize: 13, fontWeight: 700 }}>{r.n[0]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.n}</div>
                    {!r.system && <Pill tone="violet">CUSTOM</Pill>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{r.c}</div>
                </div>
                <div style={{ textAlign:"right", fontSize: 11, color:"var(--muted)" }}>
                  <div>{r.users} users</div>
                  <div>{r.policies} policies</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div style={{ display:"flex", flexDirection:"column", gap: 14 }}>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:20 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                <h2 style={{ fontFamily:'"Iowan Old Style",serif', fontSize: 24, margin: 0 }}>{activeRole}</h2>
                <Pill tone="blue">Sistema</Pill>
              </div>
              <div style={{ fontSize: 13, color:"var(--muted)", marginTop: 6 }}>
                Políticas aplicadas a 8 usuários • herda de <b style={{ color:"var(--foreground)" }}>TENANT_ADMIN</b>
              </div>
            </div>
            <div style={{ display:"flex", gap: 8 }}>
              <GhostBtn icon="download">Duplicar role</GhostBtn>
              <PrimaryBtn icon="check">Salvar mudanças</PrimaryBtn>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 0 }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Matriz de políticas</div>
              <div style={{ fontSize: 12, color:"var(--muted)", marginTop: 2 }}>Clique em qualquer célula para alternar efeito (allow / deny / inherit)</div>
            </div>
            <div style={{ display:"flex", gap: 6, fontSize: 11, color:"var(--muted)" }}>
              <LegendDot c="#1f4d47" l="Allow"/>
              <LegendDot c="#8a2f2f" l="Deny"/>
              <LegendDot c="rgba(19,33,47,0.15)" l="Inherit"/>
            </div>
          </div>
          <div style={{ padding: 18, overflow:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%" }}>
              <thead>
                <tr>
                  <th style={{ textAlign:"left", padding:"8px 10px", fontSize: 11, color:"var(--muted)", fontWeight: 700, textTransform:"uppercase", letterSpacing:".1em" }}>Entidade</th>
                  {ACTIONS.map(a => <th key={a} style={{ padding:"8px 10px", fontSize: 11, color:"var(--muted)", fontWeight: 700, textTransform:"uppercase", letterSpacing:".1em" }}>{a}</th>)}
                  <th style={{ textAlign:"left", padding:"8px 10px", fontSize: 11, color:"var(--muted)", fontWeight: 700, textTransform:"uppercase", letterSpacing:".1em" }}>Scope</th>
                  <th style={{ padding:"8px 10px", fontSize: 11, color:"var(--muted)", fontWeight: 700, textTransform:"uppercase", letterSpacing:".1em" }}>Prioridade</th>
                </tr>
              </thead>
              <tbody>
                {ENTITIES.map((e,i) => (
                  <tr key={e} style={{ borderTop: i===0?"none":"1px solid var(--line)" }}>
                    <td style={{ padding:"12px 10px", fontWeight: 600, fontFamily:"ui-monospace,monospace", fontSize: 13 }}>{e}</td>
                    {ACTIONS.map((a,j) => {
                      const states = ["allow","inherit","allow","deny","allow","deny"];
                      const s = states[(i+j)%6];
                      const colors = { allow:"#1f4d47", deny:"#8a2f2f", inherit:"rgba(19,33,47,0.15)" };
                      return (
                        <td key={a} style={{ padding:"10px 10px", textAlign:"center" }}>
                          <div style={{
                            width: 30, height: 30, margin:"0 auto",
                            borderRadius: 8, display:"grid", placeItems:"center",
                            background: s==="inherit" ? "rgba(19,33,47,0.04)" : (s==="allow"?"rgba(31,77,71,0.14)":"rgba(138,47,47,0.14)"),
                            color: colors[s], cursor:"pointer", fontWeight:700, fontSize: 13
                          }}>{s==="allow"?"✓":s==="deny"?"✕":"–"}</div>
                        </td>
                      );
                    })}
                    <td style={{ padding:"10px 10px" }}>
                      <select style={{ border:"1px solid var(--line)", borderRadius: 8, padding:"5px 8px", fontSize: 12, background:"rgba(255,255,255,0.8)" }}>
                        <option>Todos os registros</option>
                        <option>Criados por mim</option>
                        <option>Do meu time</option>
                      </select>
                    </td>
                    <td style={{ padding:"10px 10px", textAlign:"center", fontFamily:"ui-monospace,monospace", fontSize: 12 }}>{100 - i*5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

function LegendDot({ c, l }) {
  return <span style={{ display:"inline-flex", alignItems:"center", gap: 5 }}>
    <span style={{ width: 8, height: 8, borderRadius: 2, background: c }}/> {l}
  </span>;
}

// -----------------  ENTITIES ---------------------
const ENT_DEFS = [
  { n:"Lead", s:"lead", fields: 7, recs: 342, icon:"▲", upd:"há 2h" },
  { n:"Contato", s:"contact", fields: 11, recs: 1284, icon:"●", upd:"há 4h" },
  { n:"Oportunidade", s:"opportunity", fields: 14, recs: 186, icon:"◆", upd:"ontem" },
  { n:"Tarefa", s:"task", fields: 6, recs: 820, icon:"■", upd:"há 20 min" },
  { n:"Fatura", s:"invoice", fields: 9, recs: 412, icon:"▣", upd:"há 1d" },
  { n:"Conta", s:"account", fields: 12, recs: 96, icon:"▼", upd:"há 3d" },
];

const FIELDS_SAMPLE = [
  { n:"name", label:"Nome", type:"STRING", req: true, val:"min:2, max:120" },
  { n:"email", label:"Email", type:"EMAIL", req: true, val:"—" },
  { n:"phone", label:"Telefone", type:"PHONE", req: false, val:"—" },
  { n:"source", label:"Origem", type:"ENUM", req: true, val:"5 opções" },
  { n:"score", label:"Score", type:"NUMBER", req: false, val:"min:0, max:100" },
  { n:"qualified", label:"Qualificado", type:"BOOLEAN", req: false, val:"—" },
  { n:"created_at", label:"Criado em", type:"DATE", req: true, val:"auto" },
];

const EntitiesPage = () => (
  <div style={{ padding: 28, display:"grid", gridTemplateColumns:"320px 1fr", gap: 18, overflow:"auto", height:"100%" }}>
    <div style={{ display:"flex", flexDirection:"column", gap: 12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <SearchInput placeholder="Buscar entidade"/>
        <AccentBtn icon="plus" style={{ padding:"8px 12px", fontSize: 13 }}>Nova</AccentBtn>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap: 8 }}>
        {ENT_DEFS.map((e,i) => (
          <div key={e.s} style={{
            display:"flex", alignItems:"center", gap:12,
            padding: 14, borderRadius: 14,
            background: i===0 ? "#13212f" : "rgba(255,255,255,0.78)",
            color: i===0 ? "#fff" : "var(--foreground)",
            border:"1px solid var(--line)",
            cursor:"pointer"
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: i===0 ? "rgba(255,255,255,0.12)" : "rgba(211,109,63,0.1)",
              color: i===0 ? "#f6c79a" : "#d36d3f",
              display:"grid", placeItems:"center", fontSize: 16
            }}>{e.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{e.n}</div>
              <div style={{ fontSize: 11, color: i===0 ? "rgba(255,255,255,0.6)" : "var(--muted)", fontFamily:"ui-monospace,monospace", marginTop: 2 }}>{e.s} · {e.fields} campos</div>
            </div>
            <div style={{ textAlign:"right", fontSize: 11, color: i===0 ? "rgba(255,255,255,0.6)" : "var(--muted)" }}>
              <div>{e.recs}</div>
              <div style={{ marginTop: 2 }}>{e.upd}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display:"flex", flexDirection:"column", gap: 14 }}>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
              <div style={{ width: 38, height:38, borderRadius: 10, background:"rgba(211,109,63,0.12)", color:"#d36d3f", display:"grid", placeItems:"center", fontSize: 18 }}>▲</div>
              <div>
                <h2 style={{ fontFamily:'"Iowan Old Style",serif', fontSize: 26, margin:0 }}>Lead</h2>
                <div style={{ fontSize: 12, color:"var(--muted)", fontFamily:"ui-monospace,monospace", marginTop: 2 }}>acme-operacoes · slug: lead</div>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap: 8 }}>
            <GhostBtn icon="download">Duplicar</GhostBtn>
            <GhostBtn icon="download">Exportar schema</GhostBtn>
            <PrimaryBtn icon="check">Publicar alterações</PrimaryBtn>
          </div>
        </div>
        <div style={{ display:"flex", gap: 24, marginTop: 18 }}>
          <Stat v="7" l="Campos"/>
          <Stat v="342" l="Registros"/>
          <Stat v="3" l="Relações"/>
          <Stat v="v4" l="Versão schema"/>
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Schema builder</div>
            <div style={{ fontSize: 12, color:"var(--muted)", marginTop: 2 }}>Arraste para reordenar · clique em qualquer linha para editar</div>
          </div>
          <div style={{ display:"flex", gap: 8 }}>
            <GhostBtn icon="import">Importar JSON</GhostBtn>
            <AccentBtn icon="plus">Adicionar campo</AccentBtn>
          </div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background:"rgba(19,33,47,0.03)", textAlign:"left" }}>
              {["","Campo","Label","Tipo","Obrigatório","Validações",""].map((h,i) => (
                <th key={i} style={{ padding:"10px 14px", fontSize: 11, fontWeight: 700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--muted)", borderBottom:"1px solid var(--line)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIELDS_SAMPLE.map((f,i) => (
              <tr key={f.n} style={{ borderBottom: i===FIELDS_SAMPLE.length-1?"none":"1px solid var(--line)" }}>
                <td style={{ padding:"12px 14px", color:"var(--muted)", cursor:"grab", width: 20 }}>⋮⋮</td>
                <td style={{ padding:"12px 14px", fontFamily:"ui-monospace,monospace", fontSize: 12, fontWeight: 600 }}>{f.n}</td>
                <td style={{ padding:"12px 14px" }}>{f.label}</td>
                <td style={{ padding:"12px 14px" }}><Pill tone="blue">{f.type}</Pill></td>
                <td style={{ padding:"12px 14px" }}>{f.req ? <Pill tone="amber">Sim</Pill> : <span style={{ color:"var(--muted)" }}>Não</span>}</td>
                <td style={{ padding:"12px 14px", color:"var(--muted)", fontFamily:"ui-monospace,monospace", fontSize: 12 }}>{f.val}</td>
                <td style={{ padding:"12px 14px", textAlign:"right" }}>
                  <button style={{ ...iconBtn, width: 28, height: 28, fontSize: 12 }}>✎</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  </div>
);

function Stat({ v, l }) {
  return <div>
    <div style={{ fontFamily:'"Iowan Old Style",serif', fontSize: 22 }}>{v}</div>
    <div style={{ fontSize: 11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginTop: 2 }}>{l}</div>
  </div>;
}

// -----------------  RECORDS ---------------------
const LEADS = [
  { name:"Clara Monteiro", email:"clara@nova.com", source:"Website", score: 87, status:"Qualificado", owner:"Mariana L." },
  { name:"Pedro Amaral", email:"pedro@hq.com", source:"Indicação", score: 72, status:"Novo", owner:"Diego M." },
  { name:"Lívia Tavares", email:"livia@opus.com", source:"Evento", score: 94, status:"Qualificado", owner:"Mariana L." },
  { name:"Thiago Brito", email:"thiago@vlr.com", source:"Outbound", score: 38, status:"Descartado", owner:"Rafael P." },
  { name:"Sofia Reis", email:"sofia@bolt.com", source:"Website", score: 65, status:"Em contato", owner:"Bruno S." },
  { name:"Hugo Camargo", email:"hugo@delta.com", source:"Ads", score: 55, status:"Em contato", owner:"Diego M." },
  { name:"Renata Paes", email:"renata@ion.com", source:"Website", score: 81, status:"Qualificado", owner:"Bruno S." },
  { name:"Ícaro Dias", email:"icaro@zen.com", source:"Evento", score: 47, status:"Novo", owner:"Camila R." },
];

const RecordsPage = () => {
  const [view, setView] = useState("table");
  return (
    <div style={{ padding: 28, display:"flex", flexDirection:"column", gap: 18, overflow:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap: 10, flexWrap:"wrap" }}>
        <div style={{ display:"inline-flex", background:"rgba(255,255,255,0.8)", border:"1px solid var(--line)", borderRadius: 10, padding: 3 }}>
          {[["table","▤ Tabela"],["kanban","▥ Kanban"],["gallery","▦ Cards"]].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              border: 0, padding:"6px 12px", borderRadius: 7,
              background: view===v ? "#13212f" : "transparent",
              color: view===v ? "#fff" : "var(--foreground)",
              fontSize: 12, fontWeight: 600, cursor:"pointer"
            }}>{l}</button>
          ))}
        </div>
        <div style={{ height: 24, width: 1, background:"var(--line)" }}/>
        <FilterChip label="Todos" count={342} active/>
        <FilterChip label="Meus leads" count={58}/>
        <FilterChip label="Qualificados" count={94}/>
        <div style={{ flex: 1 }}/>
        <SearchInput placeholder="Buscar registros"/>
        <GhostBtn icon="group">Agrupar</GhostBtn>
        <GhostBtn icon="sort">Ordenar</GhostBtn>
        <AccentBtn icon="plus">Novo lead</AccentBtn>
      </div>

      {view === "table" && (
        <Card style={{ padding: 0 }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background:"rgba(19,33,47,0.03)", textAlign:"left" }}>
                {["Nome","Email","Origem","Score","Status","Responsável",""].map((h,i) => (
                  <th key={i} style={{ padding:"12px 14px", fontSize: 11, fontWeight: 700, letterSpacing:".1em", textTransform:"uppercase", color:"var(--muted)", borderBottom:"1px solid var(--line)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEADS.map((l,i) => (
                <tr key={l.email} style={{ borderBottom: i===LEADS.length-1?"none":"1px solid var(--line)" }}>
                  <td style={{ padding:"12px 14px", fontWeight: 600 }}>{l.name}</td>
                  <td style={{ padding:"12px 14px", color:"var(--muted)", fontSize: 12 }}>{l.email}</td>
                  <td style={{ padding:"12px 14px" }}>{l.source}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                      <div style={{ width: 60, height: 6, borderRadius: 999, background:"rgba(19,33,47,0.06)", overflow:"hidden" }}>
                        <div style={{ width: `${l.score}%`, height: "100%", background: l.score>70?"#1f4d47":l.score>50?"#d36d3f":"#8a2f2f" }}/>
                      </div>
                      <span style={{ fontFamily:"ui-monospace,monospace", fontSize: 12 }}>{l.score}</span>
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <Pill tone={l.status==="Qualificado"?"green":l.status==="Novo"?"amber":l.status==="Descartado"?"red":"blue"}>{l.status}</Pill>
                  </td>
                  <td style={{ padding:"12px 14px" }}>{l.owner}</td>
                  <td style={{ padding:"12px 14px", textAlign:"right" }}>
                    <button style={{ border:0, background:"none", cursor:"pointer", color:"var(--muted)", fontSize: 16 }}>⋯</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:"12px 18px", borderTop:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize: 12, color:"var(--muted)" }}>
            <span>Mostrando 1–8 de 342</span>
            <div style={{ display:"flex", gap: 6 }}>
              <button style={{ ...iconBtn, width: 28, height: 28, fontSize: 12 }}>‹</button>
              {[1,2,3,4].map(n => (
                <button key={n} style={{ width: 28, height: 28, borderRadius: 8, border: n===1?"1px solid #13212f":"1px solid var(--line)", background: n===1?"#13212f":"rgba(255,255,255,0.8)", color: n===1?"#fff":"var(--foreground)", fontSize: 12, cursor:"pointer" }}>{n}</button>
              ))}
              <button style={{ ...iconBtn, width: 28, height: 28, fontSize: 12 }}>›</button>
            </div>
          </div>
        </Card>
      )}

      {view === "kanban" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 12 }}>
          {[
            { t:"Novo", tone:"amber", count: 42, items: LEADS.filter(l => l.status==="Novo") },
            { t:"Em contato", tone:"blue", count: 28, items: LEADS.filter(l => l.status==="Em contato") },
            { t:"Qualificado", tone:"green", count: 94, items: LEADS.filter(l => l.status==="Qualificado") },
            { t:"Descartado", tone:"red", count: 18, items: LEADS.filter(l => l.status==="Descartado") },
          ].map(col => (
            <div key={col.t} style={{ background:"rgba(255,255,255,0.5)", border:"1px solid var(--line)", borderRadius: 14, padding: 12, display:"flex", flexDirection:"column", gap: 10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"2px 4px" }}>
                <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                  <Pill tone={col.tone}>{col.t}</Pill>
                  <span style={{ fontSize: 12, color:"var(--muted)" }}>{col.count}</span>
                </div>
                <button style={{ border:0, background:"none", cursor:"pointer", color:"var(--muted)" }}>+</button>
              </div>
              {col.items.map(l => (
                <div key={l.email} style={{ background:"rgba(255,255,255,0.95)", border:"1px solid var(--line)", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                  <div style={{ fontSize: 11, color:"var(--muted)", marginTop: 2 }}>{l.source} · {l.owner}</div>
                  <div style={{ display:"flex", alignItems:"center", gap: 6, marginTop: 10 }}>
                    <div style={{ width: 50, height: 4, borderRadius: 999, background:"rgba(19,33,47,0.06)", overflow:"hidden" }}>
                      <div style={{ width: `${l.score}%`, height:"100%", background: l.score>70?"#1f4d47":"#d36d3f" }}/>
                    </div>
                    <span style={{ fontSize: 10, fontFamily:"ui-monospace,monospace", color:"var(--muted)" }}>score {l.score}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {view === "gallery" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap: 14 }}>
          {LEADS.map(l => (
            <Card key={l.email}>
              <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background:"#e7dac8", color:"#13212f", display:"grid", placeItems:"center", fontWeight: 700 }}>{l.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                  <div style={{ fontSize: 11, color:"var(--muted)" }}>{l.email}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <Pill tone={l.status==="Qualificado"?"green":l.status==="Novo"?"amber":l.status==="Descartado"?"red":"blue"}>{l.status}</Pill>
                <span style={{ fontFamily:'"Iowan Old Style",serif', fontSize: 20 }}>{l.score}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { PermissionsPage, EntitiesPage, RecordsPage });
