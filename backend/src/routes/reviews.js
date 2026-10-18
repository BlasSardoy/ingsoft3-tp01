// ============================================================================
// RUTAS DE RESEÑAS
//   POST   /api/games/:id/reviews   → dejar (o actualizar) mi reseña
//   DELETE /api/reviews/:id         → borrar una reseña
// ============================================================================
// Las dos exigen estar logueado: llevan el middleware authenticate.
// Pegamento HTTP — la lógica vive en src/servicios/resenas.js.
// ============================================================================

const express = require("express");
const { pool } = require("../db");
const { authenticate } = require("../middleware/auth");
const { crearOActualizarResena, borrarResena } = require("../servicios/resenas");

const router = express.Router();

router.post("/games/:id/reviews", authenticate, async (req, res) => {
  try {
    const { status, body } = await crearOActualizarResena(
      pool,
      req.params.id,
      req.user,
      req.body
    );
    res.status(status).json(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar la reseña" });
  }
});

router.delete("/reviews/:id", authenticate, async (req, res) => {
  try {
    const { status, body } = await borrarResena(pool, req.params.id, req.user);
    if (status === 204) return res.status(204).end();
    res.status(status).json(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al borrar la reseña" });
  }
});

module.exports = router;
