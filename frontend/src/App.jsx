// ============================================================================
// APP: las rutas de la aplicación + la barra de navegación
// ============================================================================
// GameRate tiene TRES pantallas, a propósito. La guía de la cátedra pide una
// app chica ("CRUD + 2-3 pantallas alcanza; más grande no suma nota, sólo
// suma fricción"):
//
//   /            → Catálogo: lista de juegos, buscador, y (si sos admin)
//                  el alta de juegos nuevos.
//   /games/:id   → Detalle del juego + sus reseñas + dejar la tuya.
//   /acceso      → Ingresar o crear cuenta (las dos cosas en una pantalla).
// ============================================================================

import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import Catalog from "./pages/Catalog.jsx";
import GameDetail from "./pages/GameDetail.jsx";
import Access from "./pages/Access.jsx";
import { useAuth } from "./context/AuthContext.jsx";

// ---------------------------------------------------------------------------
// Barra superior. Va acá y no en su propio archivo porque son 30 líneas:
// un archivo menos que abrir para entender la app.
// ---------------------------------------------------------------------------
function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        <span className="navbar__cart" aria-hidden="true" />
        GameRate
      </Link>

      <div className="navbar__user">
        {user ? (
          <>
            <span className="navbar__hello">
              Hola, {user.username}
              {/* El distintivo de admin sólo se muestra si el rol lo es */}
              {user.role === "admin" && <span className="badge badge--admin">admin</span>}
            </span>
            <button className="btn btn--ghost btn--small" onClick={logout}>
              Salir
            </button>
          </>
        ) : (
          <Link to="/acceso" className="btn btn--primary btn--small">
            Ingresar
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/games/:id" element={<GameDetail />} />
          <Route path="/acceso" element={<Access />} />

          {/* Cualquier URL desconocida vuelve al catálogo */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
