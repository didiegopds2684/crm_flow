"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatInstant } from "@/lib/utils";
import type {
  ApiError,
  ApiResponse,
  PolicyResponse,
  RoleResponse
} from "@/lib/types";

type PermissionSnapshotPanelProps = {
  tenantId: string | null;
  tenantName: string | null;
};

export default function PermissionSnapshotPanel({
  tenantId,
  tenantName
}: PermissionSnapshotPanelProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [policies, setPolicies] = useState<PolicyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policiesByRole = useMemo(() => {
    return policies.reduce<Record<string, PolicyResponse[]>>((accumulator, policy) => {
      if (!accumulator[policy.roleId]) {
        accumulator[policy.roleId] = [];
      }

      accumulator[policy.roleId].push(policy);
      return accumulator;
    }, {});
  }, [policies]);

  useEffect(() => {
    if (!tenantId) {
      setRoles([]);
      setPolicies([]);
      return;
    }

    let active = true;

    async function loadPermissionSnapshot() {
      setLoading(true);
      setError(null);

      const [rolesResponse, policiesResponse] = await Promise.all([
        fetch(`/api/permissions/roles?tenantId=${tenantId}`, { cache: "no-store" }),
        fetch(`/api/permissions/policies?tenantId=${tenantId}`, { cache: "no-store" })
      ]);

      if (!active) {
        return;
      }

      if (rolesResponse.status === 401 || policiesResponse.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if (!rolesResponse.ok || !policiesResponse.ok) {
        const body = (await policiesResponse.json().catch(() => null)) as ApiError | null;
        setError(body?.message || "Nao foi possivel carregar roles e politicas.");
        setRoles([]);
        setPolicies([]);
        setLoading(false);
        return;
      }

      const rolesBody = (await rolesResponse.json()) as ApiResponse<RoleResponse[]>;
      const policiesBody = (await policiesResponse.json()) as ApiResponse<PolicyResponse[]>;
      setRoles(rolesBody.data ?? []);
      setPolicies(policiesBody.data ?? []);
      setLoading(false);
    }

    void loadPermissionSnapshot();

    return () => {
      active = false;
    };
  }, [router, tenantId]);

  if (!tenantId) {
    return (
      <section className="panel rounded-[2rem] p-6">
        <h2 className="text-2xl font-semibold text-ink">Permissoes do Tenant</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Selecione um tenant para inspecionar roles e politicas cadastradas.
        </p>
      </section>
    );
  }

  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Permissoes do Tenant</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Snapshot do `permission-service` para{" "}
            <span className="font-semibold text-ink">{tenantName ?? tenantId}</span>.
          </p>
        </div>
        <div className="rounded-full border border-slate-900/8 bg-white/75 px-4 py-3 text-sm text-slate-700">
          {loading ? "Carregando..." : `${roles.length} roles • ${policies.length} politicas`}
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5">
          <div>
            <h3 className="text-xl font-semibold text-ink">Roles</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Inclui as roles de sistema criadas no bootstrap do tenant.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[1.3rem] border border-slate-900/8 bg-white/70"
                />
              ))
            ) : roles.length > 0 ? (
              roles.map((role) => (
                <article
                  key={role.id}
                  className="rounded-[1.3rem] border border-slate-900/8 bg-white/85 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-semibold text-ink">{role.name}</h4>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                          {role.slug}
                        </span>
                        {role.system ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800">
                            System
                          </span>
                        ) : null}
                      </div>
                      {role.description ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {role.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-sm text-slate-500">
                      {formatInstant(role.createdAt)}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.3rem] border border-dashed border-slate-900/16 bg-white/60 p-5 text-sm leading-7 text-slate-600">
                Nenhuma role encontrada neste tenant.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-slate-900/8 bg-white/70 p-5">
          <div>
            <h3 className="text-xl font-semibold text-ink">Politicas por role</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Leitura direta das policies associadas a cada role no schema do tenant.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-[1.3rem] border border-slate-900/8 bg-white/70"
                />
              ))
            ) : roles.length > 0 ? (
              roles.map((role) => {
                const rolePolicies = policiesByRole[role.id] ?? [];

                return (
                  <article
                    key={role.id}
                    className="rounded-[1.3rem] border border-slate-900/8 bg-white/85 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-ink">{role.name}</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {rolePolicies.length} politicas ativas
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {rolePolicies.length > 0 ? (
                        rolePolicies
                          .slice()
                          .sort((left, right) => right.priority - left.priority)
                          .map((policy) => (
                            <div
                              key={policy.id}
                              className="rounded-2xl bg-slate-900/4 px-4 py-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-800">
                                  {policy.entitySlug}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                                  {policy.action}
                                </span>
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                                  {policy.effect}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                                  prioridade {policy.priority}
                                </span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-900/16 bg-white/60 px-4 py-3 text-sm text-slate-600">
                          Nenhuma politica configurada para esta role.
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.3rem] border border-dashed border-slate-900/16 bg-white/60 p-5 text-sm leading-7 text-slate-600">
                Nenhuma role disponivel para montar o snapshot de politicas.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
