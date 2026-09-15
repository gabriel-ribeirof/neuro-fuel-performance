import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGuardaAcesso } from "@/lib/guards";
import { supabase } from "@/integrations/supabase/client";
import { formatarValor, nomeProfissional, getPacote } from "@/lib/negocio";

export const Route = createFileRoute("/admin/paciente")({
  validateSearch: (s: Record<string, unknown>): { atleta?: string } => {
    const out: { atleta?: string } = {};
    if (typeof s["atleta"] === "string") out.atleta = s.atleta;
    return out;
  },
  head: () => ({ meta: [{ title: "Paciente — Painel admin" }] }),
  component: AdminPacientePage,
});

type Athlete = {
  id: string;
  nome: string;
  sobrenome: string;
  idade: number | null;
  clube: string | null;
  telefone: string | null;
  user_id: string;
};

type Contract = {
  id: string;
  pacote_slug: string;
  valor_centavos: number;
  status: string;
  created_at: string;
};

type Session = {
  id: string;
  profissional_slug: string;
  tipo_sessao: string;
  data: string;
  horario: string;
  duracao_min: number;
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
    "retorno-neuro": "Retorno de Neuro",
    "retorno-nutri": "Retorno de Nutri",
  };
  return mapa[tipo] ?? tipo;
}

