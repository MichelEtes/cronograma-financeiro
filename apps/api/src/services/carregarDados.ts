import type { DadosMotor } from "@cf/shared";
import { prisma } from "../db/client.js";

/**
 * Carrega todas as entidades do banco e as converte para o formato do motor
 * (`Decimal → number`) — esta é a única fronteira DB↔motor. O motor permanece puro.
 */
export async function carregarDados(): Promise<DadosMotor> {
  const [config, receitas, saidas, compras, entradas, cenarios, lancamentos, aportes] =
    await Promise.all([
      prisma.config.findUnique({ where: { id: "singleton" }, include: { orcamentos: true } }),
      prisma.receitaFixaMensal.findMany(),
      prisma.saidaFixa.findMany(),
      prisma.compraCartao.findMany(),
      prisma.entradaExtra.findMany(),
      prisma.cenarioSimulado.findMany(),
      prisma.lancamentoDiario.findMany(),
      prisma.aporteCDB.findMany(),
    ]);

  if (!config) {
    throw new Error("Config não encontrada — rode o seed (npm run db:seed).");
  }

  return {
    config: {
      saldoInicialConta: Number(config.saldoInicialConta),
      dataInicial: config.dataInicial,
      diaVencimentoFatura: config.diaVencimentoFatura,
      reservaSeguranca: Number(config.reservaSeguranca),
      saldoInicialCDB: Number(config.saldoInicialCDB),
      taxaCdbAnual: Number(config.taxaCdbAnual),
    },
    orcamentos: config.orcamentos.map((o) => ({
      categoria: o.categoria,
      orcamentoMensal: Number(o.orcamentoMensal),
    })),
    receitasFixas: receitas.map((r) => ({
      descricao: r.descricao,
      valor: Number(r.valor),
      diaRecebimento: r.diaRecebimento,
      ativa: r.ativa,
    })),
    saidasFixas: saidas.map((s) => ({
      descricao: s.descricao,
      valor: Number(s.valor),
      diaVencimento: s.diaVencimento,
      categoria: s.categoria,
      ativa: s.ativa,
    })),
    comprasCartao: compras.map((c) => ({
      descricao: c.descricao,
      valorTotal: Number(c.valorTotal),
      numParcelas: c.numParcelas,
      dataPrimeiraParcela: c.dataPrimeiraParcela,
    })),
    entradasExtras: entradas.map((e) => ({
      data: e.data,
      descricao: e.descricao,
      valor: Number(e.valor),
      confirmada: e.confirmada,
    })),
    cenarios: cenarios.map((c) => ({
      data: c.data,
      descricao: c.descricao,
      tipo: c.tipo as "entrada" | "saida",
      valor: Number(c.valor),
      incluir: c.incluir,
    })),
    lancamentosDiarios: lancamentos.map((l) => ({
      data: l.data,
      categoria: l.categoria,
      descricao: l.descricao,
      valorGasto: Number(l.valorGasto),
    })),
    aportesCdb: aportes.map((a) => ({
      data: a.data,
      tipo: a.tipo as "aporte" | "resgate",
      valor: Number(a.valor),
      observacao: a.observacao ?? undefined,
    })),
  };
}
