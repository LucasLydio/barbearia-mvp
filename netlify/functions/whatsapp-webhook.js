// https://SEU-SITE.netlify.app/.netlify/functions/whatsapp-webhook

exports.handler = async (event) => {
  // 1) Verificação (GET)
  if (event.httpMethod === "GET") {
    const params = event.queryStringParameters || {};
    const mode = params["hub.mode"];
    const token = params["hub.verify_token"];
    const challenge = params["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return { statusCode: 200, body: challenge };
    }
    return { statusCode: 403, body: "Forbidden" };
  }

  // 2) Receber eventos (POST)
  if (event.httpMethod === "POST") {
    // Aqui você pode logar status, mensagens recebidas, etc.
    // (em geral: delivery status, inbound messages)
    // No serverless, só responda 200 rápido.
    return { statusCode: 200, body: "EVENT_RECEIVED" };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
