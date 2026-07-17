import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Totais } from "./paginas/Totais";
import { Saldos } from "./paginas/Saldos";
import { CadastrosHub } from "./paginas/cadastros/CadastrosHub";
import { RecursoPagina } from "./paginas/cadastros/RecursoPagina";
import { ConfigPage } from "./paginas/cadastros/ConfigPage";

// Telas com gráficos (Recharts) carregam sob demanda — mantém o bundle inicial enxuto.
const Cronograma = lazy(() =>
  import("./paginas/Cronograma").then((m) => ({ default: m.Cronograma })),
);
const Investimentos = lazy(() =>
  import("./paginas/Investimentos").then((m) => ({ default: m.Investimentos })),
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/totais" replace /> },
      { path: "totais", element: <Totais /> },
      { path: "saldos", element: <Saldos /> },
      { path: "cronograma", element: <Cronograma /> },
      { path: "investimentos", element: <Investimentos /> },
      { path: "cadastros", element: <CadastrosHub /> },
      { path: "cadastros/config", element: <ConfigPage /> },
      { path: "cadastros/:recurso", element: <RecursoPagina /> },
    ],
  },
], {
  future: { v7_relativeSplatPath: true },
});
