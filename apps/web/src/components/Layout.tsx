import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Carregando } from "./Estado";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/*
        Em modo instalado (PWA/Add to Home Screen) o conteúdo ocupa a tela toda,
        inclusive atrás da status bar e da faixa de gestos — reserva-se esse
        espaço com env(safe-area-inset-*) (0 em navegador normal, sem efeito).
      */}
      <main
        className="mx-auto w-full max-w-lg flex-1 px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)",
        }}
      >
        <Suspense fallback={<Carregando />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
