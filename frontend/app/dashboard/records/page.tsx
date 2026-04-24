"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card, Pill, SearchInput, AccentBtn, GhostBtn,
  Toggle, Drawer, Field, Icon, inputStyle, inputErrorStyle,
} from "@/components/ui/primitives";
import { useTenantContext } from "@/components/shell/tenant-context";
import type {
  EntityDefinitionResponse, EntityRecordResponse,
  EntityFieldDefinition, ApiResponse, PageResponse,
} from "@/lib/types";

type RecordDisplay = { identity: string; highlights: string[] };

const PAGE_SIZE = 20;
const ENTITY_ICONS = ["▲", "●", "◆", "■", "▣", "▼", "◉", "◈"];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function getCellValue(data: Record<string, unknown>, field: EntityFieldDefinition): string {
  const val = data[field.name];
  if (val === null || val === undefined) return "—";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "boolean") return val ? "Sim" : "Não";
  return String(val);
}

// ─── Relation select (searchable dropdown) ───────────────────────────────────

function buildRecordDisplay(
  rec: EntityRecordResponse,
  entityDef: EntityDefinitionResponse | undefined
): RecordDisplay {
  if (entityDef) {
    const identityField  = entityDef.fields.find((f) => f.role === "IDENTITY");
    const highlightFields = entityDef.fields.filter((f) => f.role === "HIGHLIGHT");

    const identity =
      identityField && rec.data[identityField.name] != null && rec.data[identityField.name] !== ""
        ? String(rec.data[identityField.name])
        : null;

    const highlights = highlightFields
      .map((f) => rec.data[f.name])
      .filter((v) => v != null && v !== "")
      .map(String);

    if (identity) return { identity, highlights };
  }

  // Fallback: try common name keys then first string value
  const data = rec.data;
  for (const key of ["nome", "name", "title", "titulo", "label"]) {
    if (typeof data[key] === "string" && data[key]) {
      return { identity: data[key] as string, highlights: [] };
    }
  }
  const first = Object.values(data).find((v) => typeof v === "string" && v);
  return { identity: first ? (first as string) : rec.id.slice(0, 8) + "…", highlights: [] };
}

