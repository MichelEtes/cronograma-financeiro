import { describe, it, expect } from "vitest";
import {
  gerarCronograma,
  gerarCronogramaComparativo,
  primeiroDiaCritico,
  orcamentoDiarioTotal,
} from "../cronograma";
import type { ConfigMotor, DadosMotor } from "../tipos";
import type { DiaProjetado } from "../../types";

type Over = Partial<Omit<DadosMotor, "config">> & { config?: Partial<ConfigMotor> };

function base(over: Over = {}): DadosMotor {
  return {
    config: {
      saldoInicialConta: 1000,
      dataInicial: "2026-01-01",
      diaVencimentoFatura: 10,
      reservaSeguranca: 200,
      saldoInicialCDB: 0,
      taxaCdbAnual: 0,
      ...(over.config ?? {}),
    },
    orcamentos: over.orcamentos ?? [],
    receitasFixas: over.receitasFixas ?? [],
    saidasFixas: over.saidasFixas ?? [],
    comprasCartao: over.comprasCartao ?? [],
    entradasExtras: over.entradasExtras ?? [],
    cenarios: over.cenarios ?? [],
    lancamentosDiarios: over.lancamentosDiarios ?? [],
    aportesCdb: over.aportesCdb ?? [],
  };
}

const achar = (dias: DiaProjetado[], data: string): DiaProjetado =>
  dias.find((d) => d.data === data)!;

describe("gerarCronograma — estrutura", () => {
  it("gera `horizonteDias` linhas a partir da dataInicial", () => {
    const dias = gerarCronograma(base(), { horizonteDias: 5 });
    expect(dias).toHaveLength(5);
    expect(dias[0].data).toBe("2026-01-01");
    expect(dias[4].data).toBe("2026-01-05");
    expect(dias[0].saldoInicialDia).toBe(1000);
    expect(dias[0].saldoFinalDia).toBe(1000);
    expect(dias[0].status).toBe("ok");
  });

  it("usa horizonte padrão de 190 dias", () => {
    expect(gerarCronograma(base())).toHaveLength(190);
  });
});

describe("gerarCronograma — receitas/saídas fixas e clamp do dia (Seção 7)", () => {
  it("receita no dia 31 dispara no último dia em meses curtos (fev não bissexto)", () => {
    const dados = base({
      receitasFixas: [{ descricao: "Sal", valor: 500, diaRecebimento: 31, ativa: true }],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 90 }); // jan–mar
    expect(achar(dias, "2026-01-31").receitaFixa).toBe(500);
    expect(achar(dias, "2026-02-28").receitaFixa).toBe(500); // clamp 31 → 28
    expect(achar(dias, "2026-02-27").receitaFixa).toBe(0);
    expect(achar(dias, "2026-03-31").receitaFixa).toBe(500);
    // dispara uma única vez em fevereiro (não existe 2026-02-31)
    const totalFev = dias
      .filter((d) => d.data.startsWith("2026-02"))
      .reduce((a, d) => a + d.receitaFixa, 0);
    expect(totalFev).toBe(500);
  });

  it("receita no dia 31 dispara em 29/fev em ano bissexto", () => {
    const dados = base({
      config: { dataInicial: "2024-01-01" },
      receitasFixas: [{ descricao: "Sal", valor: 500, diaRecebimento: 31, ativa: true }],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 90 });
    expect(achar(dias, "2024-02-29").receitaFixa).toBe(500);
  });

  it("saída fixa no dia 31 sofre o mesmo clamp", () => {
    const dados = base({
      saidasFixas: [{ descricao: "x", valor: 100, diaVencimento: 31, categoria: "y", ativa: true }],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 90 });
    expect(achar(dias, "2026-01-31").saidasFixas).toBe(100);
    expect(achar(dias, "2026-02-28").saidasFixas).toBe(100);
  });

  it("receita/saída inativas não disparam", () => {
    const dados = base({
      receitasFixas: [{ descricao: "x", valor: 500, diaRecebimento: 1, ativa: false }],
      saidasFixas: [{ descricao: "y", valor: 100, diaVencimento: 1, categoria: "z", ativa: false }],
    });
    const d = achar(gerarCronograma(dados, { horizonteDias: 3 }), "2026-01-01");
    expect(d.receitaFixa).toBe(0);
    expect(d.saidasFixas).toBe(0);
  });
});

