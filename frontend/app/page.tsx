import Link from "next/link";
import { redirect } from "next/navigation";

import { hasSessionCookies } from "@/lib/backend";

const highlights = [
  {
    title: "Tenant-first",
    text: "A interface já assume isolamento por tenant e prepara a navegação para múltiplas empresas."
  },
  {
    title: "BFF leve",
    text: "O frontend fala com handlers internos do Next para manter tokens fora do JavaScript do browser."
  },
  {
    title: "Pronto para crescer",
    text: "A base foi aberta para encaixar entity builder, listas dinâmicas e analytics sem retrabalho."
  }
];

export default function HomePage() {
  if (hasSessionCookies()) {
    redirect("/dashboard");
  }

  return (
    <main className="grain relative min-h-screen overflow-hidden px-6 py-8 sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-between gap-10">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/60 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
              CRM Flow
            </p>
            <p className="display-font text-lg text-ink">Control surface</p>
          </div>
          <nav className="flex items-center gap-3">
            <Link className="button-secondary" href="/register">
              Criar conta
            </Link>
            <Link className="button-primary" href="/login">
              Entrar
            </Link>
          </nav>
        </header>

        <section className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-7">
            <span className="eyebrow">Frontend inicial do MVP</span>
            <div className="space-y-5">
              <h1 className="display-font max-w-3xl text-5xl leading-none text-ink sm:text-7xl">
                Um cockpit para um CRM que se molda no runtime.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                O backend já entrega autenticação e gestão de tenants. Esta
                primeira versão do frontend organiza esse fluxo com sessão
                segura, painéis operacionais e uma base de UI pronta para os
                módulos dinâmicos.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link className="button-primary" href="/login">
                Acessar console
              </Link>
              <Link className="button-secondary" href="/register">
                Registrar novo usuário
              </Link>
            </div>
          </div>

          <div className="panel rounded-[2rem] p-6 sm:p-8">
            <div className="grid gap-4">
              {highlights.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[1.5rem] border border-slate-900/8 bg-white/70 p-5"
                >
                  <h2 className="text-lg font-semibold text-ink">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-[2rem] border border-slate-900/8 bg-white/58 p-6 backdrop-blur sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Entrega atual
            </p>
            <p className="mt-3 text-3xl font-semibold text-ink">Auth + Tenant</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Integração
            </p>
            <p className="mt-3 text-3xl font-semibold text-ink">Gateway em :8080</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Próximo ciclo
            </p>
            <p className="mt-3 text-3xl font-semibold text-ink">
              Builder dinâmico
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

