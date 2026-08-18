// ============================================================================
// DATOS SEMILLA (seed)
// ============================================================================
// Corre al arrancar la app, después de ensureSchema(). Sirve para que el
// sistema no arranque con la base completamente vacía: crea un usuario admin
// y tres juegos de ejemplo.
//
// Es IDEMPOTENTE: si el admin ya existe, no lo vuelve a crear. Si ya hay
// juegos cargados, no agrega más. Así se puede reiniciar el contenedor las
// veces que haga falta sin duplicar nada.
// ============================================================================

const bcrypt = require("bcryptjs");
const { pool } = require("./db");

async function seed() {
  // --- 1. El usuario admin -------------------------------------------------
  // Sus credenciales vienen por variable de entorno (ADMIN_EMAIL /
  // ADMIN_PASSWORD), definidas en el .env — nunca escritas en el código.
  const { rows: admins } = await pool.query(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  );

  if (admins.length === 0) {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@gamerate.local";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    // bcrypt.hash: guardamos el hash, nunca la contraseña original.
    // El "10" son las rondas de salt (cuánto cuesta calcular el hash).
    const hash = await bcrypt.hash(adminPassword, 10);

    await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ["admin", adminEmail, hash]
    );
    console.log(`[seed] admin creado -> ${adminEmail}`);
  }

  // --- 2. Juegos de ejemplo ------------------------------------------------
  // Sólo si el catálogo está vacío.
  const { rows: games } = await pool.query(
    "SELECT COUNT(*)::int AS n FROM games"
  );

  if (games[0].n === 0) {
    const demo = [
      ["Hollow Knight", "Metroidvania", "PC / Switch", "Explorás Hallownest, un reino subterráneo en ruinas."],
      ["Stardew Valley", "Simulación", "PC / Móvil", "Heredás una granja abandonada y rearmás tu vida en el pueblo."],
      ["Celeste", "Plataformas", "PC / Switch", "Un plataformero de precisión sobre subir una montaña difícil."],
    ];

    for (const [title, category, platform, description] of demo) {
      await pool.query(
        `INSERT INTO games (title, category, platform, description)
         VALUES ($1, $2, $3, $4)`,
        [title, category, platform, description]
      );
    }
    console.log("[seed] juegos de ejemplo cargados");
  }
}

module.exports = { seed };
