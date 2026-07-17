import { test, expect } from "@playwright/test";

// Banco de teste com data-base fixa 2026-01-01 (ver global-setup + SEED_DATA_INICIAL).

test("dashboard Totais carrega no mês inicial", async ({ page }) => {
  await page.goto("/totais");
  await expect(page.getByRole("heading", { name: "Totais" })).toBeVisible();
  await expect(page.getByText("Janeiro de 2026")).toBeVisible();
});

test("cadastrar saída fixa → saldo cai no dia certo", async ({ page }) => {
  await page.goto("/cadastros/saidas-fixas");
  await page.getByRole("button", { name: /Novo/ }).click();

  await page.locator('input[name="descricao"]').fill("E2E Aluguel");
  await page.locator('input[name="valor"]').fill("100");
  await page.locator('input[name="diaVencimento"]').fill("20");
  await page.locator('input[name="categoria"]').fill("Teste");
  await page.getByRole("button", { name: "Salvar" }).click();

  // O item aparece na lista (mutação concluída).
  await expect(page.getByText("E2E Aluguel")).toBeVisible();

  // Em Saldos, a saída de R$ 100 cai no dia 20 de janeiro.
  await page.goto("/saldos");
  const linha = page.getByTestId("saldo-dia-2026-01-20");
  await expect(linha).toBeVisible();
  await expect(linha).toContainText("R$ 100,00");
});

test("lançar aporte CDB → conta cai no dia e aparece em Investimentos", async ({ page }) => {
  await page.goto("/cadastros/aportes-cdb");
  await page.getByRole("button", { name: /Novo/ }).click();

  // tipo já vem "aporte" por padrão
  await page.locator('input[name="valor"]').fill("500");
  await page.locator('input[name="data"]').fill("2026-01-10");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByText("R$ 500,00")).toBeVisible();

  // Em Saldos, o aporte sai da conta (coluna Economias) no dia 10.
  await page.goto("/saldos");
  await expect(page.getByTestId("saldo-dia-2026-01-10")).toContainText("R$ 500,00");

  // Em Investimentos, o aportado líquido histórico = 300 (seed) + 500 = R$ 800,00.
  await page.goto("/investimentos");
  await expect(page.getByTestId("card-aportado-hist")).toContainText("R$ 800,00");
});
