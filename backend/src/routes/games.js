// ============================================================================
// RUTAS DEL CATÁLOGO:  /api/games
// ============================================================================
// Lectura: pública (cualquiera puede ver el catálogo).
// Escritura: sólo admin (ver REGLA 5, aplicada con el middleware requireAdmin).
//
// GET / y GET /categories quedan como pegamento liviano: ninguna de las dos
// tiene una regla de negocio (ni validación, ni decisión) — sólo arman una
// consulta con el filtro que llega por query string. El resto sí delega en
// src/servicios/juegos.js.
// ============================================================================

const express = require("express");
const { pool } = require("../db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { crearJuego, obtenerJuego, borrarJuego } = require("../servicios/juegos");

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
    const { status, body } = await obtenerJuego(pool, req.params.id);
    res.status(status).json(body);
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
  try {
    const { status, body } = await crearJuego(pool, req.body, req.user);
    res.status(status).json(body);
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
    const { status, body } = await borrarJuego(pool, req.params.id);
    if (status === 204) return res.status(204).end();
    res.status(status).json(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al borrar el juego" });
  }
});

module.exports = router;
