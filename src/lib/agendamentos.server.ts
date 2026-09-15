// Server functions de agendamento.
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/integrations/supabase/auth-middleware.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  ANAMNESE_ORDEM,
  dataParaChave,
  mesmaSemana,
  type HorarioOcupado,
  type ProfissionalSlug,
} from "@/lib/negocio";

export type AgendamentoMsg = {
  ok: boolean;
  erro?: string;
};

/**
 * Agenda a anamnese (1ª etapa obrigatória do contrato), respeitando as regras
 * do briefing:
 *   – o contrato precisa estar PAGO;
 *   – 1ª sessão com Amanda, 2ª com Letícia;
 *   – as DUAS na MESMA semana civil (seg–dom);
 *   – Amanda precisa acontecer antes de Letícia.
 */
export const agendarAnamnese = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (dado: {
      contratoId: string;
      amandaData: string; // YYYY-MM-DD
      amandaHorario: string;
      leticiaData: string;
      leticiaHorario: string;
    }) => dado,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const anamneseNeuro = ANAMNESE_ORDEM[0]!;
    const anamneseNutri = ANAMNESE_ORDEM[1]!;

    // 1. Contrato pertence ao responsável e está pago.
    const { data: contrato } = await supabase
      .from("contratos")
      .select("id, user_id, atleta_id, status")
      .eq("id", data.contratoId)
      .maybeSingle();
    if (!contrato || contrato.user_id !== userId) {
      return { ok: false, erro: "Contrato não encontrado." };
    }
    if (contrato.status !== "pago") {
      return { ok: false, erro: "O contrato precisa estar pago para agendar." };
    }

    // 2. Regra da mesma semana.
    const amanda = new Date(`${data.amandaData}T12:00:00`);
    const leticia = new Date(`${data.leticiaData}T12:00:00`);
    if (!mesmaSemana(amanda, leticia)) {
      return {
        ok: false,
        erro: "As sessões de Amanda e Letícia precisam ficar marcadas na mesma semana.",
      };
    }

    // 3. Amanda antes de Letícia (mesmo dia ou dia anterior da semana).
    if (leticia < amanda) {
      return {
        ok: false,
        erro: "A sessão com Amanda precisa ser marcada antes da sessão com Letícia.",
      };
    }

    const amandaData = dataParaChave(amanda);
    const leticiaData = dataParaChave(leticia);

    // 4. Já existe anamnese marcada pra esse contrato?
    const { data: existentes } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("contrato_id", data.contratoId)
      .in("tipo_sessao", [anamneseNeuro.tipo, anamneseNutri.tipo])
      .eq("status", "agendado");
    if (existentes && existentes.length > 0) {
      return { ok: false, erro: "A anamnese desse contrato já está marcada." };
    }

    // 5. Checa conflito de horário (outros contratos já ocuparam o slot).
    const { data: ocupados } = await supabaseAdmin
      .from("agendamentos")
      .select("data, horario, profissional_slug")
      .in("data", [amandaData, leticiaData])
      .in("status", ["agendado", "confirmado"]);
    const indiceOcupado = new Set<string>();
    for (const o of ocupados ?? []) {
      indiceOcupado.add(`${o.data}|${o.horario}|${o.profissional_slug}`);
    }

    const conflita = (dataStr: string, horario: string, profissional: string) =>
      indiceOcupado.has(`${dataStr}|${horario}|${profissional}`);

    if (conflita(amandaData, data.amandaHorario, anamneseNeuro.profissional)) {
      return { ok: false, erro: "Esse horário da Amanda já foi reservado. Escolha outro." };
    }
    if (conflita(leticiaData, data.leticiaHorario, anamneseNutri.profissional)) {
      return { ok: false, erro: "Esse horário da Letícia já foi reservado. Escolha outro." };
    }

    // 6. Cria as duas sessões.
    const { error } = await supabase
      .from("agendamentos")
      .insert([
        {
          contrato_id: data.contratoId,
          atleta_id: contrato.atleta_id,
          profissional_slug: "amanda",
          tipo_sessao: "anamnese-neuro",
          data: amandaData,
          horario: data.amandaHorario,
          duracao_min: 60,
          status: "agendado",
        },
        {
          contrato_id: data.contratoId,
          atleta_id: contrato.atleta_id,
          profissional_slug: "leticia",
          tipo_sessao: "anamnese-nutri",
          data: leticiaData,
          horario: data.leticiaHorario,
          duracao_min: 60,
          status: "agendado",
        },
      ]);
    if (error) return { ok: false, erro: error.message };

    // WhatsApp: ponto de integração externa (Z-API / WABA) — ver lib/whatsapp.
    return { ok: true };
  });

/**
 * Lista as sessões do responsável logado (todas, com status).
 */
export async function listarMeusAgendamentos(userId: string) {
  const db = await supabaseAdmin;
  const { data } = await db
    .from("agendamentos")
    .select(
      "id, contrato_id, profissional_slug, tipo_sessao, data, horario, duracao_min, status",
    )
    .order("data", { ascending: true });
  void userId;
  return data ?? [];
}

