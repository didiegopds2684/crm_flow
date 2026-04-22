import { redirect } from "next/navigation";

import RegisterForm from "@/components/auth/register-form";
import { hasSessionCookies } from "@/lib/backend";

export default function RegisterPage() {
  if (hasSessionCookies()) {
    redirect("/dashboard");
  }

  return (
    <main className="grain relative min-h-screen overflow-hidden px-6 py-10 sm:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="panel panel-strong flex items-center rounded-[2rem] p-5 sm:p-8 lg:order-2">
          <RegisterForm />
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/80 via-white/58 to-emerald-50/75 p-8 shadow-panel sm:p-12 lg:order-1">
          <span className="eyebrow">Provisioning</span>
          <div className="mt-7 space-y-4">
            <h1 className="display-font text-5xl leading-none text-ink sm:text-6xl">
              Entre no fluxo antes das entidades.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-700">
              Nesta etapa, o frontend prepara a base operacional. Você cria o
              usuário, autentica a sessão e já consegue administrar tenants
              enquanto o restante do motor dinâmico amadurece no backend.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            <div className="panel rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold text-ink">Segurança</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Tokens ficam em cookies HttpOnly; o browser fala com handlers do
                Next em vez de expor credenciais na camada de UI.
              </p>
            </div>
            <div className="panel rounded-[1.5rem] p-5">
              <p className="text-sm font-semibold text-ink">Contratos estáveis</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                O client já entende o wrapper `ApiResponse` e o formato de erro
                comum dos serviços Java.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

