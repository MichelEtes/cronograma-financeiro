const MAPA = { ok: "🟢", atencao: "🟡", critico: "🔴" } as const;

export function StatusBadge({ status }: { status: "ok" | "atencao" | "critico" }) {
  return <span title={status}>{MAPA[status]}</span>;
}
