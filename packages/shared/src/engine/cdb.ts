import { arredondar } from "../dinheiro";
import { adicionarMeses, diferencaEmDias, primeiroDiaDoMes, ultimoDiaDoMes } from "../datas";
import type { MesProjetadoCdb, ResumoCdb } from "../types";
import { gerarCronograma } from "./cronograma";
import { type DadosMotor, type OpcoesCdb, MESES_PADRAO_CDB } from "./tipos";

/** Taxa mensal equivalente à taxa anual: (1 + anual/100)^(1/12) − 1. */
export function taxaMensalCdb(taxaAnualPct: number): number {
  return Math.pow(1 + taxaAnualPct / 100, 1 / 12) - 1;
}

/**
 * Projeção mensal do CDB (Seção 4.2): juros compostos sobre o saldo, mais aportes/resgates
 * líquidos do mês. `entradasDoMes` é agregado do motor de projeção diária dentro do mês.
 */
export function projetarCdb(dados: DadosMotor, opcoes: OpcoesCdb = {}): MesProjetadoCdb[] {
  const meses = opcoes.meses ?? MESES_PADRAO_CDB;
  const incluirSimulacao = opcoes.incluirSimulacao ?? false;
  const { config } = dados;
  const taxaMensal = taxaMensalCdb(config.taxaCdbAnual);

  // Entradas por mês, agregadas do motor diário (cobre exatamente os `meses` projetados).
  const mesInicialISO = primeiroDiaDoMes(config.dataInicial);
  const ultimoMesISO = adicionarMeses(mesInicialISO, meses - 1);
  const horizonteDias = diferencaEmDias(config.dataInicial, ultimoDiaDoMes(ultimoMesISO)) + 1;
  const dias = gerarCronograma(dados, { horizonteDias, incluirSimulacao });
  const entradasPorMes = new Map<string, number>();
  for (const dia of dias) {
    const mes = primeiroDiaDoMes(dia.data);
    const entradas = dia.receitaFixa + dia.entradasConfirmadas + dia.entradaSimulada;
    entradasPorMes.set(mes, (entradasPorMes.get(mes) ?? 0) + entradas);
  }

  // Aportes/resgates do ledger completo, agrupados por mês civil.
  const porMes = new Map<string, { aportes: number; resgates: number }>();
  for (const a of dados.aportesCdb) {
    const mes = primeiroDiaDoMes(a.data);
    const reg = porMes.get(mes) ?? { aportes: 0, resgates: 0 };
    if (a.tipo === "aporte") reg.aportes += a.valor;
    else reg.resgates += a.valor;
    porMes.set(mes, reg);
  }

  const tabela: MesProjetadoCdb[] = [];
  let saldoAnterior = config.saldoInicialCDB;
  let rendimentoAcumulado = 0;

  for (let m = 0; m < meses; m++) {
    const mes = adicionarMeses(mesInicialISO, m);
    const reg = porMes.get(mes) ?? { aportes: 0, resgates: 0 };
    const aporteLiquido = reg.aportes - reg.resgates;
    const rendimentoMes = saldoAnterior * taxaMensal;
    const saldoInvestido = saldoAnterior + rendimentoMes + aporteLiquido;
    rendimentoAcumulado += rendimentoMes;
    // Todo mês projetado tem dias no cronograma → a chave sempre existe; o `?? 0` é só
    // um default defensivo de tipo (ramo inalcançável).
    /* v8 ignore next */
    const entradasDoMes = entradasPorMes.get(mes) ?? 0;
    const pctEconomizado = entradasDoMes === 0 ? 0 : aporteLiquido / entradasDoMes;

    tabela.push({
      mes,
      saldoAnterior: arredondar(saldoAnterior),
      aportes: arredondar(reg.aportes),
      resgates: arredondar(reg.resgates),
      aporteLiquido: arredondar(aporteLiquido),
      rendimentoMes: arredondar(rendimentoMes),
      saldoInvestido: arredondar(saldoInvestido),
      rendimentoAcumulado: arredondar(rendimentoAcumulado),
      entradasDoMes: arredondar(entradasDoMes),
      pctEconomizado,
    });

    saldoAnterior = saldoInvestido; // carrega precisão cheia
  }

  return tabela;
}

/** Agregados globais de investimento (Seção 4.2) para o dashboard de Investimentos. */
export function resumoCdb(dados: DadosMotor, opcoes: OpcoesCdb = {}): ResumoCdb {
  const tabela = projetarCdb(dados, opcoes);
  const totalAportadoLiquidoHistorico = dados.aportesCdb.reduce(
    (acc, a) => acc + (a.tipo === "aporte" ? a.valor : -a.valor),
    0,
  );
  const somaAportesLiquidos = tabela.reduce((acc, m) => acc + m.aporteLiquido, 0);
  const somaEntradas = tabela.reduce((acc, m) => acc + m.entradasDoMes, 0);
  const primeiro = tabela[0];
  const ultimo = tabela[tabela.length - 1];

  return {
    saldoInvestidoHoje: primeiro ? primeiro.saldoInvestido : arredondar(dados.config.saldoInicialCDB),
    totalAportadoLiquidoHistorico: arredondar(totalAportadoLiquidoHistorico),
    rendimentoAcumuladoHorizonte: ultimo ? ultimo.rendimentoAcumulado : 0,
    saldoInvestidoProjetadoFinal: ultimo ? ultimo.saldoInvestido : arredondar(dados.config.saldoInicialCDB),
    pctEconomizadoMedio: somaEntradas === 0 ? 0 : somaAportesLiquidos / somaEntradas,
  };
}
