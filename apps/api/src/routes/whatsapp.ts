import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { aporteCdbSchema, lancamentoDiarioSchema, formatarBRL, hojeEmSaoPaulo, parseComando } from "@cf/shared";
import { prisma } from "../db/client.js";
import { enviarMensagemWhatsApp } from "../services/whatsapp.js";

/** "2026-07-16" -> "16/07/2026" (helper local — não precisa virar utilitário compartilhado). */
function formatarDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function assinaturaValida(rawBody: Buffer, assinaturaHeader: string | undefined, appSecret: string): boolean {
  if (!assinaturaHeader?.startsWith("sha256=")) return false;
  const esperado = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(assinaturaHeader);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface MensagemWhatsApp {
  from: string;
  type: string;
  text?: { body: string };
}

interface WebhookBody {
  entry?: { changes?: { value?: { messages?: MensagemWhatsApp[] } }[] }[];
}

interface RequestComRawBody extends FastifyRequest {
  rawBody?: Buffer;
}

/**
 * Webhook da WhatsApp Cloud API (Meta) — registrado com seu PRÓPRIO content-type parser
 * (via `api.register`, que cria um escopo isolado no Fastify) porque a verificação de
 * assinatura HMAC precisa do corpo bruto da requisição, não do JSON já parseado.
 */
export async function registrarWhatsapp(wa: FastifyInstance): Promise<void> {
  wa.addContentTypeParser("application/json", { parseAs: "buffer" }, (req, body, done) => {
    (req as RequestComRawBody).rawBody = body as Buffer;
    try {
      done(null, body.length ? JSON.parse(body.toString("utf8")) : {});
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  // Passo 1 do cadastro do webhook na Meta: ela chama GET com um desafio para confirmar
  // que este endpoint é seu (compara com WHATSAPP_VERIFY_TOKEN escolhido por você).
  wa.get("/whatsapp/webhook", async (req, reply) => {
    const query = req.query as Record<string, string>;
    const modoOk = query["hub.mode"] === "subscribe";
    const tokenOk = query["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN;
    if (modoOk && tokenOk && process.env.WHATSAPP_VERIFY_TOKEN) {
      return reply.header("Content-Type", "text/plain").send(query["hub.challenge"]);
    }
    return reply.code(403).send();
  });

  wa.post("/whatsapp/webhook", async (req, reply) => {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const rawBody = (req as RequestComRawBody).rawBody;
    const assinatura = req.headers["x-hub-signature-256"] as string | undefined;

    if (!appSecret || !rawBody || !assinaturaValida(rawBody, assinatura, appSecret)) {
      return reply.code(401).send();
    }

    const body = req.body as WebhookBody;
    const mensagem = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Sem `messages` (ex.: callback de status "entregue"/"lido") ou não é texto — só confirma.
    if (!mensagem || mensagem.type !== "text" || !mensagem.text) {
      return reply.code(200).send();
    }

    const numeroPermitido = process.env.WHATSAPP_ALLOWED_NUMBER;
    if (!numeroPermitido || mensagem.from !== numeroPermitido) {
      req.log.warn(`WhatsApp: mensagem ignorada de remetente não autorizado (${mensagem.from})`);
      return reply.code(200).send();
    }

    // Nunca deixa uma falha ao ENVIAR a confirmação virar erro 500 pra Meta — ela reenviaria
    // o mesmo webhook, e se o lançamento já tiver sido salvo, duplicaria o registro.
    // Best-effort: loga e segue; o usuário sempre pode conferir no app.
    const responder = (texto: string) =>
      enviarMensagemWhatsApp(mensagem.from, texto).catch((err) => req.log.error(err, "Falha ao responder no WhatsApp"));

    const resultado = parseComando(mensagem.text.body);

    if (!resultado.sucesso || !resultado.comando) {
      await responder(resultado.erro ?? "Não entendi o comando.");
      return reply.code(200).send();
    }

    const hoje = hojeEmSaoPaulo();
    const c = resultado.comando;

    try {
      if (c.tipo === "gasto") {
        const dados = lancamentoDiarioSchema.parse({
          data: hoje,
          categoria: c.categoria,
          descricao: c.descricao,
          valorGasto: c.valor,
        });
        await prisma.lancamentoDiario.create({ data: dados });
        await responder(`✅ Gasto de ${formatarBRL(c.valor)} em "${c.categoria}" registrado em ${formatarDataBR(hoje)}.`);
      } else {
        const dados = aporteCdbSchema.parse({
          data: hoje,
          tipo: c.tipo,
          valor: c.valor,
          observacao: c.observacao,
        });
        await prisma.aporteCDB.create({ data: dados });
        await responder(
          `✅ ${c.tipo === "aporte" ? "Aporte" : "Resgate"} de ${formatarBRL(c.valor)} registrado em ${formatarDataBR(hoje)}.`,
        );
      }
    } catch (err) {
      req.log.error(err, "Falha ao salvar lançamento vindo do WhatsApp");
      await responder("❌ Deu erro ao salvar. Tenta de novo em instantes.");
    }

    return reply.code(200).send();
  });
}
