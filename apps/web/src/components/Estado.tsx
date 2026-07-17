export function Carregando() {
  return <p className="py-10 text-center text-slate-500">Carregando…</p>;
}

export function Erro({ msg }: { msg?: string }) {
  return <p className="py-10 text-center text-red-600">{msg ?? "Erro ao carregar. A API está rodando?"}</p>;
}
