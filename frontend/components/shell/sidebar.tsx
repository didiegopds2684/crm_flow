"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTenantContext } from "./tenant-context";
import { Icon } from "@/components/ui/primitives";
import type { UserResponse } from "@/lib/types";

const MODULES = [
  { id: "overview",    label: "Overview",       icon: "overview",    href: "/dashboard/overview",    group: "Workspace" },
  { id: "tenants",     label: "Tenants",        icon: "tenants",     href: "/dashboard/tenants",     group: "Workspace" },
  { id: "users",       label: "Usuários",       icon: "users",       href: "/dashboard/users",       group: "Pessoas"   },
  { id: "permissions", label: "Permissões",     icon: "permissions", href: "/dashboard/permissions", group: "Pessoas"   },
  { id: "entities",    label: "Entidades",      icon: "entities",    href: "/dashboard/entities",    group: "Dados"     },
  { id: "records",     label: "Registros",      icon: "records",     href: "/dashboard/records",     group: "Dados"     },
  { id: "settings",    label: "Configurações",  icon: "settings",    href: "/dashboard/settings",    group: "Sistema"   },
];

const GROUP_ICONS: Record<string, string> = {
  Workspace: "logo",
  Pessoas:   "users",
  Dados:     "entities",
  Sistema:   "settings",
};

const SB_BG     = "#0f2f38";
const SB_BG2    = "#133b45";
const SB_LINE   = "rgba(255,255,255,0.08)";
const SB_TEXT   = "#e4ecea";
const SB_MUTED  = "rgba(228,236,234,0.55)";
const SB_ACTIVE = "#d36d3f";
const SB_ACTBG  = "rgba(211,109,63,0.14)";

type Props = {
  collapsed: boolean;
  user: UserResponse | null;
};

export function Sidebar({ collapsed, user }: Props) {
  const pathname = usePathname();
  const { activeTenant } = useTenantContext();

  const groups: Record<string, typeof MODULES> = {};
  MODULES.forEach((m) => {
    if (!groups[m.group]) groups[m.group] = [];
    groups[m.group].push(m);
  });

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")
    : "?";

  return (
    <aside
      style={{
        width: collapsed ? 76 : 256,
        flexShrink: 0,
        background: `linear-gradient(180deg, ${SB_BG} 0%, ${SB_BG2} 100%)`,
        color: SB_TEXT,
        borderRight: `1px solid ${SB_LINE}`,
        display: "flex", flexDirection: "column",
        padding: collapsed ? "22px 10px" : "22px 16px",
        gap: 18,
        height: "100vh", position: "sticky", top: 0,
        transition: "width 200ms ease",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: collapsed ? 0 : "2px 4px" }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: `linear-gradient(135deg, ${SB_ACTIVE}, #b44a1e)`,
            color: "#fff", display: "grid", placeItems: "center",
            boxShadow: "0 8px 18px rgba(211,109,63,0.35)",
          }}
        >
          <Icon name="logo" size={20} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: '"Iowan Old Style",serif', fontSize: 18, lineHeight: 1, color: "#fff" }}>
              CRM Flow
            </div>
            <div style={{ fontSize: 10.5, color: SB_MUTED, marginTop: 4, letterSpacing: ".14em", textTransform: "uppercase" }}>
              Operations
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 9,
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${SB_LINE}`, borderRadius: 10,
            padding: "8px 10px", color: SB_MUTED, fontSize: 13,
          }}
        >
          <Icon name="search" size={15} stroke={SB_MUTED} />
          <span style={{ flex: 1 }}>Buscar…</span>
          <kbd
            style={{
              fontFamily: "ui-monospace,monospace", fontSize: 10,
              background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 6,
              color: SB_TEXT,
            }}
          >
            ⌘K
          </kbd>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "auto", flex: 1 }}>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            {!collapsed && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  fontSize: 10.5, fontWeight: 700, letterSpacing: ".18em",
                  textTransform: "uppercase", color: SB_MUTED,
                  padding: "0 8px 8px",
                }}
              >
                <Icon name={GROUP_ICONS[group] ?? "overview"} size={12} stroke={SB_MUTED} />
                <span>{group}</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map((m) => {
                const isActive = pathname.startsWith(m.href);
                return (
                  <Link
                    key={m.id}
                    href={m.href}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: collapsed ? "11px 0" : "10px 11px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius: 10,
                      background: isActive ? SB_ACTBG : "transparent",
                      color: isActive ? "#ffd9c0" : SB_TEXT,
                      fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                      textDecoration: "none",
                      position: "relative",
                    }}
                  >
                    {isActive && (
                      <span style={{
                        position: "absolute",
                        left: collapsed ? 8 : 0,
                        top: 8, bottom: 8,
                        width: 3, borderRadius: 3,
                        background: SB_ACTIVE,
                      }} />
                    )}
                    <Icon
                      name={m.icon}
                      size={17}
                      stroke={isActive ? SB_ACTIVE : SB_TEXT}
                    />
                    {!collapsed && <span style={{ whiteSpace: "nowrap" }}>{m.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User info */}
      <div
        style={{
          borderTop: `1px solid ${SB_LINE}`,
          display: "flex", alignItems: "center", gap: 10,
          padding: collapsed ? "14px 0 0" : "14px 8px 0",
        }}
      >
        <div
          style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: "#d9c6a8", color: "#0f2f38",
            display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13,
          }}
        >
          {initials}
        </div>
        {!collapsed && (
          <div style={{ lineHeight: 1.2, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name ?? "Usuário"}
            </div>
            <div style={{ fontSize: 11, color: SB_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeTenant ? `Admin · ${activeTenant.slug}` : (user?.email ?? "")}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
