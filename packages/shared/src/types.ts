import type { z } from "zod";
import type {
  configSchema,
  orcamentoCategoriaSchema,
  receitaFixaSchema,
  saidaFixaSchema,
  compraCartaoSchema,
  entradaExtraSchema,
  cenarioSimuladoSchema,
  lancamentoDiarioSchema,
  aporteCdbSchema,
} from "./schemas.js";

// --- Tipos de entrada (payloads já validados pelo Zod) -----------------------

export type ConfigInput = z.infer<typeof configSchema>;
export type OrcamentoCategoriaInput = z.infer<typeof orcamentoCategoriaSchema>;
export type ReceitaFixaInput = z.infer<typeof receitaFixaSchema>;
export type SaidaFixaInput = z.infer<typeof saidaFixaSchema>;
export type CompraCartaoInput = z.infer<typeof compraCartaoSchema>;
export type EntradaExtraInput = z.infer<typeof entradaExtraSchema>;
export type CenarioSimuladoInput = z.infer<typeof cenarioSimuladoSchema>;
export type LancamentoDiarioInput = z.infer<typeof lancamentoDiarioSchema>;
export type AporteCdbInput = z.infer<typeof aporteCdbSchema>;

// --- Contrato de saída do motor (implementado na Fase 1) ---------------------

export type StatusDia = "ok" | "atencao" | "critico";

/** Uma linha do cronograma diário (Seção 4.1). Todos os valores em reais (number). */
export interface DiaProjetado {
  data: string; // "YYYY-MM-DD"
  saldoInicialDia: number;
  receitaFixa: number;
  entradasConfirmadas: number;
  entradaSimulada: number;
  saidasFixas: number;
  parcelaCartao: number;
  saidaSimulada: number;
  aporteCdbLiquido: number;
  gastoVariavel: number;
  /** true quando `gastoVariavel` caiu para o orçamento diário (previsão), sem lançamento real. */
  gastoVariavelEhPrevisao: boolean;
  saldoFinalDia: number;
  orcamentoDiario: number;
  saldoAcumuladoDiario: number;
  status: StatusDia;
}

/** Uma linha da projeção mensal do CDB (Seção 4.2). Valores em reais; `pctEconomizado` é fração 0..1. */
export interface MesProjetadoCdb {
  mes: string; // "YYYY-MM-01"
  saldoAnterior: number;
  aportes: number;
  resgates: number;
  aporteLiquido: number;
  rendimentoMes: number;
  saldoInvestido: number;
  rendimentoAcumulado: number;
  entradasDoMes: number;
  pctEconomizado: number;
}

/** Agregados globais de investimento para o dashboard (Seção 4.2). */
export interface ResumoCdb {
  saldoInvestidoHoje: number;
  totalAportadoLiquidoHistorico: number;
  rendimentoAcumuladoHorizonte: number;
  saldoInvestidoProjetadoFinal: number;
  pctEconomizadoMedio: number;
}

/** Bloco mensal para a visão de calendário "Saldos" (Seção 4.3). */
export interface MesAgregado {
  mes: string; // "YYYY-MM-01"
  entradas: number;
  saidas: number;
  diarios: number;
  economias: number;
  cartao: number;
  saldoFechamento: number;
}

/** Ponto da série comparativa real × simulação, para o gráfico do Cronograma (5.3/5.5). */
export interface PontoComparativo {
  data: string; // "YYYY-MM-DD"
  saldoReal: number;
  saldoComSimulacao: number;
}

/** Indicadores do dashboard "Totais" de um mês (Seção 5.1). */
export interface TotaisMes {
  mes: string; // "YYYY-MM-01"
  entradas: number;
  saidas: number;
  diarios: number;
  economias: number;
  cartao: number;
  performance: number; // entradas − saídas − diários − cartão − economias
  pctEconomizado: number; // economias / entradas (0..1)
  custoDeVida: number; // saídas + diários + cartão
  diarioMedio: number; // média do gasto variável nos dias com lançamento real
  diasComLancamento: number;
  orcamentoDiario: number;
  saldoFechamento: number;
}
