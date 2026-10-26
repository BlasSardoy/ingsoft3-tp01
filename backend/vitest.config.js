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
        "src/instrument.js", // configuración de Sentry, no tiene reglas
        "src/db.js", // esquema SQL, terreno de integración
        "src/routes/**", // pegamento HTTP — su lógica ya vive en reglas.js/servicios/**
      ],
      // Fijado con la medición real del PR 3: 90.11% líneas, 79.24% ramas,
      // con margen hacia abajo para no romper con fluctuaciones chicas.
      // Hoy mide 92.83% / 84.21%. Lo que queda sin cubrir en ramas es
      // servicios/juegos.js y el catch genérico de cada servicio (ver
      // decisiones.md › TP5 › Umbral de coverage).
      thresholds: { lines: 85, branches: 75 },
    },
  },
});
