import { arredondar } from "../dinheiro.js";
import { primeiroDiaDoMes } from "../datas.js";
import type { DiaProjetado, TotaisMes } from "../types.js";

/**
 * Indicadores do dashboard "Totais" (Seção 5.1) para um mês, derivados dos dias do motor.
 * `mesISO` pode ser qualquer data do mês desejado; o filtro é por mês civil.
 */
export function totaisDoMes(dias: readonly DiaProjetado[], mesISO: string): TotaisMes {
  const mes = primeiroDiaDoMes(mesISO);
  const doMes = dias.filter((d) => primeiroDiaDoMes(d.data) === mes);

  let entradas = 0;
  let saidas = 0;
  let diarios = 0;
  let economias = 0;
  let cartao = 0;
  let somaGastoReal = 0;
  let diasComLancamento = 0;

  for (const d of doMes) {
    entradas += d.receitaFixa + d.entradasConfirmadas + d.entradaSimulada;
    saidas += d.saidasFixas + d.saidaSimulada;
    diarios += d.gastoVariavel;
    economias += d.aporteCdbLiquido;
    cartao += d.parcelaCartao;
    if (!d.gastoVariavelEhPrevisao) {
      somaGastoReal += d.gastoVariavel;
      diasComLancamento += 1;
    }
  }

  const performance = entradas - saidas - diarios - cartao - economias;
  const custoDeVida = saidas + diarios + cartao;
  const pctEconomizado = entradas === 0 ? 0 : economias / entradas;
  const diarioMedio = diasComLancamento === 0 ? 0 : somaGastoReal / diasComLancamento;

  return {
    mes,
    entradas: arredondar(entradas),
    saidas: arredondar(saidas),
    diarios: arredondar(diarios),
    economias: arredondar(economias),
    cartao: arredondar(cartao),
    performance: arredondar(performance),
    pctEconomizado,
    custoDeVida: arredondar(custoDeVida),
    diarioMedio: arredondar(diarioMedio),
    diasComLancamento,
    orcamentoDiario: doMes.length > 0 ? doMes[0].orcamentoDiario : 0,
    saldoFechamento: doMes.length > 0 ? doMes[doMes.length - 1].saldoFinalDia : 0,
  };
}
