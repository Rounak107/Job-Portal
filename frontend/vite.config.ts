// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-ignore
import history from "vite-plugin-history";

export default defineConfig({
  plugins: [
    react(),
    history(), // 👈 ensures React Router fallback
  ],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
      '/uploads': 'http://localhost:5000',
    },
  },
});
