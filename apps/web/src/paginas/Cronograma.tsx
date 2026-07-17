import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api";
import { useCrud } from "../lib/useCrud";
import { formatarBRL, formatarDataBR } from "../lib/format";
import type { CronogramaResp } from "../lib/api-tipos";
import { StatusBadge } from "../components/StatusBadge";
import { Carregando, Erro } from "../components/Estado";

interface Cenario {
  id: string;
  data: string;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: number;
  incluir: boolean;
}

export function Cronograma() {
  const [mostrarSim, setMostrarSim] = useState(false);
  const q = useQuery<CronogramaResp>({
    queryKey: ["cronograma", 190],
    queryFn: () => api.get("/api/v1/cronograma?dias=190") as Promise<CronogramaResp>,
  });
  const cenarios = useCrud<Cenario>("/api/v1/cenarios-simulados", "cenarios-simulados");

  if (q.isLoading) return <Carregando />;
  if (q.isError || !q.data) return <Erro />;
  const { dias, primeiroFuro, serie } = q.data;

  return (
    <div>
      <h1 className="text-2xl font-bold">Cronograma</h1>
      <p className="mb-3 text-sm text-slate-500">Projeção diária dos próximos {dias.length} dias.</p>

      {primeiroFuro ? (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠️ Primeiro furo projetado em <strong>{formatarDataBR(primeiroFuro)}</strong> — o saldo fica negativo.
        </div>
      ) : (
        <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          ✓ O saldo não fica negativo no horizonte projetado.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={serie} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis
              dataKey="data"
              tickFormatter={(d) => `${String(d).slice(8, 10)}/${String(d).slice(5, 7)}`}
              minTickGap={40}
              tick={{ fontSize: 10 }}
            />
            <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 10 }} width={38} />
            <Tooltip formatter={(v) => formatarBRL(Number(v))} labelFormatter={(d) => formatarDataBR(String(d))} />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
            {primeiroFuro && <ReferenceLine x={primeiroFuro} stroke="#ef4444" />}
            <Line type="monotone" dataKey="saldoReal" name="Real" stroke="#059669" strokeWidth={2} dot={false} />
            {mostrarSim && (
              <Line
                type="monotone"
                dataKey="saldoComSimulacao"
                name="Com simulação"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Simulador (5.5): toggles de cenários — o gráfico atualiza com a 2ª curva */}
      <div className="mt-4">
        <button
          onClick={() => setMostrarSim((s) => !s)}
          className="mb-2 text-sm font-medium text-indigo-600"
        >
          {mostrarSim ? "▾" : "▸"} Simulador (E se…?){mostrarSim ? " — curva tracejada ativa" : ""}
        </button>
        {mostrarSim && (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            {cenarios.lista.data && cenarios.lista.data.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum cenário. Cadastre em Cadastros › Simulador.</p>
            )}
            <div className="space-y-1.5">
              {cenarios.lista.data?.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={c.incluir}
                    onChange={() =>
                      cenarios.atualizar.mutate({ id: c.id, data: { ...c, incluir: !c.incluir } })
                    }
                    className="h-4 w-4"
                  />
                  <span className={c.tipo === "entrada" ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
                    {c.tipo === "entrada" ? "+" : "−"}
                    {formatarBRL(c.valor)}
                  </span>
                  <span className="text-slate-600">{c.descricao}</span>
                  <span className="ml-auto text-xs text-slate-400">{formatarDataBR(c.data)}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabela dia a dia */}
      <h2 className="mb-2 mt-5 text-lg font-semibold">Dia a dia</h2>
      <div className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-2 py-1.5 text-left">Data</th>
              <th className="px-2 py-1.5 text-right">Entr.</th>
              <th className="px-2 py-1.5 text-right">Saíd.</th>
              <th className="px-2 py-1.5 text-right">Cartão</th>
              <th className="px-2 py-1.5 text-right">Diár.</th>
              <th className="px-2 py-1.5 text-right">Saldo</th>
              <th className="px-2 py-1.5 text-center">St</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d) => {
              const entradas = d.receitaFixa + d.entradasConfirmadas + d.entradaSimulada;
              const saidas = d.saidasFixas + d.saidaSimulada;
              return (
                <tr key={d.data} className={`border-t border-slate-100 ${d.saldoFinalDia < 0 ? "bg-red-50" : ""}`}>
                  <td className="px-2 py-1 text-left">{formatarDataBR(d.data)}</td>
                  <td className="px-2 py-1 text-right">{entradas ? formatarBRL(entradas) : "—"}</td>
                  <td className="px-2 py-1 text-right">{saidas ? formatarBRL(saidas) : "—"}</td>
                  <td className="px-2 py-1 text-right">{d.parcelaCartao ? formatarBRL(d.parcelaCartao) : "—"}</td>
                  <td className="px-2 py-1 text-right">
                    {formatarBRL(d.gastoVariavel)}
                    {d.gastoVariavelEhPrevisao ? "*" : ""}
                  </td>
                  <td
                    className={`px-2 py-1 text-right font-semibold ${d.saldoFinalDia < 0 ? "text-red-600" : "text-slate-800"}`}
                  >
                    {formatarBRL(d.saldoFinalDia)}
                  </td>
                  <td className="px-2 py-1 text-center">
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs text-slate-400">* diário previsto (orçamento), ainda sem lançamento real.</p>
    </div>
  );
}
