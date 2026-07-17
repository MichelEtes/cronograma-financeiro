import { valorParcela } from "@cf/shared";

// Mapeadores Prisma → API: convertem os campos Decimal para number na saída.
// Tipados como `any` porque cada modelo tem um shape diferente; a conversão é trivial.

export const mapOrcamento = (o: any) => ({
  id: o.id,
  categoria: o.categoria,
  orcamentoMensal: Number(o.orcamentoMensal),
});

export const mapConfig = (c: any) => ({
  id: c.id,
  saldoInicialConta: Number(c.saldoInicialConta),
  dataInicial: c.dataInicial,
  diaVencimentoFatura: c.diaVencimentoFatura,
  reservaSeguranca: Number(c.reservaSeguranca),
  saldoInicialCDB: Number(c.saldoInicialCDB),
  taxaCdbAnual: Number(c.taxaCdbAnual),
  orcamentos: (c.orcamentos ?? []).map(mapOrcamento),
});

export const mapReceita = (r: any) => ({
  id: r.id,
  descricao: r.descricao,
  valor: Number(r.valor),
  diaRecebimento: r.diaRecebimento,
  ativa: r.ativa,
});

export const mapSaida = (s: any) => ({
  id: s.id,
  descricao: s.descricao,
  valor: Number(s.valor),
  diaVencimento: s.diaVencimento,
  categoria: s.categoria,
  ativa: s.ativa,
});

export const mapCompra = (c: any) => {
  const valorTotal = Number(c.valorTotal);
  return {
    id: c.id,
    descricao: c.descricao,
    valorTotal,
    numParcelas: c.numParcelas,
    dataPrimeiraParcela: c.dataPrimeiraParcela,
    // valorParcela derivado, útil para a UI de cadastro do cartão
    valorParcela: valorParcela({
      descricao: c.descricao,
      valorTotal,
      numParcelas: c.numParcelas,
      dataPrimeiraParcela: c.dataPrimeiraParcela,
    }),
  };
};

export const mapEntrada = (e: any) => ({
  id: e.id,
  data: e.data,
  descricao: e.descricao,
  valor: Number(e.valor),
  confirmada: e.confirmada,
});

export const mapCenario = (c: any) => ({
  id: c.id,
  data: c.data,
  descricao: c.descricao,
  tipo: c.tipo,
  valor: Number(c.valor),
  incluir: c.incluir,
});

export const mapLancamento = (l: any) => ({
  id: l.id,
  data: l.data,
  categoria: l.categoria,
  descricao: l.descricao,
  valorGasto: Number(l.valorGasto),
});

export const mapAporte = (a: any) => ({
  id: a.id,
  data: a.data,
  tipo: a.tipo,
  valor: Number(a.valor),
  observacao: a.observacao,
});
