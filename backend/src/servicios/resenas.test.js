import { describe, it, expect, vi } from "vitest";
import { crearOActualizarResena, borrarResena } from "./resenas.js";

describe("crearOActualizarResena", () => {
  it("con rating inválido, no llega a tocar la base", async () => {
    // Arrange
    const dbFalsa = { query: vi.fn() };

    // Act
    const resultado = await crearOActualizarResena(dbFalsa, 1, { id: 1 }, { rating: 7 });

    // Assert
    expect(resultado.status).toBe(400);
    expect(dbFalsa.query).not.toHaveBeenCalled();
  });

  // Mock: si el game_id no corresponde a ningún juego, la base rechaza con
  // 23503 (foreign_key_violation) y el servicio lo traduce a 404.
  it("si el juego no existe (23503), responde 404", async () => {
    // Arrange
    const dbFalsa = { query: vi.fn().mockRejectedValue({ code: "23503" }) };

    // Act
    const resultado = await crearOActualizarResena(dbFalsa, 9999, { id: 1 }, { rating: 4 });

    // Assert
    expect(resultado.status).toBe(404);
  });

  it("con un rating válido, inserta y devuelve la reseña creada", async () => {
    // Arrange
    const resenaCreada = { id: 1, game_id: 1, user_id: 1, rating: 4, comment: "Buenísimo" };
    const dbFalsa = { query: vi.fn().mockResolvedValue({ rows: [resenaCreada] }) };

    // Act
    const resultado = await crearOActualizarResena(dbFalsa, 1, { id: 1 }, { rating: 4, comment: "Buenísimo" });

    // Assert
    expect(resultado.status).toBe(201);
    expect(resultado.body).toEqual(resenaCreada);
  });
});

describe("borrarResena — REGLA 6 (dueño o admin)", () => {
  // Mock que verifica la INTERACCIÓN, no un valor de retorno: con una reseña
  // ajena, db.query tiene que haberse llamado UNA sola vez (el SELECT que
  // trae la reseña) y nunca el DELETE. Si alguien rompiera la regla y
  // borrara igual, este test lo detecta aunque el status siga dando 403.
  it("con una reseña ajena, responde 403 y no llama a db.query una segunda vez", async () => {
    // Arrange
    const resenaAjena = { id: 10, user_id: 99 };
    const dbFalsa = {
      query: vi.fn().mockResolvedValue({ rows: [resenaAjena] }),
    };
    const usuarioQueIntentaBorrar = { id: 1, role: "user" };

    // Act
    const resultado = await borrarResena(dbFalsa, 10, usuarioQueIntentaBorrar);

    // Assert
    expect(resultado.status).toBe(403);
    expect(dbFalsa.query).toHaveBeenCalledTimes(1); // nunca llegó al DELETE
  });

  it("con la reseña propia, borra de verdad: responde 204 y llama a db.query dos veces", async () => {
    // Arrange
    const resenaPropia = { id: 10, user_id: 1 };
    const dbFalsa = { query: vi.fn().mockResolvedValue({ rows: [resenaPropia] }) };

    // Act
    const resultado = await borrarResena(dbFalsa, 10, { id: 1, role: "user" });

    // Assert
    expect(resultado.status).toBe(204);
    expect(dbFalsa.query).toHaveBeenCalledTimes(2); // el SELECT y el DELETE
  });
});
