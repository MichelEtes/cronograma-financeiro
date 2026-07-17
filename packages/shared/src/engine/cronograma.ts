import { arredondar } from "../dinheiro";
import { adicionarDias, diaEfetivoNoMes, parseData } from "../datas";
import type { DiaProjetado, PontoComparativo, StatusDia } from "../types";
import { totalFaturaDoMes } from "./cartao";
import {
  type DadosMotor,
  type OpcoesCronograma,
  type OrcamentoMotor,
  HORIZONTE_PADRAO_DIAS,
} from "./tipos";

/**
 * Orçamento diário total = soma de (orcamentoMensal / 30) de cada categoria.
 * O divisor 30 é fixo e intencional (mantém o limite diário estável, não usa dias reais do mês).
 */
export function orcamentoDiarioTotal(orcamentos: readonly OrcamentoMotor[]): number {
  return orcamentos.reduce((acc, o) => acc + o.orcamentoMensal / 30, 0);
}

function agruparPorData<T extends { data: string }>(itens: readonly T[]): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of itens) {
    const lista = mapa.get(item.data);
    if (lista) lista.push(item);
    else mapa.set(item.data, [item]);
  }
  return mapa;
}

/**
 * Gera o cronograma diário (Seção 4.1) de `horizonteDias` dias a partir de `dataInicial`.
 *
 * Regras-chave:
 * - Receitas/saídas fixas disparam no `diaEfetivoNoMes` (dia configurado com clamp por mês).
 * - A fatura inteira do mês é lançada no `diaVencimentoFatura`.
 * - `gastoVariavel` usa o total real de lançamentos do dia se houver; senão cai para o
 *   orçamento diário como PREVISÃO (marcado em `gastoVariavelEhPrevisao`).
 * - Cenários simulados só entram quando `incluirSimulacao` e o cenário tem `incluir=true`.
 * - O saldo é carregado internamente em precisão cheia e arredondado a centavos na saída.
 */
