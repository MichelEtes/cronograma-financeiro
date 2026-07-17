export type TipoCampo = "texto" | "moeda" | "numero" | "data" | "checkbox" | "select";

export interface Campo {
  nome: string;
  label: string;
  tipo: TipoCampo;
  padrao?: string | number | boolean;
  opcoes?: { valor: string; label: string }[];
  ajuda?: string;
  min?: number;
  max?: number;
}

/** Resultado de `safeParse` de um schema Zod (estruturalmente compatível, sem depender de zod). */
export type ResultadoValidacao =
  | { success: true; data: unknown }
  | { success: false; error: { issues: { path: (string | number)[]; message: string }[] } };

export interface SchemaValidavel {
  safeParse(valor: unknown): ResultadoValidacao;
}

/** Adapta um schema Zod compartilhado para `SchemaValidavel` sem acoplar a UI ao pacote zod. */
export const asValidavel = (schema: unknown): SchemaValidavel => schema as SchemaValidavel;

export interface RecursoConfig {
  endpoint: string;
  chave: string;
  titulo: string;
  descricao: string;
  schema: SchemaValidavel;
  tituloCampo: string;
  campos: Campo[];
}
