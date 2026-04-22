"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import type { ApiError, ApiResponse, UserResponse } from "@/lib/types";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    };

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as ApiError;
        setError(body.message || "Não foi possível registrar.");
        return;
      }

      const body = (await response.json()) as ApiResponse<UserResponse>;
      setSuccess(
        body.message || "Conta criada com sucesso. Você já pode entrar no console."
      );
      form.reset();

      setTimeout(() => {
        router.push("/login");
      }, 900);
    });
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Registro
        </p>
        <h2 className="display-font text-4xl text-ink">Criar acesso inicial</h2>
        <p className="text-sm leading-7 text-slate-600">
          O backend exige senha forte. Use pelo menos 8 caracteres com
          maiúscula, número e caractere especial.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Nome</span>
          <input
            required
            autoComplete="name"
            className="field"
            name="name"
            placeholder="Seu nome"
            type="text"
          />
        </label>

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
            autoComplete="new-password"
            className="field"
            name="password"
            placeholder="Ex: Senha@123"
            type="password"
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <button className="button-primary w-full" disabled={isPending} type="submit">
          {isPending ? "Criando conta..." : "Registrar usuário"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate-600">
        <span>Já tem acesso?</span>
        <Link className="font-semibold text-ember" href="/login">
          Entrar
        </Link>
      </div>
    </div>
  );
}
