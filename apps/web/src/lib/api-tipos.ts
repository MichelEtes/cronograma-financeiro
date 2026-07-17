import type {
  DiaProjetado,
  PontoComparativo,
  MesAgregado,
  MesProjetadoCdb,
  ResumoCdb,
  TotaisMes,
} from "@cf/shared";

export type { DiaProjetado, PontoComparativo, MesAgregado, MesProjetadoCdb, ResumoCdb, TotaisMes };

/** Resposta de GET /api/v1/cronograma. */
export interface CronogramaResp {
  dias: DiaProjetado[];
  primeiroFuro: string | null;
  serie: PontoComparativo[];
}

/** Resposta de GET /api/v1/investimentos. */
export interface InvestimentosResp {
  tabela: MesProjetadoCdb[];
  resumo: ResumoCdb;
}
