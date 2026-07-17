import { z } from "zod";

/** Data de calendário "YYYY-MM-DD", validada como data real existente. */
export const dataISOSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
  .refine((s) => {
    const [ano, mes, dia] = s.split("-").map(Number);
    const d = new Date(ano, mes - 1, dia);
    return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
  }, "Data inexistente");

const dinheiro = z.number().finite();
const dinheiroPositivo = z.number().finite().positive();
const dinheiroNaoNegativo = z.number().finite().nonnegative();

// --- Config + Orçamentos ------------------------------------------------------

export const orcamentoCategoriaSchema = z.object({
  categoria: z.string().min(1),
  orcamentoMensal: dinheiroNaoNegativo,
});

export const configSchema = z.object({
  saldoInicialConta: dinheiro,
  dataInicial: dataISOSchema,
  diaVencimentoFatura: z.number().int().min(1).max(28),
  reservaSeguranca: dinheiroNaoNegativo,
  saldoInicialCDB: dinheiroNaoNegativo,
  taxaCdbAnual: dinheiro,
  orcamentos: z.array(orcamentoCategoriaSchema).default([]),
});

/** Config sem os orçamentos — o PUT /config cuida só dos campos escalares. */
export const configUpdateSchema = configSchema.omit({ orcamentos: true });

// --- Receitas / Saídas fixas --------------------------------------------------

export const receitaFixaSchema = z.object({
  descricao: z.string().min(1),
  valor: dinheiroPositivo,
  diaRecebimento: z.number().int().min(1).max(31),
  ativa: z.boolean().default(true),
});

export const saidaFixaSchema = z.object({
  descricao: z.string().min(1),
  valor: dinheiroPositivo,
  diaVencimento: z.number().int().min(1).max(31),
  categoria: z.string().min(1),
  ativa: z.boolean().default(true),
});

// --- Cartão de crédito (parcelamento) ----------------------------------------

export const compraCartaoSchema = z.object({
  descricao: z.string().min(1),
  valorTotal: dinheiroPositivo,
  numParcelas: z.number().int().min(1),
  dataPrimeiraParcela: dataISOSchema,
});

// --- Entradas extras confirmadas ---------------------------------------------

export const entradaExtraSchema = z.object({
  data: dataISOSchema,
  descricao: z.string().min(1),
  valor: dinheiroPositivo,
  confirmada: z.boolean().default(false),
});

// --- Cenários simulados ("E se...?") -----------------------------------------

export const tipoCenarioSchema = z.enum(["entrada", "saida"]);

export const cenarioSimuladoSchema = z.object({
  data: dataISOSchema,
  descricao: z.string().min(1),
  tipo: tipoCenarioSchema,
  valor: dinheiroPositivo, // sempre positivo; o sinal vem do tipo
  incluir: z.boolean().default(false),
});

// --- Lançamentos diários (gastos variáveis) ----------------------------------

export const lancamentoDiarioSchema = z.object({
  data: dataISOSchema,
  categoria: z.string().min(1),
  descricao: z.string().min(1),
  valorGasto: dinheiroNaoNegativo,
});

// --- Aportes / resgates de CDB -----------------------------------------------

export const tipoAporteSchema = z.enum(["aporte", "resgate"]);

export const aporteCdbSchema = z.object({
  data: dataISOSchema,
  tipo: tipoAporteSchema,
  valor: dinheiroPositivo, // sempre positivo; o sinal vem do tipo
  observacao: z.string().optional(),
});
