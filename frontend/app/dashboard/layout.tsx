import { redirect } from "next/navigation";
import { hasSessionCookies } from "@/lib/backend";
import { AppShell } from "@/components/shell/app-shell";

// Impede qualquer tentativa de cache/pré-render — cookies() exige contexto de request
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasSessionCookies()) {
    redirect("/login");
  }
  return <AppShell>{children}</AppShell>;
}
