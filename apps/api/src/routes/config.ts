import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { configUpdateSchema, orcamentoCategoriaSchema } from "@cf/shared";
import { prisma } from "../db/client.js";
import { mapConfig, mapOrcamento } from "./mapeadores.js";

const SINGLETON = "singleton";

/** Rotas da Config (singleton) e dos Orçamentos por categoria (Seção 6). */
export function registrarConfig(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get("/config", async (_req, reply) => {
    const c = await prisma.config.findUnique({
      where: { id: SINGLETON },
      include: { orcamentos: { orderBy: { categoria: "asc" } } },
    });
    if (!c) return reply.code(404).send({ erro: "Config não encontrada — rode o seed." });
    return mapConfig(c);
  });

  r.put("/config", { schema: { body: configUpdateSchema } }, async (req) => {
    const c = await prisma.config.upsert({
      where: { id: SINGLETON },
      create: { id: SINGLETON, ...req.body },
      update: { ...req.body },
      include: { orcamentos: { orderBy: { categoria: "asc" } } },
    });
    return mapConfig(c);
  });

  r.get("/config/orcamentos", async () => {
    const os = await prisma.orcamentoCategoria.findMany({ orderBy: { categoria: "asc" } });
    return os.map(mapOrcamento);
  });

  // Substitui todos os orçamentos de uma vez (replace-all).
  r.put(
    "/config/orcamentos",
    { schema: { body: z.array(orcamentoCategoriaSchema) } },
    async (req) => {
      await prisma.$transaction([
        prisma.orcamentoCategoria.deleteMany({ where: { configId: SINGLETON } }),
        prisma.orcamentoCategoria.createMany({
          data: req.body.map((o) => ({ ...o, configId: SINGLETON })),
        }),
      ]);
      const os = await prisma.orcamentoCategoria.findMany({ orderBy: { categoria: "asc" } });
      return os.map(mapOrcamento);
    },
  );
}
