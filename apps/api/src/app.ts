import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import {
  receitaFixaSchema,
  saidaFixaSchema,
  compraCartaoSchema,
  entradaExtraSchema,
  cenarioSimuladoSchema,
  lancamentoDiarioSchema,
  aporteCdbSchema,
} from "@cf/shared";
import { prisma } from "./db/client.js";
import { registrarConfig } from "./routes/config.js";
import { registrarCrud } from "./routes/crud.js";
import { registrarProjecoes } from "./routes/projecoes.js";
import { registrarWhatsapp } from "./routes/whatsapp.js";
import {
  mapReceita,
  mapSaida,
  mapCompra,
  mapEntrada,
  mapCenario,
  mapLancamento,
  mapAporte,
} from "./routes/mapeadores.js";

/** Monta a instância Fastify com validação Zod, tratamento de erro e as rotas /api/v1. */
export function construirApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((error, req, reply) => {
    const e = error as {
      validation?: unknown;
      name?: string;
      statusCode?: number;
      code?: string;
      message?: string;
    };
    if (e.validation || e.name === "ZodError" || e.statusCode === 400) {
      return reply.code(400).send({ erro: "Requisição inválida", detalhes: e.message });
    }
    if (e.code === "P2025") {
      return reply.code(404).send({ erro: "Registro não encontrado" });
    }
    req.log.error(error);
    return reply.code(500).send({ erro: "Erro interno do servidor" });
  });

  app.get("/health", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", fase: 2 };
  });

  app.register(
    async (api) => {
      registrarConfig(api);
      registrarCrud(api, {
        prefixo: "/receitas-fixas",
        schema: receitaFixaSchema,
        delegate: prisma.receitaFixaMensal,
        toApi: mapReceita,
        ordenarPor: { diaRecebimento: "asc" },
      });
      registrarCrud(api, {
        prefixo: "/saidas-fixas",
        schema: saidaFixaSchema,
        delegate: prisma.saidaFixa,
        toApi: mapSaida,
        ordenarPor: { diaVencimento: "asc" },
      });
      registrarCrud(api, {
        prefixo: "/compras-cartao",
        schema: compraCartaoSchema,
        delegate: prisma.compraCartao,
        toApi: mapCompra,
        ordenarPor: { dataPrimeiraParcela: "asc" },
      });
      registrarCrud(api, {
        prefixo: "/entradas-extras",
        schema: entradaExtraSchema,
        delegate: prisma.entradaExtra,
        toApi: mapEntrada,
        ordenarPor: { data: "asc" },
      });
      registrarCrud(api, {
        prefixo: "/cenarios-simulados",
        schema: cenarioSimuladoSchema,
        delegate: prisma.cenarioSimulado,
        toApi: mapCenario,
        ordenarPor: { data: "asc" },
      });
      registrarCrud(api, {
        prefixo: "/lancamentos-diarios",
        schema: lancamentoDiarioSchema,
        delegate: prisma.lancamentoDiario,
        toApi: mapLancamento,
        ordenarPor: { data: "asc" },
      });
      registrarCrud(api, {
        prefixo: "/aportes-cdb",
        schema: aporteCdbSchema,
        delegate: prisma.aporteCDB,
        toApi: mapAporte,
        ordenarPor: { data: "asc" },
      });
      registrarProjecoes(api);

      // Escopo próprio (register, não chamada direta): precisa de um content-type
      // parser diferente (corpo bruto, para validar a assinatura HMAC do webhook) sem
      // afetar o parser JSON normal usado pelas rotas acima.
      await api.register(registrarWhatsapp);
    },
    { prefix: "/api/v1" },
  );

  return app;
}