describe("gerarCronograma — cartão (Seção 7)", () => {
  it("lança a fatura inteira no dia de vencimento, no mês em que a 1ª parcela cai", () => {
    const dados = base({
      comprasCartao: [
        { descricao: "NB", valorTotal: 3000, numParcelas: 10, dataPrimeiraParcela: "2026-01-05" },
      ],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 330 }); // até nov/2026
    expect(achar(dias, "2026-01-10").parcelaCartao).toBe(300); // 1º mês = mês da fatura
    expect(achar(dias, "2026-01-09").parcelaCartao).toBe(0);
    expect(achar(dias, "2026-10-10").parcelaCartao).toBe(300); // 10ª parcela
    expect(achar(dias, "2026-11-10").parcelaCartao).toBe(0); // encerrada
  });

  it("soma parcelas de várias compras na mesma fatura", () => {
    const dados = base({
      comprasCartao: [
        { descricao: "A", valorTotal: 3000, numParcelas: 10, dataPrimeiraParcela: "2026-01-05" },
        { descricao: "B", valorTotal: 600, numParcelas: 6, dataPrimeiraParcela: "2026-01-20" },
      ],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 40 });
    expect(achar(dias, "2026-01-10").parcelaCartao).toBe(400); // 300 + 100
  });
});

describe("gerarCronograma — gastoVariavel previsto ↔ real (Seção 7)", () => {
  it("cai para o orçamento diário como previsão e usa o real quando há lançamento", () => {
    const dados = base({
      config: { saldoInicialConta: 1000, reservaSeguranca: 0 },
      orcamentos: [{ categoria: "Tudo", orcamentoMensal: 3000 }], // 100/dia
      lancamentosDiarios: [
        { data: "2026-01-02", categoria: "Tudo", descricao: "merc", valorGasto: 30 },
        { data: "2026-01-02", categoria: "Tudo", descricao: "café", valorGasto: 45 },
      ],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 3 });

    expect(dias[0].gastoVariavel).toBe(100);
    expect(dias[0].gastoVariavelEhPrevisao).toBe(true);
    expect(dias[0].saldoFinalDia).toBe(900);
    expect(dias[0].saldoAcumuladoDiario).toBe(0); // 100 − 100

    expect(dias[1].gastoVariavel).toBe(75); // 30 + 45 real
    expect(dias[1].gastoVariavelEhPrevisao).toBe(false);
    expect(dias[1].saldoFinalDia).toBe(825); // 900 − 75
    expect(dias[1].saldoAcumuladoDiario).toBe(25); // 0 + 100 − 75

    expect(dias[2].gastoVariavel).toBe(100); // previsão de novo
    expect(dias[2].saldoFinalDia).toBe(725);
    expect(dias[2].saldoAcumuladoDiario).toBe(25); // 25 + 100 − 100
  });
});

describe("gerarCronograma — cenários simulados (Seção 7)", () => {
  it("cenário só afeta o saldo com incluirSimulacao=true E incluir=true", () => {
    const dados = base({
      cenarios: [{ data: "2026-01-03", descricao: "bico", tipo: "entrada", valor: 500, incluir: true }],
    });
    const real = gerarCronograma(dados, { horizonteDias: 5, incluirSimulacao: false });
    const sim = gerarCronograma(dados, { horizonteDias: 5, incluirSimulacao: true });

    expect(achar(real, "2026-01-03").entradaSimulada).toBe(0);
    expect(achar(real, "2026-01-03").saldoFinalDia).toBe(1000);
    expect(achar(sim, "2026-01-03").entradaSimulada).toBe(500);
    expect(achar(sim, "2026-01-03").saldoFinalDia).toBe(1500);
    expect(achar(sim, "2026-01-05").saldoFinalDia).toBe(1500); // carrega adiante
  });

  it("cenário com incluir=false não afeta nem com incluirSimulacao=true", () => {
    const dados = base({
      cenarios: [{ data: "2026-01-03", descricao: "x", tipo: "entrada", valor: 500, incluir: false }],
    });
    const sim = gerarCronograma(dados, { horizonteDias: 5, incluirSimulacao: true });
    expect(achar(sim, "2026-01-03").entradaSimulada).toBe(0);
    expect(achar(sim, "2026-01-03").saldoFinalDia).toBe(1000);
  });

  it("cenário de saída reduz o saldo simulado e ignora saída não incluída", () => {
    const dados = base({
      cenarios: [
        { data: "2026-01-02", descricao: "x", tipo: "saida", valor: 200, incluir: true },
        { data: "2026-01-02", descricao: "z", tipo: "saida", valor: 999, incluir: false },
      ],
    });
    const sim = gerarCronograma(dados, { horizonteDias: 3, incluirSimulacao: true });
    expect(achar(sim, "2026-01-02").saidaSimulada).toBe(200);
    expect(achar(sim, "2026-01-02").saldoFinalDia).toBe(800);
  });

  it("gerarCronogramaComparativo devolve as duas curvas alinhadas por dia", () => {
    const dados = base({
      cenarios: [{ data: "2026-01-03", descricao: "x", tipo: "entrada", valor: 500, incluir: true }],
    });
    const { real, comSimulacao, serie } = gerarCronogramaComparativo(dados, { horizonteDias: 5 });
    expect(real).toHaveLength(5);
    expect(comSimulacao).toHaveLength(5);
    const p = serie.find((s) => s.data === "2026-01-03")!;
    expect(p.saldoReal).toBe(1000);
    expect(p.saldoComSimulacao).toBe(1500);
  });

  it("gerarCronogramaComparativo usa o horizonte padrão de 190 dias", () => {
    const { real, comSimulacao, serie } = gerarCronogramaComparativo(base());
    expect(real).toHaveLength(190);
    expect(comSimulacao).toHaveLength(190);
    expect(serie).toHaveLength(190);
  });
});

