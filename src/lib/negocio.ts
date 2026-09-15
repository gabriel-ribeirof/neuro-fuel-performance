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
  {
    slug: "amanda",
    nome: "Amanda Ciaramicoli",
    especialidade: "Nutricionista Neurofuncional",
    whatsapp: "5511984975662",
  },
  {
    slug: "manuela",
    nome: "Manuela Gestal",
    especialidade: "Nutricionista Neurofuncional",
    whatsapp: "5511936212928",
  },
  {
    slug: "leticia",
    nome: "Letícia Frazão",
    especialidade: "Nutricionista esportiva",
    whatsapp: "5521981226038",
  },
  {
    slug: "gabriel",
    nome: "Gabriel Fernandes",
    especialidade: "Auxiliar de atendimentos",
    whatsapp: "5521996864747",
  },
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
      {
        tipo: "psico",
        rotulo: "4 Sessões visando a performance esportiva",
        profissional: "gabriel",
      },
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
      {
        tipo: "psico",
        rotulo: "8 Sessões visando a performance esportiva",
        profissional: "gabriel",
      },
      {
        tipo: "multidisciplinar",
        rotulo: "1 sessão final multidisciplinar",
        profissional: "amanda",
      },
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
      {
        tipo: "psico",
        rotulo: "8 Sessões visando a performance esportiva",
        profissional: "gabriel",
      },
      { tipo: "genetico", rotulo: "Teste Genético e de Metabolômica", profissional: "amanda" },
      {
        tipo: "devolutiva",
        rotulo: "Devolutiva do laudo (60 páginas, 270 genes)",
        profissional: "amanda",
      },
      {
        tipo: "multidisciplinar",
        rotulo: "1 sessão final multidisciplinar",
        profissional: "amanda",
      },
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
      {
        tipo: "devolutiva",
        rotulo: "Devolutiva do laudo (60 páginas, 270 genes)",
        profissional: "amanda",
      },
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

/** Profissionais que atendem na anamnese de neuro (opção para o paciente). */
export const NEURO_PROFISSIONAIS: { slug: ProfissionalSlug; nome: string }[] = [
  { slug: "amanda", nome: "Amanda" },
  { slug: "manuela", nome: "Manu" },
];

export type Horario = string;

/**
 * Configuração de agenda por profissional.
 * Dias da semana: 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab.
 * Slots gerados com base na duração de cada sessão.
 */
export type ConfigAgenda = {
  diasSemana: number[];
  horaInicio: number; // hora decimal (ex: 8 = 08:00)
  horaFim: number; // hora decimal (ex: 13 = 13:00)
  duracaoMin: number;
};

export const CONFIG_AGENDA: Record<ProfissionalSlug, ConfigAgenda> = {
  amanda: { diasSemana: [2], horaInicio: 8, horaFim: 13, duracaoMin: 80 },
  manuela: { diasSemana: [2], horaInicio: 13, horaFim: 20, duracaoMin: 80 },
  leticia: { diasSemana: [1, 2, 3, 4, 5], horaInicio: 9, horaFim: 17, duracaoMin: 60 },
  gabriel: { diasSemana: [1, 2, 3, 4, 5], horaInicio: 9, horaFim: 17, duracaoMin: 60 },
};

/** Gera slots de horário (HH:MM) para uma configuração de agenda. */
function gerarSlots(cfg: ConfigAgenda): Horario[] {
  const slots: Horario[] = [];
  let minuto = cfg.horaInicio * 60;
  const fimMin = cfg.horaFim * 60;
  while (minuto + cfg.duracaoMin <= fimMin) {
    const h = Math.floor(minuto / 60);
    const m = minuto % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    minuto += cfg.duracaoMin;
  }
  return slots;
}

/** Todos os horários possíveis (uniao de todos os profissionais). */
export const HORARIOS = [
  ...new Set([
    ...gerarSlots(CONFIG_AGENDA.amanda),
    ...gerarSlots(CONFIG_AGENDA.manuela),
    ...gerarSlots(CONFIG_AGENDA.leticia),
    ...gerarSlots(CONFIG_AGENDA.gabriel),
  ]),
].sort() as readonly Horario[];

/** Dias de atendimento de um profissional (ou todos se slug for undefined). */
export function ehDiaDeAtendimento(data: Date, profissional?: ProfissionalSlug): boolean {
  const dia = data.getDay();
  if (profissional) {
    return CONFIG_AGENDA[profissional].diasSemana.includes(dia);
  }
  // Fallback: dia é válido se qualquer profissional atende nele
  return Object.values(CONFIG_AGENDA).some((c) => c.diasSemana.includes(dia));
}

/** Duração da sessão de um profissional. */
export function duracaoSessao(profissional: ProfissionalSlug): number {
  return CONFIG_AGENDA[profissional].duracaoMin;
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
 * horários já ocupados (de qualquer contrato). Usa a duração do profissional.
 */
export function horariosDisponiveis(
  data: Date,
  profissional: ProfissionalSlug,
  ocupados: HorarioOcupado[],
): Horario[] {
  if (!ehDiaDeAtendimento(data, profissional)) return [];

  const slots = gerarSlots(CONFIG_AGENDA[profissional]);
  const chave = dataParaChave(data);
  const ocupadosDia = ocupados.filter((o) => o.data === chave && o.profissional === profissional);

  return slots.filter((horario) => {
    const conflita = ocupadosDia.some((o) => o.horario === horario);
    return !conflita;
  });
}

/** Próximos N dias de atendimento a partir de hoje (inclusive). */
export function proximosDias(
  quantidade: number,
  apartirDe: Date = new Date(),
  profissional?: ProfissionalSlug,
): Date[] {
  const dias: Date[] = [];
  const cursor = new Date(apartirDe);
  cursor.setHours(0, 0, 0, 0);
  while (dias.length < quantidade) {
    if (ehDiaDeAtendimento(cursor, profissional)) dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}
