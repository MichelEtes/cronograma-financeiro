import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  gerarCronograma,
  gerarCronogramaComparativo,
  primeiroDiaCritico,
  projetarCdb,
  resumoCdb,
  agregarMensal,
  totaisDoMes,
  adicionarMeses,
  diferencaEmDias,
  primeiroDiaDoMes,
  ultimoDiaDoMes,
  HORIZONTE_PADRAO_DIAS,
  MESES_PADRAO_CDB,
} from "@cf/shared";
import { carregarDados } from "../services/carregarDados.js";

// Query "true"/"false" → boolean (evita o coerce que trata "false" como true).
const incluirSimQuery = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => v === "true");

/** Endpoints derivados ao vivo do motor (cronograma, saldos, investimentos, totais). */
export function registrarProjecoes(app: FastifyInstance): void {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/cronograma",
    {
      schema: {
        querystring: z.object({
          dias: z.coerce.number().int().positive().max(1095).optional(),
          incluirSimulacao: incluirSimQuery,
        }),
      },
    },
    async (req) => {
      const dados = await carregarDados();
      const horizonteDias = req.query.dias ?? HORIZONTE_PADRAO_DIAS;
      const { real, comSimulacao, serie } = gerarCronogramaComparativo(dados, { horizonteDias });
      const dias = req.query.incluirSimulacao ? comSimulacao : real;
      return { dias, primeiroFuro: primeiroDiaCritico(dias)?.data ?? null, serie };
    },
  );

  r.get(
    "/saldos-mensais",
    { schema: { querystring: z.object({ meses: z.coerce.number().int().positive().max(36).optional() }) } },
    async (req) => {
      const dados = await carregarDados();
      const meses = req.query.meses ?? 6;
      const inicio = primeiroDiaDoMes(dados.config.dataInicial);
      const horizonteDias =
        diferencaEmDias(dados.config.dataInicial, ultimoDiaDoMes(adicionarMeses(inicio, meses - 1))) + 1;
      const dias = gerarCronograma(dados, { horizonteDias });
      return agregarMensal(dias).slice(0, meses);
    },
  );

  r.get(
    "/investimentos",
    { schema: { querystring: z.object({ meses: z.coerce.number().int().positive().max(120).optional() }) } },
    async (req) => {
      const dados = await carregarDados();
      const meses = req.query.meses ?? MESES_PADRAO_CDB;
      return { tabela: projetarCdb(dados, { meses }), resumo: resumoCdb(dados, { meses }) };
    },
  );

  r.get(
    "/totais",
    { schema: { querystring: z.object({ mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "mes deve ser YYYY-MM") }) } },
    async (req) => {
      const dados = await carregarDados();
      const mesISO = `${req.query.mes}-01`;
      const horizonteDias = Math.max(
        HORIZONTE_PADRAO_DIAS,
        diferencaEmDias(dados.config.dataInicial, ultimoDiaDoMes(mesISO)) + 1,
      );
      const dias = gerarCronograma(dados, { horizonteDias });
      return totaisDoMes(dias, mesISO);
    },
  );
}
