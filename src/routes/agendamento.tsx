import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGuardaAcesso } from "@/lib/guards";
import { listarMeusContratos } from "@/lib/contratos.server";
import {
  agendarAnamnese,
  buscarHorariosOcupados,
  reservarAnamneseEIniciarPagamento,
  type HorarioOcupado,
} from "@/lib/agendamentos.server";
import { supabase } from "@/integrations/supabase/client";
import {
  HORARIOS,
  formatarValor,
  getPacote,
  dataParaChave,
  ehDiaDeAtendimento,
  horariosDisponiveis,
  inicioDaSemana,
  linkWhatsAppProfissional,
  mesmaSemana,
  nomeProfissional,
  proximosDias,
  type Horario,
} from "@/lib/negocio";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearch } from "@tanstack/react-router";

export const Route = createFileRoute("/agendamento")({
  validateSearch: (s: Record<string, unknown>): { contrato?: string; pacote?: string; atleta?: string } => {
    const out: { contrato?: string; pacote?: string; atleta?: string } = {};
    if (typeof s["contrato"] === "string") out.contrato = s["contrato"];
    if (typeof s["pacote"] === "string") out.pacote = s["pacote"];
    if (typeof s["atleta"] === "string") out.atleta = s["atleta"];
    return out;
  },
  head: () => ({ meta: [{ title: "Agendar avaliação — Nutrição Neurofuncional iEsports" }] }),
  component: AgendamentoPage,
});

function Cabecalho({ passo, total, titulo, texto }: { passo: number; total: number; titulo: string; texto: string }) {
  return (
    <div className="mb-8">
      <p className="eyebrow">Etapa {passo} de {total}</p>
      <h1 className="mt-3 font-display text-3xl text-espresso">{titulo}</h1>
      <p className="mt-2 max-w-xl text-sm text-cocoa">{texto}</p>
    </div>
  );
}

type ContratoResumo = { id: string; pacoteSlug: string; valorCentavos: number; atletaNome: string };

