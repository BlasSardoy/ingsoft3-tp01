// ============================================================================
// CONTEXTO DE AUTENTICACIÓN
// ============================================================================
// Guarda quién está logueado y su token, y los deja disponibles en cualquier
// componente con el hook useAuth() — sin tener que pasarlos por props desde
// App.jsx hasta la pantalla que los necesita.
// ============================================================================

import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Estado inicial leído de localStorage: así, si recargás la página o cerrás
  // la pestaña, seguís logueado (el token dura 7 días, ver routes/auth.js).
  const [token, setToken] = useState(() => localStorage.getItem("gamerate_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("gamerate_user");
    return raw ? JSON.parse(raw) : null;
  });

  // Guarda en el estado de React Y en localStorage, para que sobreviva a un F5.
  function persistir(nuevoToken, nuevoUser) {
    setToken(nuevoToken);
    setUser(nuevoUser);
    localStorage.setItem("gamerate_token", nuevoToken);
    localStorage.setItem("gamerate_user", JSON.stringify(nuevoUser));
  }

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    persistir(data.token, data.user);
  }, []);

  const register = useCallback(async (username, email, password) => {
    const data = await api.register({ username, email, password });
    persistir(data.token, data.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("gamerate_token");
    localStorage.removeItem("gamerate_user");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para consumir el contexto. El error explícito evita el clásico
// "cannot read property of null" si alguien lo usa fuera del provider.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
