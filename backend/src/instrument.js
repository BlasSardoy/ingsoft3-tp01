// ============================================================================
// SENTRY — errores y rendimiento del backend
// ============================================================================
// Se carga PRIMERO desde index.js (antes que express y pg) para que Sentry
// pueda instrumentar esas librerías y medir cada pedido y cada consulta.
// ============================================================================

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN, // sólo existe en PROD (Render); sin DSN la librería queda apagada
  environment: process.env.SENTRY_ENVIRONMENT || "local",
  tracesSampleRate: 1.0, // medir todos los pedidos
});

module.exports = Sentry;
