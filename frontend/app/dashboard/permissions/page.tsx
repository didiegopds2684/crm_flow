"use client";

import { useState, useEffect } from "react";
import { Card, Pill, GhostBtn, PrimaryBtn } from "@/components/ui/primitives";
import { useTenantContext } from "@/components/shell/tenant-context";
import type { RoleResponse, PolicyResponse, ApiResponse } from "@/lib/types";

type PolicyState = "allow" | "deny" | "inherit";
type PolicyMatrix = Record<string, Record<string, PolicyState>>; // entity -> action -> state

const ACTIONS = ["read", "write", "delete", "export"];

function cycleState(s: PolicyState): PolicyState {
  return s === "allow" ? "deny" : s === "deny" ? "inherit" : "allow";
}

function PolicyCell({ state, onClick }: { state: PolicyState; onClick: () => void }) {
  const bg    = state === "inherit" ? "rgba(19,33,47,0.04)" : state === "allow" ? "rgba(31,77,71,0.14)" : "rgba(138,47,47,0.14)";
  const color = state === "inherit" ? "rgba(19,33,47,0.3)" : state === "allow" ? "#1f4d47" : "#8a2f2f";
  return (
    <td style={{ padding: "10px 10px", textAlign: "center" }}>
      <div onClick={onClick} style={{ width: 30, height: 30, margin: "0 auto", borderRadius: 8, display: "grid", placeItems: "center", background: bg, color, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
        {state === "allow" ? "✓" : state === "deny" ? "✕" : "–"}
      </div>
    </td>
  );
}

function LegendDot({ c, l }: { c: string; l: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} /> {l}
    </span>
  );
}

function buildMatrix(policies: PolicyResponse[], roleId: string): PolicyMatrix {
  const matrix: PolicyMatrix = {};
  policies.filter((p) => p.roleId === roleId).forEach((p) => {
    if (!matrix[p.entitySlug]) matrix[p.entitySlug] = {};
    matrix[p.entitySlug][p.action] = p.effect.toLowerCase() as PolicyState;
  });
  return matrix;
}

function getEntities(policies: PolicyResponse[]): string[] {
  return [...new Set(policies.map((p) => p.entitySlug))].sort();
}

export default function PermissionsPage() {
  const { activeTenant } = useTenantContext();
  const [roles, setRoles]           = useState<RoleResponse[]>([]);
  const [policies, setPolicies]     = useState<PolicyResponse[]>([]);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [matrix, setMatrix]         = useState<PolicyMatrix>({});
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (!activeTenant) { setRoles([]); setPolicies([]); return; }
    setLoading(true);

    Promise.all([
      fetch(`/api/permissions/roles?tenantId=${activeTenant.id}`).then((r) => r.json()),
      fetch(`/api/permissions/policies?tenantId=${activeTenant.id}`).then((r) => r.json()),
    ])
      .then(([rolesData, policiesData]: [ApiResponse<RoleResponse[]>, ApiResponse<PolicyResponse[]>]) => {
        const r = rolesData.data ?? [];
        const p = policiesData.data ?? [];
        setRoles(r);
        setPolicies(p);
        if (r.length > 0) {
          const firstId = r[0].id;
          setActiveRoleId(firstId);
          setMatrix(buildMatrix(p, firstId));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTenant]);

  function selectRole(id: string) {
    setActiveRoleId(id);
    setMatrix(buildMatrix(policies, id));
  }

  function toggleCell(entity: string, action: string) {
    setMatrix((prev) => {
      const cur = prev[entity]?.[action] ?? "inherit";
      return { ...prev, [entity]: { ...(prev[entity] ?? {}), [action]: cycleState(cur) } };
    });
  }

  const activeRole = roles.find((r) => r.id === activeRoleId);
  const entities   = getEntities(policies);

  if (!activeTenant) {
    return (
      <div style={{ padding: 28 }}>
        <Card>
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>◇</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Selecione um tenant</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>As permissões são configuradas por tenant.</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, overflow: "auto", height: "100%" }}>
      {/* Roles list */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>Roles</div>
          <button style={{ border: 0, background: "none", color: "#b44a1e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nova role</button>
        </div>
        {loading ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>Carregando…</div>
        ) : roles.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>Nenhuma role criada.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", padding: 8 }}>
            {roles.map((r) => {
              const active = r.id === activeRoleId;
              const policyCount = policies.filter((p) => p.roleId === r.id).length;
              return (
                <button key={r.id} onClick={() => selectRole(r.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", border: 0, borderRadius: 10, cursor: "pointer", background: active ? "rgba(19,33,47,0.06)" : "transparent", textAlign: "left", width: "100%" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: "rgba(211,109,63,0.1)", color: "#b44a1e", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>
                    {r.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                      {!r.system && <Pill tone="violet">CUSTOM</Pill>}
                    </div>
                    {r.description && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{r.description}</div>}
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>
                    <div>{policyCount} policies</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Policy detail */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {activeRole ? (
          <>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ fontFamily: '"Iowan Old Style",serif', fontSize: 24, margin: 0 }}>{activeRole.name}</h2>
                    <Pill tone={activeRole.system ? "blue" : "violet"}>{activeRole.system ? "Sistema" : "Custom"}</Pill>
                  </div>
                  {activeRole.description && (
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{activeRole.description}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <GhostBtn>Duplicar role</GhostBtn>
                  <PrimaryBtn>Salvar mudanças</PrimaryBtn>
                </div>
              </div>
            </Card>

            <Card style={{ padding: 0 }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Matriz de políticas</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Clique em qualquer célula para alternar (allow / deny / inherit)</div>
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--muted)" }}>
                  <LegendDot c="#1f4d47" l="Allow" />
                  <LegendDot c="#8a2f2f" l="Deny" />
                  <LegendDot c="rgba(19,33,47,0.15)" l="Inherit" />
                </div>
              </div>
              {entities.length === 0 ? (
                <div style={{ padding: 24, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>Nenhuma política definida para esta role.</div>
              ) : (
                <div style={{ padding: 18, overflow: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>Entidade</th>
                        {ACTIONS.map((a) => (
                          <th key={a} style={{ padding: "8px 10px", fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>{a}</th>
                        ))}
                        <th style={{ padding: "8px 10px", fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>Prioridade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entities.map((e, ei) => (
                        <tr key={e} style={{ borderTop: ei === 0 ? "none" : "1px solid var(--line)" }}>
                          <td style={{ padding: "12px 10px", fontWeight: 600, fontFamily: "ui-monospace,monospace", fontSize: 13 }}>{e}</td>
                          {ACTIONS.map((a) => (
                            <PolicyCell key={a} state={matrix[e]?.[a] ?? "inherit"} onClick={() => toggleCell(e, a)} />
                          ))}
                          <td style={{ padding: "10px 10px", textAlign: "center", fontFamily: "ui-monospace,monospace", fontSize: 12 }}>
                            {policies.find((p) => p.roleId === activeRoleId && p.entitySlug === e)?.priority ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        ) : (
          !loading && (
            <Card>
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Selecione uma role para ver as políticas.</div>
              </div>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
