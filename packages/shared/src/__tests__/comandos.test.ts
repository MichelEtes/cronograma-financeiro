import { describe, it, expect } from "vitest";
import { parseComando } from "../comandos";

describe("parseComando — aporte/resgate", () => {
  it("reconhece aporte simples", () => {
    const r = parseComando("aporte 300");
    expect(r.sucesso).toBe(true);
    expect(r.comando).toEqual({ tipo: "aporte", valor: 300, observacao: undefined });
  });

  it("reconhece resgate simples", () => {
    const r = parseComando("resgate 150");
    expect(r.sucesso).toBe(true);
    expect(r.comando).toEqual({ tipo: "resgate", valor: 150, observacao: undefined });
  });

  it("aceita variações de palavra e é case-insensitive", () => {
    expect(parseComando("Aportei 50").comando).toMatchObject({ tipo: "aporte", valor: 50 });
    expect(parseComando("APORTAR 50").comando).toMatchObject({ tipo: "aporte", valor: 50 });
    expect(parseComando("resgatei 50").comando).toMatchObject({ tipo: "resgate", valor: 50 });
    expect(parseComando("resgatar 50").comando).toMatchObject({ tipo: "resgate", valor: 50 });
  });

  it("captura o texto restante como observação", () => {
    const r = parseComando("aporte 300 investimento do mês");
    expect(r.comando).toEqual({ tipo: "aporte", valor: 300, observacao: "investimento do mês" });
  });

  it("erro quando falta o valor", () => {
    const r = parseComando("aporte");
    expect(r.sucesso).toBe(false);
    expect(r.erro).toMatch(/faltou o valor/i);
  });

  it("erro quando o valor é inválido", () => {
    const r = parseComando("aporte abc");
    expect(r.sucesso).toBe(false);
    expect(r.erro).toMatch(/não entendi o valor/i);
  });
});

describe("parseComando — gasto/despesa", () => {
  it("reconhece gasto com categoria", () => {
    const r = parseComando("gasto 50 mercado");
    expect(r.sucesso).toBe(true);
    expect(r.comando).toEqual({
      tipo: "gasto",
      valor: 50,
      categoria: "Mercado",
      descricao: "Lançamento via WhatsApp",
    });
  });

  it("aceita 'gastei' e 'despesa' como sinônimos", () => {
    expect(parseComando("gastei 50 mercado").comando).toMatchObject({ tipo: "gasto" });
    expect(parseComando("despesa 50 mercado").comando).toMatchObject({ tipo: "gasto" });
  });

  it("captura descrição opcional após a categoria", () => {
    const r = parseComando("gasto 45,90 lazer cinema com a família");
    expect(r.comando).toEqual({
      tipo: "gasto",
      valor: 45.9,
      categoria: "Lazer",
      descricao: "cinema com a família",
    });
  });

  it("erro quando falta valor e categoria", () => {
    const r = parseComando("gasto");
    expect(r.sucesso).toBe(false);
    expect(r.erro).toMatch(/faltou o valor e a categoria/i);
  });

  it("erro quando o valor é inválido", () => {
    const r = parseComando("gasto abc mercado");
    expect(r.sucesso).toBe(false);
    expect(r.erro).toMatch(/não entendi o valor/i);
  });

  it("erro quando falta a categoria", () => {
    const r = parseComando("gasto 50");
    expect(r.sucesso).toBe(false);
    expect(r.erro).toMatch(/faltou a categoria/i);
  });
});

describe("parseComando — normalização de valores", () => {
  it.each([
    ["300", 300],
    ["300,50", 300.5],
    ["300.50", 300.5],
    ["1.234,56", 1234.56],
    ["R$300,50", 300.5],
    ["R$ 300,50", 300.5],
  ])("normaliza %s -> %d", (bruto, esperado) => {
    const r = parseComando(`aporte ${bruto}`);
    expect(r.comando).toMatchObject({ valor: esperado });
  });

  it("rejeita valor zero ou negativo", () => {
    expect(parseComando("aporte 0").sucesso).toBe(false);
    expect(parseComando("aporte -50").sucesso).toBe(false);
  });
});

describe("parseComando — casos gerais", () => {
  it("mensagem vazia devolve a mensagem de ajuda", () => {
    const r = parseComando("   ");
    expect(r.sucesso).toBe(false);
    expect(r.erro).toMatch(/comandos disponíveis/i);
  });

  it("comando desconhecido devolve a mensagem de ajuda", () => {
    const r = parseComando("oi tudo bem?");
    expect(r.sucesso).toBe(false);
    expect(r.erro).toMatch(/comandos disponíveis/i);
  });

  it("tolera espaços extras entre palavras", () => {
    const r = parseComando("  aporte    300   ");
    expect(r.comando).toMatchObject({ valor: 300 });
  });
});
