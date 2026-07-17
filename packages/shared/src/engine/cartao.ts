import { arredondar } from "../dinheiro";
import { adicionarMeses, parseData, primeiroDiaDoMes } from "../datas";
import type { CompraCartaoMotor } from "./tipos";

/** Valor da parcela = valorTotal / numParcelas, arredondado a centavos. */
export function valorParcela(compra: CompraCartaoMotor): number {
  return arredondar(compra.valorTotal / compra.numParcelas);
}

/**
 * Uma compra está ativa no mês (recebido como "YYYY-MM-01") se esse mês cai no
 * intervalo de parcelas. Granularidade de MÊS: independe do dia da 1ª parcela.
 */
export function compraAtivaNoMes(compra: CompraCartaoMotor, mesPrimeiroDiaISO: string): boolean {
  const mesInicio = primeiroDiaDoMes(compra.dataPrimeiraParcela);
  const mesFim = adicionarMeses(mesInicio, compra.numParcelas - 1);
  const alvo = parseData(mesPrimeiroDiaISO).getTime();
  return alvo >= parseData(mesInicio).getTime() && alvo <= parseData(mesFim).getTime();
}

/**
 * Total da fatura do mês da data informada = soma das parcelas de todas as compras
 * ativas naquele mês. Esse total é lançado num único dia (o dia de vencimento da fatura).
 */
export function totalFaturaDoMes(compras: readonly CompraCartaoMotor[], dataDoDia: string): number {
  const mesISO = primeiroDiaDoMes(dataDoDia);
  let total = 0;
  for (const compra of compras) {
    if (compraAtivaNoMes(compra, mesISO)) total += valorParcela(compra);
  }
  return total;
}
