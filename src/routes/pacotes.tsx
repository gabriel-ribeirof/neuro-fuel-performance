import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { PACOTES, formatarValor, nomeProfissional, type Pacote } from "@/lib/negocio";
import { criarContratoEIniciarPagamento } from "@/lib/contratos.server";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pacotes")({
  head: () => ({ meta: [{ title: "Pacotes — Nutrição Neurofuncional iEsports" }] }),
  component: PacotesPage,
});

function CartaoPacote({
  pacote,
  onEscolher,
  enviando,
  destaque,
}: {
  pacote: Pacote;
  onEscolher: () => void;
  enviando: boolean;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-7 ${
        destaque ? "border-camel bg-espresso text-linen" : "border-border bg-card"
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-widest ${destaque ? "text-khaki" : "text-camel"}`}>
        Pacote
      </p>
      <h3 className={`mt-2 font-display text-2xl ${destaque ? "text-linen" : "text-espresso"}`}>
        {pacote.nome}
      </h3>
      <p className={`mt-1 text-sm ${destaque ? "text-khaki" : "text-cocoa"}`}>{pacote.chamada}</p>

      <p className={`mt-5 font-display text-3xl ${destaque ? "text-linen" : "text-espresso"}`}>
        {formatarValor(pacote.valorCentavos)}
      </p>

      <ul className={`mt-6 space-y-2 text-sm ${destaque ? "text-khaki" : "text-cocoa"}`}>
        {pacote.sessoes.map((s) => (
          <li key={s.rotulo} className="flex gap-2">
            <span className="mt-0.5 text-camel">•</span>
            <span>
              {s.rotulo} — <span className="text-camel">{nomeProfissional(s.profissional)}</span>
            </span>
          </li>
        ))}
      </ul>

      {pacote.nota && (
        <p className={`mt-4 rounded-xl px-4 py-2.5 text-xs ${destaque ? "bg-linen/10 text-khaki" : "bg-khaki/40 text-cocoa"}`}>
          {pacote.nota}
        </p>
      )}

      <button
        type="button"
        onClick={onEscolher}
        disabled={enviando}
        className={`mt-8 rounded-full px-6 py-3 text-sm font-medium transition-colors disabled:opacity-60 ${
          destaque
            ? "bg-linen text-espresso hover:bg-khaki"
            : "bg-espresso text-linen hover:bg-cocoa"
        }`}
      >
        {enviando ? "Redirecionando…" : "Escolher este pacote"}
      </button>
    </div>
  );
}

type AtletaResumo = { id: string; nome: string; sobrenome: string };

function PacotesPage() {
  const { user, carregando } = useAuth();
  const navigate = useNavigate();

  const [atletas, setAtletas] = useState<AtletaResumo[]>([]);
  const [carregandoAtletas, setCarregandoAtletas] = useState(false);
  const [atletaSelecionado, setAtletaSelecionado] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviandoSlug, setEnviandoSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setCarregandoAtletas(true);
    supabase
      .from("atletas")
      .select("id, nome, sobrenome")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const lista = (data ?? []) as AtletaResumo[];
        setAtletas(lista);
        if (lista.length > 0) setAtletaSelecionado(lista[0].id);
        setCarregandoAtletas(false);
      });
  }, [user]);

  async function escolher(pacote: Pacote) {
    setErro(null);

    if (!user) {
      navigate({ to: "/login", search: { de: "pacotes", pacote: pacote.slug } as never });
      return;
    }

    if (atletas.length === 0) {
      navigate({ to: "/cadastro" });
      return;
    }

    if (!atletaSelecionado) {
      setErro("Selecione o atleta que vai receber o pacote.");
      return;
    }

    setEnviandoSlug(pacote.slug);
    try {
      const { initPoint } = await criarContratoEIniciarPagamento({
        data: { atletaId: atletaSelecionado, pacoteSlug: pacote.slug },
      });
      if (initPoint) {
        window.location.href = initPoint;
        return;
      }
      setErro("Não foi possível iniciar o pagamento.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao iniciar o pagamento.");
    }
    setEnviandoSlug(null);
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="eyebrow">Pacotes</p>
      <h1 className="mt-4 font-display text-4xl text-espresso">Escolha seu acompanhamento</h1>
      <p className="mt-3 max-w-2xl text-sm text-cocoa">
        Todos os pacotes incluem a avaliação inicial com Amanda (anamnese de neuro) e a
        avaliação nutricional com Letícia na mesma semana. Pagamento via Mercado Pago.
      </p>

      {user && !carregandoAtletas && atletas.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <label htmlFor="atleta" className="text-sm text-cocoa">Para qual atleta?</label>
          <select
            id="atleta"
            value={atletaSelecionado}
            onChange={(e) => setAtletaSelecionado(e.target.value)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-camel"
          >
            {atletas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} {a.sobrenome}
              </option>
            ))}
          </select>
        </div>
      )}

      {user && !carregando && atletas.length === 0 && (
        <p className="mt-8 rounded-xl border border-border bg-card px-4 py-3 text-sm text-cocoa">
          Você ainda não cadastrou um atleta.{" "}
          <Link to="/cadastro" className="text-espresso underline underline-offset-4">
            Cadastre o atleta
          </Link>{" "}
          antes de escolher o pacote.
        </p>
      )}

      {erro && (
        <p className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {erro}
        </p>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PACOTES.map((pacote) => (
          <CartaoPacote
            key={pacote.slug}
            pacote={pacote}
            destaque={pacote.slug === "plus-atletas"}
            enviando={enviandoSlug === pacote.slug}
            onEscolher={() => escolher(pacote)}
          />
        ))}
      </div>
    </section>
  );
}