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
      thresholds: { lines: 80, branches: 80 }, // provisorio: se fija con la medición real (PR 3)
    },
  },
});
