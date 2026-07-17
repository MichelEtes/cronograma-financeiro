import { Link } from "react-router-dom";

const ITENS = [
  { to: "/cadastros/config", titulo: "Configuração", desc: "Saldo inicial, reserva, fatura, CDB e orçamentos" },
  { to: "/cadastros/receitas-fixas", titulo: "Receitas Fixas", desc: "Salário e entradas recorrentes" },
  { to: "/cadastros/saidas-fixas", titulo: "Saídas Fixas", desc: "Aluguel, contas e assinaturas" },
  { to: "/cadastros/compras-cartao", titulo: "Cartão de Crédito", desc: "Compras parceladas" },
  { to: "/cadastros/entradas-extras", titulo: "Entradas Extras", desc: "Dinheiro extra confirmado" },
  { to: "/cadastros/lancamentos-diarios", titulo: "Lançamentos Diários", desc: "Gastos variáveis do dia a dia" },
  { to: "/cadastros/aportes-cdb", titulo: "Aportes CDB", desc: "Aportes e resgates do investimento" },
  { to: "/cadastros/cenarios-simulados", titulo: "Simulador (E se…?)", desc: "Cenários hipotéticos" },
];

export function CadastrosHub() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Cadastros</h1>
      <p className="mb-4 text-sm text-slate-500">Gerencie os dados que alimentam a projeção.</p>
      <div className="space-y-2">
        {ITENS.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-400"
          >
            <div className="font-semibold">{i.titulo}</div>
            <div className="text-sm text-slate-500">{i.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