export type { HorarioOcupado };

/** Consulta horários ocupados num intervalo (qualquer cliente autenticado consulta). */
export const buscarHorariosOcupados = createServerFn({ method: "GET" })
  .validator((dado: { inicio: string; fim: string }) => dado)
  .handler(async ({ data }) => {
    const { data: ocupados } = await supabaseAdmin
      .from("agendamentos")
      .select("data, horario, duracao_min, profissional_slug")
      .in("status", ["agendado", "confirmado"])
      .gte("data", data.inicio)
      .lte("data", data.fim);
    return (ocupados ?? []).map((o) => ({
      data: o.data ?? "",
      horario: o.horario ?? "",
      duracaoMin: o.duracao_min ?? 0,
      profissional: (o.profissional_slug ?? "amanda") as ProfissionalSlug,
    }));
  });

/**
 * Fluxo novo: o cliente escolhe o pacote, marca as duas sessões da anamnese e
 * só então vai pro pagamento. As sessões nascem "aguardando_pagamento" (seguram
 * o horário) e só viram "confirmado" quando o webhook do Mercado Pago avisa que
 * o pagamento foi aprovado.
 */
export const reservarAnamneseEIniciarPagamento = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (dado: {
      atletaId: string;
      pacoteSlug: string;
      amandaData: string;
      amandaHorario: string;
      leticiaData: string;
      leticiaHorario: string;
    }) => dado,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { getPacote } = await import("@/lib/negocio");
    const { criarPreferenciaPagamento } = await import("@/lib/mercado-pago.server");

    const pacote = getPacote(data.pacoteSlug);
    if (!pacote) return { ok: false as const, erro: "Pacote não encontrado." };

    const { data: atleta } = await supabase
      .from("atletas")
      .select("id")
      .eq("id", data.atletaId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!atleta) return { ok: false as const, erro: "Atleta não encontrado." };

    const amanda = new Date(`${data.amandaData}T12:00:00`);
    const leticia = new Date(`${data.leticiaData}T12:00:00`);
    if (!mesmaSemana(amanda, leticia)) {
      return { ok: false as const, erro: "As duas sessões precisam ficar na mesma semana." };
    }
    if (leticia < amanda) {
      return { ok: false as const, erro: "A sessão com Amanda precisa vir antes da Letícia." };
    }

    const amandaData = dataParaChave(amanda);
    const leticiaData = dataParaChave(leticia);

    const { data: ocupados } = await supabaseAdmin
      .from("agendamentos")
      .select("data, horario, profissional_slug")
      .in("data", [amandaData, leticiaData])
      .in("status", ["agendado", "confirmado", "aguardando_pagamento"]);
    const indice = new Set((ocupados ?? []).map((o) => `${o.data}|${o.horario}|${o.profissional_slug}`));
    if (indice.has(`${amandaData}|${data.amandaHorario}|amanda`)) {
      return { ok: false as const, erro: "Esse horário da Amanda já foi reservado. Escolha outro." };
    }
    if (indice.has(`${leticiaData}|${data.leticiaHorario}|leticia`)) {
      return { ok: false as const, erro: "Esse horário da Letícia já foi reservado. Escolha outro." };
    }

    const { data: contrato, error: erroContrato } = await supabase
      .from("contratos")
      .insert({
        user_id: userId,
        atleta_id: data.atletaId,
        pacote_slug: pacote.slug,
        valor_centavos: pacote.valorCentavos,
        status: "pendente",
      })
      .select("id")
      .single();
    if (erroContrato || !contrato) {
      return { ok: false as const, erro: erroContrato?.message ?? "Não foi possível criar o contrato." };
    }

    const { error: erroSessoes } = await supabaseAdmin.from("agendamentos").insert([
      {
        contrato_id: contrato.id as string,
        atleta_id: data.atletaId,
        profissional_slug: "amanda",
        tipo_sessao: "anamnese-neuro",
        data: amandaData,
        horario: data.amandaHorario,
        duracao_min: 60,
        status: "aguardando_pagamento",
      },
      {
        contrato_id: contrato.id as string,
        atleta_id: data.atletaId,
        profissional_slug: "leticia",
        tipo_sessao: "anamnese-nutri",
        data: leticiaData,
        horario: data.leticiaHorario,
        duracao_min: 60,
        status: "aguardando_pagamento",
      },
    ]);
    if (erroSessoes) return { ok: false as const, erro: erroSessoes.message };

    const { data: ud } = await supabaseAdmin.auth.admin.getUserById(userId);

    const preferencia = await criarPreferenciaPagamento({
      contratoId: contrato.id as string,
      titulo: `Pacote ${pacote.nome} — Nutrição Neurofuncional iEsports`,
      valorCentavos: pacote.valorCentavos,
      emailCliente: ud?.user?.email ?? null,
    });

    return { ok: true as const, contratoId: contrato.id as string, initPoint: preferencia.initPoint };
  });
