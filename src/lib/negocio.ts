// Regras de negócio do Nutrição Neurofuncional iEsports — puras, sem I/O.
// Pacotes, profissionais, sessões e a regra de sequência da anamnese
// (Amanda primeiro, Letícia depois, na MESMA semana).

export type ProfissionalSlug = "amanda" | "manuela" | "leticia" | "gabriel";

export const PROFISSIONAIS: { slug: ProfissionalSlug; nome: string; especialidade: string }[] = [
  { slug: "amanda", nome: "Amanda Ciaramicoli", especialidade: "Neuronutricionista" },
  { slug: "manuela", nome: "Manuela Gestal", especialidade: "Neuronutricionista" },
  { slug: "leticia", nome: "Letícia Frazão", especialidade: "Nutricionista esportiva" },
  { slug: "gabriel", nome: "Gabriel Fernandes", especialidade: "Auxiliar de atendimentos" },
];

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
    nome: "Inicial",
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
    nome: "Plus Atletas",
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
    nome: "Plus com Teste Genético",
    chamada: "Pacote Plus + teste genético + devolutiva",
    nota: "Valor do teste genético: R$ 4.500",
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
    nome: "Plus Pais",
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
export type Horario = (typeof HORARIOS)[number];

export const DJA_SEMANA_ATENDIMENTO = [1, 2, 3, 4, 5]; // seg–sex

export function ehDiaDeAtendimento(data: Date): boolean {
  return DJA_SEMANA_ATENDIMENTO.includes(data.getDay());
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
  if (!ehDiaDeAtendimento(data)) return [];

  const chave = dataParaChave(data);
  const ocupadosDia = ocupados.filter(
    (o) => o.data === chave && o.profissional === profissional,
  );

  return HORARIOS.filter((horario) => {
    const conflita = ocupadosDia.some((o) => o.horario === horario);
    return !conflita;
  });
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