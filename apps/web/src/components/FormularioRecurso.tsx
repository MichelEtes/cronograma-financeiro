import { useState, type FormEvent } from "react";
import type { Campo, RecursoConfig } from "../lib/campos";

type Valor = string | boolean;
type Valores = Record<string, Valor>;

function valorInicial(campo: Campo, item?: Record<string, unknown>): Valor {
  const bruto = item?.[campo.nome];
  if (bruto !== undefined && bruto !== null) {
    return campo.tipo === "checkbox" ? Boolean(bruto) : String(bruto);
  }
  if (campo.tipo === "checkbox") return campo.padrao === undefined ? false : Boolean(campo.padrao);
  return campo.padrao === undefined ? "" : String(campo.padrao);
}

function converter(campo: Campo, valor: Valor): unknown {
  if (campo.tipo === "checkbox") return Boolean(valor);
  if (campo.tipo === "moeda" || campo.tipo === "numero") {
    return valor === "" ? undefined : Number(valor);
  }
  return valor; // texto, data, select
}

export function FormularioRecurso({
  config,
  item,
  onSalvar,
  onCancelar,
  salvando,
}: {
  config: RecursoConfig;
  item?: Record<string, unknown>;
  onSalvar: (payload: Record<string, unknown>) => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const [valores, setValores] = useState<Valores>(() =>
    Object.fromEntries(config.campos.map((c) => [c.nome, valorInicial(c, item)])),
  );
  const [erros, setErros] = useState<Record<string, string>>({});

  function submeter(e: FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const c of config.campos) payload[c.nome] = converter(c, valores[c.nome]);

    const r = config.schema.safeParse(payload);
    if (!r.success) {
      const novos: Record<string, string> = {};
      for (const issue of r.error.issues) {
        const chave = String(issue.path[0] ?? "");
        if (!novos[chave]) novos[chave] = issue.message;
      }
      setErros(novos);
      return;
    }
    setErros({});
    onSalvar(r.data as Record<string, unknown>);
  }

  return (
    <form onSubmit={submeter} className="space-y-3">
      {config.campos.map((c) => (
        <CampoInput
          key={c.nome}
          campo={c}
          valor={valores[c.nome]}
          erro={erros[c.nome]}
          onChange={(v) => setValores((atual) => ({ ...atual, [c.nome]: v }))}
        />
      ))}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 rounded-lg border border-slate-300 py-2 font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="flex-1 rounded-lg bg-emerald-600 py-2 font-medium text-white disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

function CampoInput({
  campo,
  valor,
  erro,
  onChange,
}: {
  campo: Campo;
  valor: Valor;
  erro?: string;
  onChange: (v: Valor) => void;
}) {
  const classeInput = `w-full rounded-lg border px-3 py-2 ${erro ? "border-red-400" : "border-slate-300"}`;

  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
        {campo.tipo === "checkbox" && (
          <input
            type="checkbox"
            name={campo.nome}
            checked={Boolean(valor)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300"
          />
        )}
        {campo.label}
      </span>

      {campo.tipo === "select" ? (
        <select name={campo.nome} value={String(valor)} onChange={(e) => onChange(e.target.value)} className={classeInput}>
          <option value="" disabled>
            Selecione…
          </option>
          {campo.opcoes?.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </select>
      ) : campo.tipo === "checkbox" ? null : (
        <input
          type={campo.tipo === "data" ? "date" : campo.tipo === "moeda" || campo.tipo === "numero" ? "number" : "text"}
          name={campo.nome}
          step={campo.tipo === "moeda" ? "0.01" : undefined}
          min={campo.min}
          max={campo.max}
          value={String(valor)}
          onChange={(e) => onChange(e.target.value)}
          className={classeInput}
        />
      )}

      {campo.ajuda && <span className="mt-1 block text-xs text-slate-500">{campo.ajuda}</span>}
      {erro && <span className="mt-1 block text-xs text-red-600">{erro}</span>}
    </label>
  );
}
