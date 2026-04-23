"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card, Pill, SearchInput, AccentBtn, GhostBtn, PrimaryBtn,
  Drawer, Field, Toggle, inputStyle, inputErrorStyle, Icon,
} from "@/components/ui/primitives";
import { useTenantContext } from "@/components/shell/tenant-context";
import type { EntityDefinitionResponse, EntityFieldDefinition, EntityFieldType, ApiResponse } from "@/lib/types";

// ─── constants ───────────────────────────────────────────────────────────────

const TYPE_TONES: Record<string, "blue" | "amber" | "green" | "violet" | "muted" | "neutral"> = {
  STRING: "blue", TEXT: "blue", NUMBER: "amber", BOOLEAN: "green",
  EMAIL: "violet", PHONE: "violet", URL: "violet", DATE: "muted",
  ENUM: "amber", RELATION: "neutral",
};

const FIELD_TYPES: { value: EntityFieldType; label: string; hint: string }[] = [
  { value: "STRING",   label: "Texto",      hint: "Linha única"        },
  { value: "TEXT",     label: "Texto longo", hint: "Múltiplas linhas"  },
  { value: "NUMBER",   label: "Número",     hint: "Inteiro ou decimal" },
  { value: "BOOLEAN",  label: "Sim/Não",    hint: "Verdadeiro/Falso"   },
  { value: "EMAIL",    label: "Email",      hint: "Formato email"      },
  { value: "PHONE",    label: "Telefone",   hint: "Formato fone"       },
  { value: "URL",      label: "URL",        hint: "Endereço web"       },
  { value: "DATE",     label: "Data",       hint: "ISO 8601"           },
  { value: "ENUM",     label: "Enum",       hint: "Lista de opções"    },
  { value: "RELATION", label: "Relação",    hint: "Link p/ entidade"   },
];

const ENTITY_ICONS = ["▲", "●", "◆", "■", "▣", "▼", "◉", "◈"];

// ─── helpers ─────────────────────────────────────────────────────────────────

function toEntitySlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .replace(/_+$/g, "")
    .slice(0, 60) || "";
}

