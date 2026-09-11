import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { pacote?: string } =>
    typeof search["pacote"] === "string" ? { pacote: search["pacote"] as string } : {},
  head: () => ({ meta: [{ title: "Entrar — Nutrição Neurofuncional iEsports" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { entrar, user, carregando, papel } = useAuth();
  const navigate = useNavigate();
  const { pacote } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!carregando && user) {
      if (papel !== "admin" && papel !== "profissional" && pacote) {
        navigate({ to: "/pacotes", search: { pacote } as never, replace: true });
        return;
      }
      navigate({
        to: papel === "admin" ? "/admin" : papel === "profissional" ? "/profissional" : "/area-cliente",
        replace: true,
      });
    }
  }, [user, carregando, papel, pacote, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const resultado = await entrar(email.trim(), senha);
    setEnviando(false);
    if (resultado.erro) setErro(resultado.erro);
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-20">
      <div className="w-full">
        <p className="eyebrow">Área do cliente</p>
        <h1 className="mt-4 font-display text-4xl text-espresso">Entrar</h1>
        <p className="mt-3 text-sm text-cocoa">
          Acesso do responsável ou da equipe profissional.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-cocoa">E-mail</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-camel"
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label htmlFor="senha" className="mb-1.5 block text-sm text-cocoa">Senha</label>
            <input
              id="senha"
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-camel"
              placeholder="••••••••"
            />
          </div>

          {erro && <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-espresso px-6 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa disabled:opacity-60"
          >
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-cocoa">
          Ainda não tem acesso?{" "}
          <Link to="/cadastro" search={{ pacote } as never} className="text-espresso underline underline-offset-4">
            Cadastre-se
          </Link>
        </p>
      </div>
    </section>
  );
}