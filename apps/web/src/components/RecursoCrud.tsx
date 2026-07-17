import { useState } from "react";
import { Link } from "react-router-dom";
import type { RecursoConfig } from "../lib/campos";
import { useCrud } from "../lib/useCrud";
import { formatarValorCampo } from "../lib/format";
import { Modal } from "./Modal";
import { FormularioRecurso } from "./FormularioRecurso";

type Item = Record<string, unknown> & { id: string };

export function RecursoCrud({ config }: { config: RecursoConfig }) {
  const { lista, criar, atualizar, remover } = useCrud<Item>(config.endpoint, config.chave);
  const [editando, setEditando] = useState<Item | "novo" | null>(null);
  const [removendo, setRemovendo] = useState<Item | null>(null);

  const campoTitulo = config.campos.find((c) => c.nome === config.tituloCampo);
  const salvando = criar.isPending || atualizar.isPending;

  function salvar(payload: Record<string, unknown>) {
    if (editando === "novo") {
      criar.mutate(payload, { onSuccess: () => setEditando(null) });
    } else if (editando) {
      atualizar.mutate({ id: editando.id, data: payload }, { onSuccess: () => setEditando(null) });
    }
  }

  function titulo(item: Item): string {
    const bruto = item[config.tituloCampo];
    return campoTitulo ? formatarValorCampo(campoTitulo, bruto) : String(bruto ?? "—");
  }

  return (
    <div>
      <Link to="/cadastros" className="mb-2 inline-block text-sm text-emerald-600">
        ‹ Cadastros
      </Link>
      <h1 className="text-2xl font-bold">{config.titulo}</h1>
      <p className="mb-4 text-sm text-slate-500">{config.descricao}</p>

      <button
        onClick={() => setEditando("novo")}
        className="mb-4 w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white"
      >
        + Novo
      </button>

      {lista.isLoading && <p className="text-slate-500">Carregando…</p>}
      {lista.isError && <p className="text-red-600">Erro ao carregar. A API está rodando?</p>}
      {lista.data?.length === 0 && <p className="text-slate-500">Nenhum registro ainda.</p>}

      <div className="space-y-2">
        {lista.data?.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold">{titulo(item)}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-slate-500">
                  {config.campos
                    .filter((c) => c.nome !== config.tituloCampo)
                    .map((c) => (
                      <span key={c.nome}>
                        {c.label}: {formatarValorCampo(c, item[c.nome])}
                      </span>
                    ))}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => setEditando(item)}
                  className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Editar
                </button>
                <button
                  onClick={() => setRemovendo(item)}
                  className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <Modal
          titulo={editando === "novo" ? `Novo — ${config.titulo}` : `Editar — ${config.titulo}`}
          onClose={() => setEditando(null)}
        >
          <FormularioRecurso
            config={config}
            item={editando === "novo" ? undefined : editando}
            onSalvar={salvar}
            onCancelar={() => setEditando(null)}
            salvando={salvando}
          />
        </Modal>
      )}

      {removendo && (
        <Modal titulo="Confirmar exclusão" onClose={() => setRemovendo(null)}>
          <p className="text-slate-600">
            Excluir <strong>{titulo(removendo)}</strong>?
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setRemovendo(null)}
              className="flex-1 rounded-lg border border-slate-300 py-2"
            >
              Cancelar
            </button>
            <button
              onClick={() => remover.mutate(removendo.id, { onSuccess: () => setRemovendo(null) })}
              disabled={remover.isPending}
              className="flex-1 rounded-lg bg-red-600 py-2 text-white disabled:opacity-50"
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
