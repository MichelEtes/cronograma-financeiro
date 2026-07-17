import { Link, useParams } from "react-router-dom";
import { RECURSOS } from "./configs";
import { RecursoCrud } from "../../components/RecursoCrud";

export function RecursoPagina() {
  const { recurso } = useParams();
  const config = recurso ? RECURSOS[recurso] : undefined;

  if (!config) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Cadastro não encontrado.</p>
        <Link to="/cadastros" className="text-emerald-600">
          Voltar aos cadastros
        </Link>
      </div>
    );
  }

  return <RecursoCrud config={config} />;
}
