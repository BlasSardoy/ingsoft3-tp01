import { describe, it, expect, vi } from "vitest";
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
});
