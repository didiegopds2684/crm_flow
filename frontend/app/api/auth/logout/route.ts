import { NextResponse } from "next/server";

import {
  backendFetch,
  clearAuthCookies,
  getRefreshToken
} from "@/lib/backend";

export async function POST() {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await backendFetch("/api/v1/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch {
      // Ignore logout transport errors and always clear local session cookies.
    }
  }

  clearAuthCookies();
  return NextResponse.json(
    {
      data: null,
      message: "Sessão encerrada",
      success: true
    },
    { status: 200 }
  );
}

