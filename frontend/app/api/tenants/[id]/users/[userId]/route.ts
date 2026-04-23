import { NextResponse } from "next/server";

import {
  authorizedBackendFetch,

  clearAuthCookies,
  forwardJson
} from "@/lib/backend";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
    userId: string;
  };
};

function unauthorizedResponse() {
  clearAuthCookies();
  return NextResponse.json(
    { error: "UNAUTHORIZED", message: "Sessao expirada", status: 401 },
    { status: 401 }
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Corpo inválido", status: 400 }, { status: 400 });
  }

  let response: Response;
  try {
    response = await authorizedBackendFetch(
      `/api/v1/tenants/${context.params.id}/users/${context.params.userId}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body }
    );
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE", message: "Tenant service indisponível.", status: 503 }, { status: 503 });
  }

  if (response.status === 401) return unauthorizedResponse();
  return forwardJson(response);
}

export async function DELETE(_request: Request, context: RouteContext) {
  let response: Response;

  try {
    response = await authorizedBackendFetch(
      `/api/v1/tenants/${context.params.id}/users/${context.params.userId}`,
      {
        method: "DELETE"
      }
    );
  } catch {
    return NextResponse.json(
      {
        error: "BACKEND_UNAVAILABLE",
        message: "Tenant service indisponivel no momento.",
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
