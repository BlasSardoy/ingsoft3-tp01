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
  test: {
    environment: "node", // sin DOM: los 4 tests pedidos no lo necesitan
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      // acá NO se excluye: se dice qué SÍ entra. Lo que no está en esta
      // lista (componentes, páginas) se verifica con e2e en el TP7.
      include: ["src/lib/**", "src/api.js"],
      thresholds: { lines: 80, branches: 80 }, // provisorio: se fija con la medición real (PR 3)
    },
  },
});