export function gerarCronograma(dados: DadosMotor, opcoes: OpcoesCronograma = {}): DiaProjetado[] {
  const horizonteDias = opcoes.horizonteDias ?? HORIZONTE_PADRAO_DIAS;
  const incluirSimulacao = opcoes.incluirSimulacao ?? false;
  const { config } = dados;

  const orcamentoDia = orcamentoDiarioTotal(dados.orcamentos);
  const entradasPorData = agruparPorData(dados.entradasExtras);
  const cenariosPorData = agruparPorData(dados.cenarios);
  const lancamentosPorData = agruparPorData(dados.lancamentosDiarios);
  const aportesPorData = agruparPorData(dados.aportesCdb);
  const receitasAtivas = dados.receitasFixas.filter((r) => r.ativa);
  const saidasAtivas = dados.saidasFixas.filter((s) => s.ativa);

  const dias: DiaProjetado[] = [];
  let saldoAnterior = config.saldoInicialConta;
  let acumuladoAnterior = 0;

  for (let i = 0; i < horizonteDias; i++) {
    const data = adicionarDias(config.dataInicial, i);
    const d = parseData(data);
    const ano = d.getFullYear();
    const mesIndex0 = d.getMonth();
    const diaDoMes = d.getDate();

    const saldoInicialDia = i === 0 ? config.saldoInicialConta : saldoAnterior;

    const receitaFixa = receitasAtivas.reduce(
      (acc, r) => acc + (diaEfetivoNoMes(r.diaRecebimento, ano, mesIndex0) === diaDoMes ? r.valor : 0),
      0,
    );

    const entradasConfirmadas = (entradasPorData.get(data) ?? []).reduce(
      (acc, e) => acc + (e.confirmada ? e.valor : 0),
      0,
    );

    const cenariosDoDia = cenariosPorData.get(data) ?? [];
    const entradaSimulada = incluirSimulacao
      ? cenariosDoDia.reduce((acc, c) => acc + (c.tipo === "entrada" && c.incluir ? c.valor : 0), 0)
      : 0;
    const saidaSimulada = incluirSimulacao
      ? cenariosDoDia.reduce((acc, c) => acc + (c.tipo === "saida" && c.incluir ? c.valor : 0), 0)
      : 0;

    const saidasFixas = saidasAtivas.reduce(
      (acc, s) => acc + (diaEfetivoNoMes(s.diaVencimento, ano, mesIndex0) === diaDoMes ? s.valor : 0),
      0,
    );

    const parcelaCartao =
      diaDoMes === config.diaVencimentoFatura ? totalFaturaDoMes(dados.comprasCartao, data) : 0;

    const aporteCdbLiquido = (aportesPorData.get(data) ?? []).reduce(
      (acc, a) => acc + (a.tipo === "aporte" ? a.valor : -a.valor),
      0,
    );

    const lancs = lancamentosPorData.get(data) ?? [];
    const temLancamentoReal = lancs.length > 0;
    const gastoVariavel = temLancamentoReal
      ? lancs.reduce((acc, l) => acc + l.valorGasto, 0)
      : orcamentoDia;

    const saldoFinalCompleto =
      saldoInicialDia +
      receitaFixa +
      entradasConfirmadas +
      entradaSimulada -
      saidasFixas -
      parcelaCartao -
      saidaSimulada -
      aporteCdbLiquido -
      gastoVariavel;

    const acumuladoCompleto = acumuladoAnterior + orcamentoDia - gastoVariavel;
    const saldoFinalDia = arredondar(saldoFinalCompleto);

    const status: StatusDia =
      saldoFinalDia < 0 ? "critico" : saldoFinalDia < config.reservaSeguranca ? "atencao" : "ok";

    dias.push({
      data,
      saldoInicialDia: arredondar(saldoInicialDia),
      receitaFixa: arredondar(receitaFixa),
      entradasConfirmadas: arredondar(entradasConfirmadas),
      entradaSimulada: arredondar(entradaSimulada),
      saidasFixas: arredondar(saidasFixas),
      parcelaCartao: arredondar(parcelaCartao),
      saidaSimulada: arredondar(saidaSimulada),
      aporteCdbLiquido: arredondar(aporteCdbLiquido),
      gastoVariavel: arredondar(gastoVariavel),
      gastoVariavelEhPrevisao: !temLancamentoReal,
      saldoFinalDia,
      orcamentoDiario: arredondar(orcamentoDia),
      saldoAcumuladoDiario: arredondar(acumuladoCompleto),
      status,
    });

    saldoAnterior = saldoFinalCompleto; // carrega precisão cheia (fiel à planilha)
    acumuladoAnterior = acumuladoCompleto;
  }

  return dias;
}

/**
 * Roda o cronograma duas vezes (sem e com simulação) e devolve as duas curvas alinhadas
 * por dia — pronto para o gráfico de duas linhas do Cronograma/Simulador.
 */
export function gerarCronogramaComparativo(
  dados: DadosMotor,
  opcoes: { horizonteDias?: number } = {},
): { real: DiaProjetado[]; comSimulacao: DiaProjetado[]; serie: PontoComparativo[] } {
  const horizonteDias = opcoes.horizonteDias ?? HORIZONTE_PADRAO_DIAS;
  const real = gerarCronograma(dados, { horizonteDias, incluirSimulacao: false });
  const comSimulacao = gerarCronograma(dados, { horizonteDias, incluirSimulacao: true });
  const serie: PontoComparativo[] = real.map((dia, i) => ({
    data: dia.data,
    saldoReal: dia.saldoFinalDia,
    saldoComSimulacao: comSimulacao[i].saldoFinalDia,
  }));
  return { real, comSimulacao, serie };
}

/** Primeiro dia em que o saldo projetado fica negativo ("primeiro furo"), ou `null`. */
export function primeiroDiaCritico(dias: readonly DiaProjetado[]): DiaProjetado | null {
  return dias.find((d) => d.saldoFinalDia < 0) ?? null;
}
