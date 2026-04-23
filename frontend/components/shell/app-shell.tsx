"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TenantProvider, useTenantContext } from "./tenant-context";
import type { UserResponse, TenantResponse, ApiResponse } from "@/lib/types";

function ShellInner({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const pathname = usePathname();
  const { setTenants, setActiveTenant, activeTenant, tenants } = useTenantContext();

  const module = pathname.split("/")[2] ?? "overview";

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d: ApiResponse<UserResponse>) => { if (d.data) setUser(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/tenants/my")
      .then((r) => r.json())
      .then((d: ApiResponse<TenantResponse[]>) => {
        if (!d.data) return;
        setTenants(d.data);

        // Validate that the stored tenant still belongs to this user.
        // If not (e.g. user switched accounts), clear it and auto-select.
        const storedStillValid = activeTenant && d.data.some((t) => t.id === activeTenant.id);
        if (!storedStillValid) {
          if (d.data.length === 1) setActiveTenant(d.data[0]);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} user={user} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Topbar
          module={module}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />
        <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider>
      <ShellInner>{children}</ShellInner>
    </TenantProvider>
  );
}
