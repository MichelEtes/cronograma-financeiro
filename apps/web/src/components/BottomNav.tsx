import { NavLink } from "react-router-dom";

const ITENS = [
  { to: "/totais", label: "Totais", icone: "📊" },
  { to: "/saldos", label: "Saldos", icone: "📅" },
  { to: "/cronograma", label: "Cronograma", icone: "📈" },
  { to: "/investimentos", label: "Investir", icone: "💰" },
  { to: "/cadastros", label: "Cadastros", icone: "⚙️" },
];

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {ITENS.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                isActive ? "text-emerald-600" : "text-slate-500"
              }`
            }
          >
            <span className="text-lg leading-none">{i.icone}</span>
            <span>{i.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
