import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { ApiResponse, LoginResponse, TokenResponse } from "@/lib/types";

export const ACCESS_COOKIE = "crmflow.access_token";
export const REFRESH_COOKIE = "crmflow.refresh_token";
export const EXPIRES_COOKIE = "crmflow.access_expires_at";

function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {})
  };
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
      ...(init?.headers ?? {})
    }
  });
}

export function setLoginCookies(session: LoginResponse) {
  const cookieStore = cookies();
  const expiresAt = Date.now() + session.expiresIn * 1000;

  cookieStore.set(ACCESS_COOKIE, session.accessToken, getCookieOptions(session.expiresIn));
  cookieStore.set(REFRESH_COOKIE, session.refreshToken, getCookieOptions(60 * 60 * 24 * 7));
  cookieStore.set(EXPIRES_COOKIE, String(expiresAt), getCookieOptions(session.expiresIn));
}

function setAccessCookies(session: TokenResponse) {
  const cookieStore = cookies();
  const expiresAt = Date.now() + session.expiresIn * 1000;

  cookieStore.set(ACCESS_COOKIE, session.accessToken, getCookieOptions(session.expiresIn));
  cookieStore.set(EXPIRES_COOKIE, String(expiresAt), getCookieOptions(session.expiresIn));
}

export function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(EXPIRES_COOKIE);
}

export function getRefreshToken() {
  return cookies().get(REFRESH_COOKIE)?.value ?? null;
}

export function hasSessionCookies() {
  const cookieStore = cookies();
  return Boolean(
    cookieStore.get(ACCESS_COOKIE)?.value || cookieStore.get(REFRESH_COOKIE)?.value
  );
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthCookies();
    return false;
  }

  const response = await backendFetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    clearAuthCookies();
    return false;
  }

  const payload = (await response.json()) as ApiResponse<TokenResponse>;

  if (!payload.data?.accessToken) {
    clearAuthCookies();
    return false;
  }

  setAccessCookies(payload.data);
  return true;
}

export async function authorizedBackendFetch(path: string, init?: RequestInit) {
  const accessToken = cookies().get(ACCESS_COOKIE)?.value;
  const response = await backendFetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  });

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshAccessToken();

  if (!refreshed) {
    return response;
  }

  const nextAccessToken = cookies().get(ACCESS_COOKIE)?.value;

  return backendFetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(nextAccessToken ? { Authorization: `Bearer ${nextAccessToken}` } : {})
    }
  });
}

export async function forwardJson(response?: Response) {
  if (!response) {
    return NextResponse.json(
      {
        error: "METHOD_NOT_ALLOWED",
        message: "Método não suportado",
        status: 405
      },
      { status: 405 }
    );
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return NextResponse.json(payload, { status: response.status });
}

