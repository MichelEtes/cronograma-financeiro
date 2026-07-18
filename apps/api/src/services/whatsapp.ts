// Cliente mínimo da WhatsApp Cloud API (Meta) — só o necessário para enviar uma
// mensagem de texto de confirmação/erro de volta ao usuário.

const GRAPH_API_VERSION = "v21.0";

/** Envia uma mensagem de texto para `paraNumero` (E.164 sem "+", ex.: "5511999999999"). */
export async function enviarMensagemWhatsApp(paraNumero: string, texto: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configurados.");
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: paraNumero,
      type: "text",
      text: { body: texto },
    }),
  });

  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    throw new Error(`Falha ao enviar mensagem WhatsApp (${res.status}): ${detalhe}`);
  }
}
