export function Card({
  titulo,
  valor,
  cor,
  sub,
  testId,
}: {
  titulo: string;
  valor: string;
  cor?: string;
  sub?: string;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{titulo}</div>
      <div className={`text-lg font-bold ${cor ?? "text-slate-900"}`}>{valor}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
