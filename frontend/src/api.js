// ============================================================================
// CLIENTE HTTP — el único lugar del frontend que sabe hablar con la API
// ============================================================================
// Todas las llamadas pasan por acá. Si mañana cambia la forma de autenticar o
// de manejar errores, se toca UN archivo.
// ============================================================================

// ---------------------------------------------------------------------------
// ⚠️ ESTO ES CLAVE PARA EL TP — "el caso trampa de la SPA".
//
// La URL base es "/api": una ruta RELATIVA, sin host ni puerto.
//
// ¿Por qué no "http://backend:8080"? Porque este código corre en el NAVEGADOR
// del usuario, que está FUERA de la red de docker compose. El nombre "backend"
// no existe para el navegador: sólo lo resuelven los contenedores entre sí.
//
// Con ruta relativa, el pedido va al mismo origen desde el que se sirvió la
// página, y quien lo reenvía al backend es:
//   - en desarrollo: el servidor de Vite (ver vite.config.js)
//   - en producción: nginx dentro del contenedor (ver nginx.conf)
//
// Ventaja extra: como todo sale del mismo origen, NO hace falta configurar
// CORS. Y la misma imagen del frontend sirve en cualquier entorno, porque no
// tiene ninguna dirección escrita adentro.
// ---------------------------------------------------------------------------
const BASE = "/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };

  // Si hay token, va en el header que espera el middleware authenticate.
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 = "salió bien, sin contenido" (los DELETE). No hay JSON que parsear.
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  // Convertimos el error de la API en una excepción, así cada pantalla la
  // atrapa con try/catch y muestra el mensaje.
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

  return data;
}

export const api = {
  // --- autenticación ---
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  // --- catálogo ---
  listGames: (params = {}) => {
    // Convierte { q: "celeste" } en "?q=celeste" (y escapa lo que haga falta)
    const qs = new URLSearchParams(params).toString();
    return request(`/games${qs ? `?${qs}` : ""}`);
  },
  listCategories: () => request("/games/categories"),
  getGame: (id) => request(`/games/${id}`),
  createGame: (payload, token) => request("/games", { method: "POST", body: payload, token }),
  deleteGame: (id, token) => request(`/games/${id}`, { method: "DELETE", token }),

  // --- reseñas ---
  upsertReview: (gameId, payload, token) =>
    request(`/games/${gameId}/reviews`, { method: "POST", body: payload, token }),
  deleteReview: (id, token) => request(`/reviews/${id}`, { method: "DELETE", token }),
};
