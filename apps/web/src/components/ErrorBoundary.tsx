import { Component, type ReactNode } from "react";

/** Captura erros de renderização e mostra uma tela amigável em vez de quebrar o app. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state: { erro: Error | null } = { erro: null };

  static getDerivedStateFromError(erro: Error) {
    return { erro };
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="mx-auto max-w-lg p-8 text-center">
          <h1 className="text-lg font-semibold">Algo deu errado</h1>
          <p className="mt-2 text-sm text-slate-500">{this.state.erro.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
