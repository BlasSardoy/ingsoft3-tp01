import { describe, it, expect, vi } from "vitest";
import { request } from "./api.js";

describe("request — cliente HTTP", () => {
  // Mock + caso de error: un fetch falso que responde 409, sin tocar la
  // red. El test verifica que request() convierta ese error de la API en
  // una excepción con el mismo mensaje — es lo que cada pantalla atrapa
  // con try/catch.
  it("si la API responde 409 con un error, request lanza ese mensaje", async () => {
    // Arrange
    const fetchFalso = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Ese usuario o email ya existe" }),
    });

    // Act + Assert
    await expect(
      request("/auth/register", {
        method: "POST",
        body: { username: "x" },
        fetchFn: fetchFalso,
      })
    ).rejects.toThrow("Ese usuario o email ya existe");
  });

  // Mock que verifica la interacción: con token, el fetch falso tiene que
  // recibir el header Authorization con el formato que espera el backend.
  it("con token, el fetch recibe el header Authorization: Bearer <token>", async () => {
    // Arrange
    const fetchFalso = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    // Act
    await request("/games", { token: "abc123", fetchFn: fetchFalso });

    // Assert
    const [, opciones] = fetchFalso.mock.calls[0];
    expect(opciones.headers.Authorization).toBe("Bearer abc123");
  });
});
