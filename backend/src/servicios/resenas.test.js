import { describe, it, expect, vi } from "vitest";
import { borrarResena } from "./resenas.js";

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
});
