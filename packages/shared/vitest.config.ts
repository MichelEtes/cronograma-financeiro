import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Barris de reexport e módulos só-de-tipo/validação ficam fora da meta de 100%
      // das FUNÇÕES PURAS de projeção (Seção 2).
      exclude: [
        "src/**/*.test.ts",
        "src/index.ts",
        "src/engine/index.ts",
        "src/schemas.ts",
        "src/types.ts",
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
