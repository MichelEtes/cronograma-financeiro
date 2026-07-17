import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  getDaysInMonth,
  startOfMonth,
  format,
} from "date-fns";

/** Data de calendário no formato "YYYY-MM-DD". */
export type DataISO = string;

const FUSO_SP = "America/Sao_Paulo";

/**
 * Data de hoje no fuso `America/Sao_Paulo`, como "YYYY-MM-DD".
 * Usa `Intl` (sem dependência externa de fuso) — é o único ponto do sistema sensível
 * ao relógio. Todo o resto opera sobre datas puras "YYYY-MM-DD".
 */
export function hojeEmSaoPaulo(agora: Date = new Date()): DataISO {
  // O locale "en-CA" formata como "YYYY-MM-DD".
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_SP,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/**
 * Converte "YYYY-MM-DD" em um `Date` ao MEIO-DIA local (evita qualquer borda de
 * horário de verão à meia-noite), sem shift de fuso. Rejeita datas inexistentes.
 */
export function parseData(data: DataISO): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!m) throw new Error(`Data inválida (esperado YYYY-MM-DD): ${data}`);
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  const d = new Date(ano, mes - 1, dia, 12, 0, 0, 0);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
    throw new Error(`Data inexistente: ${data}`);
  }
  return d;
}

/** Formata um `Date` (interpretado localmente) como "YYYY-MM-DD". */
export function formatarData(d: Date): DataISO {
  return format(d, "yyyy-MM-dd");
}

/** Primeiro dia do mês da data informada (ex.: "2026-07-16" → "2026-07-01"). */
export function primeiroDiaDoMes(data: DataISO): DataISO {
  return format(startOfMonth(parseData(data)), "yyyy-MM-dd");
}

/** Último dia do mês da data informada (ex.: "2026-02-10" → "2026-02-28"). */
export function ultimoDiaDoMes(data: DataISO): DataISO {
  return format(endOfMonth(parseData(data)), "yyyy-MM-dd");
}

/** Soma (ou subtrai, com valor negativo) meses a uma data "YYYY-MM-DD". */
export function adicionarMeses(data: DataISO, meses: number): DataISO {
  return format(addMonths(parseData(data), meses), "yyyy-MM-dd");
}

/** Soma (ou subtrai) dias a uma data "YYYY-MM-DD". */
export function adicionarDias(data: DataISO, dias: number): DataISO {
  return format(addDays(parseData(data), dias), "yyyy-MM-dd");
}

/** Número de dias de calendário entre duas datas (fim − início). */
export function diferencaEmDias(inicio: DataISO, fim: DataISO): number {
  return differenceInCalendarDays(parseData(fim), parseData(inicio));
}

/**
 * "Clamp" de um dia configurado (1–31) para o último dia válido do mês/ano.
 * É ISTO que roda dentro do motor, calculado por mês — nunca um dia efetivo salvo no banco.
 *
 * Ex.: dia 31 → 30 em abril; → 28 em fev/2026; → 29 em fev/2024 (ano bissexto).
 *
 * @param mesIndex0 mês em base 0 (janeiro = 0).
 */
export function diaEfetivoNoMes(diaConfigurado: number, ano: number, mesIndex0: number): number {
  const diasNoMes = getDaysInMonth(new Date(ano, mesIndex0, 1));
  return Math.min(diaConfigurado, diasNoMes);
}
