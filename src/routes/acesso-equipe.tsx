import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/acesso-equipe")({
  head: () => ({
    meta: [
      { title: "Acesso da equipe — Nutrição Neurofuncional iEsports" },
      {
        name: "description",
        content:
          "Entrada exclusiva dos profissionais e da administração da Nutrição Neurofuncional iEsports.",
      },
      { property: "og:title", content: "Acesso da equipe — iEsports Nutri" },
      {
        property: "og:description",
        content: "Área restrita da equipe clínica e administrativa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcessoEquipePage,
});

function AcessoEquipePage() {
  const { entrar, sair, user, papel, carregando } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (carregando || !user || !papel) return;
    if (papel === "admin") navigate({ to: "/admin", replace: true });
    else if (papel === "profissional") navigate({ to: "/profissional", replace: true });
    else {
      // Cliente não entra pela porta da equipe.
      void sair().then(() => setErro("Esta área é exclusiva da equipe. Use o login de cliente."));
    }
  }, [user, papel, carregando, navigate, sair]);

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
        <p className="eyebrow">Área restrita</p>
        <h1 className="mt-4 font-display text-4xl text-espresso">Acesso da equipe</h1>
        <p className="mt-3 text-sm text-cocoa">
          Somente profissionais e administração cadastrados pela iEsports. Clientes entram pelo{" "}
          <a href="/login" className="text-espresso underline underline-offset-4">
            login de cliente
          </a>
          .
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm text-cocoa">E-mail profissional</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-camel"
              placeholder="nome@iesports.com.br"
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

          {erro && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-espresso px-6 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa disabled:opacity-60"
          >
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </section>
  );
}
