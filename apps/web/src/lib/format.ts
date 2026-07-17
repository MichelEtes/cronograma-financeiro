import { formatarBRL, parseData } from "@cf/shared";
import type { Campo } from "./campos";

export { formatarBRL };

/** "2026-07-16" → "16/07/2026". */
export function formatarDataBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

/** "2026-07-01" → "Julho de 2026". */
export function formatarMesExtenso(iso: string): string {
  const s = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(parseData(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 0.375 → "37,5%". */
export function formatarPct(fracao: number): string {
  return `${(fracao * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** Formata o valor de um campo para exibição em listas, conforme o tipo. */
export function formatarValorCampo(campo: Campo, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  switch (campo.tipo) {
    case "moeda":
      return formatarBRL(Number(valor));
    case "data":
      return formatarDataBR(String(valor));
    case "checkbox":
      return valor ? "Sim" : "Não";
    case "select":
      return campo.opcoes?.find((o) => o.valor === String(valor))?.label ?? String(valor);
    default:
      return String(valor);
  }
}
