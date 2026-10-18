// ============================================================================
// RUTAS DE RESEÑAS
//   POST   /api/games/:id/reviews   → dejar (o actualizar) mi reseña
//   DELETE /api/reviews/:id         → borrar una reseña
// ============================================================================
// Las dos exigen estar logueado: llevan el middleware authenticate.
// ============================================================================

const express = require("express");
const { pool } = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// ---------------------------------------------------------------------------
// POST /api/games/:id/reviews
//
// REGLA DE NEGOCIO 2: el puntaje va de 1 a 5.
// REGLA DE NEGOCIO 4: un usuario tiene COMO MÁXIMO UNA reseña por juego —
//                     volver a enviarla la ACTUALIZA, no la duplica.
// ---------------------------------------------------------------------------
router.post("/games/:id/reviews", authenticate, async (req, res) => {
  const { rating, comment = "" } = req.body;
  const gameId = req.params.id;

  // REGLA 2 — validada acá y ADEMÁS en la base (CHECK rating BETWEEN 1 AND 5).
  // La doble verificación es a propósito: la de acá da un mensaje claro,
  // la de la base garantiza que ningún dato malo entre por otro camino.
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating debe estar entre 1 y 5" });
  }

  try {
    // -----------------------------------------------------------------------
    // REGLA 4, implementada con "upsert":
    //
    // Intenta insertar. Si choca con la restricción UNIQUE (game_id, user_id)
    // que declaramos en db.js, en vez de fallar ACTUALIZA la fila existente.
    //
    // EXCLUDED es la fila que se intentó insertar. O sea: "poné el rating y el
    // comentario nuevos sobre la reseña que este usuario ya tenía".
    //
    // Hacerlo en UNA sola consulta evita la condición de carrera de
    // "primero busco si existe, después inserto o actualizo".
    // -----------------------------------------------------------------------
    const { rows } = await pool.query(
      `INSERT INTO reviews (game_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (game_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
       RETURNING *`,
      [gameId, req.user.id, rating, comment]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    // 23503 = foreign_key_violation: el game_id no corresponde a ningún juego.
    if (err.code === "23503") {
      return res.status(404).json({ error: "El juego no existe" });
    }
    console.error(err);
    res.status(500).json({ error: "Error al guardar la reseña" });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/reviews/:id
//
// REGLA DE NEGOCIO 6: sólo el dueño de una reseña (o un admin) puede borrarla.
// Un usuario no puede borrar la reseña de otro.
//
// Fijate que esto NO se puede resolver con requireAdmin: la autorización
// depende del DATO concreto (¿esta reseña es tuya?), así que hay que traerla
// de la base primero y recién ahí decidir.
// ---------------------------------------------------------------------------
router.delete("/reviews/:id", authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM reviews WHERE id = $1", [
      req.params.id,
    ]);
    const review = rows[0];

    if (!review) return res.status(404).json({ error: "Reseña no encontrada" });

    // La comprobación de la REGLA 6:
    if (review.user_id !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "No podés borrar la reseña de otro usuario" });
    }

    await pool.query("DELETE FROM reviews WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al borrar la reseña" });
  }
});

module.exports = router;
