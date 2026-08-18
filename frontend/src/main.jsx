// ============================================================================
// PUNTO DE ENTRADA DEL FRONTEND
// ============================================================================
// Monta React sobre el <div id="root"> del index.html y envuelve la app en
// dos proveedores de contexto:
//   BrowserRouter → habilita las rutas (/, /games/:id, /acceso)
//   AuthProvider  → deja el usuario y el token disponibles en toda la app
// ============================================================================

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
