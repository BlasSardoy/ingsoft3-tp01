import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El front llama a /api/... con ruta RELATIVA (sin host/puerto).
// En dev, Vite proxea /api al backend que corre en localhost:8080.
// En producción, nginx hace ese mismo proxy (ver frontend/nginx.conf).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