function AdminPacientePage() {
  const { atleta: atletaParam } = useSearch({ from: "/admin/paciente" });
  const { user, carregando } = useAuth();
  useGuardaAcesso(["admin"], "/acesso-equipe");

  const [atletas, setAtletas] = useState<Athlete[]>([]);
  const [atletaId, setAtletaId] = useState<string>(atletaParam ?? "");
  const [contratos, setContratos] = useState<Contract[]>([]);
  const [sessoes, setSessoes] = useState<Session[]>([]);
  const [aba, setAba] = useState<"dados" | "sessoes" | "anamnese" | "prontuario">("dados");
  const [carregou, setCarregou] = useState(false);

  // Carrega lista de atletas
  useEffect(() => {
    if (carregando || !user) return;
    supabase
      .from("atletas")
      .select("id, nome, sobrenome, idade, clube, telefone, user_id")
      .order("nome")
      .then(({ data }) => {
        setAtletas((data ?? []) as Athlete[]);
        setCarregou(true);
      });
  }, [carregando, user]);

  // Carrega dados do atleta selecionado
  useEffect(() => {
    if (!atletaId) {
      setContratos([]);
      setSessoes([]);
      return;
    }
    Promise.all([
      supabase
        .from("contratos")
        .select("id, pacote_slug, valor_centavos, status, created_at")
        .eq("atleta_id", atletaId)
        .order("created_at", { ascending: false }),
      supabase
        .from("agendamentos")
        .select("id, profissional_slug, tipo_sessao, data, horario, duracao_min, status")
        .eq("atleta_id", atletaId)
        .order("data", { ascending: true }),
    ]).then(([contratosRes, sessoesRes]) => {
      setContratos((contratosRes.data ?? []) as Contract[]);
      setSessoes((sessoesRes.data ?? []) as Session[]);
    });
  }, [atletaId]);

  if (carregando || !user || !carregou) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-20 text-sm text-cocoa">Carregando…</section>
    );
  }

  const atletaSelecionado = atletas.find((a) => a.id === atletaId);
  const contratoAtivo = contratos.find((c) => c.status === "pago");
  const sessoesFuturas = sessoes.filter(
    (s) => s.status === "agendado" || s.status === "confirmado",
  );
  const sessoesPassadas = sessoes.filter(
    (s) => s.status === "realizado" || s.status === "cancelado",
  );

  const abas = [
    { id: "dados" as const, label: "Dados do Atleta" },
    { id: "sessoes" as const, label: "Sessões" },
    { id: "anamnese" as const, label: "Anamnese" },
    { id: "prontuario" as const, label: "Prontuário" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="eyebrow">Painel admin</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-espresso">Área do paciente</h1>
        <Link
          to="/admin"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-espresso hover:bg-card"
        >
          ← Voltar ao painel
        </Link>
      </div>

      {/* Seletor de atleta */}
      <div className="mt-8 space-y-1.5">
        <label htmlFor="atleta-select" className="text-sm text-cocoa">
          Selecionar atleta
        </label>
        <select
          id="atleta-select"
          value={atletaId}
          onChange={(e) => {
            setAtletaId(e.target.value);
            setAba("dados");
          }}
          className="w-full max-w-md rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-camel"
        >
          <option value="">Selecione um atleta…</option>
          {atletas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome} {a.sobrenome}
            </option>
          ))}
        </select>
      </div>

      {!atletaId && (
        <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-cocoa">Selecione um atleta para ver os dados.</p>
        </div>
      )}

      {atletaId && atletaSelecionado && (
        <>
          {/* Tabs */}
          <div className="mt-8 flex gap-1 rounded-xl border border-border bg-card p-1">
            {abas.map((a) => (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  aba === a.id ? "bg-espresso text-linen" : "text-cocoa hover:bg-background"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Aba: Dados do Atleta */}
          {aba === "dados" && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-lg text-espresso">Dados pessoais</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cocoa">Nome completo</span>
                    <span className="text-espresso">
                      {atletaSelecionado.nome} {atletaSelecionado.sobrenome}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cocoa">Idade</span>
                    <span className="text-espresso">{atletaSelecionado.idade ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cocoa">Clube</span>
                    <span className="text-espresso">{atletaSelecionado.clube ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cocoa">Telefone</span>
                    <span className="text-espresso">{atletaSelecionado.telefone ?? "—"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-lg text-espresso">Contrato</h3>
                {contratoAtivo ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cocoa">Pacote</span>
                      <span className="text-espresso">
                        {getPacote(contratoAtivo.pacote_slug)?.nome ?? contratoAtivo.pacote_slug}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cocoa">Valor</span>
                      <span className="text-espresso">
                        {formatarValor(contratoAtivo.valor_centavos)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cocoa">Status</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          contratoAtivo.status === "pago"
                            ? "bg-emerald-600/10 text-emerald-700"
                            : "bg-camel/20 text-cocoa"
                        }`}
                      >
                        {contratoAtivo.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cocoa">Criado em</span>
                      <span className="text-espresso">
                        {new Date(contratoAtivo.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-cocoa">Nenhum contrato ativo.</p>
                )}
              </div>
            </div>
          )}

          {/* Aba: Sessões */}
          {aba === "sessoes" && (
            <div className="mt-6">
              <h3 className="font-display text-lg text-espresso">Próximas sessões</h3>
              {sessoesFuturas.length === 0 ? (
                <p className="mt-3 text-sm text-cocoa">Nenhuma sessão futura.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {sessoesFuturas.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-espresso">
                          {rotuloSessao(s.tipo_sessao)}
                        </p>
                        <p className="mt-0.5 text-xs text-cocoa">
                          {nomeProfissional(s.profissional_slug as never)} · {s.duracao_min} min
                        </p>
                      </div>
                      <div className="text-right text-sm text-cocoa">
                        <p>{new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                        <p>{s.horario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sessoesPassadas.length > 0 && (
                <>
                  <h3 className="mt-8 font-display text-lg text-espresso">Histórico</h3>
                  <div className="mt-4 space-y-3">
                    {sessoesPassadas.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 opacity-80"
                      >
                        <div>
                          <p className="text-sm font-medium text-espresso">
                            {rotuloSessao(s.tipo_sessao)}
                          </p>
                          <p className="mt-0.5 text-xs text-cocoa">
                            {nomeProfissional(s.profissional_slug as never)}
                          </p>
                        </div>
                        <div className="text-right text-sm text-cocoa">
                          <p>
                            {new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                            {s.horario}
                          </p>
                          <p className="capitalize">{s.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Aba: Anamnese */}
          {aba === "anamnese" && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-8">
              <h3 className="font-display text-lg text-espresso">Anamnese</h3>
              <p className="mt-2 text-sm text-cocoa">
                Formulário de anamnese do atleta {atletaSelecionado.nome}{" "}
                {atletaSelecionado.sobrenome}.
              </p>
              <div className="mt-6 rounded-xl border border-dashed border-border bg-background p-8 text-center">
                <p className="text-sm text-cocoa">
                  Em breve: formulário de anamnese digital com respostas do atleta, histórico de
                  queixas, objetivos e observações clínicas.
                </p>
              </div>
            </div>
          )}

          {/* Aba: Prontuário */}
          {aba === "prontuario" && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-8">
              <h3 className="font-display text-lg text-espresso">Prontuário</h3>
              <p className="mt-2 text-sm text-cocoa">
                Prontuário eletrônico de {atletaSelecionado.nome} {atletaSelecionado.sobrenome}.
              </p>
              <div className="mt-6 rounded-xl border border-dashed border-border bg-background p-8 text-center">
                <p className="text-sm text-cocoa">
                  Em breve: prontuário com evolução clínica, notas dos profissionais, planos
                  nutricionais e relatórios de acompanhamento.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
