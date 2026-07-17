import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adicionarMeses, primeiroDiaDoMes } from "@cf/shared";
import { api } from "../lib/api";
import { useConfig } from "../lib/useConfig";
import { formatarBRL, formatarMesExtenso, formatarPct } from "../lib/format";
import type { TotaisMes } from "../lib/api-tipos";
import { Card } from "../components/Card";
import { NavegadorMes } from "../components/NavegadorMes";
import { Carregando, Erro } from "../components/Estado";

export function Totais() {
  const cfg = useConfig();
  const [offset, setOffset] = useState(0);

  const baseISO = cfg.data ? primeiroDiaDoMes(cfg.data.dataInicial) : null;
  const mesISO = baseISO ? adicionarMeses(baseISO, offset) : null;

  const q = useQuery<TotaisMes>({
    queryKey: ["totais", mesISO],
    queryFn: () => api.get(`/api/v1/totais?mes=${mesISO!.slice(0, 7)}`) as Promise<TotaisMes>,
    enabled: !!mesISO,
  });

  if (cfg.isError) return <Erro />;
  if (!mesISO || q.isLoading) return <Carregando />;
  if (q.isError || !q.data) return <Erro />;
  const t = q.data;

  return (
    <div>
      <h1 className="text-2xl font-bold">Totais</h1>
      <NavegadorMes
        label={formatarMesExtenso(mesISO)}
        onPrev={() => setOffset((o) => Math.max(0, o - 1))}
        onNext={() => setOffset((o) => o + 1)}
        prevDisabled={offset === 0}
      />

      <div className="grid grid-cols-2 gap-2">
        <Card titulo="Entradas" valor={formatarBRL(t.entradas)} cor="text-emerald-600" />
        <Card titulo="Saídas" valor={formatarBRL(t.saidas)} cor="text-red-600" />
        <Card titulo="Diários" valor={formatarBRL(t.diarios)} cor="text-red-600" />
        <Card titulo="Cartão" valor={formatarBRL(t.cartao)} cor="text-red-600" />
        <Card titulo="Economias" valor={formatarBRL(t.economias)} cor="text-indigo-600" />
        <Card titulo="Custo de vida" valor={formatarBRL(t.custoDeVida)} />
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-xs text-slate-500">Performance do mês</div>
        <div className={`text-2xl font-bold ${t.performance < 0 ? "text-red-600" : "text-emerald-600"}`}>
          {formatarBRL(t.performance)}
        </div>
        {t.performance < 0 && <div className="text-sm font-medium text-red-500">Faltou dinheiro</div>}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Card titulo="% Economizado" valor={formatarPct(t.pctEconomizado)} cor="text-indigo-600" />
        <Card
          titulo="Diário médio"
          valor={formatarBRL(t.diarioMedio)}
          sub={`Orçado: ${formatarBRL(t.orcamentoDiario)}/dia`}
        />
      </div>
    </div>
  );
}
