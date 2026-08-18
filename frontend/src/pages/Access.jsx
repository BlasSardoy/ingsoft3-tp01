// ============================================================================
// PANTALLA 3 · ACCESO  (/acceso)
// ============================================================================
// Ingresar y crear cuenta en una sola pantalla, alternando con un botón.
// Antes eran dos páginas separadas (Login.jsx y Register.jsx); se unieron
// para bajar el total a tres pantallas.
// ============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Access() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // modo: "ingresar" | "registrarme"
  const [modo, setModo] = useState("ingresar");
  const esRegistro = modo === "registrarme";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // -------------------------------------------------------------------------
  // COMPORTAMIENTO DE FRONTEND 1:
  // el botón está deshabilitado hasta que los campos son válidos.
  //
  // Las condiciones espejan las reglas del backend (contraseña ≥ 6), pero NO
  // las reemplazan: esto es comodidad para el usuario, la validación de verdad
  // está en la API. Cualquiera podría llamar al endpoint sin pasar por acá.
  // -------------------------------------------------------------------------
  const puedeEnviar =
    email.includes("@") &&
    password.length >= 6 &&
    (!esRegistro || username.trim().length >= 3) &&
    !enviando;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!puedeEnviar) return;

    setEnviando(true);
    setError("");

    try {
      if (esRegistro) {
        await register(username.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate("/"); // al catálogo, ya logueado
    } catch (err) {
      // El mensaje viene del backend (ej. "Ese usuario o email ya existe").
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  function cambiarModo() {
    setModo(esRegistro ? "ingresar" : "registrarme");
    setError("");
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>{esRegistro ? "Crear cuenta" : "Ingresar"}</h1>

        {error && <div className="alert alert--error">{error}</div>}

        {/* El nombre de usuario sólo hace falta al registrarse */}
        {esRegistro && (
          <label>
            Nombre de usuario
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            {username && username.trim().length < 3 && (
              <span className="field-hint">Mínimo 3 caracteres</span>
            )}
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={esRegistro ? "new-password" : "current-password"}
          />
          {/* Refleja la REGLA DE NEGOCIO 1 del backend */}
          {password && password.length < 6 && (
            <span className="field-hint">Mínimo 6 caracteres</span>
          )}
        </label>

        <button className="btn btn--primary" type="submit" disabled={!puedeEnviar}>
          {enviando ? "Enviando…" : esRegistro ? "Crear cuenta" : "Ingresar"}
        </button>

        <button type="button" className="btn btn--ghost btn--small" onClick={cambiarModo}>
          {esRegistro ? "Ya tengo cuenta" : "No tengo cuenta, quiero crear una"}
        </button>
      </form>
    </div>
  );
}
