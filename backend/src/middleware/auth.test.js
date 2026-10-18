import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import { authenticate, requireAdmin } from "./auth.js";

describe("requireAdmin — REGLA 5 (sólo admin)", () => {
  it("con rol user, responde 403 y no llama a next", () => {
    // Arrange
    const req = { user: { role: "user" } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();

    // Act
    requireAdmin(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // Mock que verifica la interacción: con rol admin, next() se llama UNA
  // sola vez — es la forma en que un middleware de Express "deja pasar".
  it("con rol admin, llama a next una sola vez", () => {
    // Arrange
    const req = { user: { role: "admin" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    const next = vi.fn();

    // Act
    requireAdmin(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("authenticate", () => {
  it("sin header Authorization, responde 401", () => {
    // Arrange
    const req = { headers: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    const next = vi.fn();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // Ejercicio del camino sin cubrir (ver decisiones.md): ningún test mandaba
  // un token PRESENTE — ni inválido ni válido. Éste cubre el inválido.
  it("con un token presente pero inválido, responde 401", () => {
    // Arrange
    const req = { headers: { authorization: "Bearer esto-no-es-un-jwt-valido" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    const next = vi.fn();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("con un token válido, llama a next una sola vez y completa req.user", () => {
    // Arrange
    process.env.JWT_SECRET = "secreto-de-test";
    const token = jwt.sign({ id: 1, username: "user1", role: "user" }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    const next = vi.fn();

    // Act
    authenticate(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.username).toBe("user1");
  });
});
