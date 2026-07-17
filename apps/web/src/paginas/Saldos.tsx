import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { formatarBRL, formatarMesExtenso } from "../lib/format";
import type { CronogramaResp } from "../lib/api-tipos";
import { NavegadorMes } from "../components/NavegadorMes";
import { Carregando, Erro } from "../components/Estado";

export function Saldos() {
  const q = useQuery<CronogramaResp>({
    queryKey: ["cronograma", 366],
    queryFn: () => api.get("/api/v1/cronograma?dias=366") as Promise<CronogramaResp>,
  });
  const [idx, setIdx] = useState(0);

  if (q.isLoading) return <Carregando />;
  if (q.isError || !q.data) return <Erro />;

  const meses = [...new Set(q.data.dias.map((d) => d.data.slice(0, 7)))];
  const iAtual = Math.min(idx, meses.length - 1);
  const mesSel = meses[iAtual];
  const dias = q.data.dias.filter((d) => d.data.slice(0, 7) === mesSel);

  const tot = dias.reduce(
    (a, d) => ({
      entradas: a.entradas + d.receitaFixa + d.entradasConfirmadas + d.entradaSimulada,
      saidas: a.saidas + d.saidasFixas + d.saidaSimulada,
      diarios: a.diarios + d.gastoVariavel,
      economias: a.economias + d.aporteCdbLiquido,
      cartao: a.cartao + d.parcelaCartao,
    }),
    { entradas: 0, saidas: 0, diarios: 0, economias: 0, cartao: 0 },
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Saldos</h1>
      <NavegadorMes
        label={formatarMesExtenso(`${mesSel}-01`)}
        onPrev={() => setIdx(Math.max(0, iAtual - 1))}
        onNext={() => setIdx(Math.min(meses.length - 1, iAtual + 1))}
        prevDisabled={iAtual === 0}
        nextDisabled={iAtual >= meses.length - 1}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-2 py-1.5 text-left">Dia</th>
              <th className="px-2 py-1.5 text-right">Entr.</th>
              <th className="px-2 py-1.5 text-right">Saíd.</th>
              <th className="px-2 py-1.5 text-right">Diár.</th>
              <th className="px-2 py-1.5 text-right">Econ.</th>
              <th className="px-2 py-1.5 text-right">Cartão</th>
              <th className="px-2 py-1.5 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d) => {
              const entradas = d.receitaFixa + d.entradasConfirmadas + d.entradaSimulada;
              const saidas = d.saidasFixas + d.saidaSimulada;
              return (
                <tr
                  key={d.data}
                  data-testid={`saldo-dia-${d.data}`}
                  className={`border-t border-slate-100 ${d.saldoFinalDia < 0 ? "bg-red-50" : ""}`}
                >
                  <td className="px-2 py-1 text-left">{d.data.slice(8, 10)}</td>
                  <td className="px-2 py-1 text-right">{entradas ? formatarBRL(entradas) : "—"}</td>
                  <td className="px-2 py-1 text-right">{saidas ? formatarBRL(saidas) : "—"}</td>
                  <td className="px-2 py-1 text-right">{formatarBRL(d.gastoVariavel)}</td>
                  <td className="px-2 py-1 text-right">{d.aporteCdbLiquido ? formatarBRL(d.aporteCdbLiquido) : "—"}</td>
                  <td className="px-2 py-1 text-right">{d.parcelaCartao ? formatarBRL(d.parcelaCartao) : "—"}</td>
                  <td
                    className={`px-2 py-1 text-right font-semibold ${d.saldoFinalDia < 0 ? "text-red-600" : "text-slate-800"}`}
                  >
                    {formatarBRL(d.saldoFinalDia)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold">
            <tr>
              <td className="px-2 py-1.5 text-left">Total</td>
              <td className="px-2 py-1.5 text-right">{formatarBRL(tot.entradas)}</td>
              <td className="px-2 py-1.5 text-right">{formatarBRL(tot.saidas)}</td>
              <td className="px-2 py-1.5 text-right">{formatarBRL(tot.diarios)}</td>
              <td className="px-2 py-1.5 text-right">{formatarBRL(tot.economias)}</td>
              <td className="px-2 py-1.5 text-right">{formatarBRL(tot.cartao)}</td>
              <td className="px-2 py-1.5 text-right" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
