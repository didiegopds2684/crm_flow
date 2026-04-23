import { NextResponse } from "next/server";
import { backendFetch, authorizedBackendFetch, forwardJson } from "@/lib/backend";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

export async function POST(request: Request, context: RouteContext) {
  let body: { name: string; email: string; password: string; role: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Corpo inválido." }, { status: 400 });
  }

  const { name, email, password, role } = body;
  if (!name || !email || !password || !role) {
    return NextResponse.json({ success: false, message: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  // Step 1 — create user in auth-service (public endpoint)
  let registerRes: Response;
  try {
    registerRes = await backendFetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
  } catch {
    return NextResponse.json({ success: false, message: "Auth service indisponível." }, { status: 503 });
  }

  if (!registerRes.ok) {
    return forwardJson(registerRes);
  }

  const registerData = await registerRes.json();
  const userId: string = registerData?.data?.id;
  if (!userId) {
    return NextResponse.json({ success: false, message: "Resposta inesperada do auth service." }, { status: 502 });
  }

  // Step 2 — add user to tenant (authorized)
  let addRes: Response;
  try {
    addRes = await authorizedBackendFetch(`/api/v1/tenants/${context.params.id}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
  } catch {
    return NextResponse.json({ success: false, message: "Tenant service indisponível." }, { status: 503 });
  }

  if (!addRes.ok) {
    return forwardJson(addRes);
  }

  const addData = await addRes.json();
  return NextResponse.json(
    {
      success: true,
      message: "Usuário criado e adicionado ao tenant.",
      data: {
        tenantUser: addData.data,
        authUser: registerData.data,
      },
    },
    { status: 201 }
  );
}
