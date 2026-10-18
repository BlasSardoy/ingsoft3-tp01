import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import { registrarUsuario, iniciarSesion } from "./usuarios.js";

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

  it("con datos válidos, inserta y devuelve un token", async () => {
    // Arrange
    process.env.JWT_SECRET = "secreto-de-test";
    const usuarioCreado = { id: 1, username: "user1", email: "user1@test.com", role: "user" };
    const dbFalsa = { query: vi.fn().mockResolvedValue({ rows: [usuarioCreado] }) };

    // Act
    const resultado = await registrarUsuario(dbFalsa, {
      username: "user1",
      email: "user1@test.com",
      password: "123456",
    });

    // Assert
    expect(resultado.status).toBe(201);
    expect(resultado.body.user).toEqual(usuarioCreado);
    expect(typeof resultado.body.token).toBe("string");
  });
});

describe("iniciarSesion", () => {
  it("si el email no existe, responde 401 con un mensaje genérico", async () => {
    // Arrange
    const dbFalsa = { query: vi.fn().mockResolvedValue({ rows: [] }) };

    // Act
    const resultado = await iniciarSesion(dbFalsa, {
      email: "nadie@test.com",
      password: "cualquiera",
    });

    // Assert
    expect(resultado.status).toBe(401);
    expect(resultado.body.error).toBe("Credenciales inválidas");
  });

  it("sin password, responde 400 sin llegar a consultar la base", async () => {
    // Arrange
    const dbFalsa = { query: vi.fn() };

    // Act
    const resultado = await iniciarSesion(dbFalsa, { email: "user1@test.com" });

    // Assert
    expect(resultado.status).toBe(400);
    expect(dbFalsa.query).not.toHaveBeenCalled();
  });

  it("con la contraseña mal, responde 401 (mismo mensaje que usuario inexistente)", async () => {
    // Arrange
    process.env.JWT_SECRET = "secreto-de-test";
    const hash = await bcrypt.hash("laCorrecta", 10);
    const dbFalsa = {
      query: vi.fn().mockResolvedValue({ rows: [{ id: 1, password_hash: hash, role: "user" }] }),
    };

    // Act
    const resultado = await iniciarSesion(dbFalsa, { email: "user1@test.com", password: "laIncorrecta" });

    // Assert
    expect(resultado.status).toBe(401);
    expect(resultado.body.error).toBe("Credenciales inválidas");
  });

  it("con email y contraseña correctos, responde 200 con un token", async () => {
    // Arrange
    process.env.JWT_SECRET = "secreto-de-test";
    const hash = await bcrypt.hash("laCorrecta", 10);
    const dbFalsa = {
      query: vi.fn().mockResolvedValue({
        rows: [{ id: 1, username: "user1", email: "user1@test.com", password_hash: hash, role: "user" }],
      }),
    };

    // Act
    const resultado = await iniciarSesion(dbFalsa, { email: "user1@test.com", password: "laCorrecta" });

    // Assert
    expect(resultado.status).toBe(200);
    expect(typeof resultado.body.token).toBe("string");
  });
});
