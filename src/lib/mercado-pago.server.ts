// Server-only. Integração com Mercado Pago (Checkout Pro) via fetch puro.
// Nunca importe de arquivos que vão pro bundle do cliente.

const PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";
const PAYMENTS_URL = "https://api.mercadopago.com/v1/payments";

function accessToken(): string {
  const token = process.env["MERCADO_PAGO_ACCESS_TOKEN"];
  if (!token) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }
  return token;
}

function siteUrl(): string {
  const base = process.env["PUBLIC_SITE_URL"];
  if (!base) {
    throw new Error(
      "PUBLIC_SITE_URL não configurado — defina como a URL pública do site (ex: https://neuronutricao.iesports.com.br), sem barra no final.",
    );
  }
  return base;
}

export type NovaPreferencia = {
  contratoId: string;
  titulo: string;
  valorCentavos: number;
  emailCliente: string | null;
};

/** Cria preferência de pagamento (Checkout Pro) e devolve o link de redirecionamento. */
export async function criarPreferenciaPagamento(
  preferencia: NovaPreferencia,
): Promise<{ initPoint: string }> {
  const base = siteUrl();

  const resp = await fetch(PREFERENCES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
      // Evita clique duplo criando duas preferências pro mesmo contrato.
      "X-Idempotency-Key": preferencia.contratoId,
    },
    body: JSON.stringify({
      items: [
        {
          title: preferencia.titulo,
          quantity: 1,
          currency_id: "BRL",
          unit_price: preferencia.valorCentavos / 100,
        },
      ],
      payer: preferencia.emailCliente ? { email: preferencia.emailCliente } : undefined,
      external_reference: preferencia.contratoId,
      notification_url: `${base}/webhooks/mercado-pago`,
      back_urls: {
        success: `${base}/pagamento/sucesso?contrato=${preferencia.contratoId}`,
        pending: `${base}/pagamento/pendente?contrato=${preferencia.contratoId}`,
        failure: `${base}/pagamento/falha?contrato=${preferencia.contratoId}`,
      },
      auto_return: "approved",
      statement_descriptor: "IESPORTS NEURO",
    }),
  });

  if (!resp.ok) {
    throw new Error(`Falha ao criar preferência de pagamento: ${await resp.text()}`);
  }

  const criada = (await resp.json()) as { init_point: string };
  return { initPoint: criada.init_point };
}

export type PagamentoMercadoPago = {
  id: string;
  status: string;
  externalReference: string | null;
};

/** Busca o status real do pagamento na API do Mercado Pago (nunca confia no corpo do webhook). */
export async function buscarPagamento(paymentId: string): Promise<PagamentoMercadoPago | null> {
  const resp = await fetch(`${PAYMENTS_URL}/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });

  if (!resp.ok) return null;

  const dados = (await resp.json()) as {
    id: number;
    status: string;
    external_reference: string;
  };
  return {
    id: String(dados.id),
    status: dados.status,
    externalReference: dados.external_reference ?? null,
  };
}