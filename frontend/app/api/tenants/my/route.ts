import { NextResponse } from "next/server";
import { authorizedBackendFetch, clearAuthCookies, forwardJson } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  let response: Response;
  try {
    response = await authorizedBackendFetch("/api/v1/tenants/my");
  } catch {
    return NextResponse.json(
      { error: "BACKEND_UNAVAILABLE", message: "Tenant service indisponível.", status: 503 },
      { status: 503 }
    );
  }

  if (response.status === 401) {
    clearAuthCookies();
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Sessão expirada", status: 401 },
      { status: 401 }
    );
  }

  return forwardJson(response);
}
