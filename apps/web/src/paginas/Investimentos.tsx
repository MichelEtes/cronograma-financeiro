import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api";
import { formatarBRL, formatarPct } from "../lib/format";
import type { InvestimentosResp } from "../lib/api-tipos";
import { Card } from "../components/Card";
import { Carregando, Erro } from "../components/Estado";

export function Investimentos() {
  const q = useQuery<InvestimentosResp>({
    queryKey: ["investimentos", 24],
    queryFn: () => api.get("/api/v1/investimentos?meses=24") as Promise<InvestimentosResp>,
  });

  if (q.isLoading) return <Carregando />;
  if (q.isError || !q.data) return <Erro />;
  const { tabela, resumo } = q.data;

  return (
    <div>
      <h1 className="text-2xl font-bold">Investimentos (CDB)</h1>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Card titulo="Saldo investido hoje" valor={formatarBRL(resumo.saldoInvestidoHoje)} cor="text-indigo-600" />
        <Card titulo="Projetado (fim)" valor={formatarBRL(resumo.saldoInvestidoProjetadoFinal)} cor="text-indigo-600" />
        <Card
          titulo="Aportado líq. (hist.)"
          valor={formatarBRL(resumo.totalAportadoLiquidoHistorico)}
          testId="card-aportado-hist"
        />
        <Card titulo="Rendimento acum." valor={formatarBRL(resumo.rendimentoAcumuladoHorizonte)} cor="text-emerald-600" />
        <Card titulo="% Economizado médio" valor={formatarPct(resumo.pctEconomizadoMedio)} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={tabela} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis
              dataKey="mes"
              tickFormatter={(m) => `${String(m).slice(5, 7)}/${String(m).slice(2, 4)}`}
              minTickGap={30}
              tick={{ fontSize: 10 }}
            />
            <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 10 }} width={38} />
            <Tooltip formatter={(v) => formatarBRL(Number(v))} labelFormatter={(m) => String(m).slice(0, 7)} />
            <Line type="monotone" dataKey="saldoInvestido" name="Saldo investido" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="mb-2 mt-5 text-lg font-semibold">Mês a mês</h2>
      <div className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-2 py-1.5 text-left">Mês</th>
              <th className="px-2 py-1.5 text-right">Aporte líq.</th>
              <th className="px-2 py-1.5 text-right">Rend.</th>
              <th className="px-2 py-1.5 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {tabela.map((m) => (
              <tr key={m.mes} className="border-t border-slate-100">
                <td className="px-2 py-1 text-left">
                  {m.mes.slice(5, 7)}/{m.mes.slice(0, 4)}
                </td>
                <td className="px-2 py-1 text-right">{m.aporteLiquido ? formatarBRL(m.aporteLiquido) : "—"}</td>
                <td className="px-2 py-1 text-right text-emerald-600">{formatarBRL(m.rendimentoMes)}</td>
                <td className="px-2 py-1 text-right font-semibold">{formatarBRL(m.saldoInvestido)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
