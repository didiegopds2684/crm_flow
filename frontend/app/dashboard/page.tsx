import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/dashboard-shell";
import { hasSessionCookies } from "@/lib/backend";

export default function DashboardPage() {
  if (!hasSessionCookies()) {
    redirect("/login");
  }

  return <DashboardShell />;
}

