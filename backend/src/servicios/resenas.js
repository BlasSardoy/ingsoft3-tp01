// ============================================================================
// SERVICIO DE RESEÑAS — crear/actualizar y borrar.
// ============================================================================
// Mismo criterio que usuarios.js: reciben "db" por parámetro y devuelven
// { status, body }.
// ============================================================================

const { validarRating, puedeBorrarResena } = require("../reglas");

// ---------------------------------------------------------------------------
// crearOActualizarResena — REGLA 2 (rating 1 a 5) y REGLA 4 (como máximo
// una reseña por usuario y juego, con upsert sobre ON CONFLICT: volver a
// enviarla la actualiza en vez de duplicarla). R4 vive en la restricción
// UNIQUE de la base — es terreno de integración, no unitario — así que acá
// sólo se ve su efecto (el ON CONFLICT), no se vuelve a probar con un doble.
// ---------------------------------------------------------------------------
async function crearOActualizarResena(db, gameId, user, datos = {}) {
  const { rating, comment = "" } = datos;

  const validacion = validarRating(rating);
  if (!validacion.ok) {
    return { status: 400, body: { error: validacion.error } };
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO reviews (game_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (game_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
       RETURNING *`,
      [gameId, user.id, rating, comment]
    );

    return { status: 201, body: rows[0] };
  } catch (err) {
    // 23503 = foreign_key_violation: el game_id no corresponde a ningún juego.
    if (err.code === "23503") {
      return { status: 404, body: { error: "El juego no existe" } };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// borrarResena — REGLA 6: sólo el dueño de una reseña (o un admin) puede
// borrarla. La autorización depende del DATO concreto (¿esta reseña es
// tuya?), así que hay que traerla de la base primero y recién ahí decidir
// — por eso no alcanza con un middleware como requireAdmin.
// ---------------------------------------------------------------------------
async function borrarResena(db, id, user) {
  const { rows } = await db.query("SELECT * FROM reviews WHERE id = $1", [id]);
  const review = rows[0];

  if (!review) {
    return { status: 404, body: { error: "Reseña no encontrada" } };
  }

  if (!puedeBorrarResena(review, user)) {
    return { status: 403, body: { error: "No podés borrar la reseña de otro usuario" } };
  }

  await db.query("DELETE FROM reviews WHERE id = $1", [id]);
  return { status: 204, body: null };
}

module.exports = { crearOActualizarResena, borrarResena };
