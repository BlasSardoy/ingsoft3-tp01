import { describe, it, expect } from "vitest";
import { validarRegistro, validarRating, validarJuego, puedeBorrarResena } from "./reglas.js";

describe("validarRegistro — REGLA 1", () => {
  // Parametrizado: el mismo comportamiento ("contraseña corta se rechaza,
  // de 6 para arriba se acepta") con varios datos, en vez de duplicar el test.
  it.each([
    ["12345", false], // 5 caracteres: justo debajo del límite
    ["123456", true], // 6 caracteres: justo en el límite
  ])("con contraseña %s, el resultado válido es %s", (password, esperado) => {
    // Act
    const resultado = validarRegistro({
      username: "user1",
      email: "user1@test.com",
      password,
    });

    // Assert
    expect(resultado.ok).toBe(esperado);
  });

  // Caso de error: sin email, el registro se rechaza con el mensaje de
  // "obligatorios" (no con el de la contraseña).
  it("sin email, se rechaza con el mensaje de campos obligatorios", () => {
    // Act
    const resultado = validarRegistro({ username: "user1", password: "123456" });

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toContain("obligatorios");
  });
});

describe("validarRating — REGLA 2", () => {
  it.each([
    [0, false], // debajo del mínimo
    [6, false], // arriba del máximo
    [1, true], // borde inferior válido
    [5, true], // borde superior válido
    [undefined, false], // vacío
    [2.5, false], // no entero: el hallazgo de "coverage alto no garantiza calidad"
    ["3", false], // string numérico: tampoco es un entero de JS
  ])("con rating %s, el resultado válido es %s", (rating, esperado) => {
    // Act
    const resultado = validarRating(rating);

    // Assert
    expect(resultado.ok).toBe(esperado);
  });
});

describe("validarJuego — obligatorios del alta de juego", () => {
  it("sin platform, se rechaza con el mensaje de campos obligatorios", () => {
    // Act
    const resultado = validarJuego({ title: "Celeste", category: "Plataformas" });

    // Assert
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toContain("obligatorios");
  });
});

describe("puedeBorrarResena — REGLA 6", () => {
  const resena = { user_id: 1 };

  it.each([
    ["la reseña propia", { id: 1, role: "user" }, true],
    ["una reseña ajena, sin ser admin", { id: 2, role: "user" }, false],
    ["una reseña ajena, siendo admin", { id: 2, role: "admin" }, true],
  ])("con %s, puede borrarla: %s", (_caso, user, esperado) => {
    // Act
    const resultado = puedeBorrarResena(resena, user);

    // Assert
    expect(resultado).toBe(esperado);
  });
});