function RelationSelect({
  field,
  tenantId,
  allEntities,
  value,
  onChange,
  hasError,
}: {
  field: EntityFieldDefinition;
  tenantId: string;
  allEntities: EntityDefinitionResponse[];
  value: unknown;
  onChange: (v: unknown) => void;
  hasError?: boolean;
}) {
  const relatedSlug  = (field.validations?.entity as string | undefined) ?? "";
  const relatedEntityDef = allEntities.find((e) => e.slug === relatedSlug);

  const [records, setRecords] = useState<EntityRecordResponse[]>([]);
  const [search,  setSearch]  = useState("");
  const [isOpen,  setIsOpen]  = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!relatedSlug || !tenantId) return;
    setLoading(true);
    fetch(`/api/entities/${relatedSlug}/records?tenantId=${tenantId}&size=100`)
      .then((r) => r.json())
      .then((d: ApiResponse<PageResponse<EntityRecordResponse>>) => setRecords(d.data?.content ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [relatedSlug, tenantId]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 60);
  }, [isOpen]);

  const selected = records.find((r) => r.id === value);

  const filtered = search
    ? records.filter((r) => {
        const { identity, highlights } = buildRecordDisplay(r, relatedEntityDef);
        return [identity, ...highlights, r.id].join(" ").toLowerCase().includes(search.toLowerCase());
      })
    : records;

  function select(rec: EntityRecordResponse) {
    onChange(rec.id);
    setIsOpen(false);
    setSearch("");
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  const selectedDisplay = selected ? buildRecordDisplay(selected, relatedEntityDef) : null;

  const triggerStyle: React.CSSProperties = {
    ...inputStyle,
    ...(hasError ? inputErrorStyle : {}),
    display: "flex", alignItems: "center", gap: 8,
    cursor: "pointer", userSelect: "none",
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <div onClick={() => setIsOpen((o) => !o)} style={triggerStyle}>
        {selectedDisplay ? (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedDisplay.identity}
              </div>
              {selectedDisplay.highlights.length > 0 && (
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1, display: "flex", gap: 6 }}>
                  {selectedDisplay.highlights.map((h, i) => <span key={i}>{h}</span>)}
                </div>
              )}
            </div>
            <button type="button" onClick={clear}
              style={{ border: 0, background: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}>
              ×
            </button>
          </>
        ) : (
          <span style={{ flex: 1, color: "var(--muted)" }}>
            {loading ? "Carregando registros…" : "Selecione um registro…"}
          </span>
        )}
        <Icon name="chevron" size={14} stroke="var(--muted)"
          style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "rgba(253,251,247,0.99)", border: "1px solid var(--line)",
          borderRadius: 12, boxShadow: "0 8px 28px rgba(19,33,47,0.14)",
          overflow: "hidden",
        }}>
          {/* Search */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(19,33,47,0.05)", borderRadius: 8, padding: "7px 10px" }}>
              <Icon name="search" size={13} stroke="var(--muted)" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar registro…"
                style={{ border: 0, outline: "none", background: "transparent", flex: 1, fontSize: 13 }}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}
                  style={{ border: 0, background: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, padding: 0, lineHeight: 1 }}>
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Carregando…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
                {search ? "Nenhum resultado encontrado." : "Nenhum registro disponível."}
              </div>
            ) : (
              filtered.map((rec, i) => {
                const isSelected = rec.id === value;
                const { identity, highlights } = buildRecordDisplay(rec, relatedEntityDef);
                return (
                  <div
                    key={rec.id}
                    onClick={() => select(rec)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", cursor: "pointer",
                      background: isSelected ? "#13212f" : "transparent",
                      color: isSelected ? "#fff" : "var(--foreground)",
                      borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--line)",
                      transition: "background .12s",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(19,33,47,0.04)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Identity — bold, full size */}
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {identity}
                      </div>
                      {/* Highlights — smaller, muted */}
                      {highlights.length > 0 && (
                        <div style={{ fontSize: 11, color: isSelected ? "rgba(255,255,255,0.65)" : "var(--muted)", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {highlights.map((h, j) => <span key={j}>{h}</span>)}
                        </div>
                      )}
                    </div>
                    {isSelected && <Icon name="check" size={14} stroke="#f6c79a" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single field input ───────────────────────────────────────────────────────

function SingleInput({
  field,
  tenantId,
  allEntities,
  value,
  onChange,
  hasError,
}: {
  field: EntityFieldDefinition;
  tenantId: string;
  allEntities: EntityDefinitionResponse[];
  value: unknown;
  onChange: (v: unknown) => void;
  hasError?: boolean;
}) {
  const strVal = value == null ? "" : String(value);
  const errStyle = hasError ? inputErrorStyle : {};

  if (field.type === "BOOLEAN") {
    return (
      <Toggle
        checked={Boolean(value)}
        onChange={onChange}
        label={Boolean(value) ? "Sim" : "Não"}
      />
    );
  }

  if (field.type === "TEXT") {
    return (
      <textarea
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={`Digite ${field.label ?? field.name}…`}
        style={{ ...inputStyle, ...errStyle, resize: "vertical", minHeight: 72, lineHeight: 1.5 }}
      />
    );
  }

  if (field.type === "ENUM" && field.options?.length) {
    return (
      <select
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, ...errStyle, cursor: "pointer" }}
      >
        <option value="">Selecione…</option>
        {field.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }

  if (field.type === "RELATION") {
    return (
      <RelationSelect
        field={field}
        tenantId={tenantId}
        allEntities={allEntities}
        value={value}
        onChange={onChange}
        hasError={hasError}
      />
    );
  }

  const inputType =
    field.type === "EMAIL"  ? "email"  :
    field.type === "NUMBER" ? "number" :
    field.type === "DATE"   ? "date"   :
    field.type === "URL"    ? "url"    :
    field.type === "PHONE"  ? "tel"    : "text";

  return (
    <input
      type={inputType}
      value={strVal}
      onChange={(e) =>
        onChange(field.type === "NUMBER" && e.target.value !== "" ? Number(e.target.value) : e.target.value)
      }
      placeholder={`${field.label ?? field.name}…`}
      style={{ ...inputStyle, ...errStyle }}
    />
  );
}

// ─── Record field (handles multiple/repeater) ─────────────────────────────────

function RecordFieldInput({
  field,
  tenantId,
  allEntities,
  value,
  onChange,
  error,
}: {
  field: EntityFieldDefinition;
  tenantId: string;
  allEntities: EntityDefinitionResponse[];
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  if (!field.multiple) {
    return <SingleInput field={field} tenantId={tenantId} allEntities={allEntities} value={value} onChange={onChange} hasError={!!error} />;
  }

  const list: unknown[] = Array.isArray(value) ? value : (value != null ? [value] : [""]);

  function updateItem(i: number, v: unknown) {
    const next = [...list];
    next[i] = v;
    onChange(next);
  }

  function removeItem(i: number) {
    onChange(list.filter((_, j) => j !== i));
  }

  function addItem() {
    onChange([...list, field.type === "BOOLEAN" ? false : ""]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {list.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <SingleInput field={field} tenantId={tenantId} allEntities={allEntities} value={item} onChange={(v) => updateItem(i, v)} hasError={!!error} />
          </div>
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(i)}
              style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "rgba(255,255,255,0.9)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, color: "var(--muted)", fontSize: 16 }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        style={{ display: "flex", alignItems: "center", gap: 6, border: "1px dashed var(--line)", background: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "var(--muted)", cursor: "pointer", fontWeight: 600, width: "fit-content" }}
      >
        <Icon name="plus" size={12} stroke="var(--muted)" /> Adicionar valor
      </button>
    </div>
  );
}

// ─── New Record Drawer ────────────────────────────────────────────────────────

function NewRecordDrawer({
  open, tenantId, entity, allEntities, onClose, onCreated,
}: {
  open: boolean;
  tenantId: string;
  entity: EntityDefinitionResponse;
  allEntities: EntityDefinitionResponse[];
  onClose: () => void;
  onCreated: (rec: EntityRecordResponse) => void;
}) {
  const [formData,   setFormData]   = useState<Record<string, unknown>>({});
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [general,    setGeneral]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, unknown> = {};
    for (const f of entity.fields) {
      if (f.multiple)          initial[f.name] = [""];
      else if (f.type === "BOOLEAN") initial[f.name] = false;
      else                     initial[f.name] = "";
    }
    setFormData(initial);
    setErrors({}); setGeneral("");
  }, [open, entity]);

  function updateField(name: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const f of entity.fields) {
      if (!f.required) continue;
      const val = formData[f.name];
      if (f.type === "BOOLEAN") continue;
      if (f.multiple) {
        const list = Array.isArray(val) ? val : [];
        if (list.length === 0 || list.every((v) => v === "" || v == null)) {
          errs[f.name] = "Campo obrigatório — adicione pelo menos um valor.";
        }
      } else if (val === "" || val == null) {
        errs[f.name] = "Campo obrigatório.";
      }
    }
    return errs;
  }

  async function handleSubmit() {
    setGeneral("");
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({}); setSubmitting(true);

    const data: Record<string, unknown> = {};
    for (const f of entity.fields) {
      const val = formData[f.name];
      if (f.multiple) {
        const list = (Array.isArray(val) ? val : []).filter((v) => v !== "" && v != null);
        if (list.length > 0) data[f.name] = list;
      } else if (f.type === "BOOLEAN") {
        data[f.name] = Boolean(val);
      } else if (f.type === "NUMBER") {
        if (val !== "" && val != null) data[f.name] = Number(val);
      } else if (val !== "" && val != null) {
        data[f.name] = val;
      }
    }

    try {
      const res = await fetch(`/api/entities/${entity.slug}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, data }),
      });
      const resp: ApiResponse<EntityRecordResponse> = await res.json();
      if (!res.ok || !resp.data) {
        setGeneral((resp as { message?: string }).message ?? "Erro ao criar registro.");
        return;
      }
      onCreated(resp.data);
      onClose();
    } catch {
      setGeneral("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open} onClose={onClose} width={520}
      title="Novo registro"
      subtitle={`Criando em ${entity.displayName ?? entity.name}`}
      footer={
        <>
          <GhostBtn onClick={onClose} disabled={submitting}>Cancelar</GhostBtn>
          <AccentBtn icon="plus" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Criando…" : "Criar registro"}
          </AccentBtn>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {general && (
          <div style={{ background: "rgba(138,47,47,0.08)", border: "1px solid rgba(138,47,47,0.22)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#7a2020", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="x" size={15} stroke="#7a2020" /> {general}
          </div>
        )}

        {entity.fields.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: 13 }}>
            Esta entidade não possui campos definidos.
          </div>
        ) : (
          entity.fields.map((f) => (
            <Field
              key={f.name}
              label={f.label ?? f.name}
              required={f.required}
              error={errors[f.name]}
              hint={
                f.multiple
                  ? "Campo múltiplo — adicione um ou mais valores"
                  : f.type === "RELATION"
                  ? `Referência para outra entidade`
                  : undefined
              }
            >
              <RecordFieldInput
                field={f}
                tenantId={tenantId}
                allEntities={allEntities}
                value={formData[f.name]}
                onChange={(v) => updateField(f.name, v)}
                error={errors[f.name]}
              />
            </Field>
          ))
        )}
      </form>
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecordsPage() {
  const { activeTenant } = useTenantContext();

  const [entities,       setEntities]       = useState<EntityDefinitionResponse[]>([]);
  const [activeEntity,   setActiveEntity]   = useState<EntityDefinitionResponse | null>(null);
  const [records,        setRecords]        = useState<EntityRecordResponse[]>([]);
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(0);
  const [view,           setView]           = useState<"table" | "cards">("table");
  const [search,         setSearch]         = useState("");
  const [entitySearch,   setEntitySearch]   = useState("");
  const [newRecordOpen,  setNewRecordOpen]  = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [loadingRecords,  setLoadingRecords]  = useState(false);

  useEffect(() => {
    if (!activeTenant) { setEntities([]); setActiveEntity(null); return; }
    setLoadingEntities(true);
    fetch(`/api/entities/definitions?tenantId=${activeTenant.id}`)
      .then((r) => r.json())
      .then((d: ApiResponse<EntityDefinitionResponse[]>) => {
        const list = d.data ?? [];
        setEntities(list);
        setActiveEntity((prev) => list.find((e) => e.id === prev?.id) ?? list[0] ?? null);
        setPage(0);
      })
      .catch(() => {})
      .finally(() => setLoadingEntities(false));
  }, [activeTenant]);

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

  function handleRecordCreated(rec: EntityRecordResponse) {
    setRecords((prev) => [rec, ...prev]);
    setTotal((t) => t + 1);
  }

  const filteredEntities = entities.filter((e) =>
    !entitySearch ||
    e.name.toLowerCase().includes(entitySearch.toLowerCase()) ||
    e.slug.includes(entitySearch.toLowerCase())
  );

  const displayFields = activeEntity?.fields.slice(0, 5) ?? [];
  const totalPages    = Math.ceil(total / PAGE_SIZE);

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
    <>
      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, overflow: "auto", height: "100%" }}>

        {/* ── Entity sidebar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SearchInput placeholder="Buscar entidade" value={entitySearch} onChange={setEntitySearch} style={{ width: "100%" }} />

          {loadingEntities ? (
            <div style={{ padding: 24, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>Carregando…</div>
          ) : filteredEntities.length === 0 ? (
            <Card>
              <div style={{ padding: "28px 0", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {entitySearch ? "Nenhuma entidade corresponde." : "Nenhuma entidade criada ainda."}
                </div>
              </div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredEntities.map((e, i) => {
                const isActive = activeEntity?.id === e.id;
                return (
                  <div
                    key={e.id}
                    onClick={() => selectEntity(e)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, background: isActive ? "#13212f" : "rgba(255,255,255,0.78)", color: isActive ? "#fff" : "var(--foreground)", border: "1px solid var(--line)", cursor: "pointer", transition: "background .15s" }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: isActive ? "rgba(255,255,255,0.12)" : "rgba(211,109,63,0.1)", color: isActive ? "#f6c79a" : "#d36d3f", display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>
                      {e.icon ?? ENTITY_ICONS[i % ENTITY_ICONS.length]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{e.displayName ?? e.name}</div>
                      <div style={{ fontSize: 11, color: isActive ? "rgba(255,255,255,0.55)" : "var(--muted)", fontFamily: "ui-monospace,monospace", marginTop: 1 }}>
                        {e.slug} · {e.fields.length} campo{e.fields.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Records panel ── */}
        {activeEntity ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>

            {/* Header */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(211,109,63,0.12)", color: "#d36d3f", display: "grid", placeItems: "center", fontSize: 20 }}>
                    {activeEntity.icon ?? "▲"}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: '"Iowan Old Style",serif', fontSize: 24, margin: 0 }}>
                      {activeEntity.displayName ?? activeEntity.name}
                    </h2>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "ui-monospace,monospace", marginTop: 2 }}>
                      {activeTenant.slug} / {activeEntity.slug}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.8)", border: "1px solid var(--line)", borderRadius: 10, padding: 3 }}>
                    {(["table", "cards"] as const).map((v) => (
                      <button key={v} onClick={() => setView(v)} style={{ border: 0, padding: "6px 12px", borderRadius: 7, background: view === v ? "#13212f" : "transparent", color: view === v ? "#fff" : "var(--foreground)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        {v === "table" ? "▤ Tabela" : "▦ Cards"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 28, marginTop: 16 }}>
                {[
                  { v: total,                     l: "Registros"  },
                  { v: activeEntity.fields.length, l: "Campos"     },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <div style={{ fontFamily: '"Iowan Old Style",serif', fontSize: 20 }}>{v}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <SearchInput
                placeholder={`Buscar em ${activeEntity.displayName ?? activeEntity.name}…`}
                value={search}
                onChange={setSearch}
                style={{ flex: 1, width: "auto" }}
              />
              <AccentBtn icon="plus" onClick={() => setNewRecordOpen(true)}>
                Novo registro
              </AccentBtn>
            </div>

            {/* Records */}
            <Card style={{ padding: 0, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              {loadingRecords ? (
                <div style={{ padding: 40, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>Carregando registros…</div>
              ) : records.length === 0 ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 12 }}>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>Nenhum registro encontrado.</div>
                  <button
                    onClick={() => setNewRecordOpen(true)}
                    style={{ border: "1px dashed var(--line)", background: "none", borderRadius: 8, padding: "6px 18px", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}
                  >
                    + Criar primeiro registro
                  </button>
                </div>
              ) : view === "table" ? (
                <>
                  <div style={{ overflow: "auto", flex: 1 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "rgba(19,33,47,0.03)", textAlign: "left" }}>
                          {displayFields.map((f) => (
                            <th key={f.name} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>
                              {f.label ?? f.name}
                              {f.multiple && <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6 }}>[ ]</span>}
                            </th>
                          ))}
                          <th style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>Criado</th>
                          <th style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)", width: 40 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((rec, i) => (
                          <tr key={rec.id} style={{ borderBottom: i === records.length - 1 ? "none" : "1px solid var(--line)" }}>
                            {displayFields.map((f) => (
                              <td key={f.name} style={{ padding: "12px 16px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {f.type === "BOOLEAN" ? (
                                  <Pill tone={rec.data[f.name] ? "green" : "muted"}>{getCellValue(rec.data, f)}</Pill>
                                ) : f.type === "ENUM" ? (
                                  <Pill tone="blue">{getCellValue(rec.data, f)}</Pill>
                                ) : f.multiple && Array.isArray(rec.data[f.name]) ? (
                                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                    {(rec.data[f.name] as unknown[]).map((v, j) => (
                                      <Pill key={j} tone="neutral">{String(v)}</Pill>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ color: rec.data[f.name] == null ? "var(--muted)" : "inherit" }}>
                                    {getCellValue(rec.data, f)}
                                  </span>
                                )}
                              </td>
                            ))}
                            <td style={{ padding: "12px 16px", color: "var(--muted)", whiteSpace: "nowrap" }}>{formatRelative(rec.createdAt)}</td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <button style={{ border: 0, background: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, padding: "2px 6px" }}>⋯</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>
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
                </>
              ) : (
                <div style={{ overflow: "auto", padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
                    {records.map((rec) => (
                      <div key={rec.id} style={{ background: "rgba(255,255,255,0.88)", border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontFamily: "ui-monospace,monospace", color: "var(--muted)" }}>{rec.id.slice(0, 8)}…</div>
                          <button style={{ border: 0, background: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, padding: "0 4px" }}>⋯</button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {displayFields.map((f) => (
                            <div key={f.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", flexShrink: 0 }}>{f.label ?? f.name}</span>
                              {f.type === "BOOLEAN" ? (
                                <Pill tone={rec.data[f.name] ? "green" : "muted"}>{getCellValue(rec.data, f)}</Pill>
                              ) : f.multiple && Array.isArray(rec.data[f.name]) ? (
                                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                  {(rec.data[f.name] as unknown[]).map((v, j) => (
                                    <Pill key={j} tone="neutral">{String(v)}</Pill>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, fontWeight: 500, color: rec.data[f.name] == null ? "var(--muted)" : "inherit", textAlign: "right" }}>
                                  {getCellValue(rec.data, f)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--muted)" }}>
                          {formatRelative(rec.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          !loadingEntities && (
            <Card>
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>▦</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Selecione uma entidade</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Escolha uma entidade na barra lateral para ver os registros.</div>
              </div>
            </Card>
          )
        )}
      </div>

      {activeTenant && activeEntity && (
        <NewRecordDrawer
          open={newRecordOpen}
          tenantId={activeTenant.id}
          entity={activeEntity}
          allEntities={entities}
          onClose={() => setNewRecordOpen(false)}
          onCreated={handleRecordCreated}
        />
      )}
    </>
  );
}
