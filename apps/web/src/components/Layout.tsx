import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Carregando } from "./Estado";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-5">
        <Suspense fallback={<Carregando />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
