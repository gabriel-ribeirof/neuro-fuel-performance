import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function SiteHeader({ children }: { children?: ReactNode }) {
  const { user, papel, perfilNome, carregando, sair } = useAuth();

  const linkLogin = user
    ? papel === "admin"
      ? "/admin"
      : papel === "profissional"
        ? "/profissional"
        : "/area-cliente"
    : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <a href="/" className="font-display text-lg tracking-[0.18em] uppercase">
          iEsports <span className="text-camel">Nutri</span>
        </a>
        <div className="hidden items-center gap-8 text-sm text-cocoa md:flex">
          <a href="/#servicos" className="hover:text-espresso">Serviços</a>
          <a href="/pacotes" className="hover:text-espresso">Pacotes</a>
          <a href="/#equipe" className="hover:text-espresso">Equipe</a>
          <a href="/#onde" className="hover:text-espresso">Onde atendemos</a>
        </div>
        <div className="flex items-center gap-3">
          {children}
          {carregando ? null : user ? (
            <>
              <a
                href={linkLogin}
                className="hidden text-sm text-cocoa hover:text-espresso sm:block"
              >
                {perfilNome || "Minha área"}
              </a>
              <button
                onClick={() => void sair()}
                className="rounded-full border border-cocoa px-4 py-2 text-sm text-cocoa transition-colors hover:bg-khaki"
              >
                Sair
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="rounded-full bg-espresso px-5 py-2.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa"
            >
              Entrar
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-espresso text-linen">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div>
          <p className="font-display text-lg tracking-[0.18em] uppercase">
            iEsports <span className="text-camel">Nutri</span>
          </p>
          <p className="mt-4 max-w-xs text-sm text-khaki">
            Nutrição Neurofuncional iEsports — neuronutrição e saúde mental esportiva para atletas
            aprovados no Experience.
          </p>
        </div>
        <div className="text-sm text-khaki">
          <p className="text-linen">Local</p>
          <p className="mt-3">Vista Verde Offices</p>
          <p className="mt-1">Av. Queiroz Filho, 1560, Conj. 201</p>
          <p className="mt-1">Vila Hamburguesa, São Paulo/SP</p>
        </div>
        <div className="text-sm text-khaki">
          <p className="text-linen">Acesso</p>
          <div className="mt-3 flex flex-col gap-1">
            <a href="/login" className="hover:text-linen">Login</a>
            <a href="/cadastro" className="hover:text-linen">Cadastro</a>
            <a href="/pacotes" className="hover:text-linen">Pacotes</a>
            <a href="https://iesports.com.br" className="hover:text-linen">iEsports</a>
          </div>
        </div>
      </div>
      <div className="border-t border-linen/15 py-6 text-center text-xs text-khaki">
        © {new Date().getFullYear()} Nutrição Neurofuncional iEsports
      </div>
    </footer>
  );
}