describe("gerarCronograma — aportes/resgates de CDB (Seção 7)", () => {
  it("aporte e resgate no mesmo dia se compensam no líquido", () => {
    const dados = base({
      aportesCdb: [
        { data: "2026-01-03", tipo: "aporte", valor: 300 },
        { data: "2026-01-03", tipo: "resgate", valor: 300 },
      ],
    });
    const d = achar(gerarCronograma(dados, { horizonteDias: 5 }), "2026-01-03");
    expect(d.aporteCdbLiquido).toBe(0);
    expect(d.saldoFinalDia).toBe(1000);
  });

  it("aporte reduz o saldo da conta; resgate aumenta", () => {
    const dados = base({
      aportesCdb: [
        { data: "2026-01-02", tipo: "aporte", valor: 300 },
        { data: "2026-01-04", tipo: "resgate", valor: 100 },
      ],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 5 });
    expect(achar(dias, "2026-01-02").aporteCdbLiquido).toBe(300);
    expect(achar(dias, "2026-01-02").saldoFinalDia).toBe(700); // 1000 − 300
    expect(achar(dias, "2026-01-04").aporteCdbLiquido).toBe(-100);
    expect(achar(dias, "2026-01-04").saldoFinalDia).toBe(800); // 700 + 100
  });
});

describe("gerarCronograma — virada de ano e status (Seção 7)", () => {
  it("projeta corretamente dezembro → janeiro", () => {
    const dados = base({
      config: { dataInicial: "2026-12-30" },
      receitasFixas: [{ descricao: "Sal", valor: 500, diaRecebimento: 1, ativa: true }],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 5 });
    expect(dias.map((d) => d.data)).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
      "2027-01-03",
    ]);
    expect(achar(dias, "2027-01-01").receitaFixa).toBe(500);
    expect(achar(dias, "2027-01-01").saldoFinalDia).toBe(1500);
  });

  it("classifica ok/atencao/critico e acha o primeiro furo", () => {
    const dados = base({
      config: { saldoInicialConta: 250, reservaSeguranca: 100 },
      orcamentos: [{ categoria: "x", orcamentoMensal: 3000 }], // 100/dia
    });
    const dias = gerarCronograma(dados, { horizonteDias: 3 });
    expect(dias[0].saldoFinalDia).toBe(150);
    expect(dias[0].status).toBe("ok");
    expect(dias[1].saldoFinalDia).toBe(50);
    expect(dias[1].status).toBe("atencao");
    expect(dias[2].saldoFinalDia).toBe(-50);
    expect(dias[2].status).toBe("critico");
    expect(primeiroDiaCritico(dias)?.data).toBe("2026-01-03");
  });

  it("saldo exatamente na reserva é 'ok'; primeiroDiaCritico é null quando nunca fura", () => {
    const dados = base({ config: { saldoInicialConta: 100, reservaSeguranca: 100 } });
    const dias = gerarCronograma(dados, { horizonteDias: 5 });
    expect(dias[0].saldoFinalDia).toBe(100);
    expect(dias[0].status).toBe("ok");
    expect(primeiroDiaCritico(dias)).toBeNull();
  });
});

describe("orcamentoDiarioTotal", () => {
  it("soma orcamentoMensal / 30 de cada categoria", () => {
    expect(
      orcamentoDiarioTotal([
        { categoria: "a", orcamentoMensal: 900 },
        { categoria: "b", orcamentoMensal: 300 },
      ]),
    ).toBeCloseTo(40, 6); // 1200 / 30
    expect(orcamentoDiarioTotal([])).toBe(0);
  });
});

describe("gerarCronograma — entradas extras confirmadas (regra de ouro)", () => {
  it("entra no saldo real só quando confirmada=true", () => {
    const dados = base({
      entradasExtras: [
        { data: "2026-01-02", descricao: "freela entregue", valor: 800, confirmada: true },
        { data: "2026-01-03", descricao: "talvez receba", valor: 500, confirmada: false },
      ],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 5 });
    expect(achar(dias, "2026-01-02").entradasConfirmadas).toBe(800);
    expect(achar(dias, "2026-01-02").saldoFinalDia).toBe(1800);
    expect(achar(dias, "2026-01-03").entradasConfirmadas).toBe(0); // não confirmada é ignorada
    expect(achar(dias, "2026-01-03").saldoFinalDia).toBe(1800); // saldo inalterado
  });
});
