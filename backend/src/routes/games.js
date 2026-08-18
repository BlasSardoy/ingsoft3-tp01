// ============================================================================
// RUTAS DEL CATÁLOGO:  /api/games
// ============================================================================
// Lectura: pública (cualquiera puede ver el catálogo).
// Escritura: sólo admin (ver REGLA 5, aplicada con el middleware requireAdmin).
// ============================================================================

const express = require("express");
const { pool } = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /api/games?q=&category=
// Lista de juegos con su promedio de puntaje y cantidad de reseñas.
//
// El filtrado se hace EN EL SERVIDOR (no en el navegador): el buscador del
// frontend manda q y category, y esta consulta devuelve sólo lo que coincide.
// ---------------------------------------------------------------------------
router.get("/", async (req, res) => {
  const { q = "", category = "" } = req.query;

  try {
    const { rows } = await pool.query(
      `SELECT g.*,
              COALESCE(AVG(r.rating), 0)::numeric(3,2) AS avg_rating,
              COUNT(r.id)::int                          AS review_count
       FROM games g
       LEFT JOIN reviews r ON r.game_id = g.id
       -- LEFT JOIN (y no JOIN a secas) para que los juegos SIN reseñas
       -- también aparezcan en la lista, con promedio 0.
       WHERE ($1 = '' OR g.title ILIKE '%' || $1 || '%')
         AND ($2 = '' OR g.category = $2)
       -- Si el parámetro viene vacío, esa condición se cumple siempre:
       -- así una sola consulta sirve para "todos" y para "filtrados".
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [q, category]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar juegos" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/games/categories
// Categorías existentes, para llenar el desplegable del buscador.
//
// ⚠️ Tiene que estar declarada ANTES de GET /:id. Express evalúa las rutas en
// orden, y "/:id" también matchearía con "/categories" (tomando "categories"
// como si fuera un id).
// ---------------------------------------------------------------------------
router.get("/categories", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT DISTINCT category FROM games ORDER BY category"
    );
    res.json(rows.map((r) => r.category));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar categorías" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/games/:id
// Detalle de un juego + todas sus reseñas (con el nombre de quien la escribió).
// ---------------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const { rows: gameRows } = await pool.query(
      `SELECT g.*,
              COALESCE(AVG(r.rating), 0)::numeric(3,2) AS avg_rating,
              COUNT(r.id)::int                          AS review_count
       FROM games g
       LEFT JOIN reviews r ON r.game_id = g.id
       WHERE g.id = $1
       GROUP BY g.id`,
      [req.params.id]
    );

    const game = gameRows[0];
    if (!game) return res.status(404).json({ error: "Juego no encontrado" });

    const { rows: reviews } = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.username
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.game_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    res.json({ ...game, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el juego" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/games — alta de un juego
//
// REGLA DE NEGOCIO 5: sólo un admin puede crear juegos.
// Se aplica encadenando dos middlewares antes del handler:
//   authenticate  → confirma que hay un token válido y llena req.user
//   requireAdmin  → corta con 403 si req.user.role !== 'admin'
// ---------------------------------------------------------------------------
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { title, category, platform, description = "" } = req.body;

  if (!title || !category || !platform) {
    return res
      .status(400)
      .json({ error: "title, category y platform son obligatorios" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO games (title, category, platform, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, category, platform, description, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear el juego" });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/games/:id — baja de un juego (REGLA 5, también sólo admin)
//
// Al borrar un juego, sus reseñas se borran solas: la tabla reviews declara
// ON DELETE CASCADE sobre game_id (ver db.js).
// ---------------------------------------------------------------------------
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM games WHERE id = $1", [
      req.params.id,
    ]);
    if (!rowCount) return res.status(404).json({ error: "Juego no encontrado" });

    // 204 = "salió bien y no hay nada que devolver".
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al borrar el juego" });
  }
});

module.exports = router;
