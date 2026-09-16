import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGuardaAcesso } from "@/lib/guards";
import { listarMeusContratos, retomarPagamentoContrato } from "@/lib/contratos.server";
import { buscarHorariosOcupados } from "@/lib/agendamentos.server";
import { formatarValor, nomeProfissional, getPacote } from "@/lib/negocio";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/area-cliente")({
  head: () => ({ meta: [{ title: "Área do cliente — Nutrição Neurofuncional iEsports" }] }),
  component: AreaClientePage,
});

type SessaoCliente = {
  id: string;
  contratoId: string;
  profissionalSlug: string;
  tipoSessao: string;
  data: string;
  horario: string;
  status: string;
};

function rotuloSessao(tipo: string): string {
  const mapa: Record<string, string> = {
    "anamnese-neuro": "Anamnese de Neuro",
    "anamnese-nutri": "Avaliação Nutricional",
    neuro: "Sessão de Neuro",
    nutri: "Consulta Nutricional",
    psico: "Sessão de Psicologia",
    genetico: "Teste Genético",
    devolutiva: "Devolutiva de Laudo",
    multidisciplinar: "Sessão Multidisciplinar",
  };
  return mapa[tipo] ?? tipo;
}

function AreaClientePage() {
  const { user, carregando, perfilNome } = useAuth();
  useGuardaAcesso(["responsavel"], "/login");
  const [contratos, setContratos] = useState<Awaited<ReturnType<typeof listarMeusContratos>> | null>(null);
  const [sessoes, setSessoes] = useState<SessaoCliente[]>([]);
  const [carregou, setCarregou] = useState(false);
  const [retomando, setRetomando] = useState<string | null>(null);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);

  async function continuarAdesao(contratoId: string) {
    setErroPagamento(null);
    setRetomando(contratoId);
    try {
      const r = await retomarPagamentoContrato({ data: { contratoId } });
      if (r.ok && r.initPoint) {
        window.location.href = r.initPoint;
        return;
      }
      setErroPagamento(r.erro ?? "Não foi possível abrir o pagamento.");
    } catch (e) {
      setErroPagamento(e instanceof Error ? e.message : "Falha ao abrir o pagamento.");
    }
    setRetomando(null);
  }

  useEffect(() => {
    if (carregando) return;
    if (!user) return;

    listarMeusContratos().then((lista) => {
      setContratos(lista);
      const ids = lista.map((c) => c.id);
      if (ids.length === 0) {
        setSessoes([]);
        setCarregou(true);
        return;
      }
      supabase
        .from("agendamentos")
        .select("id, contrato_id, profissional_slug, tipo_sessao, data, horario, status")
        .in("contrato_id", ids)
        .order("data", { ascending: true })
        .then(({ data }) => {
          setSessoes(
            (data ?? []).map((r) => ({
              id: r.id,
              contratoId: r.contrato_id,
              profissionalSlug: r.profissional_slug,
              tipoSessao: r.tipo_sessao,
              data: r.data,
              horario: r.horario,
              status: r.status,
            })),
          );
          setCarregou(true);
        });
    });
  }, [carregando, user]);

  if (carregando || !user || !carregou) {
    return <section className="mx-auto max-w-4xl px-6 py-20 text-sm text-cocoa">Carregando…</section>;
  }

  const futuras = sessoes.filter(
    (s) => s.status === "agendado" || s.status === "confirmado" || s.status === "aguardando_pagamento",
  );
  const passadas = sessoes.filter((s) => s.status === "realizado" || s.status === "cancelado");

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <p className="eyebrow">Área do cliente</p>
      <h1 className="mt-4 font-display text-4xl text-espresso">Olá, {perfilNome || "responsável"}</h1>

      {contratos && contratos.length === 0 && (
        <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-cocoa">Você ainda não contratou nenhum pacote.</p>
          <Link
            to="/pacotes"
            className="mt-5 inline-block rounded-full bg-espresso px-6 py-3 text-sm font-medium text-linen hover:bg-cocoa"
          >
            Ver pacotes
          </Link>
        </div>
      )}

      {erroPagamento && (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {erroPagamento}
        </p>
      )}

      {contratos && contratos.length > 0 && (
        <>
          <div className="mt-10">
            <h2 className="font-display text-2xl text-espresso">Contratos</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {contratos.map((c) => (
                <div key={c.id} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-lg text-espresso">
                      {getPacote(c.pacoteSlug)?.nome ?? c.pacoteSlug}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        c.status === "pago"
                          ? "bg-emerald-600/10 text-emerald-700"
                          : c.status === "cancelado"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-camel/20 text-cocoa"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-cocoa">Atleta: {c.atletaNome}</p>
                  <p className="mt-1 text-sm text-cocoa">{formatarValor(c.valorCentavos)}</p>
                  {c.status === "pendente" && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => continuarAdesao(c.id)}
                        disabled={retomando === c.id}
                        className="rounded-full bg-espresso px-5 py-2.5 text-xs font-medium text-linen hover:bg-cocoa disabled:opacity-60"
                      >
                        {retomando === c.id ? "Abrindo pagamento…" : "Continuar adesão e pagar"}
                      </button>
                      <p className="mt-2 text-xs text-cocoa">
                        Seus horários ficam reservados até o pagamento ser aprovado.
                      </p>
                    </div>
                  )}
                  {c.status === "pago" && futuras.length === 0 && (
                    <Link
                      to="/agendamento"
                      search={{ contrato: c.id }}
                      className="mt-4 inline-block rounded-full bg-espresso px-5 py-2.5 text-xs font-medium text-linen hover:bg-cocoa"
                    >
                      Agendar avaliação
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="font-display text-2xl text-espresso">Próximas sessões</h2>
            {futuras.length === 0 ? (
              <p className="mt-3 text-sm text-cocoa">
                Nenhuma sessão marcada ainda.
                {contratos.some((c) => c.status === "pago") && (
                  <Link to="/agendamento" className="ml-1 text-espresso underline underline-offset-4">
                    Agendar agora
                  </Link>
                )}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {futuras.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-espresso">{rotuloSessao(s.tipoSessao)}</p>
                      <p className="mt-0.5 text-xs text-cocoa">{nomeProfissional(s.profissionalSlug as never)}</p>
                    </div>
                    <div className="text-right text-sm text-cocoa">
                      <p>{new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                      <p>{s.horario}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {passadas.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl text-espresso">Histórico</h2>
              <div className="mt-4 space-y-3">
                {passadas.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 opacity-80">
                    <div>
                      <p className="text-sm font-medium text-espresso">{rotuloSessao(s.tipoSessao)}</p>
                      <p className="mt-0.5 text-xs text-cocoa">{nomeProfissional(s.profissionalSlug as never)}</p>
                    </div>
                    <div className="text-right text-sm text-cocoa">
                      <p>{new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")} · {s.horario}</p>
                      <p className="capitalize">{s.status === "aguardando_pagamento" ? "aguardando pagamento" : s.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}