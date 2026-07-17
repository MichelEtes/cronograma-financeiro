import { execSync } from "node:child_process";

// Prepara o banco de teste ANTES dos webServers atenderem: aplica as migrations e popula
// com data-base fixa (2026-01-01) para as projeções serem determinísticas nos testes.
export default async function globalSetup() {
  const env = {
    ...process.env,
    DATABASE_URL: "file:./test.db",
    SEED_DATA_INICIAL: "2026-01-01",
  };
  execSync("npm run db:deploy -w @cf/api", { env, stdio: "inherit" });
  execSync("npm run db:seed -w @cf/api", { env, stdio: "inherit" });
}
