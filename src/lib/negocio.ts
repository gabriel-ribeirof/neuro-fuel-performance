// Regras de negócio do Nutrição Neurofuncional iEsports — puras, sem I/O.
// Pacotes, profissionais, sessões e a regra de sequência da anamnese
// (Amanda primeiro, Letícia depois, na MESMA semana).

export type ProfissionalSlug = "amanda" | "manuela" | "leticia" | "gabriel";

export type Profissional = {
  slug: ProfissionalSlug;
  nome: string;
  especialidade: string;
  // WhatsApp com DDI + DDD, apenas dígitos (ex: 5511999998888).
  // Usado nos links wa.me das confirmações. Deixe vazio até saber o número.
  whatsapp: string;
};

export const PROFISSIONAIS: Profissional[] = [
  { slug: "amanda", nome: "Amanda Ciaramicoli", especialidade: "Nutricionista Neurofuncional", whatsapp: "5511984975662" },
  { slug: "manuela", nome: "Manuela Gestal", especialidade: "Nutricionista Neurofuncional", whatsapp: "5511936212928" },
  { slug: "leticia", nome: "Letícia Frazão", especialidade: "Nutricionista esportiva", whatsapp: "5521981226038" },
  { slug: "gabriel", nome: "Gabriel Fernandes", especialidade: "Auxiliar de atendimentos", whatsapp: "5521996864747" },
];

