"use client";

import { useState, useEffect, useRef } from "react";
import {
  StatCard, Card, Pill, FilterChip, SearchInput,
  GhostBtn, AccentBtn, Drawer, Field, inputStyle, inputErrorStyle, Icon,
} from "@/components/ui/primitives";
import { useTenantContext } from "@/components/shell/tenant-context";
import type { TenantUserResponse, UserResponse, ApiResponse } from "@/lib/types";

type EnrichedUser = TenantUserResponse & { name: string; email: string };

// ─── helpers ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "TENANT_ADMIN", label: "Admin",    tone: "amber" as const },
  { value: "MANAGER",      label: "Manager",  tone: "blue"  as const },
  { value: "OPERATOR",     label: "Operator", tone: "green" as const },
  { value: "VIEWER",       label: "Viewer",   tone: "muted" as const },
];

function roleTone(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.tone ?? "muted";
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)}d`;
}

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*])(?=\S+$).{8,}$/;

// ─── New User Drawer ─────────────────────────────────────────────────────────

type FormErrors = { name?: string; email?: string; password?: string; role?: string; general?: string };

function NewUserDrawer({
  open,
  tenantId,
  onClose,
  onCreated,
}: {
  open: boolean;
  tenantId: string;
  onClose: () => void;
  onCreated: (u: EnrichedUser) => void;
}) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [role,     setRole]     = useState("OPERATOR");
  const [errors,   setErrors]   = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(""); setEmail(""); setPassword(""); setShowPwd(false);
      setRole("OPERATOR"); setErrors({});
      setTimeout(() => nameRef.current?.focus(), 120);
    }
  }, [open]);

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = "Nome deve ter pelo menos 2 caracteres.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Email inválido.";
    if (!PASSWORD_RE.test(password))
      e.password = "Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial (@#$%^&*).";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tenants/${tenantId}/register-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ general: data.message ?? "Erro ao criar usuário." });
        return;
      }

      const { tenantUser, authUser } = data.data as { tenantUser: TenantUserResponse; authUser: UserResponse };
      onCreated({ ...tenantUser, name: authUser.name, email: authUser.email });
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
      title="Novo usuário"
      subtitle="Cria a conta e já adiciona ao tenant com a role selecionada."
      footer={
        <>
          <GhostBtn onClick={onClose} disabled={submitting}>Cancelar</GhostBtn>
          <AccentBtn icon="plus" onClick={handleSubmit as never} disabled={submitting}>
            {submitting ? "Criando…" : "Criar usuário"}
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

        {/* Preview */}
        {(name || email) && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", borderRadius: 12,
            background: "rgba(15,47,56,0.05)", border: "1px solid var(--line)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
              background: "#e7dac8", color: "#13212f",
              display: "grid", placeItems: "center",
              fontWeight: 700, fontSize: 15,
            }}>
              {name ? initials(name) : "?"}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{name || "Nome do usuário"}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {email || "email@exemplo.com"}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Pill tone={roleTone(role)}>{role}</Pill>
            </div>
          </div>
        )}

        {/* Name */}
        <Field label="Nome completo" required error={errors.name}>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João Silva"
            maxLength={200}
            style={{ ...inputStyle, ...(errors.name ? inputErrorStyle : {}) }}
          />
        </Field>

        {/* Email */}
        <Field label="Email" required error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joao@empresa.com"
            maxLength={254}
            style={{ ...inputStyle, ...(errors.email ? inputErrorStyle : {}) }}
          />
        </Field>

        {/* Password */}
        <Field
          label="Senha"
          required
          hint="Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 especial (@#$%^&*)."
          error={errors.password}
        >
          <div style={{ position: "relative" }}>
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              maxLength={128}
              style={{ ...inputStyle, ...(errors.password ? inputErrorStyle : {}), paddingRight: 80 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                border: 0, background: "none", fontSize: 11, color: "var(--muted)",
                cursor: "pointer", fontWeight: 600,
              }}
            >
              {showPwd ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </Field>

        {/* Role */}
        <Field label="Role">
          <div style={{ display: "flex", gap: 8 }}>
            {ROLE_OPTIONS.map((r) => {
              const active = role === r.value;
              const toneColors: Record<string, { border: string; bg: string; text: string }> = {
                amber: { border: "#9d3f14", bg: "rgba(211,109,63,0.12)", text: "#9d3f14" },
                blue:  { border: "#1c3d58", bg: "rgba(28,61,88,0.10)",   text: "#1c3d58" },
                green: { border: "#155a52", bg: "rgba(21,90,82,0.10)",   text: "#155a52" },
                muted: { border: "#51616d", bg: "rgba(19,33,47,0.06)",   text: "#51616d" },
              };
              const c = toneColors[r.tone];
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  style={{
                    flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer",
                    border: active ? `2px solid ${c.border}` : "2px solid transparent",
                    background: active ? c.bg : "rgba(255,255,255,0.8)",
                    color: active ? c.text : "var(--muted)",
                    fontSize: 11, fontWeight: 700, textAlign: "center",
                    outline: "none",
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Info */}
        <div style={{
          borderRadius: 10, padding: "14px 16px",
          background: "rgba(211,109,63,0.06)", border: "1px solid rgba(211,109,63,0.18)",
          fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700, color: "#9d3f14" }}>O que acontece: </span>
          Uma conta de usuário é criada no sistema e adicionada a este tenant com a role escolhida. O usuário pode fazer login com as credenciais fornecidas.
        </div>

      </form>
    </Drawer>
  );
}

// ─── Link Existing User Drawer ───────────────────────────────────────────────

function LinkUserDrawer({
  open,
  tenantId,
  existingUserIds,
  onClose,
  onLinked,
}: {
  open: boolean;
  tenantId: string;
  existingUserIds: string[];
  onClose: () => void;
  onLinked: (u: EnrichedUser) => void;
}) {
  const [email,      setEmail]      = useState("");
  const [found,      setFound]      = useState<UserResponse | null>(null);
  const [notFound,   setNotFound]   = useState(false);
  const [searching,  setSearching]  = useState(false);
  const [role,       setRole]       = useState("OPERATOR");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEmail(""); setFound(null); setNotFound(false);
      setRole("OPERATOR"); setError("");
      setTimeout(() => emailRef.current?.focus(), 120);
    }
  }, [open]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSearching(true); setFound(null); setNotFound(false); setError("");
    try {
      const res = await fetch(`/api/auth/users/search?email=${encodeURIComponent(email.trim())}`);
      const data: ApiResponse<UserResponse> = await res.json();
      if (res.status === 404 || !data.data) { setNotFound(true); return; }
      if (!res.ok) { setError(data.message ?? "Erro na busca."); return; }
      if (existingUserIds.includes(data.data.id)) {
        setError("Este usuário já é membro deste tenant.");
        return;
      }
      setFound(data.data);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSearching(false);
    }
  }

  async function handleLink() {
    if (!found) return;
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/tenants/${tenantId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: found.id, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Erro ao vincular usuário."); return; }
      const tenantUser: TenantUserResponse = data.data;
      onLinked({ ...tenantUser, name: found.name, email: found.email });
      onClose();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const toneColors: Record<string, { border: string; bg: string; text: string }> = {
    amber: { border: "#9d3f14", bg: "rgba(211,109,63,0.12)", text: "#9d3f14" },
    blue:  { border: "#1c3d58", bg: "rgba(28,61,88,0.10)",   text: "#1c3d58" },
    green: { border: "#155a52", bg: "rgba(21,90,82,0.10)",   text: "#155a52" },
    muted: { border: "#51616d", bg: "rgba(19,33,47,0.06)",   text: "#51616d" },
  };

  return (
    <Drawer
      open={open} onClose={onClose}
      title="Vincular usuário existente"
      subtitle="Busque pelo email e atribua uma role no tenant."
      footer={
        <>
          <GhostBtn onClick={onClose} disabled={submitting}>Cancelar</GhostBtn>
          <AccentBtn icon="plus" onClick={handleLink} disabled={!found || submitting}>
            {submitting ? "Vinculando…" : "Vincular ao tenant"}
          </AccentBtn>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Email search */}
        <Field label="Email do usuário" required>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFound(null); setNotFound(false); setError(""); }}
              placeholder="joao@empresa.com"
              maxLength={254}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="submit"
              disabled={searching || !email.trim()}
              style={{ padding: "0 16px", borderRadius: 8, border: "1px solid var(--line)", background: "rgba(255,255,255,0.9)", cursor: searching ? "wait" : "pointer", fontSize: 12, fontWeight: 600, color: "var(--foreground)", flexShrink: 0, opacity: searching ? 0.7 : 1 }}
            >
              {searching ? "Buscando…" : "Buscar"}
            </button>
          </form>
        </Field>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(138,47,47,0.08)", border: "1px solid rgba(138,47,47,0.22)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#7a2020", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="x" size={15} stroke="#7a2020" /> {error}
          </div>
        )}

        {/* Not found */}
        {notFound && !error && (
          <div style={{ background: "rgba(19,33,47,0.04)", border: "1px solid var(--line)", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Nenhum usuário encontrado com este email.
          </div>
        )}

        {/* Found user card */}
        {found && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(21,90,82,0.06)", border: "1px solid rgba(21,90,82,0.2)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e7dac8", color: "#13212f", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {initials(found.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{found.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{found.email}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Pill tone="green">Encontrado</Pill>
              </div>
            </div>

            <Field label="Role no tenant">
              <div style={{ display: "flex", gap: 8 }}>
                {ROLE_OPTIONS.map((r) => {
                  const active = role === r.value;
                  const c = toneColors[r.tone];
                  return (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", border: active ? `2px solid ${c.border}` : "2px solid transparent", background: active ? c.bg : "rgba(255,255,255,0.8)", color: active ? c.text : "var(--muted)", fontSize: 11, fontWeight: 700, textAlign: "center", outline: "none" }}>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </>
        )}

      </div>
    </Drawer>
  );
}

// ─── Edit Profile Drawer ─────────────────────────────────────────────────────

type ProfileErrors = { name?: string; email?: string; currentPassword?: string; newPassword?: string; general?: string };

function EditProfileDrawer({
  open, user, onClose, onUpdated,
}: {
  open: boolean;
  user: EnrichedUser;
  onClose: () => void;
  onUpdated: (u: EnrichedUser) => void;
}) {
  const [name,            setName]            = useState(user.name);
  const [email,           setEmail]           = useState(user.email === "—" ? "" : user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [showPwd,         setShowPwd]         = useState(false);
  const [changingPwd,     setChangingPwd]     = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [errors,          setErrors]          = useState<ProfileErrors>({});

  useEffect(() => {
    if (open) {
      setName(user.name); setEmail(user.email);
      setCurrentPassword(""); setNewPassword(""); setShowPwd(false);
      setChangingPwd(false); setErrors({});
    }
  }, [open, user]);

  function validate(): ProfileErrors {
    const e: ProfileErrors = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Nome deve ter pelo menos 2 caracteres.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido.";
    if (changingPwd) {
      if (!currentPassword) e.currentPassword = "Informe a senha atual.";
      if (!PASSWORD_RE.test(newPassword)) e.newPassword = "Mín. 8 chars, 1 maiúscula, 1 minúscula, 1 número e 1 especial (@#$%^&*).";
    }
    return e;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({}); setSubmitting(true);

    const body: Record<string, string | undefined> = {};
    if (name.trim()) body.name = name.trim();
    if (email.trim()) body.email = email.trim().toLowerCase();
    if (changingPwd) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    try {
      const res = await fetch(`/api/auth/users/${user.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data.message ?? "Erro ao atualizar usuário." }); return; }
      onUpdated({ ...user, name: data.data?.name ?? name.trim(), email: data.data?.email ?? email.trim() });
      onClose();
    } catch {
      setErrors({ general: "Erro de conexão. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open} onClose={onClose}
      title="Editar perfil"
      subtitle={`Alterações aplicadas na conta de ${user.name}`}
      footer={
        <>
          <GhostBtn onClick={onClose} disabled={submitting}>Cancelar</GhostBtn>
          <AccentBtn icon="check" onClick={handleSave} disabled={submitting}>
            {submitting ? "Salvando…" : "Salvar alterações"}
          </AccentBtn>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {errors.general && (
          <div style={{ background: "rgba(138,47,47,0.08)", border: "1px solid rgba(138,47,47,0.22)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#7a2020", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="x" size={15} stroke="#7a2020" /> {errors.general}
          </div>
        )}

        <Field label="Nome completo" required error={errors.name}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200}
            style={{ ...inputStyle, ...(errors.name ? inputErrorStyle : {}) }} />
        </Field>

        <Field label="Email" required error={errors.email}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254}
            style={{ ...inputStyle, ...(errors.email ? inputErrorStyle : {}) }} />
        </Field>

        {/* Password section */}
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, marginBottom: changingPwd ? 16 : 0 }}>
            <input type="checkbox" checked={changingPwd} onChange={(e) => setChangingPwd(e.target.checked)} />
            Alterar senha
          </label>

          {changingPwd && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Senha atual" required error={errors.currentPassword}>
                <div style={{ position: "relative" }}>
                  <input type={showPwd ? "text" : "password"} value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••"
                    style={{ ...inputStyle, ...(errors.currentPassword ? inputErrorStyle : {}), paddingRight: 80 }} />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", fontSize: 11, color: "var(--muted)", cursor: "pointer", fontWeight: 600 }}>
                    {showPwd ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </Field>

              <Field label="Nova senha" required
                hint="Mín. 8 chars, 1 maiúscula, 1 minúscula, 1 número e 1 especial (@#$%^&*)."
                error={errors.newPassword}>
                <input type={showPwd ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••"
                  style={{ ...inputStyle, ...(errors.newPassword ? inputErrorStyle : {}) }} />
              </Field>
            </div>
          )}
        </div>

      </div>
    </Drawer>
  );
}

// ─── Edit User Drawer ────────────────────────────────────────────────────────

function EditUserDrawer({
  open,
  tenantId,
  user,
  onClose,
  onUpdated,
  onRemoved,
}: {
  open: boolean;
  tenantId: string;
  user: EnrichedUser;
  onClose: () => void;
  onUpdated: (u: EnrichedUser) => void;
  onRemoved: (userId: string) => void;
}) {
  const [role,        setRole]        = useState(user.role);
  const [submitting,  setSubmitting]  = useState(false);
  const [removing,    setRemoving]    = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (open) { setRole(user.role); setError(""); setConfirmDel(false); }
  }, [open, user]);

  async function handleSave() {
    if (role === user.role) { onClose(); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/tenants/${tenantId}/users/${user.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Erro ao atualizar role."); return; }
      onUpdated({ ...user, role });
      onClose();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove() {
    setRemoving(true); setError("");
    try {
      const res = await fetch(`/api/tenants/${tenantId}/users/${user.userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Erro ao remover usuário."); return;
      }
      onRemoved(user.id);
      onClose();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setRemoving(false);
    }
  }

  const toneColors: Record<string, { border: string; bg: string; text: string }> = {
    amber: { border: "#9d3f14", bg: "rgba(211,109,63,0.12)", text: "#9d3f14" },
    blue:  { border: "#1c3d58", bg: "rgba(28,61,88,0.10)",   text: "#1c3d58" },
    green: { border: "#155a52", bg: "rgba(21,90,82,0.10)",   text: "#155a52" },
    muted: { border: "#51616d", bg: "rgba(19,33,47,0.06)",   text: "#51616d" },
  };

  return (
    <Drawer
      open={open} onClose={onClose}
      title="Editar usuário"
      subtitle={`${user.name} · ${user.email}`}
      footer={
        <>
          <GhostBtn onClick={onClose} disabled={submitting || removing}>Cancelar</GhostBtn>
          <AccentBtn icon="check" onClick={handleSave} disabled={submitting || removing || role === user.role}>
            {submitting ? "Salvando…" : "Salvar role"}
          </AccentBtn>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* User card */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(15,47,56,0.05)", border: "1px solid var(--line)" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#e7dac8", color: "#13212f", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {initials(user.name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{user.email}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Pill tone={roleTone(role)}>{role}</Pill>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(138,47,47,0.08)", border: "1px solid rgba(138,47,47,0.22)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#7a2020", fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="x" size={15} stroke="#7a2020" /> {error}
          </div>
        )}

        {/* Role selector */}
        <Field label="Role">
          <div style={{ display: "flex", gap: 8 }}>
            {ROLE_OPTIONS.map((r) => {
              const active = role === r.value;
              const c = toneColors[r.tone];
              return (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", border: active ? `2px solid ${c.border}` : "2px solid transparent", background: active ? c.bg : "rgba(255,255,255,0.8)", color: active ? c.text : "var(--muted)", fontSize: 11, fontWeight: 700, textAlign: "center", outline: "none" }}>
                  {r.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Danger zone */}
        <div style={{ borderRadius: 10, padding: "14px 16px", background: "rgba(138,47,47,0.05)", border: "1px solid rgba(138,47,47,0.18)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#7a2020", marginBottom: 8 }}>Zona de risco</div>
          {!confirmDel ? (
            <button type="button" onClick={() => setConfirmDel(true)}
              style={{ fontSize: 12, fontWeight: 600, color: "#7a2020", background: "rgba(138,47,47,0.10)", border: "1px solid rgba(138,47,47,0.22)", borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}>
              Remover do tenant
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12.5, color: "#7a2020" }}>
                Tem certeza? O usuário perderá o acesso imediatamente.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setConfirmDel(false)}
                  style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", background: "rgba(255,255,255,0.9)", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="button" onClick={handleRemove} disabled={removing}
                  style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#8a2f2f", border: "none", borderRadius: 8, padding: "7px 14px", cursor: removing ? "not-allowed" : "pointer", opacity: removing ? 0.7 : 1 }}>
                  {removing ? "Removendo…" : "Confirmar remoção"}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ROLE_FILTERS = [
  { label: "Todos",    role: null,           },
  { label: "Admins",   role: "TENANT_ADMIN", },
  { label: "Managers", role: "MANAGER",      },
  { label: "Operators",role: "OPERATOR",     },
  { label: "Viewers",  role: "VIEWER",       },
];

export default function UsersPage() {
  const { activeTenant } = useTenantContext();
  const [users,          setUsers]          = useState<EnrichedUser[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [activeRole,     setActiveRole]     = useState<string | null>(null);
  const [search,         setSearch]         = useState("");
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [linkOpen,       setLinkOpen]       = useState(false);
  const [editingUser,    setEditingUser]    = useState<EnrichedUser | null>(null);
  const [editingProfile, setEditingProfile] = useState<EnrichedUser | null>(null);

  useEffect(() => {
    if (!activeTenant) { setUsers([]); return; }
    setLoading(true);

    fetch(`/api/tenants/${activeTenant.id}/users`)
      .then((r) => r.json())
      .then(async (d: ApiResponse<TenantUserResponse[]>) => {
        const tenantUsers = d.data ?? [];
        if (tenantUsers.length === 0) { setUsers([]); return; }

        const ids = tenantUsers.map((u) => u.userId).join(",");
        const uRes = await fetch(`/api/auth/users?ids=${ids}`);
        const uData: ApiResponse<UserResponse[]> = await uRes.json();
        if (!uRes.ok) console.error("[users] lookup failed:", uData);
        const userMap = new Map((uData.data ?? []).map((u) => [u.id, u]));

        setUsers(
          tenantUsers.map((tu) => {
            const u = userMap.get(tu.userId);
            return { ...tu, name: u?.name ?? tu.userId, email: u?.email ?? "—" };
          })
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTenant]);

  function handleCreated(u: EnrichedUser) {
    setUsers((prev) => [u, ...prev]);
  }

  function handleUpdated(u: EnrichedUser) {
    setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
  }

  function handleRemoved(tenantUserId: string) {
    setUsers((prev) => prev.filter((x) => x.id !== tenantUserId));
  }

  const roleCounts = ROLE_FILTERS.map((f) => ({
    ...f,
    count: f.role ? users.filter((u) => u.role === f.role).length : users.length,
  }));

  const filtered = users.filter((u) => {
    if (activeRole && u.role !== activeRole) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (!activeTenant) {
    return (
      <div style={{ padding: 28 }}>
        <Card>
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>◉</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Selecione um tenant</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Use o seletor de tenant na barra superior para ver os usuários.</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18, overflow: "auto" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          <StatCard icon="users"  label="Total"    value={users.length} />
          <StatCard icon="check"  label="Admins"   value={users.filter((u) => u.role === "TENANT_ADMIN").length} />
          <StatCard icon="shield" label="Managers" value={users.filter((u) => u.role === "MANAGER").length} />
          <StatCard icon="users"  label="Operators + Viewers" value={users.filter((u) => u.role === "OPERATOR" || u.role === "VIEWER").length} />
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {roleCounts.map((f) => (
            <FilterChip
              key={f.label}
              label={f.label}
              count={f.count}
              active={activeRole === f.role}
              onClick={() => setActiveRole(f.role)}
            />
          ))}
          <div style={{ flex: 1 }} />
          <SearchInput placeholder="Nome ou email" value={search} onChange={setSearch} />
          <GhostBtn icon="import" onClick={() => setLinkOpen(true)}>Vincular existente</GhostBtn>
          <AccentBtn icon="plus" onClick={() => setDrawerOpen(true)}>Novo usuário</AccentBtn>
        </div>

        {/* Table */}
        <Card style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              Carregando usuários…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              {search || activeRole ? "Nenhum usuário corresponde ao filtro." : "Nenhum usuário neste tenant ainda."}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(19,33,47,0.03)", textAlign: "left" }}>
                  {["", "Usuário", "Email", "Role", "Adicionado", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--line)" }}>
                    <td style={{ padding: "12px 14px", width: 28 }}>
                      <input type="checkbox" />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "#e7dac8", color: "#13212f",
                          display: "grid", placeItems: "center",
                          fontWeight: 700, fontSize: 12, flexShrink: 0,
                        }}>
                          {initials(u.name)}
                        </div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--muted)", fontSize: 12 }}>{u.email}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <Pill tone={roleTone(u.role)}>{u.role}</Pill>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--muted)" }}>{formatRelative(u.createdAt)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => setEditingProfile(u)}
                          style={{ border: "1px solid var(--line)", background: "rgba(255,255,255,0.8)", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>
                          Perfil
                        </button>
                        <button onClick={() => setEditingUser(u)}
                          style={{ border: "1px solid var(--line)", background: "rgba(255,255,255,0.8)", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>
                          Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {activeTenant && (
        <NewUserDrawer
          open={drawerOpen}
          tenantId={activeTenant.id}
          onClose={() => setDrawerOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {activeTenant && (
        <LinkUserDrawer
          open={linkOpen}
          tenantId={activeTenant.id}
          existingUserIds={users.map((u) => u.userId)}
          onClose={() => setLinkOpen(false)}
          onLinked={(u) => setUsers((prev) => [u, ...prev])}
        />
      )}

      {editingProfile && (
        <EditProfileDrawer
          open={!!editingProfile}
          user={editingProfile}
          onClose={() => setEditingProfile(null)}
          onUpdated={(u) => { handleUpdated(u); setEditingProfile(null); }}
        />
      )}

      {activeTenant && editingUser && (
        <EditUserDrawer
          open={!!editingUser}
          tenantId={activeTenant.id}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={handleUpdated}
          onRemoved={handleRemoved}
        />
      )}
    </>
  );
}
