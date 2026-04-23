"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Pill, FilterChip, SearchInput, AccentBtn, GhostBtn } from "@/components/ui/primitives";
import { useTenantContext } from "@/components/shell/tenant-context";
import type { EntityDefinitionResponse, EntityRecordResponse, EntityFieldDefinition, ApiResponse, PageResponse } from "@/lib/types";

const PAGE_SIZE = 20;

function getCellValue(data: Record<string, unknown>, field: EntityFieldDefinition): string {
  const val = data[field.name];
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Sim" : "Não";
  return String(val);
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

const DISPLAY_FIELDS_MAX = 5;

export default function RecordsPage() {
  const { activeTenant } = useTenantContext();

  const [entities, setEntities]         = useState<EntityDefinitionResponse[]>([]);
  const [activeEntity, setActiveEntity] = useState<EntityDefinitionResponse | null>(null);
  const [records, setRecords]           = useState<EntityRecordResponse[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(0);
  const [view, setView]                 = useState<"table" | "cards">("table");
  const [search, setSearch]             = useState("");
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [loadingRecords, setLoadingRecords]   = useState(false);

  // Load entity list when tenant changes
  useEffect(() => {
    if (!activeTenant) { setEntities([]); setActiveEntity(null); return; }
    setLoadingEntities(true);
    fetch(`/api/entities/definitions?tenantId=${activeTenant.id}`)
      .then((r) => r.json())
      .then((d: ApiResponse<EntityDefinitionResponse[]>) => {
        const list = d.data ?? [];
        setEntities(list);
        setActiveEntity(list[0] ?? null);
        setPage(0);
      })
      .catch(() => {})
      .finally(() => setLoadingEntities(false));
  }, [activeTenant]);

  // Load records when entity or page changes
  const loadRecords = useCallback(() => {
    if (!activeTenant || !activeEntity) { setRecords([]); setTotal(0); return; }
    setLoadingRecords(true);
    const params = new URLSearchParams({ tenantId: activeTenant.id, page: String(page), size: String(PAGE_SIZE) });
    fetch(`/api/entities/${activeEntity.slug}/records?${params}`)
      .then((r) => r.json())
      .then((d: ApiResponse<PageResponse<EntityRecordResponse>>) => {
        setRecords(d.data?.content ?? []);
        setTotal(d.data?.totalElements ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingRecords(false));
  }, [activeTenant, activeEntity, page]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  function selectEntity(e: EntityDefinitionResponse) {
    setActiveEntity(e);
    setPage(0);
    setSearch("");
  }

  const displayFields = activeEntity?.fields.slice(0, DISPLAY_FIELDS_MAX) ?? [];
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!activeTenant) {
    return (
      <div style={{ padding: 28 }}>
        <Card>
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>▦</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Selecione um tenant</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Os registros são isolados por tenant.</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
      {/* Entity tabs */}
      {loadingEntities ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Carregando entidades…</div>
      ) : entities.length === 0 ? (
        <Card>
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nenhuma entidade</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Crie uma entidade primeiro no módulo Entidades.</div>
          </div>
        </Card>
      ) : (
        <>
          {/* Entity selector + toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* View toggle */}
            <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.8)", border: "1px solid var(--line)", borderRadius: 10, padding: 3 }}>
              {(["table", "cards"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} style={{ border: 0, padding: "6px 12px", borderRadius: 7, background: view === v ? "#13212f" : "transparent", color: view === v ? "#fff" : "var(--foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {v === "table" ? "▤ Tabela" : "▦ Cards"}
                </button>
              ))}
            </div>
            <div style={{ height: 24, width: 1, background: "var(--line)" }} />

            {/* Entity chips */}
            {entities.map((e) => (
              <FilterChip key={e.id} label={e.displayName ?? e.name} active={activeEntity?.id === e.id} onClick={() => selectEntity(e)} />
            ))}

            <div style={{ flex: 1 }} />
            <SearchInput placeholder={`Buscar em ${activeEntity?.displayName ?? activeEntity?.name ?? "registros"}…`} value={search} onChange={setSearch} />
            <GhostBtn icon="sort">Ordenar</GhostBtn>
            <AccentBtn icon="plus">Novo registro</AccentBtn>
          </div>

          {/* Records */}
          {loadingRecords ? (
            <Card><div style={{ padding: 32, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>Carregando registros…</div></Card>
          ) : records.length === 0 ? (
            <Card>
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Sem registros</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Nenhum registro encontrado em <b>{activeEntity?.displayName ?? activeEntity?.name}</b>.</div>
                <AccentBtn icon="plus">Criar primeiro registro</AccentBtn>
              </div>
            </Card>
          ) : view === "table" ? (
            <Card style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(19,33,47,0.03)", textAlign: "left" }}>
                    {displayFields.map((f) => (
                      <th key={f.name} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>
                        {f.label ?? f.name}
                      </th>
                    ))}
                    <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>Criado</th>
                    <th style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }} />
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <tr key={rec.id} style={{ borderBottom: i === records.length - 1 ? "none" : "1px solid var(--line)" }}>
                      {displayFields.map((f) => (
                        <td key={f.name} style={{ padding: "12px 14px" }}>
                          {f.type === "BOOLEAN" ? (
                            <Pill tone={rec.data[f.name] ? "green" : "muted"}>{getCellValue(rec.data, f)}</Pill>
                          ) : f.type === "ENUM" ? (
                            <Pill tone="blue">{getCellValue(rec.data, f)}</Pill>
                          ) : (
                            <span style={{ color: rec.data[f.name] == null ? "var(--muted)" : "inherit" }}>
                              {getCellValue(rec.data, f)}
                            </span>
                          )}
                        </td>
                      ))}
                      <td style={{ padding: "12px 14px", color: "var(--muted)" }}>{formatRelative(rec.createdAt)}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <button style={{ border: 0, background: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}>⋯</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--muted)" }}>
                  <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "rgba(255,255,255,0.8)", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1 }}>‹</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(0, page - 2)).map((n) => (
                      <button key={n} onClick={() => setPage(n)} style={{ width: 28, height: 28, borderRadius: 8, border: n === page ? "1px solid #13212f" : "1px solid var(--line)", background: n === page ? "#13212f" : "rgba(255,255,255,0.8)", color: n === page ? "#fff" : "var(--foreground)", fontSize: 12, cursor: "pointer" }}>{n + 1}</button>
                    ))}
                    <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "rgba(255,255,255,0.8)", cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1 }}>›</button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
              {records.map((rec) => (
                <Card key={rec.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontFamily: "ui-monospace,monospace", color: "var(--muted)" }}>
                      {rec.id.slice(0, 8)}…
                    </div>
                    <button style={{ border: 0, background: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}>⋯</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {displayFields.map((f) => (
                      <div key={f.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{f.label ?? f.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: rec.data[f.name] == null ? "var(--muted)" : "inherit" }}>
                          {getCellValue(rec.data, f)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--muted)" }}>
                    {formatRelative(rec.createdAt)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
