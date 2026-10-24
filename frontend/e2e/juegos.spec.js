// =============================================================================
// E2E — la app completa con un navegador real, contra el FRONT
// =============================================================================
// Cada flujo usa la app como una persona: busca los controles por su rol y su
// nombre visible (getByRole / getByLabel), como un lector de pantalla, nunca
// por clases CSS. El pedido recorre navegador → nginx → API → base, sin dobles.
// =============================================================================
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@gamerate.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

// Ingresa como admin desde la pantalla de acceso. Se busca dentro del
// formulario "Acceso" porque el encabezado también tiene un botón "Ingresar".
async function loginAdmin(page) {
  await page.goto("/acceso");
  const form = page.getByRole("form", { name: "Acceso" });
  await form.getByLabel("Email").fill(ADMIN_EMAIL);
  await form.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await form.getByRole("button", { name: "Ingresar" }).click();
  // El panel de admin sólo aparece si el login funcionó y el rol es admin.
  await expect(page.getByRole("heading", { name: "Agregar un juego" })).toBeVisible();
}

test("el admin agrega un juego, lo ve en el catálogo, lo borra y ya no está", async ({ page }) => {
  await loginAdmin(page);
  const titulo = `e2e ${Date.now()}`;

  // 1. Completa el formulario del panel de admin.
  await page.getByLabel("Título", { exact: true }).fill(titulo);
  await page.getByLabel("Categoría").fill("e2e");
  await page.getByLabel("Plataforma").fill("PC");
  await page.getByRole("button", { name: "Agregar juego" }).click();

  // 2. El juego aparece en la grilla del catálogo.
  const tarjeta = page.getByRole("heading", { name: titulo });
  await expect(tarjeta).toBeVisible();

  // 3. El borrado pide confirmación con confirm(): se acepta el diálogo.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: `Borrar ${titulo}` }).click();

  // 4. El juego ya no está.
  await expect(tarjeta).toHaveCount(0);
});

test("registrarse con un usuario que ya existe muestra el error y no crea la cuenta", async ({ page }) => {
  await page.goto("/acceso");
  await page.getByRole("button", { name: "No tengo cuenta, quiero crear una" }).click();

  // 1. "admin" ya existe (lo crea el seed); el email es nuevo.
  const email = `e2e-${Date.now()}@test.local`;
  const password = "e2e-123456";
  await page.getByLabel("Nombre de usuario").fill("admin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  // 2. La API responde 409 y el front lo muestra.
  await expect(page.getByRole("alert")).toContainText("ya existe");

  // 3. Prueba de que la cuenta NO se creó: ingresar con ese email falla.
  await page.getByRole("button", { name: "Ya tengo cuenta" }).click();
  const form = page.getByRole("form", { name: "Acceso" });
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill(password);
  await form.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("alert")).toContainText("Credenciales inválidas");
});

test("buscar por título muestra sólo ese juego", async ({ page }) => {
  // El uso diario: toca la base y no crea nada.
  await page.goto("/");
  await page.getByRole("searchbox").fill("Celeste");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page.getByRole("heading", { name: "Celeste" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hollow Knight" })).toHaveCount(0);
});