function toFieldName(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .replace(/_+$/g, "")
    .slice(0, 60) || "";
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `há ${days}d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ─── Field draft types ────────────────────────────────────────────────────────

type FieldDraft = {
  uid: string;
  name: string;
  nameTouched: boolean;
  label: string;
  type: EntityFieldType;
  required: boolean;
  multiple: boolean;
  relatedEntity: string;
  options: string[];
  optionInput: string;
  minLen: string;
  maxLen: string;
  minVal: string;
  maxVal: string;
  open: boolean;
};

function makeFieldDraft(overrides?: Partial<FieldDraft>): FieldDraft {
  return {
    uid: Math.random().toString(36).slice(2),
    name: "", nameTouched: false,
    label: "", type: "STRING", required: false, multiple: false,
    relatedEntity: "", options: [], optionInput: "",
    minLen: "", maxLen: "", minVal: "", maxVal: "",
    open: true,
    ...overrides,
  };
}

function buildFieldValidations(f: FieldDraft) {
  if (f.type === "RELATION") return { entity: f.relatedEntity };
  const v: Record<string, unknown> = {};
  if (f.type === "STRING" || f.type === "TEXT") {
    if (f.minLen) v.minLength = Number(f.minLen);
    if (f.maxLen) v.maxLength = Number(f.maxLen);
  }
  if (f.type === "NUMBER") {
    if (f.minVal) v.min = Number(f.minVal);
    if (f.maxVal) v.max = Number(f.maxVal);
  }
  return Object.keys(v).length > 0 ? v : null;
}

// ─── Field Accordion Item ─────────────────────────────────────────────────────

function FieldAccordionItem({
  f, index, errors, existingEntities, canRemove,
  onChange, onToggle, onRemove,
}: {
  f: FieldDraft;
  index: number;
  errors: Record<string, string>;
  existingEntities: EntityDefinitionResponse[];
  canRemove: boolean;
  onChange: (uid: string, patch: Partial<FieldDraft>) => void;
  onToggle: (uid: string) => void;
  onRemove: (uid: string) => void;
}) {
  const hasError = Object.keys(errors).some((k) => k.startsWith(f.uid));

  return (
    <div style={{
      border: `1px solid ${hasError ? "rgba(138,47,47,0.4)" : "var(--line)"}`,
      borderRadius: 10,
      overflow: "hidden",
      background: "rgba(255,255,255,0.6)",
    }}>
      {/* Header */}
      <div
        onClick={() => onToggle(f.uid)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px", cursor: "pointer",
          background: f.open ? "rgba(28,61,88,0.05)" : "transparent",
          userSelect: "none",
        }}
      >
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, minWidth: 18 }}>{index + 1}.</span>
        <span style={{ transform: f.open ? "rotate(90deg)" : "none", transition: "transform .15s", display: "inline-block", fontSize: 9, color: "var(--muted)" }}>▶</span>
        <Pill tone={TYPE_TONES[f.type] ?? "neutral"}>{f.type}</Pill>
        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>
          {f.label || f.name || <span style={{ color: "var(--muted)", fontWeight: 400 }}>Campo {index + 1}</span>}
        </span>
        {f.required && <Pill tone="amber">Obrigatório</Pill>}
        {f.multiple && <Pill tone="blue">Múltiplo</Pill>}
        {hasError && <span style={{ color: "#7a2020", fontSize: 11, fontWeight: 700 }}>Erro</span>}
        {canRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(f.uid); }}
            style={{ border: 0, background: "none", cursor: "pointer", padding: "2px 6px", color: "var(--muted)", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        )}
      </div>

      {/* Body */}
      {f.open && (
        <div style={{ padding: "14px 14px 16px", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Label + Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Label de exibição" required>
              <input
                value={f.label}
                onChange={(e) => onChange(f.uid, { label: e.target.value })}
                placeholder={`Campo ${index + 1}`}
                maxLength={200}
                style={inputStyle}
              />
            </Field>
            <Field label="Nome do campo" required error={errors[`${f.uid}.name`]}>
              <div style={{ position: "relative" }}>
                <input
                  value={f.name}
                  onChange={(e) => onChange(f.uid, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""), nameTouched: true })}
                  placeholder="campo_nome"
                  maxLength={60}
                  style={{ ...inputStyle, fontFamily: "ui-monospace,monospace", fontSize: 12, ...(errors[`${f.uid}.name`] ? inputErrorStyle : {}), paddingRight: f.nameTouched ? 80 : 14 }}
                />
                {f.nameTouched && (
                  <button
                    type="button"
                    onClick={() => onChange(f.uid, { nameTouched: false, name: toFieldName(f.label) })}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", fontSize: 11, color: "var(--muted)", cursor: "pointer", fontWeight: 600 }}
                  >
                    Auto ↺
                  </button>
                )}
              </div>
            </Field>
          </div>

          {/* Type selector */}
          <Field label="Tipo">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
              {FIELD_TYPES.map((t) => {
                const active = f.type === t.value;
                return (
                  <button key={t.value} type="button" onClick={() => onChange(f.uid, { type: t.value })}
                    style={{ padding: "7px 4px", borderRadius: 7, cursor: "pointer", border: active ? "2px solid #1c3d58" : "2px solid transparent", background: active ? "rgba(28,61,88,0.10)" : "rgba(255,255,255,0.8)", color: active ? "#1c3d58" : "var(--muted)", fontSize: 10, fontWeight: 700, textAlign: "center", outline: "none" }}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* RELATION selector */}
          {f.type === "RELATION" && (
            <Field label="Entidade alvo" required error={errors[`${f.uid}.relation`]}>
              {existingEntities.length === 0 ? (
                <div style={{ ...inputStyle, color: "var(--muted)", fontSize: 12 }}>
                  Nenhuma outra entidade disponível.
                </div>
              ) : (
                <select
                  value={f.relatedEntity}
                  onChange={(e) => onChange(f.uid, { relatedEntity: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Selecione uma entidade…</option>
                  {existingEntities.map((e) => (
                    <option key={e.id} value={e.slug}>{e.displayName ?? e.name} ({e.slug})</option>
                  ))}
                </select>
              )}
            </Field>
          )}

          {/* ENUM options */}
          {f.type === "ENUM" && (
            <Field label="Opções" required error={errors[`${f.uid}.options`]}>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input
                  value={f.optionInput}
                  onChange={(e) => onChange(f.uid, { optionInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = f.optionInput.trim();
                      if (v && !f.options.includes(v)) onChange(f.uid, { options: [...f.options, v], optionInput: "" });
                    }
                  }}
                  placeholder="Adicionar opção…"
                  maxLength={100}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button type="button"
                  onClick={() => {
                    const v = f.optionInput.trim();
                    if (v && !f.options.includes(v)) onChange(f.uid, { options: [...f.options, v], optionInput: "" });
                  }}
                  style={{ padding: "0 14px", borderRadius: 8, border: "1px solid var(--line)", background: "rgba(255,255,255,0.9)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  +
                </button>
              </div>
              {f.options.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {f.options.map((o) => (
                    <div key={o} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 16, background: "rgba(28,61,88,0.10)", fontSize: 11, fontWeight: 600, color: "#1c3d58" }}>
                      {o}
                      <button type="button" onClick={() => onChange(f.uid, { options: f.options.filter((x) => x !== o) })}
                        style={{ border: 0, background: "none", cursor: "pointer", color: "#1c3d58", padding: 0, fontSize: 13 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          )}

          {/* String/Text validations */}
          {(f.type === "STRING" || f.type === "TEXT") && (
            <Field label="Comprimento (opcional)">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Mín. chars</div>
                  <input type="number" min={0} value={f.minLen} onChange={(e) => onChange(f.uid, { minLen: e.target.value })} placeholder="0" style={{ ...inputStyle, width: "100%" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Máx. chars</div>
                  <input type="number" min={0} value={f.maxLen} onChange={(e) => onChange(f.uid, { maxLen: e.target.value })} placeholder="500" style={{ ...inputStyle, width: "100%" }} />
                </div>
              </div>
            </Field>
          )}

          {/* Number validations */}
          {f.type === "NUMBER" && (
            <Field label="Intervalo (opcional)">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Valor mín.</div>
                  <input type="number" value={f.minVal} onChange={(e) => onChange(f.uid, { minVal: e.target.value })} placeholder="0" style={{ ...inputStyle, width: "100%" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Valor máx.</div>
                  <input type="number" value={f.maxVal} onChange={(e) => onChange(f.uid, { maxVal: e.target.value })} placeholder="9999" style={{ ...inputStyle, width: "100%" }} />
                </div>
              </div>
            </Field>
          )}

          {/* Required + Multiple */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 2 }}>
            <Toggle
              checked={f.required}
              onChange={(v) => onChange(f.uid, { required: v })}
              label="Obrigatório"
              hint="Deve ser preenchido"
            />
            <Toggle
              checked={f.multiple}
              onChange={(v) => onChange(f.uid, { multiple: v })}
              label="Múltiplo"
              hint="Aceita vários valores"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New Entity Drawer ────────────────────────────────────────────────────────

type EntityFormErrors = { name?: string; slug?: string; general?: string };

function NewEntityDrawer({
  open, tenantId, existingEntities, onClose, onCreated,
}: {
  open: boolean;
  tenantId: string;
  existingEntities: EntityDefinitionResponse[];
  onClose: () => void;
  onCreated: (e: EntityDefinitionResponse, openFields: boolean) => void;
}) {
  const [name,        setName]        = useState("");
  const [slug,        setSlug]        = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [fields,      setFields]      = useState<FieldDraft[]>([
    makeFieldDraft({ label: "Nome", name: "nome", required: true }),
  ]);
  const [errors,      setErrors]      = useState<EntityFormErrors>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(""); setSlug(""); setSlugTouched(false);
      setDisplayName(""); setDescription("");
      setFields([makeFieldDraft({ label: "Nome", name: "nome", required: true })]);
      setErrors({}); setFieldErrors({});
      setTimeout(() => nameRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    if (!slugTouched) setSlug(toEntitySlug(name));
  }, [name, slugTouched]);

  function updateField(uid: string, patch: Partial<FieldDraft>) {
    setFields((prev) =>
      prev.map((f) => {
        if (f.uid !== uid) return f;
        const updated = { ...f, ...patch };
        if ("label" in patch && !updated.nameTouched) {
          updated.name = toFieldName(updated.label);
        }
        return updated;
      })
    );
  }

  function toggleField(uid: string) {
    setFields((prev) => prev.map((f) => (f.uid === uid ? { ...f, open: !f.open } : f)));
  }

  function removeField(uid: string) {
    setFields((prev) => prev.filter((f) => f.uid !== uid));
  }

  function addField() {
    setFields((prev) => [...prev.map((f) => ({ ...f, open: false })), makeFieldDraft()]);
  }

  function validate() {
    const form: EntityFormErrors = {};
    const fe: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) form.name = "Nome deve ter pelo menos 2 caracteres.";
    if (!slug || !/^[a-z][a-z0-9_]*$/.test(slug)) form.slug = "Slug: letras minúsculas, números e underscores. Deve começar com letra.";
    if (fields.length === 0) form.general = "Adicione pelo menos um campo à entidade.";

    const seenNames = new Set<string>();
    for (const f of fields) {
      if (!f.name || !/^[a-z][a-z0-9_]*$/.test(f.name)) {
        fe[`${f.uid}.name`] = "Nome inválido.";
      } else if (seenNames.has(f.name)) {
        fe[`${f.uid}.name`] = `"${f.name}" duplicado.`;
      } else {
        seenNames.add(f.name);
      }
      if (f.type === "RELATION" && !f.relatedEntity) fe[`${f.uid}.relation`] = "Selecione a entidade alvo.";
      if (f.type === "ENUM" && f.options.length < 2) fe[`${f.uid}.options`] = "Mínimo 2 opções.";
    }

    return { form, fe };
  }

  async function handleSubmit(afterCreate: "close" | "addFields") {
    const { form, fe } = validate();
    if (Object.keys(form).length > 0 || Object.keys(fe).length > 0) {
      setErrors(form); setFieldErrors(fe);
      const errorUids = new Set(Object.keys(fe).map((k) => k.split(".")[0]));
      setFields((prev) => prev.map((f) => ({ ...f, open: f.open || errorUids.has(f.uid) })));
      return;
    }
    setErrors({}); setFieldErrors({}); setSubmitting(true);

    const body = {
      tenantId,
      name: name.trim(),
      slug,
      displayName: displayName.trim() || name.trim(),
      description: description.trim() || null,
      icon: null,
      fields: fields.map((f) => ({
        name: f.name,
        type: f.type,
        required: f.required,
        multiple: f.multiple,
        label: f.label.trim() || f.name,
        defaultValue: null,
        validations: buildFieldValidations(f),
        options: f.type === "ENUM" ? f.options : null,
      })),
    };

    try {
      const res = await fetch("/api/entities/definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ApiResponse<EntityDefinitionResponse> = await res.json();
      if (!res.ok || !data.data) {
        setErrors({ general: (data as { message?: string }).message ?? "Erro ao criar entidade." });
        return;
      }
      onCreated(data.data, afterCreate === "addFields");
      onClose();
    } catch {
      setErrors({ general: "Erro de conexão. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open} onClose={onClose} width={560}
      title="Nova entidade"
      subtitle="Define o schema de um novo tipo de dado no tenant."
      footer={
        <>
          <GhostBtn onClick={onClose} disabled={submitting}>Cancelar</GhostBtn>
          <PrimaryBtn
            onClick={() => handleSubmit("close")}
            disabled={submitting || fields.length === 0}
          >
            {submitting ? "Criando…" : "Criar entidade"}
          </PrimaryBtn>
          <AccentBtn
            icon="plus"
            onClick={() => handleSubmit("addFields")}
            disabled={submitting || fields.length === 0}
          >
            {submitting ? "Criando…" : "Criar e adicionar campos"}
          </AccentBtn>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit("close"); }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {errors.general && (
          <div style={{ background: "rgba(138,47,47,0.08)", border: "1px solid rgba(138,47,47,0.22)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#7a2020", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="x" size={15} stroke="#7a2020" /> {errors.general}
          </div>
        )}

        {/* Preview */}
        {(name || slug) && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(15,47,56,0.05)", border: "1px solid var(--line)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "rgba(211,109,63,0.12)", color: "#d36d3f", display: "grid", placeItems: "center", fontSize: 20 }}>
              ▲
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{displayName || name || "Nome da entidade"}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "ui-monospace,monospace", marginTop: 2 }}>{slug || "slug_entidade"}</div>
            </div>
          </div>
        )}

        {/* Name */}
        <Field label="Nome" required error={errors.name}>
          <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Lead" maxLength={200}
            style={{ ...inputStyle, ...(errors.name ? inputErrorStyle : {}) }} />
        </Field>

        {/* Slug */}
        <Field label="Slug" required hint="Identificador técnico: letras minúsculas, números e underscores." error={errors.slug}>
          <div style={{ position: "relative" }}>
            <input value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); }}
              placeholder="lead" maxLength={60}
              style={{ ...inputStyle, ...(errors.slug ? inputErrorStyle : {}), paddingRight: slugTouched ? 80 : 14 }} />
            {slugTouched && (
              <button type="button" onClick={() => { setSlugTouched(false); setSlug(toEntitySlug(name)); }}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", fontSize: 11, color: "var(--muted)", cursor: "pointer", fontWeight: 600 }}>
                Auto ↺
              </button>
            )}
          </div>
        </Field>

        {/* Display Name */}
        <Field label="Nome de exibição" hint="Como a entidade aparece para os usuários. Padrão: igual ao nome.">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder={name || "Lead"} maxLength={200}
            style={inputStyle} />
        </Field>

        {/* Description */}
        <Field label="Descrição">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o propósito desta entidade…" maxLength={500} rows={2}
            style={{ ...inputStyle, resize: "vertical", minHeight: 60, lineHeight: 1.5 }} />
        </Field>

        {/* Fields accordion section */}
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Campos <span style={{ color: "#9d3f14" }}>*</span>
              <span style={{ fontWeight: 400, marginLeft: 6, textTransform: "none", letterSpacing: 0 }}>({fields.length})</span>
            </div>
            <button type="button" onClick={addField}
              style={{ border: "1px solid var(--line)", background: "rgba(255,255,255,0.9)", borderRadius: 7, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600, color: "#1c3d58" }}>
              + Campo
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {fields.map((f, i) => (
              <FieldAccordionItem
                key={f.uid}
                f={f} index={i}
                errors={fieldErrors}
                existingEntities={existingEntities}
                canRemove={fields.length > 1}
                onChange={updateField}
                onToggle={toggleField}
                onRemove={removeField}
              />
            ))}
          </div>
        </div>
      </form>
    </Drawer>
  );
}

// ─── New Field Drawer ─────────────────────────────────────────────────────────

type FieldFormErrors = { name?: string; options?: string; general?: string };

function NewFieldDrawer({
  open, tenantId, entity, otherEntities, onClose, onSaved,
}: {
  open: boolean;
  tenantId: string;
  entity: EntityDefinitionResponse;
  otherEntities: EntityDefinitionResponse[];
  onClose: () => void;
  onSaved: (e: EntityDefinitionResponse) => void;
}) {
  const [name,          setName]          = useState("");
  const [nameTouched,   setNameTouched]   = useState(false);
  const [label,         setLabel]         = useState("");
  const [type,          setType]          = useState<EntityFieldType>("STRING");
  const [required,      setRequired]      = useState(false);
  const [multiple,      setMultiple]      = useState(false);
  const [relatedEntity, setRelatedEntity] = useState("");
  const [options,       setOptions]       = useState<string[]>([]);
  const [optionInput,   setOptionInput]   = useState("");
  const [minLen,        setMinLen]        = useState("");
  const [maxLen,        setMaxLen]        = useState("");
  const [minVal,        setMinVal]        = useState("");
  const [maxVal,        setMaxVal]        = useState("");
  const [errors,        setErrors]        = useState<FieldFormErrors>({});
  const [submitting,    setSubmitting]    = useState(false);
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(""); setNameTouched(false); setLabel(""); setType("STRING");
      setRequired(false); setMultiple(false); setRelatedEntity(""); setOptions([]); setOptionInput("");
      setMinLen(""); setMaxLen(""); setMinVal(""); setMaxVal(""); setErrors({});
      setTimeout(() => labelRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    if (!nameTouched) setName(toFieldName(label));
  }, [label, nameTouched]);

  function addOption() {
    const v = optionInput.trim();
    if (!v || options.includes(v)) return;
    setOptions((prev) => [...prev, v]);
    setOptionInput("");
  }

  function removeOption(o: string) {
    setOptions((prev) => prev.filter((x) => x !== o));
  }

  function validate(): FieldFormErrors {
    const e: FieldFormErrors = {};
    if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) e.name = "Nome: letras minúsculas, números e underscores, começando com letra.";
    if (entity.fields.some((f) => f.name === name)) e.name = `Campo "${name}" já existe nesta entidade.`;
    if (type === "ENUM" && options.length < 2) e.options = "ENUM precisa de pelo menos 2 opções.";
    if (type === "RELATION" && !relatedEntity) e.general = "Selecione a entidade alvo da relação.";
    return e;
  }

  function buildValidations() {
    if (type === "RELATION") return { entity: relatedEntity };
    const v: Record<string, unknown> = {};
    if (type === "STRING" || type === "TEXT") {
      if (minLen) v.minLength = Number(minLen);
      if (maxLen) v.maxLength = Number(maxLen);
    }
    if (type === "NUMBER") {
      if (minVal) v.min = Number(minVal);
      if (maxVal) v.max = Number(maxVal);
    }
    return Object.keys(v).length > 0 ? v : null;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({}); setSubmitting(true);

    const newField: EntityFieldDefinition = {
      name, label: label.trim() || name, type,
      required, multiple,
      defaultValue: undefined,
      validations: buildValidations(),
      options: type === "ENUM" ? options : null,
    };

    const body = {
      name: entity.name,
      slug: entity.slug,
      displayName: entity.displayName,
      description: entity.description,
      icon: entity.icon,
      fields: [...entity.fields, newField],
    };

    try {
      const res = await fetch(`/api/entities/definitions/${entity.slug}?tenantId=${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ApiResponse<EntityDefinitionResponse> = await res.json();
      if (!res.ok || !data.data) { setErrors({ general: (data as { message?: string }).message ?? "Erro ao salvar campo." }); return; }
      onSaved(data.data);
      onClose();
    } catch {
      setErrors({ general: "Erro de conexão. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  const showStringValidations = type === "STRING" || type === "TEXT";
  const showNumberValidations  = type === "NUMBER";
  const showEnumOptions        = type === "ENUM";

  return (
    <Drawer
      open={open} onClose={onClose} width={500}
      title="Novo campo"
      subtitle={`Adicionando campo à entidade ${entity.displayName ?? entity.name}`}
      footer={
        <>
          <GhostBtn onClick={onClose} disabled={submitting}>Cancelar</GhostBtn>
          <AccentBtn icon="plus" onClick={handleSubmit as never} disabled={submitting}>
            {submitting ? "Salvando…" : "Adicionar campo"}
          </AccentBtn>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {errors.general && (
          <div style={{ background: "rgba(138,47,47,0.08)", border: "1px solid rgba(138,47,47,0.22)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#7a2020", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="x" size={15} stroke="#7a2020" /> {errors.general}
          </div>
        )}

        {/* Preview */}
        {(label || name) && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, background: "rgba(15,47,56,0.04)", border: "1px solid var(--line)" }}>
            <Pill tone={TYPE_TONES[type] ?? "neutral"}>{type}</Pill>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{label || name}</span>
            <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 11, color: "var(--muted)" }}>{name}</span>
            {required && <span style={{ marginLeft: "auto" }}><Pill tone="amber">Obrigatório</Pill></span>}
          </div>
        )}

        {/* Label */}
        <Field label="Label de exibição" required>
          <input ref={labelRef} value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Nome completo" maxLength={200} style={inputStyle} />
        </Field>

        {/* Field name */}
        <Field label="Nome do campo" required hint="snake_case. Identifica o campo no banco de dados." error={errors.name}>
          <div style={{ position: "relative" }}>
            <input value={name}
              onChange={(e) => { setNameTouched(true); setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); }}
              placeholder="nome_completo" maxLength={60}
              style={{ ...inputStyle, fontFamily: "ui-monospace,monospace", fontSize: 12, ...(errors.name ? inputErrorStyle : {}), paddingRight: nameTouched ? 80 : 14 }} />
            {nameTouched && (
              <button type="button" onClick={() => { setNameTouched(false); setName(toFieldName(label)); }}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", fontSize: 11, color: "var(--muted)", cursor: "pointer", fontWeight: 600 }}>
                Auto ↺
              </button>
            )}
          </div>
        </Field>

        {/* Type */}
        <Field label="Tipo de campo">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {FIELD_TYPES.map((t) => {
              const active = type === t.value;
              return (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  style={{ padding: "9px 6px", borderRadius: 8, cursor: "pointer", border: active ? "2px solid #1c3d58" : "2px solid transparent", background: active ? "rgba(28,61,88,0.10)" : "rgba(255,255,255,0.8)", color: active ? "#1c3d58" : "var(--muted)", fontSize: 11, fontWeight: 700, textAlign: "center", outline: "none" }}>
                  {t.label}
                  <div style={{ fontSize: 10, fontWeight: 400, marginTop: 1, opacity: 0.75 }}>{t.hint}</div>
                </button>
              );
            })}
          </div>
        </Field>

        {/* RELATION: entity selector */}
        {type === "RELATION" && (
          <Field label="Entidade alvo" required hint="Qual entidade este campo referencia.">
            {otherEntities.length === 0 ? (
              <div style={{ ...inputStyle, color: "var(--muted)", fontSize: 12, display: "flex", alignItems: "center" }}>
                Nenhuma outra entidade disponível neste tenant.
              </div>
            ) : (
              <select
                value={relatedEntity}
                onChange={(e) => setRelatedEntity(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Selecione uma entidade…</option>
                {otherEntities.map((e) => (
                  <option key={e.id} value={e.slug}>
                    {e.displayName ?? e.name} ({e.slug})
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}

        {/* Required + Multiple */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Toggle
            checked={required}
            onChange={setRequired}
            label="Obrigatório"
            hint="Deve ser preenchido"
          />
          <Toggle
            checked={multiple}
            onChange={setMultiple}
            label="Múltiplo"
            hint="Aceita vários valores"
          />
        </div>

        {/* ENUM options */}
        {showEnumOptions && (
          <Field label="Opções do ENUM" required error={errors.options}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                placeholder="Adicionar opção…"
                maxLength={100}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={addOption}
                style={{ padding: "0 14px", borderRadius: 8, border: "1px solid var(--line)", background: "rgba(255,255,255,0.9)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                +
              </button>
            </div>
            {options.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {options.map((o) => (
                  <div key={o} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(28,61,88,0.10)", fontSize: 12, fontWeight: 600, color: "#1c3d58" }}>
                    {o}
                    <button type="button" onClick={() => removeOption(o)}
                      style={{ border: 0, background: "none", cursor: "pointer", color: "#1c3d58", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        )}

        {/* String/Text validations */}
        {showStringValidations && (
          <Field label="Validações (opcional)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Mín. caracteres</div>
                <input type="number" min={0} value={minLen} onChange={(e) => setMinLen(e.target.value)}
                  placeholder="0" style={{ ...inputStyle, width: "100%" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Máx. caracteres</div>
                <input type="number" min={0} value={maxLen} onChange={(e) => setMaxLen(e.target.value)}
                  placeholder="500" style={{ ...inputStyle, width: "100%" }} />
              </div>
            </div>
          </Field>
        )}

        {/* Number validations */}
        {showNumberValidations && (
          <Field label="Validações (opcional)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Valor mínimo</div>
                <input type="number" value={minVal} onChange={(e) => setMinVal(e.target.value)}
                  placeholder="0" style={{ ...inputStyle, width: "100%" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Valor máximo</div>
                <input type="number" value={maxVal} onChange={(e) => setMaxVal(e.target.value)}
                  placeholder="9999" style={{ ...inputStyle, width: "100%" }} />
              </div>
            </div>
          </Field>
        )}

      </form>
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EntitiesPage() {
  const { activeTenant } = useTenantContext();
  const [entities,    setEntities]    = useState<EntityDefinitionResponse[]>([]);
  const [selected,    setSelected]    = useState<EntityDefinitionResponse | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [newEntityOpen, setNewEntityOpen] = useState(false);
  const [newFieldOpen,  setNewFieldOpen]  = useState(false);

  useEffect(() => {
    if (!activeTenant) { setEntities([]); setSelected(null); return; }
    setLoading(true);
    fetch(`/api/entities/definitions?tenantId=${activeTenant.id}`)
      .then((r) => r.json())
      .then((d: ApiResponse<EntityDefinitionResponse[]>) => {
        const list = d.data ?? [];
        setEntities(list);
        setSelected((prev) => list.find((e) => e.id === prev?.id) ?? list[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTenant]);

  function handleEntityCreated(e: EntityDefinitionResponse, openFields: boolean) {
    setEntities((prev) => [e, ...prev]);
    setSelected(e);
    if (openFields) setNewFieldOpen(true);
  }

  function handleFieldSaved(updated: EntityDefinitionResponse) {
    setEntities((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelected(updated);
  }

  const filtered = entities.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.slug.includes(search.toLowerCase())
  );

  if (!activeTenant) {
    return (
      <div style={{ padding: 28 }}>
        <Card>
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>▤</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Selecione um tenant</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>As entidades são criadas por tenant.</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, overflow: "auto", height: "100%" }}>

        {/* Entity list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SearchInput placeholder="Buscar entidade" value={search} onChange={setSearch} style={{ flex: 1, width: "auto" }} />
            <AccentBtn icon="plus" onClick={() => setNewEntityOpen(true)} style={{ padding: "8px 12px", flexShrink: 0 }}>Nova</AccentBtn>
          </div>

          {loading ? (
            <div style={{ padding: 24, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>Carregando…</div>
          ) : filtered.length === 0 ? (
            <Card>
              <div style={{ padding: "28px 0", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {search ? "Nenhuma entidade corresponde." : "Nenhuma entidade criada ainda."}
                </div>
                {!search && (
                  <button onClick={() => setNewEntityOpen(true)} style={{ marginTop: 12, border: "1px dashed var(--line)", background: "none", borderRadius: 8, padding: "6px 16px", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
                    + Criar primeira entidade
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map((e, i) => {
                const isSelected = selected?.id === e.id;
                return (
                  <div key={e.id} onClick={() => setSelected(e)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, background: isSelected ? "#13212f" : "rgba(255,255,255,0.78)", color: isSelected ? "#fff" : "var(--foreground)", border: "1px solid var(--line)", cursor: "pointer", transition: "background .15s" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: isSelected ? "rgba(255,255,255,0.12)" : "rgba(211,109,63,0.1)", color: isSelected ? "#f6c79a" : "#d36d3f", display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>
                      {e.icon ?? ENTITY_ICONS[i % ENTITY_ICONS.length]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{e.displayName ?? e.name}</div>
                      <div style={{ fontSize: 11, color: isSelected ? "rgba(255,255,255,0.55)" : "var(--muted)", fontFamily: "ui-monospace,monospace", marginTop: 1 }}>
                        {e.slug} · {e.fields.length} campo{e.fields.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: isSelected ? "rgba(255,255,255,0.5)" : "var(--muted)", flexShrink: 0 }}>
                      {formatRelative(e.updatedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Schema builder */}
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>

            {/* Entity header */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(211,109,63,0.12)", color: "#d36d3f", display: "grid", placeItems: "center", fontSize: 20 }}>
                    {selected.icon ?? "▲"}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: '"Iowan Old Style",serif', fontSize: 24, margin: 0 }}>
                      {selected.displayName ?? selected.name}
                    </h2>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "ui-monospace,monospace", marginTop: 2 }}>
                      {activeTenant.slug} / {selected.slug}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Pill tone={selected.active ? "green" : "muted"}>{selected.active ? "Ativa" : "Inativa"}</Pill>
                </div>
              </div>

              <div style={{ display: "flex", gap: 28, marginTop: 16 }}>
                {[
                  { v: selected.fields.length,                                         l: "Campos"       },
                  { v: selected.fields.filter((f) => f.required).length,               l: "Obrigatórios" },
                  { v: formatRelative(selected.updatedAt),                              l: "Atualizado"   },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <div style={{ fontFamily: '"Iowan Old Style",serif', fontSize: 20 }}>{v}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>

              {selected.description && (
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{selected.description}</div>
              )}
            </Card>

            {/* Fields table */}
            <Card style={{ padding: 0, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Schema</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{selected.fields.length} campo{selected.fields.length !== 1 ? "s" : ""} definido{selected.fields.length !== 1 ? "s" : ""}</div>
                </div>
                <PrimaryBtn icon="plus" onClick={() => setNewFieldOpen(true)}>
                  Adicionar campo
                </PrimaryBtn>
              </div>

              {selected.fields.length === 0 ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 12 }}>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>Nenhum campo definido ainda.</div>
                  <button onClick={() => setNewFieldOpen(true)} style={{ border: "1px dashed var(--line)", background: "none", borderRadius: 8, padding: "6px 18px", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
                    + Adicionar primeiro campo
                  </button>
                </div>
              ) : (
                <div style={{ overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "rgba(19,33,47,0.03)", textAlign: "left" }}>
                        {["Campo", "Label", "Tipo", "Obrigatório", "Múltiplo", "Validações / Opções"].map((h, i) => (
                          <th key={i} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.fields.map((f, i) => {
                        const validSummary = f.type === "RELATION" && f.validations?.entity
                          ? `→ ${f.validations.entity}`
                          : f.validations && Object.keys(f.validations).filter((k) => k !== "entity").length > 0
                            ? Object.entries(f.validations).filter(([k]) => k !== "entity").map(([k, v]) => `${k}: ${v}`).join(", ")
                            : f.options?.length
                              ? f.options.join(", ")
                              : "—";
                        return (
                          <tr key={f.name} style={{ borderBottom: i === selected.fields.length - 1 ? "none" : "1px solid var(--line)" }}>
                            <td style={{ padding: "12px 16px", fontFamily: "ui-monospace,monospace", fontSize: 12, fontWeight: 600 }}>{f.name}</td>
                            <td style={{ padding: "12px 16px" }}>{f.label ?? f.name}</td>
                            <td style={{ padding: "12px 16px" }}><Pill tone={TYPE_TONES[f.type] ?? "neutral"}>{f.type}</Pill></td>
                            <td style={{ padding: "12px 16px" }}>
                              {f.required
                                ? <Pill tone="amber">Sim</Pill>
                                : <span style={{ color: "var(--muted)" }}>Não</span>}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {f.multiple
                                ? <Pill tone="blue">Sim</Pill>
                                : <span style={{ color: "var(--muted)" }}>Não</span>}
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--muted)", fontFamily: "ui-monospace,monospace", fontSize: 11, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {validSummary}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        ) : (
          !loading && (
            <Card>
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Selecione uma entidade ou crie uma nova.</div>
                <AccentBtn icon="plus" onClick={() => setNewEntityOpen(true)}>Nova entidade</AccentBtn>
              </div>
            </Card>
          )
        )}
      </div>

      {activeTenant && (
        <NewEntityDrawer
          open={newEntityOpen}
          tenantId={activeTenant.id}
          existingEntities={entities}
          onClose={() => setNewEntityOpen(false)}
          onCreated={handleEntityCreated}
        />
      )}

      {activeTenant && selected && (
        <NewFieldDrawer
          open={newFieldOpen}
          tenantId={activeTenant.id}
          entity={selected}
          otherEntities={entities.filter((e) => e.id !== selected.id)}
          onClose={() => setNewFieldOpen(false)}
          onSaved={handleFieldSaved}
        />
      )}
    </>
  );
}
