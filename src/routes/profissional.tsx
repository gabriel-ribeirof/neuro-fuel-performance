import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  listarMinhaAgenda,
  trocarStatusSessaoProfissional,
} from "@/lib/admin.server";

export const Route = createFileRoute("/profissional")({
  head: () => ({ meta: [{ title: "Agenda — Nutrição Neurofuncional iEsports" }] }),
  component: ProfissionalPage,
});

type MinhaSessao = {
  id: string;
  tipoSessao: string;
  data: string;
  horario: string;
  duracaoMin: number;
  status: string;
  atletaNome: string;
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

function ProfissionalPage() {
  const { user, carregando, perfilNome } = useAuth();
  const [sessoes, setSessoes] = useState<MinhaSessao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function carregar() {
    setErro(null);
    listarMinhaAgenda()
      .then(setSessoes)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar agenda."));
  }

  useEffect(() => {
    if (!carregando && user) carregar();
  }, [carregando, user]);

  async function trocarStatus(id: string, status: "realizado" | "cancelado") {
    setErro(null);
    try {
      await trocarStatusSessaoProfissional({ data: { agendamentoId: id, status } });
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao atualizar a sessão.");
    }
  }

  if (carregando || !user || !sessoes) {
    return <section className="mx-auto max-w-4xl px-6 py-20 text-sm text-cocoa">Carregando…</section>;
  }

  const abertas = sessoes.filter((s) => s.status === "agendado" || s.status === "confirmado");
  const finalizadas = sessoes.filter((s) => s.status === "realizado" || s.status === "cancelado");

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <p className="eyebrow">Agenda profissional</p>
      <h1 className="mt-4 font-display text-4xl text-espresso">Olá, {perfilNome || "profissional"}</h1>

      {erro && (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">{erro}</p>
      )}

      <div className="mt-10">
        <h2 className="font-display text-2xl text-espresso">Sessões</h2>
        {abertas.length === 0 && finalizadas.length === 0 && (
          <p className="mt-3 text-sm text-cocoa">Nenhuma sessão na sua agenda.</p>
        )}

        {abertas.length > 0 && (
          <div className="mt-4 space-y-3">
            {abertas.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-espresso">{rotuloSessao(s.tipoSessao)}</p>
                  <p className="mt-0.5 text-xs text-cocoa">{s.atletaNome} · {s.duracaoMin} min</p>
                </div>
                <div className="text-right text-sm text-cocoa">
                  <p>{new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                  <p>{s.horario}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => trocarStatus(s.id, "realizado")}
                    className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800"
                  >
                    Realizada
                  </button>
                  <button
                    onClick={() => trocarStatus(s.id, "cancelado")}
                    className="rounded-full border border-destructive/40 px-4 py-2 text-xs text-destructive hover:bg-destructive/5"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {finalizadas.length > 0 && (
          <>
            <h2 className="mt-10 font-display text-2xl text-espresso">Histórico</h2>
            <div className="mt-4 space-y-3">
              {finalizadas.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 opacity-80">
                  <div>
                    <p className="text-sm font-medium text-espresso">{rotuloSessao(s.tipoSessao)}</p>
                    <p className="mt-0.5 text-xs text-cocoa">{s.atletaNome}</p>
                  </div>
                  <div className="text-right text-sm text-cocoa">
                    <p>{new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")} · {s.horario}</p>
                    <p className="capitalize">{s.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}