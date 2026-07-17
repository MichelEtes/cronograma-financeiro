import { describe, it, expect } from "vitest";
import { arredondar, formatarBRL } from "../dinheiro";

describe("arredondar", () => {
  it("arredonda a 2 casas absorvendo erro de float", () => {
    expect(arredondar(0.1 + 0.2)).toBe(0.3);
    expect(arredondar(100 / 3)).toBe(33.33);
    expect(arredondar(1.005)).toBe(1.01);
    expect(arredondar(2.675)).toBe(2.68);
  });

  it("mantém inteiros, zero e divisões exatas", () => {
    expect(arredondar(0)).toBe(0);
    expect(arredondar(1200)).toBe(1200);
    expect(arredondar(3000 / 10)).toBe(300);
  });
});

describe("formatarBRL", () => {
  it("formata no padrão pt-BR", () => {
    expect(formatarBRL(1234.56)).toMatch(/^R\$\s1\.234,56$/);
    expect(formatarBRL(0)).toMatch(/^R\$\s0,00$/);
  });
});
