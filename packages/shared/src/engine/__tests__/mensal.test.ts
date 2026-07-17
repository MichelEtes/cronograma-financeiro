import { describe, it, expect } from "vitest";
import { gerarCronograma } from "../cronograma";
import { agregarMensal } from "../mensal";
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

describe("agregarMensal", () => {
  it("agrupa por mês civil, soma as colunas e fecha no saldo do último dia", () => {
    const dados = base({
      receitasFixas: [{ descricao: "Sal", valor: 500, diaRecebimento: 1, ativa: true }],
      saidasFixas: [{ descricao: "Aluguel", valor: 200, diaVencimento: 5, categoria: "Moradia", ativa: true }],
      comprasCartao: [{ descricao: "x", valorTotal: 300, numParcelas: 3, dataPrimeiraParcela: "2026-01-05" }],
      aportesCdb: [{ data: "2026-01-15", tipo: "aporte", valor: 100 }],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 59 }); // jan (31) + fev (28)
    const meses = agregarMensal(dias);
    expect(meses).toHaveLength(2);

    const jan = meses[0];
    expect(jan.mes).toBe("2026-01-01");
    expect(jan.entradas).toBe(500); // 1 receita
    expect(jan.saidas).toBe(200); // aluguel dia 5
    expect(jan.cartao).toBe(100); // 300 / 3
    expect(jan.economias).toBe(100); // aporte
    expect(jan.diarios).toBe(0); // sem orçamento
    const dia31 = dias.find((d) => d.data === "2026-01-31")!;
    expect(jan.saldoFechamento).toBe(dia31.saldoFinalDia);

    const fev = meses[1];
    expect(fev.mes).toBe("2026-02-01");
    expect(fev.entradas).toBe(500);
    expect(fev.saidas).toBe(200);
    expect(fev.cartao).toBe(100); // 2ª parcela
    expect(fev.economias).toBe(0);
  });

  it("os totais mensais batem com a soma das linhas diárias exibidas", () => {
    const dados = base({
      orcamentos: [{ categoria: "x", orcamentoMensal: 900 }],
      lancamentosDiarios: [{ data: "2026-01-02", categoria: "x", descricao: "y", valorGasto: 12.34 }],
    });
    const dias = gerarCronograma(dados, { horizonteDias: 31 });
    const [jan] = agregarMensal(dias);
    const somaDiariosDasLinhas = dias.reduce((a, d) => a + d.gastoVariavel, 0);
    expect(jan.diarios).toBeCloseTo(somaDiariosDasLinhas, 2);
  });
});
