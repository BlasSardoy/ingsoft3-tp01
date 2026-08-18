// ============================================================================
// PUNTO DE ENTRADA DEL BACKEND
// ============================================================================
// Arma el servidor Express, monta las rutas, prepara la base y se pone a
// escuchar. Es el archivo que ejecuta el CMD del Dockerfile:
//     CMD ["node", "src/index.js"]
// ============================================================================

// Lee un archivo .env si existe. Dentro de Docker no hace falta (las variables
// las inyecta compose), pero permite correr el backend suelto en la máquina.
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { ensureSchema } = require("./db");
const { seed } = require("./seed");
const authRoutes = require("./routes/auth");
const gamesRoutes = require("./routes/games");
const reviewsRoutes = require("./routes/reviews");

const app = express();

// El puerto también entra por variable de entorno (la misma imagen puede
// escuchar en otro puerto sin recompilarse). 8080 es el valor por defecto.
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json()); // parsea los body en JSON de los POST/PUT

// ---------------------------------------------------------------------------
// GET /health — endpoint de salud.
//
// Sirve para saber si la API ya está levantada sin tener que abrir el
// navegador:  curl localhost:8080/health  →  {"status":"ok"}
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ---------------------------------------------------------------------------
// Montaje de las rutas. Todo cuelga de /api porque el nginx del frontend
// reenvía exactamente ese prefijo hacia acá (ver frontend/nginx.conf).
// ---------------------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api", reviewsRoutes); // expone /api/games/:id/reviews y /api/reviews/:id

// Cualquier otra ruta: 404 en JSON (y no el HTML por defecto de Express).
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// ---------------------------------------------------------------------------
// ARRANQUE
//
// El orden importa: primero preparamos la base, recién después empezamos a
// aceptar pedidos. Si escucháramos antes, el primer request podría llegar a
// tablas que todavía no existen.
// ---------------------------------------------------------------------------
async function start() {
  // Si falta JWT_SECRET no arrancamos: sin él no se pueden firmar tokens y la
  // app fallaría más adelante con un error mucho menos claro.
  if (!process.env.JWT_SECRET) {
    console.error("Falta JWT_SECRET en el entorno. Revisá tu .env");
    process.exit(1);
  }

  await ensureSchema(); // crea las tablas si no existen
  await seed();         // admin + juegos de ejemplo

  app.listen(PORT, () => {
    console.log(`GameRate API escuchando en el puerto ${PORT}`);
  });
}

start().catch((err) => {
  // Si la base todavía no acepta conexiones, morimos acá.
  console.error("No se pudo iniciar la app:", err);
  process.exit(1);
});
