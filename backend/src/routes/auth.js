// ============================================================================
// RUTAS DE AUTENTICACIÓN:  POST /api/auth/register  y  POST /api/auth/login
// ============================================================================
// Pegamento HTTP: llaman al servicio pasándole el pool real y traducen
// { status, body } a res.status(...).json(...). Las reglas y el acceso a
// la base viven en src/servicios/usuarios.js, no acá.
// ============================================================================

const express = require("express");
const { pool } = require("../db");
const { registrarUsuario, iniciarSesion } = require("../servicios/usuarios");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { status, body } = await registrarUsuario(pool, req.body);
    res.status(status).json(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno al registrar" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { status, body } = await iniciarSesion(pool, req.body);
    res.status(status).json(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno al iniciar sesión" });
  }
});

module.exports = router;
