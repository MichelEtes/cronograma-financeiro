import { defineConfig, devices } from "@playwright/test";

// A API do E2E roda contra um banco isolado (test.db), populado com data-base fixa.
const DB_TESTE = "file:./test.db";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run e2e:api -w @cf/api",
      port: 3333,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { DATABASE_URL: DB_TESTE },
    },
    {
      command: "npm run dev -w @cf/web",
      port: 5173,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
