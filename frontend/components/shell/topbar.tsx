"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTenantContext } from "./tenant-context";
import { Icon } from "@/components/ui/primitives";
import type { TenantResponse } from "@/lib/types";

const MODULE_META: Record<string, { title: string; subtitle: string; icon: string }> = {
  overview:    { title: "Overview",       subtitle: "Visão geral da plataforma",    icon: "overview"    },
  tenants:     { title: "Tenants",        subtitle: "Gerenciamento de contas",      icon: "tenants"     },
  users:       { title: "Usuários",       subtitle: "Membros e convites",           icon: "users"       },
  permissions: { title: "Permissões",     subtitle: "Roles e políticas de acesso",  icon: "permissions" },
  entities:    { title: "Entidades",      subtitle: "Schema builder dinâmico",      icon: "entities"    },
  records:     { title: "Registros",      subtitle: "Dados das entidades",          icon: "records"     },
  settings:    { title: "Configurações",  subtitle: "Preferências do sistema",      icon: "settings"    },
};

const iconBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10,
  border: "1px solid var(--line)", background: "rgba(255,255,255,0.9)",
  cursor: "pointer", color: "var(--foreground)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

type Props = {
  module: string;
  collapsed: boolean;
  onToggleSidebar: () => void;
};

export function Topbar({ module, collapsed, onToggleSidebar }: Props) {
  const [tenantOpen, setTenantOpen] = useState(false);
  const router = useRouter();
  const { tenants, activeTenant, setActiveTenant } = useTenantContext();
  const meta = MODULE_META[module] ?? { title: module, subtitle: "", icon: "overview" };

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function handleSelectTenant(t: TenantResponse) {
    setActiveTenant(t);
    setTenantOpen(false);
  }

  return (
    <header
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "26px 32px 22px", borderBottom: "1px solid var(--line)",
        background: "rgba(253,251,247,0.5)", gap: 20, flexShrink: 0,
      }}
    >
      {/* Left: toggle + hero title */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
        <button
          onClick={onToggleSidebar}
          style={{
            ...iconBtn,
            flexShrink: 0,
          }}
        >
          <Icon name={collapsed ? "arrow" : "chevron"} size={15} style={{ transform: collapsed ? "rotate(0deg)" : "rotate(90deg)" }} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,#0f2f38,#133b45)",
              color: "#f6c79a", display: "grid", placeItems: "center",
              boxShadow: "0 10px 22px rgba(15,47,56,0.28)",
            }}
          >
            <Icon name={meta.icon} size={24} stroke="#f6c79a" />
          </div>
          <div>
            <h1
              style={{
                fontFamily: '"Iowan Old Style","Palatino Linotype",serif',
                fontSize: 40, margin: 0, color: "var(--foreground)",
                letterSpacing: "-0.02em", lineHeight: 1.05,
              }}
            >
              {meta.title}
            </h1>
            <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 4 }}>{meta.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Right: tenant switcher + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
        {/* Tenant switcher */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setTenantOpen((o) => !o)}
            style={{
              border: "1px solid var(--line)", background: "rgba(255,255,255,0.9)",
              borderRadius: 10, padding: "8px 12px",
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
            }}
          >
            {activeTenant ? (
              <>
                <div
                  style={{
                    width: 24, height: 24, borderRadius: 7,
                    background: "linear-gradient(135deg,#d36d3f,#b44a1e)",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    display: "grid", placeItems: "center",
                  }}
                >
                  {activeTenant.slug.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeTenant.name}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Selecionar tenant</span>
            )}
            <Icon name="chevron" size={13} stroke="var(--muted)" />
          </button>

          {tenantOpen && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0,
                background: "#fff", border: "1px solid var(--line)", borderRadius: 12,
                boxShadow: "0 8px 32px rgba(19,33,47,0.14)", padding: 8,
                minWidth: 240, zIndex: 100,
              }}
            >
              {tenants.length === 0 ? (
                <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--muted)" }}>
                  Nenhum tenant disponível
                </div>
              ) : (
                tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTenant(t)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "10px 12px", border: 0, borderRadius: 8,
                      background: activeTenant?.id === t.id ? "rgba(19,33,47,0.06)" : "transparent",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        background: "#13212f", color: "#f6c79a",
                        display: "grid", placeItems: "center",
                        fontFamily: '"Iowan Old Style",serif', fontSize: 13,
                      }}
                    >
                      {t.name[0]}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "ui-monospace,monospace" }}>{t.slug}</div>
                    </div>
                  </button>
                ))
              )}
              <div style={{ borderTop: "1px solid var(--line)", marginTop: 6, paddingTop: 6 }}>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex", width: "100%", padding: "8px 12px", border: 0,
                    borderRadius: 8, background: "transparent", color: "#8a2f2f",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left",
                  }}
                >
                  Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>

        <button style={iconBtn}><Icon name="help" size={16} /></button>
        <button style={iconBtn}><Icon name="bell" size={16} /></button>
      </div>
    </header>
  );
}
