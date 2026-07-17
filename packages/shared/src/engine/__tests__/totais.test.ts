import { describe, it, expect } from "vitest";
import { gerarCronograma } from "../cronograma";
import { totaisDoMes } from "../totais";
import type { ConfigMotor, DadosMotor } from "../tipos";

type Over = Partial<Omit<DadosMotor, "config">> & { config?: Partial<ConfigMotor> };

function base(over: Over = {}): DadosMotor {
  return {
    config: {
      saldoInicialConta: 1000,
      dataInicial: "2026-01-01",
      diaVencimentoFatura: 10,
      reservaSeguranca: 0,
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

describe("totaisDoMes", () => {
  it("agrega totais e indicadores do mês (5.1)", () => {
    const dados = base({
      orcamentos: [{ categoria: "x", orcamentoMensal: 3000 }], // 100/dia
      receitasFixas: [{ descricao: "Sal", valor: 2000, diaRecebimento: 1, ativa: true }],
      saidasFixas: [{ descricao: "Aluguel", valor: 500, diaVencimento: 5, categoria: "Moradia", ativa: true }],
      comprasCartao: [{ descricao: "x", valorTotal: 300, numParcelas: 3, dataPrimeiraParcela: "2026-01-05" }],
      aportesCdb: [{ data: "2026-01-15", tipo: "aporte", valor: 200 }],
      lancamentosDiarios: [{ data: "2026-01-02", categoria: "x", descricao: "y", valorGasto: 40 }],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 31 }); // janeiro inteiro
    const t = totaisDoMes(dias, "2026-01-01");

    expect(t.mes).toBe("2026-01-01");
    expect(t.entradas).toBe(2000);
    expect(t.saidas).toBe(500);
    expect(t.cartao).toBe(100); // 300 / 3
    expect(t.economias).toBe(200);
    expect(t.diarios).toBe(3040); // 1 dia real (40) + 30 dias de previsão (100)
    expect(t.custoDeVida).toBe(3640); // 500 + 3040 + 100
    expect(t.performance).toBe(2000 - 500 - 3040 - 100 - 200); // −1840
    expect(t.pctEconomizado).toBeCloseTo(0.1, 6); // 200 / 2000
    expect(t.diasComLancamento).toBe(1);
    expect(t.diarioMedio).toBe(40); // média dos dias com lançamento real
    expect(t.orcamentoDiario).toBe(100);
  });

  it("mês sem dias projetados retorna zeros com segurança", () => {
    const dias = gerarCronograma(base(), { horizonteDias: 10 }); // só janeiro
    const t = totaisDoMes(dias, "2030-05-01");
    expect(t.entradas).toBe(0);
    expect(t.diarios).toBe(0);
    expect(t.pctEconomizado).toBe(0);
    expect(t.diarioMedio).toBe(0);
    expect(t.diasComLancamento).toBe(0);
    expect(t.orcamentoDiario).toBe(0);
    expect(t.saldoFechamento).toBe(0);
  });
});
