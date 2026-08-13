import { createFileRoute } from "@tanstack/react-router";
import { buscarPagamento } from "@/lib/mercado-pago.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enviarConfirmacaoWhatsApp, montarTextoConfirmacao } from "@/lib/whatsapp.server";
import { nomeProfissional } from "@/lib/negocio";

/**
 * Notificação do Mercado Pago quando um pagamento muda de status. É a ÚNICA
 * fonte de verdade pra marcar um contrato como PAGO — a tela de sucesso é só UX.
 * Por segurança nunca confiamos no corpo; buscamos o status real na API.
 */
async function extrairPaymentId(request: Request): Promise<string | null> {
  const url = new URL(request.url);
  const idDaQuery = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  if (idDaQuery) return idDaQuery;

  if (request.method === "POST") {
    try {
      const corpo = (await request.json()) as { data?: { id?: string | number } };
      if (corpo.data?.id) return String(corpo.data.id);
    } catch {
      // corpo vazio / ping de teste
    }
  }
  return null;
}

async function processarNotificacao(request: Request): Promise<Response> {
  try {
    const paymentId = await extrairPaymentId(request);
    if (!paymentId) return new Response("ok", { status: 200 });

    const pagamento = await buscarPagamento(paymentId);
    if (!pagamento || !pagamento.externalReference) return new Response("ok", { status: 200 });
    if (pagamento.status !== "approved") return new Response("ok", { status: 200 });

    const db = await supabaseAdmin;
    const { data: contrato } = await db
      .from("contratos")
      .select("id, user_id, atleta_id, status, mercado_pago_payment_id, pacote_slug")
      .eq("id", pagamento.externalReference)
      .maybeSingle();
    if (!contrato) return new Response("ok", { status: 200 });

    // Idempotência.
    if (contrato.status === "pago" || contrato.mercado_pago_payment_id) {
      return new Response("ok", { status: 200 });
    }

    const { error } = await db
      .from("contratos")
      .update({ status: "pago", mercado_pago_payment_id: pagamento.id })
      .eq("id", contrato.id)
      .eq("status", "pendente"); // corrida: só confirma pendente
    if (error) {
      console.error("Erro ao confirmar contrato pago:", error.message);
      return new Response("ok", { status: 200 });
    }

    // WhatsApp: grava plano pago. A confirmação data/horário fica no agendamento.
    try {
      const [{ data: perfil }, { data: atleta }] = await Promise.all([
        db.from("profiles").select("nome, telefone, email").eq("id", contrato.user_id).maybeSingle(),
        db.from("atletas").select("nome, sobrenome, telefone").eq("id", contrato.atleta_id).maybeSingle(),
      ]);
      const destinatario = perfil?.telefone || atleta?.telefone;
      if (destinatario) {
        await enviarConfirmacaoWhatsApp({
          para: destinatario.replace(/\D/g, ""),
          texto: `Olá! Seu pacote foi confirmado e seu espaço no projeto foi liberado. Agora é só marcar a anamnese com Amanda e Letícia.`,
        });
      }
    } catch (erroWhats) {
      console.error("Erro ao notificar por WhatsApp:", erroWhats);
    }

    return new Response("ok", { status: 200 });
  } catch (erro) {
    console.error("Erro ao processar webhook do Mercado Pago:", erro);
    return new Response("ok", { status: 200 }); // retry não resolve bug nosso
  }
}

export const Route = createFileRoute("/webhooks/mercado-pago")({
  server: {
    handlers: {
      GET: ({ request }) => processarNotificacao(request),
      POST: ({ request }) => processarNotificacao(request),
    },
  },
});