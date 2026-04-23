"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { TenantResponse } from "@/lib/types";

type TenantContextType = {
  tenants: TenantResponse[];
  activeTenant: TenantResponse | null;
  setActiveTenant: (t: TenantResponse) => void;
  setTenants: (ts: TenantResponse[]) => void;
};

const TenantCtx = createContext<TenantContextType>({
  tenants: [],
  activeTenant: null,
  setActiveTenant: () => {},
  setTenants: () => {},
});

const STORAGE_KEY = "crmflow.active_tenant";

function readStoredTenant(): TenantResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TenantResponse) : null;
  } catch {
    return null;
  }
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  // Start with null — both server and client agree on the initial state.
  // The stored tenant is restored client-side only, after hydration.
  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [activeTenant, setActiveTenantState] = useState<TenantResponse | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredTenant();
    if (stored) setActiveTenantState(stored);
    setHydrated(true);
  }, []);

  function setActiveTenant(t: TenantResponse) {
    setActiveTenantState(t);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
    } catch {}
  }

  // Suppress rendering children until hydration is complete to avoid
  // mismatches between server (null tenant) and client (stored tenant).
  if (!hydrated) return null;

  return (
    <TenantCtx.Provider value={{ tenants, activeTenant, setActiveTenant, setTenants }}>
      {children}
    </TenantCtx.Provider>
  );
}

export function useTenantContext() {
  return useContext(TenantCtx);
}
