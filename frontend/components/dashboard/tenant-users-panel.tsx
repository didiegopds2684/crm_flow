"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { formatInstant } from "@/lib/utils";
import type {
  ApiError,
  ApiResponse,
  TenantUserResponse
} from "@/lib/types";

const roleOptions = ["TENANT_ADMIN", "MANAGER", "OPERATOR", "VIEWER"];

type TenantUsersPanelProps = {
  tenantId: string | null;
  tenantName: string | null;
};

export default function TenantUsersPanel({
  tenantId,
  tenantName
}: TenantUsersPanelProps) {
  const router = useRouter();
  const [memberships, setMemberships] = useState<TenantUserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("OPERATOR");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();

  useEffect(() => {
    if (!tenantId) {
      setMemberships([]);
      return;
    }

    let active = true;

    async function loadMemberships() {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tenants/${tenantId}/users`, {
        cache: "no-store"
      });

      if (!active) {
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiError | null;
        setError(body?.message || "Nao foi possivel carregar os usuarios do tenant.");
        setMemberships([]);
        setLoading(false);
        return;
      }

      const body = (await response.json()) as ApiResponse<TenantUserResponse[]>;
      setMemberships(body.data ?? []);
      setLoading(false);
    }

    void loadMemberships();

    return () => {
      active = false;
    };
  }, [router, tenantId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenantId) {
      setSubmitError("Selecione um tenant antes de atribuir usuarios.");
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);

    startSubmitTransition(async () => {
      const response = await fetch(`/api/tenants/${tenantId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userId.trim(),
          role
        })
      });

      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiError | null;
        setSubmitError(body?.message || "Falha ao vincular o usuario ao tenant.");
        return;
      }

      const body = (await response.json()) as ApiResponse<TenantUserResponse>;
      setMemberships((current) => [body.data, ...current]);
      setSubmitSuccess(body.message || "Usuario vinculado com sucesso.");
      setUserId("");
      setRole("OPERATOR");
    });
  }

  async function handleRemoveMembership(member: TenantUserResponse) {
    if (!tenantId) {
      return;
    }

    setPendingRemoval(member.userId);

    const response = await fetch(`/api/tenants/${tenantId}/users/${member.userId}`, {
      method: "DELETE"
    });

    if (response.status === 401) {
      router.replace("/login");
      router.refresh();
      return;
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiError | null;
      setSubmitError(body?.message || "Nao foi possivel remover o usuario do tenant.");
      setPendingRemoval(null);
      return;
    }

    setMemberships((current) => current.filter((item) => item.userId !== member.userId));
    setSubmitSuccess("Usuario removido do tenant.");
    setPendingRemoval(null);
  }

  if (!tenantId) {
    return (
      <section className="panel rounded-[2rem] p-6">
        <h2 className="text-2xl font-semibold text-ink">Usuarios por Tenant</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Selecione um tenant para listar membros e atribuir roles.
        </p>
      </section>
    );
  }

  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Usuarios por Tenant</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Viculos carregados do `tenant-service` para{" "}
            <span className="font-semibold text-ink">{tenantName ?? tenantId}</span>.
          </p>
        </div>
        <div className="rounded-full border border-slate-900/8 bg-white/75 px-4 py-3 text-sm text-slate-700">
          {loading ? "Carregando membros..." : `${memberships.length} vinculados`}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5">
          <div>
            <h3 className="text-xl font-semibold text-ink">Atribuir usuario</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              O backend atual nao expõe listagem global de usuarios. Aqui a atribuicao
              usa o `userId` direto retornado no registro ou em `/auth/me`.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">User ID</span>
              <input
                required
                className="field font-mono"
                onChange={(event) => setUserId(event.target.value)}
                placeholder="UUID do usuario"
                type="text"
                value={userId}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Role no tenant</span>
              <select
                className="field"
                onChange={(event) => setRole(event.target.value)}
                value={role}
              >
                {roleOptions.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            {submitError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </p>
            ) : null}

            {submitSuccess ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {submitSuccess}
              </p>
            ) : null}

            <button className="button-primary w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Vinculando..." : "Adicionar ao tenant"}
            </button>
          </form>
        </section>

        <section className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5">
          <div>
            <h3 className="text-xl font-semibold text-ink">Membros atuais</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Relacao atual de `tenant_users`, incluindo role aplicada no schema.
            </p>
          </div>

          {error ? (
            <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-[1.3rem] border border-slate-900/8 bg-white/70"
                />
              ))
            ) : memberships.length > 0 ? (
              memberships.map((member) => (
                <article
                  key={member.id}
                  className="rounded-[1.3rem] border border-slate-900/8 bg-white/85 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                          {member.role}
                        </span>
                        <span className="text-sm text-slate-500">
                          Criado em {formatInstant(member.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        User ID
                      </p>
                      <p className="mt-1 font-mono text-sm text-slate-700">
                        {member.userId}
                      </p>
                    </div>

                    <button
                      className="button-secondary"
                      disabled={pendingRemoval === member.userId}
                      onClick={() => void handleRemoveMembership(member)}
                      type="button"
                    >
                      {pendingRemoval === member.userId ? "Removendo..." : "Remover"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.3rem] border border-dashed border-slate-900/16 bg-white/60 p-5 text-sm leading-7 text-slate-600">
                Nenhum usuario vinculado a este tenant alem do fluxo inicial.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
