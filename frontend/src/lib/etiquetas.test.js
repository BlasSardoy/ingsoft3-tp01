import { describe, it, expect } from "vitest";
import { etiquetaDePuntaje } from "./etiquetas.js";

describe("etiquetaDePuntaje", () => {
  it.each([
    ["sin reseñas", 0, 0, "sin reseñas"],
    ["mixto", 2.5, 3, "mixto"],
    ["bien valorado", 4, 10, "bien valorado"],
    ["aclamado", 4.8, 20, "aclamado"],
  ])("con %s (promedio %s, cantidad %s), devuelve %s", (_caso, promedio, cantidad, esperado) => {
    // Act
    const resultado = etiquetaDePuntaje(promedio, cantidad);

    // Assert
    expect(resultado).toBe(esperado);
  });
});
