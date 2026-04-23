import { NextRequest, NextResponse } from "next/server";
import { authorizedBackendFetch, clearAuthCookies, forwardJson } from "@/lib/backend";

export const dynamic = "force-dynamic";

type RouteContext = { params: { slug: string } };

function unauthorizedResponse() {
  clearAuthCookies();
  return NextResponse.json(
    { error: "UNAUTHORIZED", message: "Sessão expirada", status: 401 },
    { status: 401 }
  );
}

export async function GET(request: NextRequest, context: RouteContext) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "tenantId obrigatório", status: 400 }, { status: 400 });
  }

  let response: Response;
  try {
    response = await authorizedBackendFetch(`/api/v1/entities/definitions/${context.params.slug}`, {
      headers: { "X-Tenant-ID": tenantId },
    });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE", status: 503 }, { status: 503 });
  }

  if (response.status === 401) return unauthorizedResponse();
  return forwardJson(response);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "tenantId obrigatório", status: 400 }, { status: 400 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Corpo inválido", status: 400 }, { status: 400 });
  }

  let response: Response;
  try {
    response = await authorizedBackendFetch(`/api/v1/entities/definitions/${context.params.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
      body,
    });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE", status: 503 }, { status: 503 });
  }

  if (response.status === 401) return unauthorizedResponse();
  return forwardJson(response);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");
  if (!tenantId) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "tenantId obrigatório", status: 400 }, { status: 400 });
  }

  let response: Response;
  try {
    response = await authorizedBackendFetch(`/api/v1/entities/definitions/${context.params.slug}`, {
      method: "DELETE",
      headers: { "X-Tenant-ID": tenantId },
    });
  } catch {
    return NextResponse.json({ error: "BACKEND_UNAVAILABLE", status: 503 }, { status: 503 });
  }

  if (response.status === 401) return unauthorizedResponse();
  return forwardJson(response);
}
