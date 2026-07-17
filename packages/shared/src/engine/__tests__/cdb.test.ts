import { describe, it, expect } from "vitest";
import { taxaMensalCdb, projetarCdb, resumoCdb } from "../cdb";
import type { ConfigMotor, DadosMotor } from "../tipos";

type Over = Partial<Omit<DadosMotor, "config">> & { config?: Partial<ConfigMotor> };

function base(over: Over = {}): DadosMotor {
  return {
    config: {
      saldoInicialConta: 0,
      dataInicial: "2026-01-01",
      diaVencimentoFatura: 10,
      reservaSeguranca: 0,
      saldoInicialCDB: 1000,
      taxaCdbAnual: 12,
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

describe("taxaMensalCdb", () => {
  it("converte taxa anual em mensal equivalente", () => {
    expect(taxaMensalCdb(12)).toBeCloseTo(Math.pow(1.12, 1 / 12) - 1, 10);
    expect(taxaMensalCdb(0)).toBe(0);
    // 12 meses compostos reconstroem a taxa anual
    expect(Math.pow(1 + taxaMensalCdb(12), 12) - 1).toBeCloseTo(0.12, 10);
  });
});

describe("projetarCdb", () => {
  const tx = Math.pow(1.12, 1 / 12) - 1;

  it("aplica juros compostos mês a mês sobre o saldo", () => {
    const tabela = projetarCdb(base(), { meses: 2 });
    expect(tabela).toHaveLength(2);
    expect(tabela[0].mes).toBe("2026-01-01");
    expect(tabela[0].saldoAnterior).toBe(1000);
    expect(tabela[0].rendimentoMes).toBeCloseTo(1000 * tx, 2);
    expect(tabela[0].saldoInvestido).toBeCloseTo(1000 * (1 + tx), 2);
    expect(tabela[1].saldoAnterior).toBeCloseTo(1000 * (1 + tx), 2);
    expect(tabela[1].saldoInvestido).toBeCloseTo(1000 * (1 + tx) ** 2, 2);
    expect(tabela[1].rendimentoAcumulado).toBeCloseTo(1000 * (1 + tx) ** 2 - 1000, 2);
  });

  it("soma aportes e resgates líquidos no mês", () => {
    const dados = base({
      aportesCdb: [
        { data: "2026-01-10", tipo: "aporte", valor: 500 },
        { data: "2026-01-20", tipo: "resgate", valor: 200 },
      ],
    });
    const tabela = projetarCdb(dados, { meses: 1 });
    expect(tabela[0].aportes).toBe(500);
    expect(tabela[0].resgates).toBe(200);
    expect(tabela[0].aporteLiquido).toBe(300);
    expect(tabela[0].saldoInvestido).toBeCloseTo(1000 + 1000 * tx + 300, 2);
  });

  it("pctEconomizado = aporte líquido / entradas do mês (agregadas do motor diário)", () => {
    const dados = base({
      config: { saldoInicialCDB: 0, taxaCdbAnual: 0 },
      receitasFixas: [{ descricao: "Sal", valor: 1000, diaRecebimento: 1, ativa: true }],
      aportesCdb: [{ data: "2026-01-05", tipo: "aporte", valor: 250 }],
    });
    const tabela = projetarCdb(dados, { meses: 1 });
    expect(tabela[0].entradasDoMes).toBe(1000);
    expect(tabela[0].pctEconomizado).toBeCloseTo(0.25, 6);
  });

  it("pctEconomizado é 0 quando não há entradas no mês", () => {
    const dados = base({ aportesCdb: [{ data: "2026-01-05", tipo: "aporte", valor: 100 }] });
    const tabela = projetarCdb(dados, { meses: 1 });
    expect(tabela[0].entradasDoMes).toBe(0);
    expect(tabela[0].pctEconomizado).toBe(0);
  });

  it("usa o padrão de 24 meses quando chamado sem opções", () => {
    const tabela = projetarCdb(base());
    expect(tabela).toHaveLength(24);
    expect(tabela[0].mes).toBe("2026-01-01");
    expect(tabela[23].mes).toBe("2027-12-01");
  });

  it("inclui cenários simulados nas entradas do mês quando incluirSimulacao=true", () => {
    const dados = base({
      config: { saldoInicialCDB: 0, taxaCdbAnual: 0 },
      cenarios: [{ data: "2026-01-05", descricao: "x", tipo: "entrada", valor: 400, incluir: true }],
    });
    const semSim = projetarCdb(dados, { meses: 1, incluirSimulacao: false });
    const comSim = projetarCdb(dados, { meses: 1, incluirSimulacao: true });
    expect(semSim[0].entradasDoMes).toBe(0);
    expect(comSim[0].entradasDoMes).toBe(400);
  });
});

describe("resumoCdb", () => {
  it("agrega totais do horizonte e o histórico completo do ledger", () => {
    const dados = base({
      config: { saldoInicialCDB: 1000, taxaCdbAnual: 12 },
      receitasFixas: [{ descricao: "Sal", valor: 1000, diaRecebimento: 1, ativa: true }],
      aportesCdb: [
        { data: "2026-01-05", tipo: "aporte", valor: 200 },
        { data: "2026-02-10", tipo: "resgate", valor: 50 }, // resgate dentro do horizonte
        { data: "2030-01-05", tipo: "aporte", valor: 999 }, // fora do horizonte de 2 meses
      ],
    });
    const r = resumoCdb(dados, { meses: 2 });
    // histórico soma TODO o ledger (aportes − resgates), mesmo fora do horizonte: 200 − 50 + 999
    expect(r.totalAportadoLiquidoHistorico).toBe(1149);
    expect(r.saldoInvestidoProjetadoFinal).toBeGreaterThan(1100);
    expect(r.rendimentoAcumuladoHorizonte).toBeGreaterThan(0);
    // aportes líquidos do horizonte: jan +200, fev −50 = 150; entradas 2×1000 → 150/2000 = 0,075
    expect(r.pctEconomizadoMedio).toBeCloseTo(0.075, 6);
  });

  it("degrada com segurança quando não há meses projetados", () => {
    const r = resumoCdb(base({ config: { saldoInicialCDB: 500 } }), { meses: 0 });
    expect(r.saldoInvestidoHoje).toBe(500);
    expect(r.saldoInvestidoProjetadoFinal).toBe(500);
    expect(r.rendimentoAcumuladoHorizonte).toBe(0);
    expect(r.pctEconomizadoMedio).toBe(0);
  });

  it("usa os padrões quando chamado sem opções", () => {
    const r = resumoCdb(base());
    expect(r.totalAportadoLiquidoHistorico).toBe(0);
    expect(Number.isFinite(r.saldoInvestidoProjetadoFinal)).toBe(true);
    expect(r.rendimentoAcumuladoHorizonte).toBeGreaterThan(0);
  });
});
