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
  };
};

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

export async function GET(_request: Request, context: RouteContext) {
  let response: Response;

  try {
    response = await authorizedBackendFetch(`/api/v1/tenants/${context.params.id}/users`);
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

export async function POST(request: Request, context: RouteContext) {
  let body: string;

  try {
    body = await request.text();
  } catch {
    return badRequest("Corpo da requisicao invalido.");
  }

  let response: Response;

  try {
    response = await authorizedBackendFetch(`/api/v1/tenants/${context.params.id}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body
    });
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
