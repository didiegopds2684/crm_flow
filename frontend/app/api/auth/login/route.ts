import { NextResponse } from "next/server";

import { backendFetch, setLoginCookies } from "@/lib/backend";
import type { ApiResponse, LoginResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.text();
  const response = await backendFetch("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiResponse<LoginResponse>) : null;

  if (!response.ok || !payload?.data) {
    return NextResponse.json(payload, { status: response.status });
  }

  setLoginCookies(payload.data);
  return NextResponse.json(payload, { status: response.status });
}
