import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface ConfigResp {
  saldoInicialConta: number;
  dataInicial: string;
  diaVencimentoFatura: number;
  reservaSeguranca: number;
  saldoInicialCDB: number;
  taxaCdbAnual: number;
  orcamentos: { categoria: string; orcamentoMensal: number }[];
}

export function useConfig() {
  return useQuery<ConfigResp>({
    queryKey: ["config"],
    queryFn: () => api.get("/api/v1/config") as Promise<ConfigResp>,
  });
}
