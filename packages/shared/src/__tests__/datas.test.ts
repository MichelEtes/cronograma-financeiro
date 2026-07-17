import { describe, it, expect } from "vitest";
import {
  diaEfetivoNoMes,
  parseData,
  primeiroDiaDoMes,
  adicionarMeses,
  hojeEmSaoPaulo,
  formatarData,
  ultimoDiaDoMes,
  adicionarDias,
  diferencaEmDias,
} from "../datas";

describe("diaEfetivoNoMes — clamp do dia configurado, calculado por mês", () => {
  it("mantém o dia quando ele existe no mês", () => {
    expect(diaEfetivoNoMes(15, 2026, 1)).toBe(15); // fev/2026
    expect(diaEfetivoNoMes(28, 2026, 1)).toBe(28);
    expect(diaEfetivoNoMes(31, 2026, 0)).toBe(31); // janeiro (31 dias)
  });

  it("faz clamp do dia 31 para o último dia do mês", () => {
    expect(diaEfetivoNoMes(31, 2026, 3)).toBe(30); // abril (30 dias)
    expect(diaEfetivoNoMes(31, 2026, 1)).toBe(28); // fev/2026 (NÃO bissexto)
    expect(diaEfetivoNoMes(31, 2024, 1)).toBe(29); // fev/2024 (BISSEXTO) — ponto crítico
    expect(diaEfetivoNoMes(30, 2026, 1)).toBe(28); // dia 30 também cai em fevereiro
  });
});

describe("helpers de data pura (sem shift de fuso)", () => {
  it("parseData constrói data local estável", () => {
    const d = parseData("2026-07-16");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // julho (base 0)
    expect(d.getDate()).toBe(16);
  });

  it("rejeita data mal-formada ou inexistente", () => {
    expect(() => parseData("2026-02-31")).toThrow();
    expect(() => parseData("16/07/2026")).toThrow();
  });

  it("primeiroDiaDoMes e adicionarMeses (inclusive cruzando o ano)", () => {
    expect(primeiroDiaDoMes("2026-07-16")).toBe("2026-07-01");
    expect(adicionarMeses("2026-11-30", 1)).toBe("2026-12-30");
    expect(adicionarMeses("2026-12-15", 1)).toBe("2027-01-15"); // dezembro → janeiro
  });

  it("hojeEmSaoPaulo retorna formato YYYY-MM-DD e respeita o fuso", () => {
    // 2026-07-16 12:00 UTC = 09:00 em São Paulo (UTC-3) → mesmo dia
    expect(hojeEmSaoPaulo(new Date("2026-07-16T12:00:00Z"))).toBe("2026-07-16");
    expect(hojeEmSaoPaulo()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("helpers de data usados pelo motor", () => {
  it("formatarData formata um Date local como YYYY-MM-DD", () => {
    expect(formatarData(parseData("2026-07-16"))).toBe("2026-07-16");
  });

  it("ultimoDiaDoMes respeita meses curtos e bissexto", () => {
    expect(ultimoDiaDoMes("2026-02-10")).toBe("2026-02-28");
    expect(ultimoDiaDoMes("2024-02-10")).toBe("2024-02-29");
    expect(ultimoDiaDoMes("2026-04-01")).toBe("2026-04-30");
  });

  it("adicionarDias soma dias cruzando mês e ano", () => {
    expect(adicionarDias("2026-01-31", 1)).toBe("2026-02-01");
    expect(adicionarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(adicionarDias("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("diferencaEmDias conta dias de calendário (fim − início)", () => {
    expect(diferencaEmDias("2026-01-01", "2026-01-31")).toBe(30);
    expect(diferencaEmDias("2026-01-01", "2026-01-01")).toBe(0);
    expect(diferencaEmDias("2026-02-27", "2026-03-01")).toBe(2);
  });
});