/** Link wa.me (abre WhatsApp com mensagem pronta) pra um profissional. */
export function linkWhatsAppProfissional(slug: ProfissionalSlug, texto: string): string | null {
  const numero = PROFISSIONAIS.find((p) => p.slug === slug)?.whatsapp?.replace(/\D/g, "");
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function nomeProfissional(slug: ProfissionalSlug): string {
  return PROFISSIONAIS.find((p) => p.slug === slug)?.nome ?? slug;
}

export type SessaoPacote = {
  tipo: string; // ex: "neuro", "nutri", "psico", "genetico", "devolutiva", "multidisciplinar"
  rotulo: string; // ex: "Sessão de Neuro"
  profissional: ProfissionalSlug;
};

export type Pacote = {
  slug: string;
  nome: string;
  chamada: string;
  valorCentavos: number;
  nota?: string;
  sessoes: SessaoPacote[];
};

// Preços e composição extraídos do briefing institucional.
export const PACOTES: Pacote[] = [
  {
    slug: "inicial",
    nome: "Pacote Atleta",
    chamada: "Primeira etapa de avaliação completa",
    valorCentavos: 150_000,
    sessoes: [
      { tipo: "neuro", rotulo: "1 Neuro", profissional: "amanda" },
      { tipo: "nutri", rotulo: "1 Nutri", profissional: "leticia" },
      { tipo: "psico", rotulo: "4 Sessões visando a performance esportiva", profissional: "gabriel" },
    ],
  },
  {
    slug: "plus-atletas",
    nome: "Pacote Atleta Performance",
    chamada: "Acompanhamento intensivo de temporada",
    valorCentavos: 310_000,
    sessoes: [
      { tipo: "neuro", rotulo: "2 Neuro", profissional: "amanda" },
      { tipo: "nutri", rotulo: "2 Nutri", profissional: "leticia" },
      { tipo: "psico", rotulo: "8 Sessões visando a performance esportiva", profissional: "gabriel" },
      { tipo: "multidisciplinar", rotulo: "1 sessão final multidisciplinar", profissional: "amanda" },
    ],
  },
  {
    slug: "plus-genetico",
    nome: "Atleta Pro",
    chamada: "O mais completo — inclui teste genético e devolutiva",
    valorCentavos: 649_000,
    sessoes: [
      { tipo: "neuro", rotulo: "2 Neuro", profissional: "amanda" },
      { tipo: "nutri", rotulo: "2 Nutri", profissional: "leticia" },
      { tipo: "psico", rotulo: "8 Sessões visando a performance esportiva", profissional: "gabriel" },
      { tipo: "genetico", rotulo: "Teste Genético e de Metabolômica", profissional: "amanda" },
      { tipo: "devolutiva", rotulo: "Devolutiva do laudo (60 páginas, 270 genes)", profissional: "amanda" },
      { tipo: "multidisciplinar", rotulo: "1 sessão final multidisciplinar", profissional: "amanda" },
    ],
  },
  {
    slug: "plus-pais",
    nome: "Pais de Atletas",
    chamada: "Acompanhamento para atletas com apoio familiar",
    valorCentavos: 250_000,
    sessoes: [
      { tipo: "neuro", rotulo: "2 Neuro", profissional: "amanda" },
      { tipo: "nutri", rotulo: "2 Nutri", profissional: "leticia" },
      { tipo: "neuro-amanda", rotulo: "2 Neuro (Amanda)", profissional: "amanda" },
      { tipo: "retorno-neuro", rotulo: "1 retorno Neuro", profissional: "amanda" },
      { tipo: "retorno-nutri", rotulo: "1 retorno Nutri", profissional: "leticia" },
    ],
  },
  {
    slug: "genetico-avulso",
    nome: "Teste Genético Avulso",
    chamada: "Teste genético e de metabolômica sem pacote",
    nota: "Pode ser contratado separadamente, sem precisar de pacote.",
    valorCentavos: 450_000,
    sessoes: [
      { tipo: "genetico", rotulo: "Teste Genético e de Metabolômica", profissional: "amanda" },
      { tipo: "devolutiva", rotulo: "Devolutiva do laudo (60 páginas, 270 genes)", profissional: "amanda" },
    ],
  },
];

export function getPacote(slug: string): Pacote | undefined {
  return PACOTES.find((p) => p.slug === slug);
}

export function formatarValor(valorCentavos: number): string {
  return (valorCentavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// --- Regra da anamnese ---
// Após o pagamento, as DUAS primeiras sessões precisam obedecer:
//   1) Primeiro uma sessão com Amanda (anamnese de neuro).
//   2) Depois uma sessão com Letícia (avaliação nutricional).
//   3) As duas precisam ficar marcadas DENTRO DA MESMA SEMANA.
export const ANAMNESE_ORDEM: { tipo: string; profissional: ProfissionalSlug }[] = [
  { tipo: "anamnese-neuro", profissional: "amanda" },
  { tipo: "anamnese-nutri", profissional: "leticia" },
];

export const HORARIOS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"] as const;
export type Horario = string;

export const DJA_SEMANA_ATENDIMENTO = [1, 2, 3, 4, 5]; // seg–sex

/** Quem pode conduzir a anamnese de neuro (1ª sessão). */
export const NEURO_PROFISSIONAIS: ProfissionalSlug[] = ["amanda", "manuela"];

/** Nome curto usado nas telas de agendamento. */
export function nomeCurtoProfissional(slug: ProfissionalSlug): string {
  const curtos: Record<string, string> = {
    amanda: "Amanda",
    manuela: "Manu",
    leticia: "Letícia",
    gabriel: "Gabriel",
  };
  return curtos[slug] ?? slug;
}

export type JanelaAtendimento = {
  diasSemana: number[]; // 0 = domingo
  inicio: string; // "08:00"
  fim: string; // "13:00"
  duracaoMin: number;
};

/**
 * Agenda de cada profissional.
 *  – Amanda: terças, 08h–13h, consultas de 1h20.
 *  – Manu: terças, 13h–20h, consultas de 1h20.
 *  – Demais: seg–sex, horários comerciais de 1h.
 */
export const AGENDA_PROFISSIONAL: Record<ProfissionalSlug, JanelaAtendimento[]> = {
  amanda: [{ diasSemana: [2], inicio: "08:00", fim: "13:00", duracaoMin: 80 }],
  manuela: [{ diasSemana: [2], inicio: "13:00", fim: "20:00", duracaoMin: 80 }],
  leticia: [
    { diasSemana: [1, 2, 3, 4, 5], inicio: "09:00", fim: "12:00", duracaoMin: 60 },
    { diasSemana: [1, 2, 3, 4, 5], inicio: "14:00", fim: "18:00", duracaoMin: 60 },
  ],
  gabriel: [
    { diasSemana: [1, 2, 3, 4, 5], inicio: "09:00", fim: "12:00", duracaoMin: 60 },
    { diasSemana: [1, 2, 3, 4, 5], inicio: "14:00", fim: "18:00", duracaoMin: 60 },
  ],
};

function paraMinutos(hhmm: string): number {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

function paraHora(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Duração padrão da consulta de um profissional (minutos). */
export function duracaoConsulta(profissional: ProfissionalSlug): number {
  return AGENDA_PROFISSIONAL[profissional]?.[0]?.duracaoMin ?? 60;
}

/** Todos os horários que o profissional atende naquele dia (sem checar ocupação). */
export function horariosDoDia(data: Date, profissional: ProfissionalSlug): string[] {
  const janelas = AGENDA_PROFISSIONAL[profissional] ?? [];
  const slots: string[] = [];
  for (const j of janelas) {
    if (!j.diasSemana.includes(data.getDay())) continue;
    for (let t = paraMinutos(j.inicio); t + j.duracaoMin <= paraMinutos(j.fim); t += j.duracaoMin) {
      slots.push(paraHora(t));
    }
  }
  return slots.sort();
}

export function ehDiaDeAtendimento(data: Date, profissional?: ProfissionalSlug): boolean {
  if (profissional) return horariosDoDia(data, profissional).length > 0;
  return DJA_SEMANA_ATENDIMENTO.includes(data.getDay());
}

/** O profissional de neuro atende nesse dia? (Amanda ou Manu) */
export function ehDiaDeNeuro(data: Date): boolean {
  return NEURO_PROFISSIONAIS.some((p) => ehDiaDeAtendimento(data, p));
}

export function dataParaChave(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Segunda-feira da semana da data informada. */
export function inicioDaSemana(data: Date): Date {
  const d = new Date(data);
  const delta = (d.getDay() + 6) % 7; // seg = 0
  d.setDate(d.getDate() - delta);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Mesma semana civil (seg–dom) entre duas datas. */
export function mesmaSemana(a: Date, b: Date): boolean {
  return inicioDaSemana(a).getTime() === inicioDaSemana(b).getTime();
}

export type HorarioOcupado = {
  data: string;
  horario: string;
  duracaoMin: number;
  profissional: ProfissionalSlug;
};

/**
 * Horários disponíveis para um profissional numa data, dado o conjunto de
 * horários já ocupados (de qualquer contrato). Sessão = 60 min; não pode
 * ultrapassar o último slot.
 */
export function horariosDisponiveis(
  data: Date,
  profissional: ProfissionalSlug,
  ocupados: HorarioOcupado[],
): Horario[] {
  const chave = dataParaChave(data);
  const ocupadosDia = ocupados.filter(
    (o) => o.data === chave && o.profissional === profissional,
  );

  return horariosDoDia(data, profissional).filter(
    (horario) => !ocupadosDia.some((o) => o.horario === horario),
  );
}

/** Próximos N dias de atendimento a partir de hoje (inclusive). */
export function proximosDias(quantidade: number, apartirDe: Date = new Date()): Date[] {
  const dias: Date[] = [];
  const cursor = new Date(apartirDe);
  cursor.setHours(0, 0, 0, 0);
  while (dias.length < quantidade) {
    if (ehDiaDeAtendimento(cursor)) dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}