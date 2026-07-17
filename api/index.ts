// Adaptador serverless para a Vercel: expõe a mesma app Fastify (apps/api/src/app.ts)
// como uma função Node. Nenhuma rota é reescrita — o Fastify processa a requisição
// internamente, exatamente como no servidor local (apps/api/src/server.ts).
//
// O vercel.json reescreve "/api/*" e "/health" para esta função.
import type { IncomingMessage, ServerResponse } from "node:http";
import { construirApp } from "../apps/api/src/app.js";

type FastifyAppInstance = ReturnType<typeof construirApp>;

// Reaproveita a instância entre invocações do mesmo container "morno" (evita
// reconstruir rotas/plugins a cada requisição).
let appPromise: Promise<FastifyAppInstance> | null = null;

function obterApp(): Promise<FastifyAppInstance> {
  if (!appPromise) {
    const app = construirApp();
    appPromise = app.ready().then(() => app);
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await obterApp();
  app.server.emit("request", req, res);
}
