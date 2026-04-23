"use client";

import { Card } from "@/components/ui/primitives";
import { useTenantContext } from "@/components/shell/tenant-context";

export default function SettingsPage() {
  const { activeTenant } = useTenantContext();

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Tenant ativo</div>
        {activeTenant ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { l: "Nome",   v: activeTenant.name },
              { l: "Slug",   v: activeTenant.slug },
              { l: "Plano",  v: activeTenant.plan },
              { l: "Status", v: activeTenant.status },
            ].map(({ l, v }) => (
              <div key={l} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 100, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>{l}</div>
                <div style={{ fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Nenhum tenant selecionado.</div>
        )}
      </Card>

      <Card>
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Configurações em construção</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Preferências avançadas serão adicionadas nas próximas versões.</div>
        </div>
      </Card>
    </div>
  );
}
