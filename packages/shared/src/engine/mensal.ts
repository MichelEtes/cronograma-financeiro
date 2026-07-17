import { arredondar } from "../dinheiro.js";
import { primeiroDiaDoMes } from "../datas.js";
import type { DiaProjetado, MesAgregado } from "../types.js";

/**
 * Agrega os dias do motor (4.1) em blocos de mês civil, para a visão "Saldos" (4.3).
 * Os totais somam os valores já arredondados de cada dia, então batem com a tabela diária.
 * O saldo de fechamento é o `saldoFinalDia` do último dia presente do mês.
 */
export function agregarMensal(dias: readonly DiaProjetado[]): MesAgregado[] {
  const porMes = new Map<string, DiaProjetado[]>();
  for (const dia of dias) {
    const mes = primeiroDiaDoMes(dia.data);
    const lista = porMes.get(mes);
    if (lista) lista.push(dia);
    else porMes.set(mes, [dia]);
  }

  const meses: MesAgregado[] = [];
  for (const [mes, diasDoMes] of porMes) {
    let entradas = 0;
    let saidas = 0;
    let diarios = 0;
    let economias = 0;
    let cartao = 0;
    for (const d of diasDoMes) {
      entradas += d.receitaFixa + d.entradasConfirmadas + d.entradaSimulada;
      saidas += d.saidasFixas + d.saidaSimulada;
      diarios += d.gastoVariavel;
      economias += d.aporteCdbLiquido;
      cartao += d.parcelaCartao;
    }
    const saldoFechamento = diasDoMes[diasDoMes.length - 1].saldoFinalDia;
    meses.push({
      mes,
      entradas: arredondar(entradas),
      saidas: arredondar(saidas),
      diarios: arredondar(diarios),
      economias: arredondar(economias),
      cartao: arredondar(cartao),
      saldoFechamento,
    });
  }

  return meses;
}
