import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGuardaAcesso } from "@/lib/guards";
import {
  listarMinhaAgenda,
  trocarStatusSessaoProfissional,
  listarPacientesProfissional,
  criarRetornoProfissional,
} from "@/lib/admin.server";
import { buscarHorariosOcupados, type HorarioOcupado } from "@/lib/agendamentos.server";
import {
  dataParaChave,
  ehDiaDeAtendimento,
  horariosDisponiveis,
  proximosDias,
  type Horario,
  type ProfissionalSlug,
} from "@/lib/negocio";
import { Calendar } from "@/components/ui/calendar";

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
  atletaTelefone: string;
};

/** Link direto pro WhatsApp do cliente. */
function linkWhatsCliente(telefone: string, atleta: string): string | null {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  const texto = `Olá! Aqui é da Nutrição Neurofuncional iEsports, sobre o atendimento de ${atleta}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

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
    "retorno-neuro": "Retorno de Neuro",
    "retorno-nutri": "Retorno de Nutri",
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

function ProfissionalPage() {
  const { user, carregando, perfilNome } = useAuth();
  useGuardaAcesso(["profissional", "admin"], "/acesso-equipe");
  const [sessoes, setSessoes] = useState<MinhaSessao[] | null>(null);
  const [podeMarcar, setPodeMarcar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estado do form de retorno
  const [mostrandoForm, setMostrandoForm] = useState(false);
  const [pacientes, setPacientes] = useState<
    { email: string; atletaNome: string; pacoteSlug: string; status: string }[]
  >([]);
  const [meuSlug, setMeuSlug] = useState<ProfissionalSlug>("amanda");
  const [emailCliente, setEmailCliente] = useState("");
  const [tipoSessao, setTipoSessao] = useState("retorno-neuro");
  const [dataEscolhida, setDataEscolhida] = useState<string | undefined>();
  const [horarioEscolhido, setHorarioEscolhido] = useState<Horario | null>(null);
  const [ocupados, setOcupados] = useState<HorarioOcupado[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState("");

  const dias = useMemo(() => proximosDias(30, new Date(), meuSlug), [meuSlug]);

  function carregar() {
    setErro(null);
    listarMinhaAgenda()
      .then((dados) => {
        setSessoes(dados.sessoes);
        setPodeMarcar(dados.podeMarcar);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar agenda."));
  }

  useEffect(() => {
    if (!carregando && user) carregar();
  }, [carregando, user]);

  // Carrega pacientes + horários ocupados do intervalo quando abre o form.
  useEffect(() => {
    if (!mostrandoForm) return;
    listarPacientesProfissional()
      .then((dados) => {
        setMeuSlug(dados.profissionalSlug as ProfissionalSlug);
        setPacientes(dados.pacientes);
        setEmailCliente((atual) => atual || (dados.pacientes[0]?.email ?? ""));
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar pacientes."));

    const inicio = dias[0]?.toISOString().slice(0, 10);
    const fim = dias[dias.length - 1]?.toISOString().slice(0, 10);
    if (inicio && fim) {
      buscarHorariosOcupados({ data: { inicio, fim } }).then((dados) => setOcupados(dados));
    }
  }, [mostrandoForm, dias]);

  // Limpa o horário quando a data muda.
  useEffect(() => {
    setHorarioEscolhido(null);
  }, [dataEscolhida]);

  const dataObj = dataEscolhida ? new Date(`${dataEscolhida}T12:00:00`) : undefined;
  const horarios = dataObj ? horariosDisponiveis(dataObj, meuSlug, ocupados) : [];
  const diasChave = useMemo(() => dias.map(dataParaChave), [dias]);

  async function trocarStatus(id: string, status: "realizado" | "cancelado") {
    setErro(null);
    try {
      await trocarStatusSessaoProfissional({ data: { agendamentoId: id, status } });
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao atualizar a sessão.");
    }
  }

  async function salvarRetorno() {
    setErro(null);
    setSucesso("");
    if (!emailCliente.trim()) {
      setErro("Informe o e-mail do cliente para marcar o retorno.");
      return;
    }
    if (!dataEscolhida || !horarioEscolhido) {
      setErro("Escolha data e horário para o retorno.");
      return;
    }
    setEnviando(true);
    try {
      await criarRetornoProfissional({
        data: {
          email: emailCliente.trim(),
          tipoSessao,
          data: dataEscolhida,
          horario: horarioEscolhido,
        },
      });
      setSucesso("Retorno marcado! O cliente já vê a sessão na área dele.");
      setDataEscolhida(undefined);
      setHorarioEscolhido(null);
      setMostrandoForm(false);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao marcar retorno.");
    }
    setEnviando(false);
  }

  if (carregando || !user || !sessoes) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-20 text-sm text-cocoa">Carregando…</section>
    );
  }

  const abertas = sessoes.filter((s) => s.status === "agendado" || s.status === "confirmado");
  const finalizadas = sessoes.filter((s) => s.status === "realizado" || s.status === "cancelado");

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <p className="eyebrow">Agenda profissional</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-espresso">Olá, {perfilNome || "profissional"}</h1>
        {podeMarcar && (
          <button
            onClick={() => setMostrandoForm((v) => !v)}
            className="rounded-full bg-espresso px-5 py-2.5 text-sm font-medium text-linen hover:bg-cocoa"
          >
            {mostrandoForm ? "Fechar" : "Marcar retorno"}
          </button>
        )}
      </div>

      {erro && (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="mt-6 rounded-xl border border-emerald-600/30 bg-emerald-600/5 px-4 py-3 text-xs text-emerald-800">
          {sucesso}
        </p>
      )}

      {mostrandoForm && podeMarcar && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl text-espresso">Marcar retorno</h2>
          <p className="mt-1 text-sm text-cocoa">
            A sessão entra na sua agenda e aparece automaticamente na área do cliente.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div>
                <label htmlFor="paciente" className="mb-1.5 block text-sm text-cocoa">
                  E-mail do cliente
                </label>
                <input
                  id="paciente"
                  list="clientes-cadastrados"
                  type="email"
                  placeholder="email.do.cliente@exemplo.com"
                  value={emailCliente}
                  onChange={(e) => setEmailCliente(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-camel"
                />
                <datalist id="clientes-cadastrados">
                  {pacientes
                    .filter((p) => p.email)
                    .map((p) => (
                      <option key={p.email} value={p.email}>
                        {p.atletaNome}
                      </option>
                    ))}
                </datalist>
                {pacientes.length === 0 && (
                  <p className="mt-1.5 text-xs text-cocoa">
                    Nenhum cliente com contrato ativo cadastrado ainda.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="tipo" className="mb-1.5 block text-sm text-cocoa">
                  Tipo de sessão
                </label>
                <select
                  id="tipo"
                  value={tipoSessao}
                  onChange={(e) => setTipoSessao(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-camel"
                >
                  {TIPOS_RETORNO.map((t) => (
                    <option key={t.tipo} value={t.tipo}>
                      {t.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-cocoa">Dia</p>
                <Calendar
                  mode="single"
                  selected={dataObj}
                  onSelect={(d) => d && setDataEscolhida(dataParaChave(d))}
                  disabled={(d) =>
                    !ehDiaDeAtendimento(d, meuSlug) ||
                    d < new Date(new Date().toDateString()) ||
                    !diasChave.includes(dataParaChave(d))
                  }
                  className="rounded-xl border border-border"
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-cocoa">Horário</p>
                {horarios.length === 0 ? (
                  <p className="rounded-xl border border-border px-4 py-3 text-xs text-cocoa">
                    Nenhum horário disponível nesse dia.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {horarios.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHorarioEscolhido(h)}
                        className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                          horarioEscolhido === h
                            ? "border-camel bg-espresso text-linen"
                            : "border-border bg-background hover:border-camel"
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={enviando}
              onClick={salvarRetorno}
              className="rounded-full bg-espresso px-6 py-3 text-sm font-medium text-linen transition-colors hover:bg-cocoa disabled:opacity-50"
            >
              {enviando ? "Salvando…" : "Marcar retorno"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-2xl text-espresso">Sessões</h2>
        {abertas.length === 0 && finalizadas.length === 0 && (
          <p className="mt-3 text-sm text-cocoa">Nenhuma sessão na sua agenda.</p>
        )}

        {abertas.length > 0 && (
          <div className="mt-4 space-y-3">
            {abertas.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-espresso">{rotuloSessao(s.tipoSessao)}</p>
                  <p className="mt-0.5 text-xs text-cocoa">
                    {s.atletaNome} · {s.duracaoMin} min
                  </p>
                </div>
                <div className="text-right text-sm text-cocoa">
                  <p>{new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                  <p>{s.horario}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {linkWhatsCliente(s.atletaTelefone, s.atletaNome) && (
                    <a
                      href={linkWhatsCliente(s.atletaTelefone, s.atletaNome) as string}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[#25D366] px-4 py-2 text-xs font-medium text-white hover:brightness-95"
                    >
                      WhatsApp do cliente
                    </a>
                  )}
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
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 opacity-80"
                >
                  <div>
                    <p className="text-sm font-medium text-espresso">
                      {rotuloSessao(s.tipoSessao)}
                    </p>
                    <p className="mt-0.5 text-xs text-cocoa">{s.atletaNome}</p>
                  </div>
                  <div className="text-right text-sm text-cocoa">
                    <p>
                      {new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")} · {s.horario}
                    </p>
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
