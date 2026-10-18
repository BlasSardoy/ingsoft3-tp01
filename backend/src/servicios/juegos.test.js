import { describe, it, expect, vi } from "vitest";
import { crearJuego, obtenerJuego, borrarJuego } from "./juegos.js";

describe("crearJuego", () => {
  it("sin platform, no llega a tocar la base", async () => {
    // Arrange
    const dbFalsa = { query: vi.fn() };

    // Act
    const resultado = await crearJuego(dbFalsa, { title: "Celeste", category: "Plataformas" }, { id: 1 });

    // Assert
    expect(resultado.status).toBe(400);
    expect(dbFalsa.query).not.toHaveBeenCalled();
  });

  it("con los campos completos, inserta y devuelve el juego creado", async () => {
    // Arrange
    const juegoCreado = { id: 5, title: "Celeste" };
    const dbFalsa = { query: vi.fn().mockResolvedValue({ rows: [juegoCreado] }) };

    // Act
    const resultado = await crearJuego(
      dbFalsa,
      { title: "Celeste", category: "Plataformas", platform: "PC" },
      { id: 1 }
    );

    // Assert
    expect(resultado.status).toBe(201);
    expect(resultado.body).toEqual(juegoCreado);
  });
});

describe("obtenerJuego", () => {
  it("si el juego no existe, responde 404", async () => {
    // Arrange
    const dbFalsa = { query: vi.fn().mockResolvedValue({ rows: [] }) };

    // Act
    const resultado = await obtenerJuego(dbFalsa, 9999);

    // Assert
    expect(resultado.status).toBe(404);
  });
});

describe("borrarJuego", () => {
  it("si el juego no existe, responde 404", async () => {
    // Arrange
    const dbFalsa = { query: vi.fn().mockResolvedValue({ rowCount: 0 }) };

    // Act
    const resultado = await borrarJuego(dbFalsa, 9999);

    // Assert
    expect(resultado.status).toBe(404);
  });
});
