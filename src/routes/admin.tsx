import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGuardaAcesso } from "@/lib/guards";
import {
  listarVisaoAdmin,
  atualizarSessaoAdmin,
  criarRetornoProfissional,
  type listarMinhaAgenda,
} from "@/lib/admin.server";
import { formatarValor, nomeProfissional, PROFISSIONAIS, HORARIOS } from "@/lib/negocio";

function linkWhatsCliente(telefone: string, atleta: string): string | null {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  const texto = `Olá! Aqui é da Nutrição Neurofuncional iEsports, sobre o atendimento de ${atleta}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

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

const TIPOS_RETORNO: { tipo: string; rotulo: string }[] = [
  { tipo: "retorno-neuro", rotulo: "Retorno de Neuro" },
  { tipo: "retorno-nutri", rotulo: "Retorno de Nutri" },
  { tipo: "neuro", rotulo: "Sessão de Neuro" },
  { tipo: "nutri", rotulo: "Consulta Nutricional" },
  { tipo: "psico", rotulo: "Sessão de Psicologia" },
  { tipo: "devolutiva", rotulo: "Devolutiva de Laudo" },
  { tipo: "multidisciplinar", rotulo: "Sessão Multidisciplinar" },
];

function AdminPage() {
  const { user, carregando, perfilNome } = useAuth();
  useGuardaAcesso(["admin"], "/acesso-equipe");
  const [visao, setVisao] = useState<VisaoAdmin | null>(null);
  const [remarcandoId, setRemarcandoId] = useState<string | null>(null);
  const [novaData, setNovaData] = useState("");
  const [novoHorario, setNovoHorario] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState("");
  const [mostrandoRetorno, setMostrandoRetorno] = useState(false);
  const [emailCliente, setEmailCliente] = useState("");
  const [profSlug, setProfSlug] = useState<string>("amanda");
  const [tipoRetorno, setTipoRetorno] = useState<string>("retorno-neuro");
  const [dataRetorno, setDataRetorno] = useState("");
  const [horaRetorno, setHoraRetorno] = useState<string>("09:00");
  const [enviando, setEnviando] = useState(false);

  async function salvarRetorno() {
    setErro(null);
    setSucesso("");
    if (!emailCliente.trim() || !dataRetorno || !horaRetorno) {
      setErro("Informe e-mail do cliente, data e horário.");
      return;
    }
    setEnviando(true);
    try {
      await criarRetornoProfissional({
        data: {
          email: emailCliente.trim(),
          tipoSessao: tipoRetorno,
          data: dataRetorno,
          horario: horaRetorno,
          profissionalSlug: profSlug,
        },
      });
      setSucesso("Retorno marcado! O cliente já vê a sessão na área dele.");
      setEmailCliente("");
      setDataRetorno("");
      setMostrandoRetorno(false);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao marcar retorno.");
    }
    setEnviando(false);
  }

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
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-espresso">Admin — {perfilNome || "gestão"}</h1>
        <button
          onClick={() => setMostrandoRetorno((v) => !v)}
          className="rounded-full bg-espresso px-5 py-2.5 text-sm font-medium text-linen hover:bg-cocoa"
        >
          {mostrandoRetorno ? "Fechar" : "Marcar retorno"}
        </button>
      </div>

      {sucesso && (
        <p className="mt-6 rounded-xl border border-emerald-600/30 bg-emerald-600/5 px-4 py-3 text-xs text-emerald-800">
          {sucesso}
        </p>
      )}

      {mostrandoRetorno && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl text-espresso">Marcar retorno</h2>
          <p className="mt-1 text-sm text-cocoa">
            Identificamos o cliente pelo e-mail cadastrado; a sessão aparece na área dele.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email-cliente" className="mb-1.5 block text-sm text-cocoa">E-mail do cliente</label>
              <input
                id="email-cliente"
                list="clientes-admin"
                type="email"
                value={emailCliente}
                onChange={(e) => setEmailCliente(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-camel"
              />
              <datalist id="clientes-admin">
                {visao.contratos.map((c) => (
                  <option key={c.id} value={c.responsavelEmail}>
                    {c.atletaNome}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="prof" className="mb-1.5 block text-sm text-cocoa">Profissional responsável</label>
              <select
                id="prof"
                value={profSlug}
                onChange={(e) => setProfSlug(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-camel"
              >
                {PROFISSIONAIS.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.nome} — {p.especialidade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tipo" className="mb-1.5 block text-sm text-cocoa">Tipo de sessão</label>
              <select
                id="tipo"
                value={tipoRetorno}
                onChange={(e) => setTipoRetorno(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-camel"
              >
                {TIPOS_RETORNO.map((t) => (
                  <option key={t.tipo} value={t.tipo}>{t.rotulo}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="data-ret" className="mb-1.5 block text-sm text-cocoa">Data</label>
                <input
                  id="data-ret"
                  type="date"
                  value={dataRetorno}
                  onChange={(e) => setDataRetorno(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-camel"
                />
              </div>
              <div>
                <label htmlFor="hora-ret" className="mb-1.5 block text-sm text-cocoa">Horário</label>
                <select
                  id="hora-ret"
                  value={horaRetorno}
                  onChange={(e) => setHoraRetorno(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-camel"
                >
                  {HORARIOS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <button
            onClick={salvarRetorno}
            disabled={enviando}
            className="mt-6 rounded-full bg-espresso px-6 py-2.5 text-sm font-medium text-linen hover:bg-cocoa disabled:opacity-60"
          >
            {enviando ? "Salvando…" : "Confirmar retorno"}
          </button>
        </div>
      )}

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
                    {linkWhatsCliente(a.atletaTelefone, a.atletaNome) && (
                      <a
                        href={linkWhatsCliente(a.atletaTelefone, a.atletaNome) as string}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-2 inline-block rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:brightness-95"
                      >
                        WhatsApp
                      </a>
                    )}
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