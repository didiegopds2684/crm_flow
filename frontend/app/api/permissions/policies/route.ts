import { NextRequest, NextResponse } from "next/server";

import {
  authorizedBackendFetch,
  clearAuthCookies,
  forwardJson
} from "@/lib/backend";

function unauthorizedResponse() {
  clearAuthCookies();
  return NextResponse.json(
    { error: "UNAUTHORIZED", message: "Sessao expirada", status: 401 },
    { status: 401 }
  );
}

function badRequest(message: string) {
  return NextResponse.json(
    { error: "BAD_REQUEST", message, status: 400 },
    { status: 400 }
  );
}

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();

  if (!tenantId) {
    return badRequest("tenantId e obrigatorio.");
  }

  let response: Response;

  try {
    response = await authorizedBackendFetch("/api/v1/permissions/policies", {
      headers: {
        "X-Tenant-ID": tenantId
      }
    });
  } catch {
    return NextResponse.json(
      {
        error: "BACKEND_UNAVAILABLE",
        message: "Permission service indisponivel no momento.",
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
