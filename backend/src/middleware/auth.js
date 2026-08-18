// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================================================
// Un "middleware" en Express es una función que se ejecuta ANTES del handler
// de la ruta. Puede cortar el pedido (respondiendo un error) o dejarlo pasar
// llamando a next().
//
// Acá hay dos, y hacen cosas distintas:
//   - authenticate  → ¿QUIÉN sos?     (autenticación)
//   - requireAdmin  → ¿PODÉS hacerlo? (autorización)
// ============================================================================

const jwt = require("jsonwebtoken");

// ---------------------------------------------------------------------------
// authenticate: verifica el token JWT que manda el frontend.
//
// El frontend envía el header:  Authorization: Bearer <token>
// Si el token es válido, guardamos sus datos en req.user para que las rutas
// que vienen después sepan quién está haciendo el pedido.
// ---------------------------------------------------------------------------
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Falta el token de autenticación" });
  }

  try {
    // jwt.verify falla si el token fue modificado o si ya venció.
    // JWT_SECRET viene del .env — si cambia, todos los tokens emitidos
    // antes dejan de valer.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o vencido" });
  }
}

// ---------------------------------------------------------------------------
// requireAdmin: se usa SIEMPRE después de authenticate.
//
// REGLA DE NEGOCIO 5: sólo un admin puede crear o borrar juegos del catálogo.
//
// Ojo con la diferencia de códigos HTTP:
//   401 = "no sé quién sos"      (lo devuelve authenticate)
//   403 = "sé quién sos, pero no tenés permiso"  (lo devuelve esto)
// ---------------------------------------------------------------------------
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Requiere rol admin" });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
