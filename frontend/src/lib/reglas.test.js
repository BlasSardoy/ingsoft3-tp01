import { describe, it, expect } from "vitest";
import {
  puedeEnviarAcceso,
  puedeEnviarResena,
  puedeGuardarJuego,
  estrellasLlenas,
} from "./reglas.js";

describe("puedeEnviarAcceso — formulario de login/registro", () => {
  // Parametrizado: login con contraseña en el borde de la REGLA 1.
  it.each([
    ["12345", false],
    ["123456", true],
  ])("en login, con contraseña %s el resultado es %s", (password, esperado) => {
    // Act
    const resultado = puedeEnviarAcceso({
      esRegistro: false,
      email: "user1@test.com",
      password,
      username: "",
    });

    // Assert
    expect(resultado).toBe(esperado);
  });

  // Parametrizado: en registro, también importa el largo del username.
  it.each([
    ["ab", false],
    ["abc", true],
  ])("en registro, con username %s el resultado es %s", (username, esperado) => {
    // Act
    const resultado = puedeEnviarAcceso({
      esRegistro: true,
      email: "user1@test.com",
      password: "123456",
      username,
    });

    // Assert
    expect(resultado).toBe(esperado);
  });

  it("mientras está enviando, el resultado es false aunque los campos sean válidos", () => {
    // Act
    const resultado = puedeEnviarAcceso({
      esRegistro: false,
      email: "user1@test.com",
      password: "123456",
      username: "",
      enviando: true,
    });

    // Assert
    expect(resultado).toBe(false);
  });
});

describe("puedeEnviarResena — REGLA 2 del lado del front", () => {
  it.each([
    [0, false],
    [6, false],
    [1, true],
    [5, true],
  ])("con rating %s, el resultado es %s", (rating, esperado) => {
    // Act
    const resultado = puedeEnviarResena(rating, false);

    // Assert
    expect(resultado).toBe(esperado);
  });

  it("mientras está guardando, el resultado es false aunque el rating sea válido", () => {
    // Act
    const resultado = puedeEnviarResena(5, true);

    // Assert
    expect(resultado).toBe(false);
  });
});

describe("puedeGuardarJuego — alta de juego (admin)", () => {
  it("sin platform, el resultado es false", () => {
    // Act
    const resultado = puedeGuardarJuego({ title: "Celeste", category: "Plataformas", platform: "" });

    // Assert
    expect(resultado).toBe(false);
  });
});

describe("estrellasLlenas — StarRating", () => {
  // Borde: .5 redondea para arriba.
  it.each([
    [4.49, 4],
    [4.5, 5],
  ])("estrellasLlenas(%s) = %s", (promedio, esperado) => {
    // Act
    const resultado = estrellasLlenas(promedio);

    // Assert
    expect(resultado).toBe(esperado);
  });
});
