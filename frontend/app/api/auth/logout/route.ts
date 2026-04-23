import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendFetch, clearAuthCookies, REFRESH_COOKIE } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function POST() {
  let refreshToken: string | null = null;
  try {
    refreshToken = cookies().get(REFRESH_COOKIE)?.value ?? null;
  } catch {}

  if (refreshToken) {
    try {
      await backendFetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Always clear local session cookies even if backend call fails.
    }
  }

  clearAuthCookies();
  return NextResponse.json(
    { data: null, message: "Sessão encerrada", success: true },
    { status: 200 }
  );
}
