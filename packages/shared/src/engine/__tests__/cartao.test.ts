import { describe, it, expect } from "vitest";
import { valorParcela, compraAtivaNoMes, totalFaturaDoMes } from "../cartao";
import type { CompraCartaoMotor } from "../tipos";

const compra = (o: Partial<CompraCartaoMotor> = {}): CompraCartaoMotor => ({
  descricao: "x",
  valorTotal: 3000,
  numParcelas: 10,
  dataPrimeiraParcela: "2026-01-05",
  ...o,
});

describe("valorParcela", () => {
  it("divide e arredonda a centavos", () => {
    expect(valorParcela(compra({ valorTotal: 3000, numParcelas: 10 }))).toBe(300);
    expect(valorParcela(compra({ valorTotal: 100, numParcelas: 3 }))).toBe(33.33);
  });
});

describe("compraAtivaNoMes", () => {
  const c = compra({ numParcelas: 10, dataPrimeiraParcela: "2026-01-05" }); // jan..out/2026

  it("ativa do mês inicial ao último mês de parcela", () => {
    expect(compraAtivaNoMes(c, "2026-01-01")).toBe(true);
    expect(compraAtivaNoMes(c, "2026-10-01")).toBe(true);
  });

  it("inativa antes do início e depois do fim", () => {
    expect(compraAtivaNoMes(c, "2025-12-01")).toBe(false);
    expect(compraAtivaNoMes(c, "2026-11-01")).toBe(false);
  });

  it("atravessa a virada do ano", () => {
    const c2 = compra({ numParcelas: 4, dataPrimeiraParcela: "2026-11-10" }); // nov,dez,jan,fev
    expect(compraAtivaNoMes(c2, "2027-01-01")).toBe(true);
    expect(compraAtivaNoMes(c2, "2027-02-01")).toBe(true);
    expect(compraAtivaNoMes(c2, "2027-03-01")).toBe(false);
  });
});

describe("totalFaturaDoMes", () => {
  it("soma as parcelas das compras ativas no mês da data", () => {
    const compras = [
      compra({ valorTotal: 3000, numParcelas: 10, dataPrimeiraParcela: "2026-01-05" }), // 300, jan..out
      compra({ valorTotal: 600, numParcelas: 6, dataPrimeiraParcela: "2026-01-20" }), //  100, jan..jun
    ];
    expect(totalFaturaDoMes(compras, "2026-01-10")).toBe(400); // 300 + 100
    expect(totalFaturaDoMes(compras, "2026-07-10")).toBe(300); // só a de 10x segue ativa
    expect(totalFaturaDoMes(compras, "2026-12-10")).toBe(0); // ambas encerradas
  });
});
