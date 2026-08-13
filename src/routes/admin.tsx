import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  listarVisaoAdmin,
  atualizarSessaoAdmin,
  type listarMinhaAgenda,
} from "@/lib/admin.server";
import { formatarValor, nomeProfissional } from "@/lib/negocio";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel admin — Nutrição Neurofuncional iEsports" }] }),
  component: AdminPage,
});

type VisaoAdmin = Awaited<ReturnType<typeof listarVisaoAdmin>>;
type Agenda = Awaited<ReturnType<typeof listarMinhaAgenda>>;

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

function AdminPage() {
  const { user, carregando, perfilNome } = useAuth();
  const [visao, setVisao] = useState<VisaoAdmin | null>(null);
  const [remarcandoId, setRemarcandoId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState("");
  const [novoHorario, setNovoHorario] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function carregar() {
    setErro(null);
    listarVisaoAdmin()
      .then(setVisao)
      .catch((e) => setErro(e instanceof Error ? e.message : "Acesso restrito ao painel administrativo."));
  }

  useEffect(() => {
    if (!carregando && user) carregar();
  }, [carregando, user]);

  async function cancelar(agendamentoId: string) {
    setErro(null);
    try {
      await atualizarSessaoAdmin({ data: { agendamentoId, acao: "cancelar" } });
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao cancelar.");
    }
  }

  async function remarcar(agendamentoId: string) {
    setErro(null);
    try {
      await atualizarSessaoAdmin({
        data: { agendamentoId, acao: "remarcar", novaData, novoHorario },
      });
      setRemarcandoId(null);
      setNovaData("");
      setNovoHorario("");
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao remarcar.");
    }
  }

  if (carregando || !user || !visao) {
    return <section className="mx-auto max-w-6xl px-6 py-20 text-sm text-cocoa">Carregando…</section>;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="eyebrow">Painel administrativo</p>
      <h1 className="mt-4 font-display text-4xl text-espresso">Admin — {perfilNome || "gestão"}</h1>

      {erro && (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">{erro}</p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-camel">Contratos</p>
          <p className="mt-2 font-display text-3xl text-espresso">{visao.contratos.length}</p>
          <p className="mt-1 text-xs text-cocoa">
            {visao.contratos.filter((c) => c.status === "pago").length} pagos ·{" "}
            {visao.contratos.filter((c) => c.status === "pendente").length} pendentes
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-camel">Sessões</p>
          <p className="mt-2 font-display text-3xl text-espresso">{visao.agendamentos.length}</p>
          <p className="mt-1 text-xs text-cocoa">
            {visao.agendamentos.filter((a) => a.status === "agendado").length} marcadas
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-camel">Atletas</p>
          <p className="mt-2 font-display text-3xl text-espresso">{visao.atletas.length}</p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl text-espresso">Contratos</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-card text-xs uppercase tracking-widest text-cocoa">
              <tr>
                <th className="px-5 py-3">Atleta</th>
                <th className="px-5 py-3">Pacote</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Responsável</th>
                <th className="px-5 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visao.contratos.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3">{c.atletaNome}</td>
                  <td className="px-5 py-3 capitalize">{c.pacoteSlug.replace("-", " ")}</td>
                  <td className="px-5 py-3">{formatarValor(c.valorCentavos)}</td>
                  <td className="px-5 py-3">
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
                  </td>
                  <td className="px-5 py-3 text-cocoa">{c.responsavelEmail}</td>
                  <td className="px-5 py-3 text-cocoa">
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl text-espresso">Sessões</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-border bg-card text-xs uppercase tracking-widest text-cocoa">
              <tr>
                <th className="px-5 py-3">Atleta</th>
                <th className="px-5 py-3">Profissional</th>
                <th className="px-5 py-3">Sessão</th>
                <th className="px-5 py-3">Data/Hora</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visao.agendamentos.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3">{a.atletaNome}</td>
                  <td className="px-5 py-3">{nomeProfissional(a.profissional as never)}</td>
                  <td className="px-5 py-3">{rotuloSessao(a.tipoSessao)}</td>
                  <td className="px-5 py-3 text-cocoa">
                    {new Date(`${a.data}T12:00:00`).toLocaleDateString("pt-BR")} · {a.horario}
                  </td>
                  <td className="px-5 py-3">
                    <span className="capitalize">{a.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    {(a.status === "agendado" || a.status === "confirmado") && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                          onClick={() => cancelar(a.id)}
                          className="rounded-full border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            setRemarcandoId(remarcandoId === a.id ? null : a.id);
                            setNovaData("");
                            setNovoHorario("");
                          }}
                          className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-card"
                        >
                          Remarcar
                        </button>
                      </div>
                    )}
                    {remarcandoId === a.id && (
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="date"
                          value={novaData}
                          onChange={(e) => setNovaData(e.target.value)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs outline-none focus:border-camel"
                        />
                        <input
                          type="time"
                          value={novoHorario}
                          onChange={(e) => setNovoHorario(e.target.value)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs outline-none focus:border-camel"
                        />
                        <button
                          onClick={() => remarcar(a.id)}
                          className="rounded-full bg-espresso px-3 py-1.5 text-xs text-linen hover:bg-cocoa"
                        >
                          Salvar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl text-espresso">Atletas</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-card text-xs uppercase tracking-widest text-cocoa">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Idade</th>
                <th className="px-5 py-3">Clube</th>
                <th className="px-5 py-3">Celular</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visao.atletas.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3">{a.nome}</td>
                  <td className="px-5 py-3 text-cocoa">{a.idade}</td>
                  <td className="px-5 py-3 text-cocoa">{a.clube}</td>
                  <td className="px-5 py-3 text-cocoa">{a.telefone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}