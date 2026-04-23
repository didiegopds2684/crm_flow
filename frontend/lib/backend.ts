import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { ApiResponse, LoginResponse, TokenResponse } from "@/lib/types";

export const ACCESS_COOKIE  = "crmflow.access_token";
export const REFRESH_COOKIE = "crmflow.refresh_token";
export const EXPIRES_COOKIE = "crmflow.access_expires_at";

function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  };
}

// Safely reads the cookie store — returns null if called outside a request context.
function safeCookies() {
  try {
    return cookies();
  } catch {
    return null;
  }
}

export function getBackendBaseUrl() {
  return (
    process.env.CRMFLOW_API_URL ??
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080"
  );
}

export async function backendFetch(path: string, init?: RequestInit) {
  const url = new URL(path, getBackendBaseUrl()).toString();
  return fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export function setLoginCookies(session: LoginResponse) {
  const store = safeCookies();
  if (!store) return;
  const expiresAt = Date.now() + session.expiresIn * 1000;
  store.set(ACCESS_COOKIE,  session.accessToken,  getCookieOptions(session.expiresIn));
  store.set(REFRESH_COOKIE, session.refreshToken, getCookieOptions(60 * 60 * 24 * 7));
  store.set(EXPIRES_COOKIE, String(expiresAt),    getCookieOptions(session.expiresIn));
}

function setAccessCookies(store: ReturnType<typeof cookies>, session: TokenResponse) {
  const expiresAt = Date.now() + session.expiresIn * 1000;
  store.set(ACCESS_COOKIE,  session.accessToken, getCookieOptions(session.expiresIn));
  store.set(EXPIRES_COOKIE, String(expiresAt),   getCookieOptions(session.expiresIn));
}

export function clearAuthCookies() {
  const store = safeCookies();
  if (!store) return;
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(EXPIRES_COOKIE);
}

export function hasSessionCookies() {
  const store = safeCookies();
  if (!store) return false;
  return Boolean(
    store.get(ACCESS_COOKIE)?.value || store.get(REFRESH_COOKIE)?.value
  );
}

// Reads all auth tokens in one synchronous call — before any awaits.
function readAuthTokens() {
  const store = safeCookies();
  if (!store) return { accessToken: null, refreshToken: null, store: null };
  return {
    accessToken:  store.get(ACCESS_COOKIE)?.value  ?? null,
    refreshToken: store.get(REFRESH_COOKIE)?.value ?? null,
    store,
  };
}

async function refreshAccessToken(refreshToken: string, store: ReturnType<typeof cookies>) {
  const response = await backendFetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearAuthCookies();
    return null;
  }

  const payload = (await response.json()) as ApiResponse<TokenResponse>;
  if (!payload.data?.accessToken) {
    clearAuthCookies();
    return null;
  }

  setAccessCookies(store, payload.data);
  return payload.data.accessToken;
}

export async function authorizedBackendFetch(path: string, init?: RequestInit) {
  // Read ALL tokens before the first await to avoid losing request context.
  const { accessToken, refreshToken, store } = readAuthTokens();

  const response = await backendFetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (response.status !== 401) {
    return response;
  }

  if (!refreshToken || !store) {
    return response;
  }

  const newToken = await refreshAccessToken(refreshToken, store);
  if (!newToken) {
    return response;
  }

  return backendFetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${newToken}`,
    },
  });
}

export async function forwardJson(response?: Response) {
  if (!response) {
    return NextResponse.json(
      { error: "METHOD_NOT_ALLOWED", message: "Método não suportado", status: 405 },
      { status: 405 }
    );
  }
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return NextResponse.json(payload, { status: response.status });
}
