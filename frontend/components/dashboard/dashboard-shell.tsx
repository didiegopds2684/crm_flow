"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  useTransition
} from "react";

import EntityEnginePanel from "@/components/dashboard/entity-engine-panel";
import PermissionSnapshotPanel from "@/components/dashboard/permission-snapshot-panel";
import TenantUsersPanel from "@/components/dashboard/tenant-users-panel";
import { formatInstant } from "@/lib/utils";
import type {
  ApiError,
  ApiResponse,
  TenantResponse,
  UserResponse
} from "@/lib/types";

const planOptions = ["FREE", "PRO", "ENTERPRISE"];

export default function DashboardShell() {
  const router = useRouter();
  const [session, setSession] = useState<UserResponse | null>(null);
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isTenantDrawerOpen, setIsTenantDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      const [sessionResponse, tenantsResponse] = await Promise.all([
        fetch("/api/auth/session", { cache: "no-store" }),
        fetch("/api/tenants", { cache: "no-store" })
      ]);

      if (!active) {
        return;
      }

      if (sessionResponse.status === 401 || tenantsResponse.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!sessionResponse.ok || !tenantsResponse.ok) {
        const body = (await tenantsResponse.json().catch(() => null)) as
          | ApiError
          | null;
        setError(body?.message || "Não foi possível carregar o dashboard.");
        setLoading(false);
        return;
      }

      const sessionBody = (await sessionResponse.json()) as ApiResponse<UserResponse>;
      const tenantsBody =
        (await tenantsResponse.json()) as ApiResponse<TenantResponse[]>;

      setSession(sessionBody.data);
      const nextTenants = tenantsBody.data ?? [];
      setTenants(nextTenants);
      setSelectedTenantId((current) => current ?? nextTenants[0]?.id ?? null);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!isTenantDrawerOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsTenantDrawerOpen(false);
      }
    }

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isTenantDrawerOpen]);

  const tenantCountLabel = useMemo(() => {
    if (tenants.length === 1) {
      return "1 tenant ativo";
    }

    return `${tenants.length} tenants ativos`;
  }, [tenants.length]);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [selectedTenantId, tenants]
  );

  function handleCreateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      plan: String(formData.get("plan") ?? "")
    };

    setCreateError(null);
    setCreateSuccess(null);

    startCreateTransition(async () => {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null) as ApiError | null;
        setCreateError(body?.message || "Falha ao criar tenant. Tente novamente.");
        return;
      }

      const body = (await response.json()) as ApiResponse<TenantResponse>;
      setTenants((current) => [body.data, ...current]);
      setSelectedTenantId(body.data.id);
      setCreateSuccess(body.message || "Tenant criado com sucesso.");
      setIsTenantDrawerOpen(false);
      form.reset();
    });
  }

  function handleLogout() {
    startLogoutTransition(async () => {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <main className="grain min-h-screen px-6 py-8 sm:px-10">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <header className="panel flex flex-col gap-5 rounded-[2rem] p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Tenant Admin Dashboard</span>
            <div>
              <h1 className="display-font text-4xl text-ink sm:text-5xl">
                Operação inicial do CRM Flow
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
                O dashboard agora acompanha melhor o que o backend já expõe:
                autenticação, tenants, vínculos de usuários, permissões e o início
                do entity engine por tenant.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-slate-900/8 bg-white/75 px-4 py-3 text-sm text-slate-700">
              {session ? `${session.name} • ${session.email}` : "Carregando sessão"}
            </div>
            <button
              className="button-secondary"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? "Encerrando..." : "Sair"}
            </button>
          </div>
        </header>

        {createSuccess ? (
          <div className="panel rounded-[1.6rem] border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm text-emerald-800">
            {createSuccess}
          </div>
        ) : null}

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="panel rounded-[1.6rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Escopo ativo
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink">
                Auth + Tenants + Users
              </p>
            </article>
            <article className="panel rounded-[1.6rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Inventário
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink">
                {loading ? "..." : tenantCountLabel}
              </p>
            </article>
            <article className="panel rounded-[1.6rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Módulos
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink">4 visões</p>
            </article>
            <article className="panel rounded-[1.6rem] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Atalho
              </p>
              <button
                className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
                onClick={() => {
                  setCreateError(null);
                  setCreateSuccess(null);
                  setIsTenantDrawerOpen(true);
                }}
                type="button"
              >
                Novo tenant
              </button>
            </article>
          </div>

          <section className="panel rounded-[2rem] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-ink">
                  Tenant em foco
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  A seleção abaixo define o contexto principal do dashboard:
                  memberships, permissões e entity engine usam esse tenant.
                </p>
              </div>
              <div className="rounded-full border border-slate-900/8 bg-white/75 px-4 py-3 text-sm text-slate-700">
                {selectedTenant ? selectedTenant.slug : "Nenhum tenant selecionado"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-[1.5rem] border border-slate-900/8 bg-white/55"
                  />
                ))
              ) : tenants.length > 0 ? (
                tenants.map((tenant) => {
                  const isSelected = tenant.id === selectedTenantId;

                  return (
                    <button
                      key={tenant.id}
                      className={`rounded-[1.5rem] border p-5 text-left transition ${
                        isSelected
                          ? "border-slate-900/25 bg-slate-900 text-white shadow-lg"
                          : "border-slate-900/8 bg-white/70 text-ink"
                      }`}
                      onClick={() => setSelectedTenantId(tenant.id)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold">{tenant.name}</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                            isSelected
                              ? "bg-white/15 text-white"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {tenant.plan}
                        </span>
                      </div>
                      <p
                        className={`mt-2 text-sm ${
                          isSelected ? "text-white/75" : "text-slate-600"
                        }`}
                      >
                        slug: <span className="font-mono">{tenant.slug}</span>
                      </p>
                      <p
                        className={`mt-4 text-sm ${
                          isSelected ? "text-white/75" : "text-slate-500"
                        }`}
                      >
                        Criado em {formatInstant(tenant.createdAt)}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-900/16 bg-white/60 p-6 text-sm leading-7 text-slate-600 md:col-span-2 xl:col-span-4">
                  Nenhum tenant encontrado. Crie um tenant para ativar o entity engine.
                </div>
              )}
            </div>
          </section>

          <TenantUsersPanel
            tenantId={selectedTenantId}
            tenantName={selectedTenant?.name ?? null}
          />

          <PermissionSnapshotPanel
            tenantId={selectedTenantId}
            tenantName={selectedTenant?.name ?? null}
          />

          <section className="panel rounded-[2rem] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-ink">
                  Tenants disponíveis
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  O backend atual já permite listar e criar empresas, incluindo
                  o provisionamento do schema PostgreSQL.
                </p>
              </div>
            </div>

            {error ? (
              <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-[1.5rem] border border-slate-900/8 bg-white/55"
                  />
                ))
              ) : tenants.length > 0 ? (
                tenants.map((tenant) => (
                  <article
                    key={tenant.id}
                    className="rounded-[1.5rem] border border-slate-900/8 bg-white/70 p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-ink">
                            {tenant.name}
                          </h3>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                            {tenant.plan}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                            {tenant.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          slug: <span className="font-mono">{tenant.slug}</span>
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">
                        Criado em {formatInstant(tenant.createdAt)}
                      </p>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-900/4 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        Settings
                      </p>
                      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {JSON.stringify(tenant.settings ?? {}, null, 2)}
                      </pre>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-900/16 bg-white/60 p-6 text-sm leading-7 text-slate-600 xl:col-span-2">
                  Nenhum tenant encontrado. Use o botão flutuante para
                  provisionar o primeiro schema do ambiente.
                </div>
              )}
            </div>
          </section>

          <EntityEnginePanel
            tenantId={selectedTenantId}
            tenantName={selectedTenant?.name ?? null}
          />

          <section className="panel rounded-[2rem] p-6">
            <h2 className="text-xl font-semibold text-ink">Mapa do MVP</h2>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50/90 p-4 text-sm leading-7 text-slate-700">
                <p className="font-semibold text-emerald-800">
                  Entregue agora
                </p>
                <p>
                  Autenticação, sessão, gestão de tenants, atribuição de usuários,
                  snapshot de permissões e builder inicial do entity engine.
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50/90 p-4 text-sm leading-7 text-slate-700">
                <p className="font-semibold text-amber-800">
                  Proximo passo
                </p>
                <p>
                  Completar edição/exclusão, busca global de usuários no auth-service
                  e políticas editáveis por role e entidade.
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>

      <button
        aria-expanded={isTenantDrawerOpen}
        className="button-primary fixed bottom-6 right-6 z-40 flex items-center gap-3 px-5 py-4 shadow-[0_20px_45px_rgba(19,33,47,0.28)]"
        onClick={() => {
          setCreateError(null);
          setCreateSuccess(null);
          setIsTenantDrawerOpen(true);
        }}
        type="button"
      >
        <span className="text-xl leading-none">+</span>
        <span>Novo tenant</span>
      </button>

      <div
        aria-hidden={!isTenantDrawerOpen}
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm transition ${
          isTenantDrawerOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsTenantDrawerOpen(false)}
      />

      <aside
        aria-hidden={!isTenantDrawerOpen}
        className={`panel-strong fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-900/10 shadow-[0_24px_80px_rgba(19,33,47,0.22)] transition-transform duration-300 ${
          isTenantDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-900/8 px-6 py-6">
          <div>
            <span className="eyebrow">Tenant Setup</span>
            <h2 className="mt-4 text-3xl font-semibold text-ink">Novo tenant</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Cria a empresa no `tenant-service` e dispara o setup do schema
              correspondente no PostgreSQL.
            </p>
          </div>
          <button
            className="button-secondary px-4"
            onClick={() => setIsTenantDrawerOpen(false)}
            type="button"
          >
            Fechar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form className="space-y-4" onSubmit={handleCreateTenant}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Nome</span>
              <input
                required
                className="field"
                name="name"
                placeholder="Acme Operações"
                type="text"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Slug</span>
              <input
                required
                className="field font-mono"
                name="slug"
                pattern="^[a-z0-9-]+$"
                placeholder="acme-operacoes"
                type="text"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Plano</span>
              <select className="field" defaultValue="FREE" name="plan">
                {planOptions.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan}
                  </option>
                ))}
              </select>
            </label>

            {createError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createError}
              </p>
            ) : null}

            <div className="rounded-[1.4rem] bg-slate-900/4 p-4 text-sm leading-7 text-slate-600">
              O tenant criado entra imediatamente na visão principal e passa a ser
              selecionado como contexto ativo do dashboard.
            </div>

            <button className="button-primary w-full" disabled={isCreating} type="submit">
              {isCreating ? "Provisionando..." : "Criar tenant"}
            </button>
          </form>
        </div>
      </aside>
    </main>
  );
}
