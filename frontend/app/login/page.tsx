import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/login-form";
import { hasSessionCookies } from "@/lib/backend";

export default function LoginPage() {
  if (hasSessionCookies()) {
    redirect("/dashboard");
  }

  return (
    <main className="grain relative min-h-screen overflow-hidden px-6 py-10 sm:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-white/60 bg-mesh-radial p-8 shadow-panel sm:p-12">
          <div className="space-y-6">
            <span className="eyebrow">CRM Flow Console</span>
            <div className="space-y-4">
              <h1 className="display-font max-w-2xl text-5xl leading-none text-ink sm:text-6xl">
                Operação SaaS para um CRM que nasce da API.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-700">
                A camada web inicial já conversa com autenticação e tenants.
                Builder dinâmico e analytics entram assim que os próximos
                serviços saírem do esqueleto.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="panel rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Auth
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Registro, login, refresh e sessão com cookies HttpOnly.
              </p>
            </div>
            <div className="panel rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Tenants
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Listagem, criação e leitura operacional do tenant admin.
              </p>
            </div>
            <div className="panel rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Próximo
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Entidades dinâmicas, registros e visualização analítica.
              </p>
            </div>
          </div>
        </section>

        <section className="panel panel-strong flex items-center rounded-[2rem] p-5 sm:p-8">
          <LoginForm />
        </section>
      </div>
    </main>
  );
}

