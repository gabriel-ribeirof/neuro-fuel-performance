// Server-only. Envio de mensagens de confirmação por WhatsApp.
//
// PENDÊNCIA DE CONFIGURAÇÃO FORA DO LOVABLE:
// Este serviço depende de uma automação externa (ex: Z-API ou WhatsApp
// Business API). As credenciais NÃO entram no repo — devem ser cadastradas
// em Lovable Cloud → Secrets. Enquanto as variáveis não existirem, a função
// roda em modo silencioso (tenta não derrubar o agendamento).
//
// Secrets esperadas:
//   WHATSAPP_PROVIDER   = "z-api" | "whatsapp-business" | "flowlane" ...
//   WHATSAPP_API_URL    = URL base do provedor
//   WHATSAPP_API_TOKEN  = token do provedor
//   WHATSAPP_FROM       = número/remetente (por país, ex: 5511987654321)
//   WHATSAPP_ENABLED    = "1" liga o envio de fato

type MensagemWhatsApp = {
  para: string; // dígitos com DDI, ex: 5511999998888
  texto: string;
};

function configOk(): boolean {
  return (
    process.env["WHATSAPP_ENABLED"] === "1" &&
    Boolean(process.env["WHATSAPP_API_URL"]) &&
    Boolean(process.env["WHATSAPP_API_TOKEN"])
  );
}

/**
 * Envia confirmação de agendamento para o responsável/atleta informando data
 * e horário. Se o provider não estiver configurado, apenas loga o conteúdo
 * que seria enviado — sem quebrar a requisição.
 */
export async function enviarConfirmacaoWhatsApp(mensagem: MensagemWhatsApp): Promise<void> {
  if (!configOk()) {
    console.info("[WhatsApp] Não configurado — mensagem não enviada:", mensagem.texto);
    return;
  }

  const provider = process.env["WHATSAPP_PROVIDER"] ?? "z-api";
  await fetch(`${process.env["WHATSAPP_API_URL"]}/send-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["WHATSAPP_API_TOKEN"]}`,
    },
    body: JSON.stringify({
      provider,
      from: process.env["WHATSAPP_FROM"] ?? undefined,
      phone: mensagem.para,
      message: mensagem.texto,
    }),
  }).catch((erro) => console.error("[WhatsApp] Falha ao enviar:", erro));
}

export function montarTextoConfirmacao(dados: {
  responsavelNome: string;
  atletaNome: string;
  profissional: string;
  dataFormatada: string;
  horario: string;
}): string {
  return (
    `Olá, ${dados.responsavelNome}! Confirmamos o agendamento do(a) ${dados.atletaNome} ` +
    `com ${dados.profissional} para ${dados.dataFormatada} às ${dados.horario}. ` +
    `A equipe da Nutrição Neurofuncional iEsports já está com seu horário reservado.`
  );
}