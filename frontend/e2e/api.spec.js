// =============================================================================
// INTEGRACIÓN — la API contra su base de datos REAL
// =============================================================================
// Usa el fixture `request` de Playwright: pedidos HTTP directos, SIN navegador
// y SIN dobles. Cada test pasa por Express, los servicios y PostgreSQL de
// verdad, así que prueba lo que ningún unitario con un `db` falso puede ver:
// que los datos se guarden, se borren y que la base aplique sus restricciones.
// =============================================================================
import { test, expect } from "@playwright/test";

// La API, no el front. Sin barra final: las rutas de abajo empiezan con /api.
const API = process.env.API_BASE_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@gamerate.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

// Ingresa como el admin que crea el seed y devuelve su token JWT.
async function loginAdmin(request) {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.token;
}

// Lista el catálogo tal como está en la base en este momento.
async function listar(request) {
  const res = await request.get(`${API}/api/games`);
  expect(res.status()).toBe(200);
  return res.json();
}

test("el alta de un juego se guarda en la base de verdad, y el borrado lo saca", async ({ request }) => {
  const token = await loginAdmin(request);
  const auth = { Authorization: `Bearer ${token}` };
  // Título único: el test no choca con datos de otra corrida ni del seed.
  const title = `api ${Date.now()}`;

  // 1. Alta: la API responde 201 con el juego creado (y su id de la base).
  const alta = await request.post(`${API}/api/games`, {
    headers: auth,
    data: { title, category: "e2e", platform: "PC" },
  });
  expect(alta.status()).toBe(201);
  const juego = await alta.json();

  // 2. El listado lo encuentra: quedó guardado, no sólo "respondió 201".
  expect((await listar(request)).some((g) => g.title === title)).toBe(true);

  // 3. Borrado: 204 sin cuerpo.
  const baja = await request.delete(`${API}/api/games/${juego.id}`, { headers: auth });
  expect(baja.status()).toBe(204);

  // 4. El listado ya no lo encuentra: el borrado llegó a la base.
  expect((await listar(request)).some((g) => g.title === title)).toBe(false);
});

test("un juego sin título lo rechaza la api, y no crea nada", async ({ request }) => {
  const token = await loginAdmin(request);

  // 1. Cuántos juegos hay antes del intento.
  const antes = (await listar(request)).length;

  // 2. Alta con título vacío (con token de admin, para que el 400 venga de la
  //    regla de campos obligatorios y no de los permisos).
  const res = await request.post(`${API}/api/games`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { title: "", category: "e2e", platform: "PC" },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toContain("obligatorios");

  // 3. Después hay la misma cantidad: el rechazo no dejó nada a medias.
  const despues = (await listar(request)).length;
  expect(despues).toBe(antes);
});

// REGLA 4: una reseña por usuario y juego. Esta regla vive en la base, en el
// UNIQUE(game_id, user_id) + el ON CONFLICT del INSERT de Postgres: ningún
// unitario con un `db` falso la puede ver, por eso quedó afuera en el TP5.
test("REGLA 4: reseñar dos veces el mismo juego deja UNA reseña, con el último puntaje", async ({ request }) => {
  const token = await loginAdmin(request);
  const auth = { Authorization: `Bearer ${token}` };

  // 1. Un juego propio, para no tocar las reseñas de los juegos del seed.
  const alta = await request.post(`${API}/api/games`, {
    headers: auth,
    data: { title: `regla4 ${Date.now()}`, category: "e2e", platform: "PC" },
  });
  expect(alta.status()).toBe(201);
  const juego = await alta.json();

  try {
    // 2. Primera reseña del admin sobre ese juego.
    const primera = await request.post(`${API}/api/games/${juego.id}/reviews`, {
      headers: auth,
      data: { rating: 2, comment: "primera" },
    });
    expect(primera.status()).toBe(201);

    // 3. Segunda reseña del MISMO usuario sobre el MISMO juego: el ON CONFLICT
    //    actualiza la existente en vez de insertar otra fila.
    const segunda = await request.post(`${API}/api/games/${juego.id}/reviews`, {
      headers: auth,
      data: { rating: 5, comment: "segunda" },
    });
    expect(segunda.status()).toBe(201);

    // 4. El detalle del juego trae exactamente UNA reseña, con el último puntaje.
    const detalle = await request.get(`${API}/api/games/${juego.id}`);
    expect(detalle.status()).toBe(200);
    const body = await detalle.json();
    expect(body.reviews).toHaveLength(1);
    expect(body.reviews[0].rating).toBe(5);
  } finally {
    // 5. Limpieza, pase lo que pase: borrar el juego (sus reseñas caen en
    //    cascada) y comprobar que ya no existe.
    const baja = await request.delete(`${API}/api/games/${juego.id}`, { headers: auth });
    expect(baja.status()).toBe(204);
    const despues = await request.get(`${API}/api/games/${juego.id}`);
    expect(despues.status()).toBe(404);
  }
});
