import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/favicon-32.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Cronograma Financeiro",
        short_name: "Cronograma",
        description: "Planejamento financeiro preditivo — projeção diária do saldo bancário.",
        lang: "pt-BR",
        start_url: "/totais",
        display: "standalone",
        background_color: "#f8fafc",
        theme_color: "#059669",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Nunca cachear a API — os dados da projeção precisam ser sempre ao vivo.
        // O app-shell (HTML/JS/CSS/ícones) é precacheado para abrir rápido/offline.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  // @cf/shared é TypeScript de workspace — deixa o Vite processá-lo pelo pipeline normal.
  optimizeDeps: { exclude: ["@cf/shared"] },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3333",
    },
  },
});
