import { NextRequest, NextResponse } from "next/server";
import { authorizedBackendFetch, clearAuthCookies, forwardJson } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "email é obrigatório", status: 400 }, { status: 400 });
  }

  let response: Response;
  try {
    response = await authorizedBackendFetch(`/api/v1/auth/users/search?email=${encodeURIComponent(email)}`);
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE", message: "Auth service indisponível.", status: 503 }, { status: 503 });
  }

  if (response.status === 401) {
    clearAuthCookies();
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Sessão expirada", status: 401 }, { status: 401 });
  }

  return forwardJson(response);
}
