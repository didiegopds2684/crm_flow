import { NextResponse } from "next/server";

import {
  authorizedBackendFetch,

  clearAuthCookies,
  forwardJson
} from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = await authorizedBackendFetch("/api/v1/tenants");

  if (response.status === 401) {
    clearAuthCookies();
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
        message: "Sessão expirada",
        status: 401
      },
      { status: 401 }
    );
  }

  return forwardJson(response);
}

export async function POST(request: Request) {
  let response: Response;
  try {
    const body = await request.text();
    response = await authorizedBackendFetch("/api/v1/tenants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body
    });
  } catch {
    return NextResponse.json(
      { error: "BACKEND_UNAVAILABLE", message: "Serviço indisponível. Tente novamente.", status: 503 },
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

