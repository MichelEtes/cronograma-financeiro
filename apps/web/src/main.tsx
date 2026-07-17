import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { router } from "./router";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { registerSW } from "virtual:pwa-register";
import "./index.css";

// Atualiza o app sozinho em segundo plano quando uma nova versão é publicada
// (sem popup — na próxima abertura o usuário já vê a versão nova).
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
