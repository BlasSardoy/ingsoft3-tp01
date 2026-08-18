// ============================================================================
// CONEXIÓN A POSTGRESQL + CREACIÓN DEL ESQUEMA
// ============================================================================
// Este archivo hace dos cosas:
//   1. Abre el pool de conexiones contra PostgreSQL.
//   2. Crea las tablas si todavía no existen (ensureSchema).
// ============================================================================

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------------------------------------------------------------------------
// ESQUEMA DE LA BASE
//
// Tres tablas: usuarios, juegos y reseñas.
// Varias REGLAS DE NEGOCIO viven acá abajo, como restricciones de la base —
// no sólo como validaciones de JavaScript. Eso importa: aunque alguien llame
// a la API salteándose el frontend, la base sigue rechazando los datos malos.
// ---------------------------------------------------------------------------
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,          -- REGLA 3: nombre de usuario único
  email         TEXT UNIQUE NOT NULL,          -- REGLA 3: email único
  password_hash TEXT NOT NULL,                 -- nunca guardamos la contraseña en claro
  role          TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'admin')),  -- sólo existen estos dos roles
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS games (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL,
  platform    TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  game_id    INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),  -- REGLA 2
  comment    TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- REGLA 4: un usuario tiene COMO MÁXIMO UNA reseña por juego.
  -- Esta restricción es la que hace posible el "ON CONFLICT ... DO UPDATE"
  -- de routes/reviews.js: sin ella, reseñar dos veces duplicaría filas.
  UNIQUE (game_id, user_id)
);
`;

async function ensureSchema() {
  await pool.query(SCHEMA);
}

module.exports = { pool, ensureSchema };
