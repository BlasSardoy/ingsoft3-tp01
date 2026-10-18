// ============================================================================
// SERVICIO DE USUARIOS — registro e inicio de sesión.
// ============================================================================
// Reciben "db" (cualquier objeto con un método .query) por parámetro: no
// importan pool directamente. Así, en el test, el doble entra por acá — y en
// la app real, routes/auth.js les pasa el pool de verdad.
//
// Devuelven { status, body }: el handler de la ruta sólo traduce eso a
// res.status(status).json(body). El comportamiento HTTP no cambia.
// ============================================================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validarRegistro } = require("../reglas");

// Arma el token que el frontend va a guardar y reenviar en cada pedido.
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ---------------------------------------------------------------------------
// registrarUsuario — REGLA 1 (campos obligatorios + contraseña ≥ 6) y
// REGLA 3 (usuario/email único, vía el 23505 que tira la restricción UNIQUE
// de la base: no se chequea con un SELECT previo para evitar una condición
// de carrera).
// ---------------------------------------------------------------------------
async function registrarUsuario(db, datos = {}) {
  const { username, email, password } = datos;

  const validacion = validarRegistro({ username, email, password });
  if (!validacion.ok) {
    return { status: 400, body: { error: validacion.error } };
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, username, email, role`,
      [username, email, hash]
    );

    const user = rows[0];
    return { status: 201, body: { token: signToken(user), user } };
  } catch (err) {
    if (err.code === "23505") {
      return { status: 409, body: { error: "Ese usuario o email ya existe" } };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// iniciarSesion — usuario inexistente y contraseña incorrecta devuelven el
// MISMO 401 "Credenciales inválidas": si dijéramos "ese email no existe" le
// confirmaríamos a un atacante qué cuentas hay registradas.
// ---------------------------------------------------------------------------
async function iniciarSesion(db, datos = {}) {
  const { email, password } = datos;

  if (!email || !password) {
    return { status: 400, body: { error: "email y password son obligatorios" } };
  }

  const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];

  if (!user) {
    return { status: 401, body: { error: "Credenciales inválidas" } };
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return { status: 401, body: { error: "Credenciales inválidas" } };
  }

  // Nunca devolvemos password_hash al frontend.
  const publicUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return { status: 200, body: { token: signToken(publicUser), user: publicUser } };
}

module.exports = { registrarUsuario, iniciarSesion };
