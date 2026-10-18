import { describe, it, expect, vi } from "vitest";
import { registrarUsuario } from "./usuarios.js";

describe("registrarUsuario — REGLA 3 (usuario/email único)", () => {
  // Mock: no probamos contra una base real — le damos a registrarUsuario un
  // "db" falso cuyo .query rechaza con el mismo código (23505) que tira
  // PostgreSQL ante la restricción UNIQUE, y verificamos que el servicio lo
  // traduzca al 409 que entiende el frontend.
  it("si la base rechaza por email duplicado (23505), responde 409", async () => {
    // Arrange
    const dbFalsa = {
      query: vi.fn().mockRejectedValue({ code: "23505" }),
    };

    // Act
    const resultado = await registrarUsuario(dbFalsa, {
      username: "user1",
      email: "repetido@test.com",
      password: "123456",
    });

    // Assert
    expect(resultado.status).toBe(409);
    expect(resultado.body.error).toContain("ya existe");
  });
});
