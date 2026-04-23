import { NextResponse } from "next/server";

import {
  authorizedBackendFetch,

  clearAuthCookies,
  forwardJson
} from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = await authorizedBackendFetch("/api/v1/auth/me");

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

