// ============================================================================
// REGLAS DE NEGOCIO — funciones puras, sin tocar la base ni Express.
// ============================================================================
// No reciben pool ni req/res: reciben datos, devuelven un resultado
// ({ ok: true } o { ok: false, error }). Eso es lo que las hace testeables
// sin levantar un servidor ni una base de datos.
// ============================================================================

// ---------------------------------------------------------------------------
// REGLA 1: username, email y password son obligatorios, y la contraseña
// tiene que tener al menos 6 caracteres.
// ---------------------------------------------------------------------------
function validarRegistro({ username, email, password } = {}) {
  if (!username || !email || !password) {
    return { ok: false, error: "username, email y password son obligatorios" };
  }
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// REGLA 2: el puntaje de una reseña va de 1 a 5.
//
// Number.isInteger en vez de un chequeo laxo: "abc" y 2.5 pasaban la
// validación anterior (!rating || rating < 1 || rating > 5) y recién la
// base los rechazaba al convertir a SMALLINT, así que la API respondía 500
// en vez de 400. Coverage alto no había detectado el agujero: la línea
// estaba 100% cubierta y la regla igual dejaba pasar valores inválidos.
// ---------------------------------------------------------------------------
function validarRating(rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "rating debe ser un número entero entre 1 y 5" };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// REGLA obligatorios del juego: title, category y platform son obligatorios.
// ---------------------------------------------------------------------------
function validarJuego({ title, category, platform } = {}) {
  if (!title || !category || !platform) {
    return { ok: false, error: "title, category y platform son obligatorios" };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// REGLA 6: sólo el dueño de una reseña (o un admin) puede borrarla.
// ---------------------------------------------------------------------------
function puedeBorrarResena(review, user) {
  return review.user_id === user.id || user.role === "admin";
}

module.exports = { validarRegistro, validarRating, validarJuego, puedeBorrarResena };
