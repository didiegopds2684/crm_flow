import { NextResponse } from "next/server";

import {
  authorizedBackendFetch,
  clearAuthCookies,
  forwardJson
} from "@/lib/backend";

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
  const body = await request.text();
  const response = await authorizedBackendFetch("/api/v1/tenants", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body
  });

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

