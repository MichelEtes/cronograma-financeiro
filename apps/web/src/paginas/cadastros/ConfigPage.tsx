import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatarBRL } from "@cf/shared";
import { api } from "../../lib/api";

interface ConfigData {
  saldoInicialConta: number;
  dataInicial: string;
  diaVencimentoFatura: number;
  reservaSeguranca: number;
  saldoInicialCDB: number;
  taxaCdbAnual: number;
  orcamentos: { categoria: string; orcamentoMensal: number }[];
}

interface OrcamentoRow {
  categoria: string;
  orcamentoMensal: string;
}

const CAMPOS: { nome: keyof ConfigData; label: string; tipo: "moeda" | "numero" | "data" }[] = [
  { nome: "saldoInicialConta", label: "Saldo inicial da conta", tipo: "moeda" },
  { nome: "dataInicial", label: "Data inicial", tipo: "data" },
  { nome: "diaVencimentoFatura", label: "Dia de vencimento da fatura (1–28)", tipo: "numero" },
  { nome: "reservaSeguranca", label: "Reserva de segurança", tipo: "moeda" },
  { nome: "saldoInicialCDB", label: "Saldo inicial do CDB", tipo: "moeda" },
  { nome: "taxaCdbAnual", label: "Taxa do CDB (% a.a.)", tipo: "numero" },
];

export function ConfigPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery<ConfigData>({
    queryKey: ["config"],
    queryFn: () => api.get("/api/v1/config") as Promise<ConfigData>,
  });

  const [escalares, setEscalares] = useState<Record<string, string>>({});
  const [orcamentos, setOrcamentos] = useState<OrcamentoRow[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!data) return;
    setEscalares({
      saldoInicialConta: String(data.saldoInicialConta),
      dataInicial: data.dataInicial,
      diaVencimentoFatura: String(data.diaVencimentoFatura),
      reservaSeguranca: String(data.reservaSeguranca),
      saldoInicialCDB: String(data.saldoInicialCDB),
      taxaCdbAnual: String(data.taxaCdbAnual),
    });
    setOrcamentos(
      data.orcamentos.map((o) => ({ categoria: o.categoria, orcamentoMensal: String(o.orcamentoMensal) })),
    );
  }, [data]);

  const salvarConfig = useMutation({
    mutationFn: () =>
      api.put("/api/v1/config", {
        saldoInicialConta: Number(escalares.saldoInicialConta),
        dataInicial: escalares.dataInicial,
        diaVencimentoFatura: Number(escalares.diaVencimentoFatura),
        reservaSeguranca: Number(escalares.reservaSeguranca),
        saldoInicialCDB: Number(escalares.saldoInicialCDB),
        taxaCdbAnual: Number(escalares.taxaCdbAnual),
      }),
    onSuccess: () => {
      qc.invalidateQueries();
      setMsg("Configuração salva.");
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const salvarOrcamentos = useMutation({
    mutationFn: () =>
      api.put(
        "/api/v1/config/orcamentos",
        orcamentos.map((o) => ({ categoria: o.categoria, orcamentoMensal: Number(o.orcamentoMensal) })),
      ),
    onSuccess: () => {
      qc.invalidateQueries();
      setMsg("Orçamentos salvos.");
    },
    onError: (e: Error) => setMsg(e.message),
  });

  if (isLoading) return <p className="text-slate-500">Carregando…</p>;
  if (isError) return <p className="text-red-600">Erro ao carregar. A API está rodando?</p>;

  const total = orcamentos.reduce((s, o) => s + (Number(o.orcamentoMensal) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/cadastros" className="mb-2 inline-block text-sm text-emerald-600">
          ‹ Cadastros
        </Link>
        <h1 className="text-2xl font-bold">Configuração</h1>
      </div>

      <section className="space-y-3">
        {CAMPOS.map((c) => (
          <label key={c.nome} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{c.label}</span>
            <input
              type={c.tipo === "data" ? "date" : "number"}
              step={c.tipo === "moeda" ? "0.01" : undefined}
              value={escalares[c.nome] ?? ""}
              onChange={(e) => setEscalares((s) => ({ ...s, [c.nome]: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        ))}
        <button
          onClick={() => salvarConfig.mutate()}
          disabled={salvarConfig.isPending}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {salvarConfig.isPending ? "Salvando…" : "Salvar configuração"}
        </button>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Orçamentos por categoria</h2>
          <span className="text-sm text-slate-500">Total: {formatarBRL(total)}/mês</span>
        </div>
        <div className="space-y-2">
          {orcamentos.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Categoria"
                value={o.categoria}
                onChange={(e) =>
                  setOrcamentos((os) => os.map((x, j) => (j === i ? { ...x, categoria: e.target.value } : x)))
                }
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Valor/mês"
                value={o.orcamentoMensal}
                onChange={(e) =>
                  setOrcamentos((os) =>
                    os.map((x, j) => (j === i ? { ...x, orcamentoMensal: e.target.value } : x)),
                  )
                }
                className="w-28 rounded-lg border border-slate-300 px-3 py-2"
              />
              <button
                onClick={() => setOrcamentos((os) => os.filter((_, j) => j !== i))}
                className="rounded-lg px-2 text-red-600"
                aria-label="Remover"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setOrcamentos((os) => [...os, { categoria: "", orcamentoMensal: "" }])}
          className="mt-2 text-sm text-emerald-600"
        >
          + Adicionar categoria
        </button>
        <button
          onClick={() => salvarOrcamentos.mutate()}
          disabled={salvarOrcamentos.isPending}
          className="mt-3 w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {salvarOrcamentos.isPending ? "Salvando…" : "Salvar orçamentos"}
        </button>
      </section>

      {msg && <p className="text-center text-sm text-emerald-700">{msg}</p>}
    </div>
  );
}
