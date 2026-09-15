// Server functions de contratos e pagamentos (Mercado Pago).
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/integrations/supabase/auth-middleware.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { criarPreferenciaPagamento } from "@/lib/mercado-pago.server";
import { getPacote } from "@/lib/negocio";

/**
 * Cria um contrato (pacote) pré-agendamento e devolve a URL do Checkout Pro
 * do Mercado Pago pra redirecionar o responsável. O contrato nasce "pendente";
 * só vira "pago" quando o webhook confirma — e só dai o agendamento desbloqueia.
 */
export const criarContratoEIniciarPagamento = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((dado: { atletaId: string; pacoteSlug: string }) => dado)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const pacote = getPacote(data.pacoteSlug);
    if (!pacote) throw new Error("Pacote não encontrado.");

    // Confere que o atleta pertence ao responsável logado.
    const { data: atleta } = await supabase
      .from("atletas")
      .select("id")
      .eq("id", data.atletaId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!atleta) throw new Error("Atleta não encontrado.");

    // Cria contrato pendente.
    const { data: contrato, error } = await supabase
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
    if (error || !contrato) throw new Error(error?.message ?? "Não foi possível criar o contrato.");

    // Email do responsável para o Mercado Pago.
    const { data: ud } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = ud?.user?.email ?? null;

    const preferencia = await criarPreferenciaPagamento({
      contratoId: contrato.id as string,
      titulo: `Pacote ${pacote.nome} — Nutrição Neurofuncional iEsports`,
      valorCentavos: pacote.valorCentavos,
      emailCliente: email,
    });

    return { contratoId: contrato.id as string, initPoint: preferencia.initPoint };
  });

/**
 * Lista os contratos do responsável logado (com nome do atleta).
 */
export const listarMeusContratos = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: contratos } = await supabase
      .from("contratos")
      .select("id, pacote_slug, valor_centavos, status, created_at, atleta_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!contratos) return [];

    const nomes = new Map<string, string>();
    for (const c of contratos) {
      if (!nomes.has(c.atleta_id)) {
        const { data: a } = await supabase
          .from("atletas")
          .select("nome, sobrenome")
          .eq("id", c.atleta_id)
          .maybeSingle();
        if (a) nomes.set(c.atleta_id, `${a.nome} ${a.sobrenome}`);
      }
    }

    return contratos.map((c) => ({
      id: c.id,
      pacoteSlug: c.pacote_slug,
      valorCentavos: c.valor_centavos,
      status: c.status,
      createdAt: c.created_at,
      atletaNome: nomes.get(c.atleta_id) ?? "Atleta",
    }));
  });

/**
 * Retoma o pagamento de um contrato pendente: cria uma nova preferência
 * no Mercado Pago e devolve a URL do Checkout Pro.
 */
export const retomarPagamento = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((dado: { contratoId: string }) => dado)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: contrato } = await supabase
      .from("contratos")
      .select("id, user_id, pacote_slug, valor_centavos, status")
      .eq("id", data.contratoId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!contrato) throw new Error("Contrato não encontrado.");
    if (contrato.status !== "pendente") throw new Error("Esse contrato não está pendente.");

    const pacote = getPacote(contrato.pacote_slug);

    const { data: ud } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = ud?.user?.email ?? null;

    const preferencia = await criarPreferenciaPagamento({
      contratoId: contrato.id,
      titulo: `Pacote ${pacote?.nome ?? contrato.pacote_slug} — Nutrição Neurofuncional iEsports`,
      valorCentavos: contrato.valor_centavos,
      emailCliente: email,
    });

    return { initPoint: preferencia.initPoint };
  });
