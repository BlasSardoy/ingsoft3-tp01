// ============================================================================
// SERVICIO DE JUEGOS — alta, detalle y baja.
// ============================================================================
// Mismo criterio que usuarios.js y resenas.js. listGames y listCategories
// quedan en la ruta: son lectura simple sin ninguna regla de negocio (ni
// validación, ni decisión), así que no hay nada ahí que amerite su propia
// función ni su propio test.
// ============================================================================

const { validarJuego } = require("../reglas");

// ---------------------------------------------------------------------------
// crearJuego — REGLA obligatorios (title, category y platform). REGLA 5
// (sólo admin) se aplica antes de llegar acá, con el middleware
// requireAdmin: no se repite el chequeo de rol en el servicio.
// ---------------------------------------------------------------------------
async function crearJuego(db, datos = {}, user) {
  const { title, category, platform, description = "" } = datos;

  const validacion = validarJuego({ title, category, platform });
  if (!validacion.ok) {
    return { status: 400, body: { error: validacion.error } };
  }

  const { rows } = await db.query(
    `INSERT INTO games (title, category, platform, description, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, category, platform, description, user.id]
  );

  return { status: 201, body: rows[0] };
}

// ---------------------------------------------------------------------------
// obtenerJuego — 404 si no existe. Trae también sus reseñas.
// ---------------------------------------------------------------------------
async function obtenerJuego(db, id) {
  const { rows: gameRows } = await db.query(
    `SELECT g.*,
            COALESCE(AVG(r.rating), 0)::numeric(3,2) AS avg_rating,
            COUNT(r.id)::int                          AS review_count
     FROM games g
     LEFT JOIN reviews r ON r.game_id = g.id
     WHERE g.id = $1
     GROUP BY g.id`,
    [id]
  );

  const game = gameRows[0];
  if (!game) {
    return { status: 404, body: { error: "Juego no encontrado" } };
  }

  const { rows: reviews } = await db.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.username
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.game_id = $1
     ORDER BY r.created_at DESC`,
    [id]
  );

  return { status: 200, body: { ...game, reviews } };
}

// ---------------------------------------------------------------------------
// borrarJuego — REGLA 5 (sólo admin, aplicada antes con requireAdmin). Sus
// reseñas se borran solas: ON DELETE CASCADE en reviews (ver db.js).
// ---------------------------------------------------------------------------
async function borrarJuego(db, id) {
  const { rowCount } = await db.query("DELETE FROM games WHERE id = $1", [id]);
  if (!rowCount) {
    return { status: 404, body: { error: "Juego no encontrado" } };
  }
  return { status: 204, body: null };
}

module.exports = { crearJuego, obtenerJuego, borrarJuego };
