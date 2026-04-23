import { NextRequest, NextResponse } from "next/server";
import { authorizedBackendFetch, clearAuthCookies, forwardJson } from "@/lib/backend";

export const dynamic = "force-dynamic";

type RouteContext = { params: { userId: string } };

function unauthorizedResponse() {
  clearAuthCookies();
  return NextResponse.json({ error: "UNAUTHORIZED", message: "Sessão expirada", status: 401 }, { status: 401 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Corpo inválido", status: 400 }, { status: 400 });
  }

  let response: Response;
  try {
    response = await authorizedBackendFetch(`/api/v1/auth/users/${context.params.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE", message: "Auth service indisponível.", status: 503 }, { status: 503 });
  }

  if (response.status === 401) return unauthorizedResponse();
  return forwardJson(response);
}
