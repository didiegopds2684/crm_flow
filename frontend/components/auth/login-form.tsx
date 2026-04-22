"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import type { ApiError } from "@/lib/types";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    };

    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as ApiError;
        setError(body.message || "Não foi possível autenticar.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Entrar
        </p>
        <h2 className="display-font text-4xl text-ink">Sessão operacional</h2>
        <p className="text-sm leading-7 text-slate-600">
          O login bate no `auth-service` via gateway e o frontend guarda a
          sessão em cookies HttpOnly.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            required
            autoComplete="email"
            className="field"
            name="email"
            placeholder="voce@empresa.com"
            type="email"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Senha</span>
          <input
            required
            autoComplete="current-password"
            className="field"
            name="password"
            placeholder="Sua senha"
            type="password"
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button className="button-primary w-full" disabled={isPending} type="submit">
          {isPending ? "Autenticando..." : "Entrar no console"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate-600">
        <span>Novo por aqui?</span>
        <Link className="font-semibold text-ember" href="/register">
          Criar conta
        </Link>
      </div>
    </div>
  );
}

