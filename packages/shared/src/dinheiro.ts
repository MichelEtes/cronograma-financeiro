/**
 * Arredonda um valor monetário para 2 casas decimais (centavos), de forma estável
 * contra o erro de representação de ponto flutuante.
 *
 * O motor trabalha em `number` (reais); toda saída monetária passa por aqui.
 * Exemplos: arredondar(1.005) === 1.01; arredondar(100 / 3) === 33.33.
 */
export function arredondar(valor: number): number {
  // Corrige o ruído de float (ex.: 100.4999999997) antes do arredondamento final.
  const emCentavos = Math.round(valor * 100 * 1e6) / 1e6;
  return Math.round(emCentavos) / 100;
}

/** Formata um valor em Reais no padrão pt-BR (ex.: "R$ 1.234,56"). */
export function formatarBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}
