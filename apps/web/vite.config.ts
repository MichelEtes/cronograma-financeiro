import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // @cf/shared é TypeScript de workspace — deixa o Vite processá-lo pelo pipeline normal.
  optimizeDeps: { exclude: ["@cf/shared"] },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3333",
    },
  },
});
