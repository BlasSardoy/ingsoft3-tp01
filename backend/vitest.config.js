import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      // include amplio + exclude explícito: un archivo nuevo en src/ entra
      // solo a la cuenta, no hay que acordarse de sumarlo a mano.
      include: ["src/**"],
      exclude: [
        "src/**/*.test.js",
        "src/index.js", // arranque: cablea Express, no tiene reglas
        "src/seed.js", // datos de ejemplo, no tiene reglas
        "src/db.js", // esquema SQL, terreno de integración
        "src/routes/**", // pegamento HTTP — su lógica ya vive en reglas.js/servicios/**
      ],
      // Fijado con la medición real del PR 3: 90.11% líneas, 79.24% ramas.
      // Con margen hacia abajo para no romper con fluctuaciones chicas; el
      // resto de la brecha en ramas es a propósito (ver auth.test.js: el
      // req.user?.role de requireAdmin queda sin testear para el ejercicio
      // del camino sin cubrir del PR 4/5).
      thresholds: { lines: 85, branches: 75 },
    },
  },
});