function AgendamentoPage() {
  const { contrato: contratoParam } = useSearch({ from: "/agendamento" });
  const navigate = useNavigate();

  const { user, carregando: authCarregando } = useAuth();
  useGuardaAcesso(["responsavel"], "/login");
  const [contratos, setContratos] = useState<ContratoResumo[]>([]);
  const [carregandoContratos, setCarregandoContratos] = useState(true);

  const [contratoId, setContratoId] = useState<string>("");
  const [ocupados, setOcupados] = useState<HorarioOcupado[]>([]);

  // Datas de Amanda e Letícia (YYYY-MM-DD)
  const [amandaData, setAmandaData] = useState<string | undefined>();
  const [amandaHorario, setAmandaHorario] = useState<Horario | null>(null);
  const [leticiaData, setLeticiaData] = useState<string | undefined>();
  const [leticiaHorario, setLeticiaHorario] = useState<Horario | null>(null);

  const [termo, setTermo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState("");

  const dias = useMemo(() => proximosDias(21), []);
  const diasChave = useMemo(() => dias.map(dataParaChave), [dias]);

  useEffect(() => {
    if (authCarregando) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    listarMeusContratos().then((lista) => {
      const pagos = lista
        .filter((c) => c.status === "pago")
        .map((c) => ({
          id: c.id,
          pacoteSlug: c.pacoteSlug,
          valorCentavos: c.valorCentavos,
          atletaNome: c.atletaNome,
        }));
      setContratos(pagos);
      if (pagos.length > 0) {
        const inicial = (contratoParam && pagos.some((c) => c.id === contratoParam) ? contratoParam : pagos[0]?.id) ?? "";
        setContratoId(inicial);
      }
      setCarregandoContratos(false);
    });
  }, [authCarregando, user, contratoParam, navigate]);

  // Carrega horários ocupados do intervalo de dias exibidos.
  useEffect(() => {
    if (dias.length === 0) return;
    const inicio = dias[0]?.toISOString().slice(0, 10);
    const fim = dias[dias.length - 1]?.toISOString().slice(0, 10);
    if (!inicio || !fim) return;
    buscarHorariosOcupados({ data: { inicio, fim } }).then((dados) => setOcupados(dados));
  }, [dias]);

  const amandaDataObj = amandaData ? new Date(`${amandaData}T12:00:00`) : undefined;
  const leticiaDataObj = leticiaData ? new Date(`${leticiaData}T12:00:00`) : undefined;

  const amandaHorarios = amandaDataObj
    ? horariosDisponiveis(amandaDataObj, "amanda", ocupados)
    : [];
  const leticiaHorarios = leticiaDataObj
    ? horariosDisponiveis(leticiaDataObj, "leticia", ocupados)
    : [];

  // Dias válidos para a Letícia: na mesma semana da data escolhida de Amanda.
  const diasLeticia = useMemo(() => {
    if (!amandaDataObj) return dias;
    return dias.filter((d) => mesmaSemana(d, amandaDataObj) && d >= amandaDataObj);
  }, [dias, amandaDataObj]);

  // Reset dos horários quando muda a data.
  useEffect(() => {
    setAmandaHorario(null);
  }, [amandaData]);
  useEffect(() => {
    setLeticiaHorario(null);
  }, [leticiaData]);

  function trocarAmanda(d?: Date) {
    setAmandaData(d ? dataParaChave(d) : undefined);
    setLeticiaData(undefined);
    setLeticiaHorario(null);
  }

  function escolherLeticia(d: Date) {
    setLeticiaData(dataParaChave(d));
  }

  function passoAtual(): number {
    if (!amandaData || !amandaHorario) return 1;
    if (!leticiaData || !leticiaHorario) return 2;
    return 3;
  }

  async function confirmar() {
    setErro(null);
    setSucesso("");
    if (!contratoId) {
      setErro("Selecione o contrato para agendar.");
      return;
    }
    if (!amandaData || !amandaHorario || !leticiaData || !leticiaHorario) {
      setErro("Preencha as duas sessões da anamnese.");
      return;
    }
    if (!termo) {
      setErro("Você precisa aceitar o termo de responsabilidade para confirmar.");
      return;
    }

    setEnviando(true);
    try {
      const resultado = await agendarAnamnese({
        data: {
          contratoId,
          amandaData,
          amandaHorario,
          leticiaData,
          leticiaHorario,
        },
      });
      if (!resultado.ok) {
        setErro(resultado.erro ?? "Não foi possível agendar.");
        setEnviando(false);
        return;
      }
      setSucesso("Avaliação agendada! Compartilhe a confirmação com a equipe pelo WhatsApp abaixo.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao agendar.");
    }
    setEnviando(false);
  }

  if (authCarregando || carregandoContratos) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-20 text-sm text-cocoa">Carregando…</section>
    );
  }

  if (contratos.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="eyebrow">Agendar avaliação</p>
        <h1 className="mt-4 font-display text-3xl text-espresso">Nenhum pacote pago</h1>
        <p className="mt-3 text-sm text-cocoa">
          Para agendar a avaliação inicial você precisa ter um pacote com pagamento confirmado.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/pacotes" className="rounded-full bg-espresso px-6 py-3.5 text-sm font-medium text-linen hover:bg-cocoa">
            Ver pacotes
          </Link>
          <Link to="/area-cliente" className="rounded-full border border-border px-6 py-3.5 text-sm font-medium text-espresso hover:bg-card">
            Área do cliente
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <Cabecalho
        passo={passoAtual()}
        total={3}
        titulo="Agendar avaliação inicial"
        texto="Primeiro a sessão de neuro com Amanda e depois a avaliação nutricional com Letícia — as duas na mesma semana."
      />

      <div className="mb-8 space-y-1.5">
        <label htmlFor="contrato" className="text-sm text-cocoa">Contrato</label>
        <select
          id="contrato"
          value={contratoId}
          onChange={(e) => setContratoId(e.target.value)}
          className="w-full max-w-md rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-camel"
        >
          {contratos.map((c) => (
            <option key={c.id} value={c.id}>
              Pacote {c.pacoteSlug} — {c.atletaNome}
            </option>
          ))}
        </select>
      </div>

      {/* Passo 1: Amanda */}
      <div className={`rounded-2xl border p-6 ${passoAtual() === 1 ? "border-camel" : "border-border"}`}>
        <h2 className="font-display text-xl text-espresso">1. Neuro com Amanda</h2>
        <p className="mt-1 text-sm text-cocoa">Escolha o dia e o horário da sessão de anamnese de neuro.</p>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-cocoa">Dia</p>
            <Calendar
              mode="single"
              selected={amandaData ? new Date(`${amandaData}T12:00:00`) : undefined}
              onSelect={trocarAmanda}
              disabled={(d) => !ehDiaDeAtendimento(d) || d < new Date(new Date().toDateString()) || !diasChave.includes(dataParaChave(d))}
              className="rounded-xl border border-border"
            />
          </div>
          <div>
            <p className="mb-2 text-sm text-cocoa">Horário</p>
            {amandaHorarios.length === 0 ? (
              <p className="rounded-xl border border-border px-4 py-3 text-xs text-cocoa">
                Nenhum horário disponível nesse dia.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {amandaHorarios.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setAmandaHorario(h)}
                    className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                      amandaHorario === h
                        ? "border-camel bg-espresso text-linen"
                        : "border-border bg-card hover:border-camel"
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

      {/* Passo 2: Letícia */}
      {passoAtual() >= 2 && (
        <div className={`mt-6 rounded-2xl border p-6 ${passoAtual() === 2 ? "border-camel" : "border-border"}`}>
          <h2 className="font-display text-xl text-espresso">2. Nutrição com Letícia</h2>
          <p className="mt-1 text-sm text-cocoa">
            Mesma semana da sessão da Amanda{amandaData ? ` (semana de ${inicioDaSemana(amandaDataObj!).toLocaleDateString("pt-BR")})` : ""}.
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm text-cocoa">Dia</p>
              <Calendar
                mode="single"
                selected={leticiaData ? new Date(`${leticiaData}T12:00:00`) : undefined}
                onSelect={(d) => d && escolherLeticia(d)}
                disabled={(d) => !ehDiaDeAtendimento(d) || !diasLeticia.some((x) => dataParaChave(x) === dataParaChave(d))}
                className="rounded-xl border border-border"
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-cocoa">Horário</p>
              {leticiaHorarios.length === 0 ? (
                <p className="rounded-xl border border-border px-4 py-3 text-xs text-cocoa">
                  Nenhum horário disponível nesse dia.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {leticiaHorarios.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setLeticiaHorario(h)}
                      className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                        leticiaHorario === h
                          ? "border-camel bg-espresso text-linen"
                          : "border-border bg-card hover:border-camel"
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
      )}

      {/* Passo 3: Termo */}
      {passoAtual() >= 3 && (
        <div className={`mt-6 rounded-2xl border p-6 ${passoAtual() === 3 ? "border-camel" : "border-border"}`}>
          <h2 className="font-display text-xl text-espresso">3. Termo de responsabilidade</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cocoa">
            Confirmo que o atleta está em boas condições para participar das avaliações e que os
            dados informados no cadastro são verdadeiros. Estou ciente de que a avaliação é
            educativa e não substitui diagnóstico médico, e que o plano nutricional é individualizado
            e será acompanhado pela equipe da Nutrição Neurofuncional iEsports.
          </p>
          <label className="mt-5 flex items-start gap-3 text-sm text-cocoa">
            <Checkbox
              checked={termo}
              onCheckedChange={(v) => setTermo(v === true)}
              className="mt-0.5"
            />
            <span>Aceito o termo de responsabilidade digital acima.</span>
          </label>
        </div>
      )}

      {erro && (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">{erro}</p>
      )}
      {sucesso && (
        <div className="mt-6 rounded-xl border border-emerald-600/30 bg-emerald-600/5 px-4 py-3 text-xs text-emerald-800">
          <p>{sucesso}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { slug: "amanda" as const, data: amandaData, horario: amandaHorario },
              { slug: "leticia" as const, data: leticiaData, horario: leticiaHorario },
            ].map((item) => {
              const link = item.data && item.horario
                ? linkWhatsAppProfissional(
                    item.slug,
                    `Olá, ${nomeProfissional(item.slug)}! Confirmo a sessão do dia ${new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR")} às ${item.horario}. Meu contrato com a Nutrição Neurofuncional iEsports já está pago.`,
                  )
                : null;
              if (!link) return null;
              return (
                <a
                  key={item.slug}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-espresso px-4 py-2 text-xs font-medium text-linen hover:bg-cocoa"
                >
                  Enviar confirmação para {nomeProfissional(item.slug)}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {passoAtual() >= 2 && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={passoAtual() < 3 || enviando}
            onClick={confirmar}
            className="rounded-full bg-espresso px-6 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cocoa disabled:opacity-50"
          >
            {enviando ? "Confirmando…" : "Confirmar agendamento"}
          </button>
          {sucesso && (
            <button
              type="button"
              onClick={() => navigate({ to: "/area-cliente" })}
              className="rounded-full border border-border px-6 py-3.5 text-sm font-medium text-espresso hover:bg-card"
            >
              Ir para a área do cliente
            </button>
          )}
        </div>
      )}
    </section>
  );
}