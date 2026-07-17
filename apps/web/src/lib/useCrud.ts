import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

/**
 * CRUD genérico via React Query. Toda mutação invalida todas as queries, para que as
 * telas de projeção (Fase 4) reflitam imediatamente qualquer cadastro alterado.
 */
export function useCrud<T>(endpoint: string, chave: string) {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries();

  const lista = useQuery<T[]>({
    queryKey: [chave],
    queryFn: () => api.get(endpoint) as Promise<T[]>,
  });

  const criar = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(endpoint, data),
    onSuccess: invalidar,
  });

  const atualizar = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`${endpoint}/${id}`, data),
    onSuccess: invalidar,
  });

  const remover = useMutation({
    mutationFn: (id: string) => api.del(`${endpoint}/${id}`),
    onSuccess: invalidar,
  });

  return { lista, criar, atualizar, remover };
}
