"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card, Pill, FilterChip, SearchInput,
  GhostBtn, PrimaryBtn, AccentBtn,
  Drawer, Field, inputStyle, inputErrorStyle,
  Icon,
} from "@/components/ui/primitives";
import type { TenantResponse, ApiResponse } from "@/lib/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#13212f", "#24455f", "#d36d3f", "#1f4d47", "#5a4282", "#8a2f2f"];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo", TRIAL: "Trial", PAUSED: "Pausado", INACTIVE: "Inativo",
};

const PLAN_OPTIONS = ["FREE", "PRO", "ENTERPRISE"] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

// ─── New Tenant Drawer ────────────────────────────────────────────────────────

type FormErrors = { name?: string; slug?: string; general?: string };

function NewTenantDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (t: TenantResponse) => void;
}) {
  const [name, setName]         = useState("");
  const [slug, setSlug]         = useState("");
  const [plan, setPlan]         = useState<string>("FREE");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setName(""); setSlug(""); setPlan("FREE");
      setSlugTouched(false); setErrors({});
      setTimeout(() => nameRef.current?.focus(), 120);
    }
  }, [open]);

  // Auto-generate slug from name unless user has edited it manually
  useEffect(() => {
    if (!slugTouched) setSlug(toSlug(name));
  }, [name, slugTouched]);

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = "Nome deve ter pelo menos 2 caracteres.";
    if (!slug || slug.length < 2)
      e.slug = "Slug deve ter pelo menos 2 caracteres.";
    else if (!/^[a-z0-9-]+$/.test(slug))
      e.slug = "Slug só pode conter letras minúsculas, números e hífens.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug, plan }),
      });
      const data: ApiResponse<TenantResponse> = await res.json();

      if (!res.ok || !data.success) {
        const msg = (data as { message?: string }).message ?? "Erro ao criar tenant.";
        setErrors({ general: msg });
        return;
      }

      onCreated(data.data);
      onClose();
    } catch {
      setErrors({ general: "Erro de conexão. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Novo tenant"
      subtitle="Preencha os dados para provisionar um novo espaço de trabalho."
      footer={
        <>
          <GhostBtn onClick={onClose} disabled={submitting}>Cancelar</GhostBtn>
          <AccentBtn icon="plus" onClick={handleSubmit as never} disabled={submitting}>
            {submitting ? "Criando…" : "Criar tenant"}
          </AccentBtn>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* General error */}
        {errors.general && (
          <div style={{
            background: "rgba(138,47,47,0.08)", border: "1px solid rgba(138,47,47,0.22)",
            borderRadius: 10, padding: "12px 14px",
            fontSize: 13, color: "#7a2020", fontWeight: 500,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Icon name="x" size={15} stroke="#7a2020" />
            {errors.general}
          </div>
        )}

        {/* Preview badge */}
        {(name || slug) && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(15,47,56,0.05)", border: "1px solid var(--line)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg,#0f2f38,#133b45)",
              color: "#f6c79a", display: "grid", placeItems: "center",
              fontFamily: '"Iowan Old Style",serif', fontSize: 18, fontWeight: 700,
            }}>
              {name ? name[0].toUpperCase() : "?"}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{name || "Nome do tenant"}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "ui-monospace,monospace", marginTop: 2 }}>
                {slug || "slug-do-tenant"}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Pill tone={plan === "ENTERPRISE" ? "amber" : plan === "PRO" ? "blue" : "muted"}>{plan}</Pill>
            </div>
          </div>
        )}

        {/* Name */}
        <Field label="Nome" required error={errors.name}>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Acme Operações"
            maxLength={200}
            style={{ ...inputStyle, ...(errors.name ? inputErrorStyle : {}) }}
          />
        </Field>

        {/* Slug */}
        <Field
          label="Slug"
          required
          hint="Identificador único. Apenas letras minúsculas, números e hífens."
          error={errors.slug}
        >
          <div style={{ position: "relative" }}>
            <input
              value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); }}
              placeholder="acme-operacoes"
              maxLength={100}
              style={{
                ...inputStyle,
                ...(errors.slug ? inputErrorStyle : {}),
                paddingRight: slugTouched ? 80 : 14,
              }}
            />
            {slugTouched && (
              <button
                type="button"
                onClick={() => { setSlugTouched(false); setSlug(toSlug(name)); }}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  border: 0, background: "none", fontSize: 11, color: "var(--muted)",
                  cursor: "pointer", fontWeight: 600,
                }}
              >
                Auto ↺
              </button>
            )}
          </div>
        </Field>

        {/* Plan */}
        <Field label="Plano">
          <div style={{ display: "flex", gap: 8 }}>
            {PLAN_OPTIONS.map((p) => {
              const active = plan === p;
              const tone = p === "ENTERPRISE" ? "#9d3f14" : p === "PRO" ? "#1c3d58" : "#51616d";
              const bg   = p === "ENTERPRISE" ? "rgba(211,109,63,0.12)" : p === "PRO" ? "rgba(28,61,88,0.10)" : "rgba(19,33,47,0.06)";
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlan(p)}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer",
                    border: active ? `2px solid ${tone}` : "2px solid transparent",
                    background: active ? bg : "rgba(255,255,255,0.8)",
                    color: active ? tone : "var(--muted)",
                    fontSize: 12, fontWeight: 700, textAlign: "center",
                    outline: "none",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Divider + info box */}
        <div style={{
          borderRadius: 10, padding: "14px 16px",
          background: "rgba(211,109,63,0.06)", border: "1px solid rgba(211,109,63,0.18)",
          fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700, color: "#9d3f14" }}>O que acontece ao criar: </span>
          Um schema PostgreSQL isolado é provisionado automaticamente para este tenant. O slug não pode ser alterado depois.
        </div>

      </form>
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const [tenants, setTenants]     = useState<TenantResponse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function loadTenants() {
    setLoading(true);
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((d: ApiResponse<TenantResponse[]>) => { if (d.data) setTenants(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTenants(); }, []);

  function handleCreated(t: TenantResponse) {
    setTenants((prev) => [t, ...prev]);
  }

  const filtered = tenants.filter((t) => {
    if (activeFilter && t.status !== activeFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.slug.includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all:    tenants.length,
    ACTIVE: tenants.filter((t) => t.status === "ACTIVE").length,
    TRIAL:  tenants.filter((t) => t.status === "TRIAL").length,
    PAUSED: tenants.filter((t) => t.status === "PAUSED").length,
  };

  const STATUS_FILTERS = [
    { label: "Todos",    filter: null,     count: counts.all    },
    { label: "Ativos",   filter: "ACTIVE", count: counts.ACTIVE },
    { label: "Trial",    filter: "TRIAL",  count: counts.TRIAL  },
    { label: "Pausados", filter: "PAUSED", count: counts.PAUSED },
  ];

  return (
    <>
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.label}
              label={f.label}
              count={f.count}
              active={activeFilter === f.filter}
              onClick={() => setActiveFilter(f.filter)}
            />
          ))}
          <div style={{ flex: 1 }} />
          <SearchInput placeholder="Buscar por nome ou slug" value={search} onChange={setSearch} />
          <GhostBtn icon="download">Exportar CSV</GhostBtn>
          <GhostBtn icon="filter">Filtros</GhostBtn>
          <PrimaryBtn icon="plus" onClick={() => setDrawerOpen(true)}>Novo tenant</PrimaryBtn>
        </div>

        {/* Table */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              Carregando tenants…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              {search || activeFilter ? "Nenhum tenant corresponde ao filtro." : "Nenhum tenant cadastrado ainda."}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(19,33,47,0.03)", textAlign: "left" }}>
                  {["", "Tenant", "Slug", "Plano", "Status", "Criado", "Ações"].map((h, i) => (
                    <th key={i} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--line)" }}>
                    <td style={{ padding: "14px 14px", width: 28 }}>
                      <input type="checkbox" />
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: "#fff", display: "grid", placeItems: "center", fontFamily: '"Iowan Old Style",serif', fontSize: 14, flexShrink: 0 }}>
                          {t.name[0]}
                        </div>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 14px", fontFamily: "ui-monospace,monospace", color: "var(--muted)", fontSize: 12 }}>{t.slug}</td>
                    <td style={{ padding: "14px 14px" }}>
                      <Pill tone={t.plan === "ENTERPRISE" ? "amber" : t.plan === "PRO" ? "blue" : "muted"}>{t.plan}</Pill>
                    </td>
                    <td style={{ padding: "14px 14px" }}>
                      <Pill tone={t.status === "ACTIVE" ? "green" : t.status === "TRIAL" ? "amber" : "red"}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </Pill>
                    </td>
                    <td style={{ padding: "14px 14px", color: "var(--muted)" }}>{formatDate(t.createdAt)}</td>
                    <td style={{ padding: "14px 14px" }}>
                      <button style={{ border: 0, background: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}>⋯</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <NewTenantDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
