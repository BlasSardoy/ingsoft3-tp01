// ============================================================================
// PUNTO DE ENTRADA DEL FRONTEND
// ============================================================================
// Inicializa Sentry (errores y rendimiento del navegador) antes de montar
// nada, y después monta React sobre el <div id="root"> del index.html,
// envolviendo la app en dos proveedores de contexto:
//   BrowserRouter → habilita las rutas (/, /games/:id, /acceso)
//   AuthProvider  → deja el usuario y el token disponibles en toda la app
// ============================================================================

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles.css";

Sentry.init({
  // el DSN de un front es público: sólo permite ENVIAR datos a Sentry, no leerlos
  dsn: "https://099ffe29e20ec874c7ca0b94f3ee4711@o4512319915687936.ingest.us.sentry.io/4512320015826944",
  environment: window.location.hostname, // QA, PROD o localhost
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
