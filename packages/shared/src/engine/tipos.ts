// Tipos de ENTRADA do motor: versões em `number` das entidades (já convertidas de Decimal
// na borda do banco). O motor é puro — não conhece Prisma, Zod nem I/O.

export interface ConfigMotor {
  saldoInicialConta: number;
  dataInicial: string; // "YYYY-MM-DD"
  diaVencimentoFatura: number; // 1–28
  reservaSeguranca: number;
  saldoInicialCDB: number;
  taxaCdbAnual: number; // % a.a.
}

export interface OrcamentoMotor {
  categoria: string;
  orcamentoMensal: number;
}

export interface ReceitaFixaMotor {
  descricao: string;
  valor: number;
  diaRecebimento: number; // 1–31 (clamp aplicado no motor)
  ativa: boolean;
}

export interface SaidaFixaMotor {
  descricao: string;
  valor: number;
  diaVencimento: number; // 1–31 (clamp aplicado no motor)
  categoria: string;
  ativa: boolean;
}

export interface CompraCartaoMotor {
  descricao: string;
  valorTotal: number;
  numParcelas: number;
  dataPrimeiraParcela: string; // "YYYY-MM-DD"
}

export interface EntradaExtraMotor {
  data: string;
  descricao: string;
  valor: number;
  confirmada: boolean;
}

export interface CenarioMotor {
  data: string;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: number;
  incluir: boolean;
}

export interface LancamentoMotor {
  data: string;
  categoria: string;
  descricao: string;
  valorGasto: number;
}

export interface AporteMotor {
  data: string;
  tipo: "aporte" | "resgate";
  valor: number;
  observacao?: string;
}

/** Pacote completo de dados que o motor recebe (tudo já carregado do banco). */
export interface DadosMotor {
  config: ConfigMotor;
  orcamentos: OrcamentoMotor[];
  receitasFixas: ReceitaFixaMotor[];
  saidasFixas: SaidaFixaMotor[];
  comprasCartao: CompraCartaoMotor[];
  entradasExtras: EntradaExtraMotor[];
  cenarios: CenarioMotor[];
  lancamentosDiarios: LancamentoMotor[];
  aportesCdb: AporteMotor[];
}

export interface OpcoesCronograma {
  horizonteDias?: number; // default HORIZONTE_PADRAO_DIAS
  incluirSimulacao?: boolean; // default false
}

export interface OpcoesCdb {
  meses?: number; // default MESES_PADRAO_CDB
  incluirSimulacao?: boolean; // default false
}

export const HORIZONTE_PADRAO_DIAS = 190;
export const MESES_PADRAO_CDB = 24;
