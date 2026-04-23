import { NextRequest, NextResponse } from "next/server";

import {
  authorizedBackendFetch,

  clearAuthCookies,
  forwardJson
} from "@/lib/backend";

export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json(
    { error: "BAD_REQUEST", message, status: 400 },
    { status: 400 }
  );
}

function unauthorizedResponse() {
  clearAuthCookies();
  return NextResponse.json(
    { error: "UNAUTHORIZED", message: "Sessão expirada", status: 401 },
    { status: 401 }
  );
}

function getTenantId(request: NextRequest) {
  return request.nextUrl.searchParams.get("tenantId")?.trim() || null;
}

export async function GET(request: NextRequest) {
  const tenantId = getTenantId(request);

  if (!tenantId) {
    return badRequest("tenantId é obrigatório.");
  }

  let response: Response;
  try {
    response = await authorizedBackendFetch("/api/v1/entities/definitions", {
      headers: {
        "X-Tenant-ID": tenantId
      }
    });
  } catch {
    return NextResponse.json(
      {
        error: "BACKEND_UNAVAILABLE",
        message: "Entity engine indisponível no momento.",
        status: 503
      },
      { status: 503 }
    );
  }

  if (response.status === 401) {
    return unauthorizedResponse();
  }

  return forwardJson(response);
}

export async function POST(request: Request) {
  let tenantId: string | null = null;
  let payload: unknown;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    tenantId = String(body.tenantId ?? "").trim() || null;
    const { tenantId: _tenantId, ...definitionPayload } = body;
    payload = definitionPayload;
  } catch {
    return badRequest("Corpo da requisição inválido.");
  }

  if (!tenantId) {
    return badRequest("tenantId é obrigatório.");
  }

  let response: Response;
  try {
    response = await authorizedBackendFetch("/api/v1/entities/definitions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId
      },
      body: JSON.stringify(payload)
    });
  } catch {
    return NextResponse.json(
      {
        error: "BACKEND_UNAVAILABLE",
        message: "Entity engine indisponível no momento.",
        status: 503
      },
      { status: 503 }
    );
  }

  if (response.status === 401) {
    return unauthorizedResponse();
  }

  return forwardJson(response);
}
