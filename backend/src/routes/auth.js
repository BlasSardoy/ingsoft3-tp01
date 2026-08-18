// ============================================================================
// RUTAS DE AUTENTICACIÓN:  POST /api/auth/register  y  POST /api/auth/login
// ============================================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const router = express.Router();

// Arma el token que el frontend va a guardar y reenviar en cada pedido.
// Adentro viaja el id, el nombre y el ROL — por eso el backend puede saber
// si sos admin sin volver a consultar la base en cada request.
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ---------------------------------------------------------------------------
// POST /api/auth/register — alta de un usuario nuevo (siempre con rol 'user')
// ---------------------------------------------------------------------------
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "username, email y password son obligatorios" });
  }

  // -------------------------------------------------------------------------
  // REGLA DE NEGOCIO 1: la contraseña debe tener al menos 6 caracteres.
  // -------------------------------------------------------------------------
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    // Nótese el uso de $1, $2, $3 en vez de concatenar strings:
    // son "consultas parametrizadas", la defensa estándar contra SQL injection.
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, username, email, role`,
      [username, email, hash]
    );

    const user = rows[0];
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    // -----------------------------------------------------------------------
    // REGLA DE NEGOCIO 3: username y email son únicos.
    //
    // No la chequeamos con un SELECT previo (eso tendría una condición de
    // carrera): dejamos que la restricción UNIQUE de la base la haga cumplir
    // y traducimos su error a un mensaje entendible.
    // 23505 es el código de PostgreSQL para "unique_violation".
    // -----------------------------------------------------------------------
    if (err.code === "23505") {
      return res.status(409).json({ error: "Ese usuario o email ya existe" });
    }
    console.error(err);
    res.status(500).json({ error: "Error interno al registrar" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email y password son obligatorios" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = rows[0];

    // Devolvemos el MISMO mensaje si el usuario no existe o si la contraseña
    // está mal. Si dijéramos "ese email no existe", le estaríamos confirmando
    // a un atacante qué cuentas hay registradas.
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Nunca devolvemos password_hash al frontend.
    const publicUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    res.json({ token: signToken(publicUser), user: publicUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno al iniciar sesión" });
  }
});

module.exports = router;
