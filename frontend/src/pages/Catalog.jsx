// ============================================================================
// PANTALLA 1 · CATÁLOGO  (/)
// ============================================================================
// Lista de juegos + buscador. Si el usuario logueado es admin, además ve el
// formulario para dar de alta juegos y el botón para borrarlos.
//
// Antes el alta de juegos era una cuarta pantalla (/admin). Se movió acá
// adentro, condicionada al rol, para bajar el total a tres pantallas.
// ============================================================================

import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import StarRating from "../components/StarRating.jsx";

export default function Catalog() {
  const { user, token } = useAuth();
  const esAdmin = user?.role === "admin";

  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Estado del buscador
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  // -------------------------------------------------------------------------
  // COMPORTAMIENTO DE FRONTEND 2:
  // el buscador NO filtra en el navegador — le pide al servidor la lista ya
  // filtrada. Por eso los filtros viajan como query params (?q=&category=).
  //
  // Esto escala: con 10.000 juegos no querríamos traerlos todos al navegador
  // para después esconder la mayoría.
  // -------------------------------------------------------------------------
  const buscar = useCallback(async (params) => {
    setCargando(true);
    setError("");
    try {
      setGames(await api.listGames(params));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial: todos los juegos + las categorías del desplegable.
  useEffect(() => {
    buscar({});
    api.listCategories().then(setCategories).catch(() => {});
  }, [buscar]);

  function handleSearch(e) {
    e.preventDefault();
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (category) params.category = category;
    buscar(params);
  }

  function limpiarFiltros() {
    setQ("");
    setCategory("");
    buscar({});
  }

  return (
    <div className="page">
      <section className="hero">
        <h1>Encontrá tu próximo juego</h1>
        <p className="muted">
          Calificá la jugabilidad, dejá tu comentario y mirá qué opina el resto.
        </p>
      </section>

      {/* ---------------- Buscador ---------------- */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Buscar por título…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn btn--primary" type="submit">
          Buscar
        </button>
        {(q || category) && (
          <button className="btn btn--ghost" type="button" onClick={limpiarFiltros}>
            Limpiar
          </button>
        )}
      </form>

      {/* ---------------------------------------------------------------
          COMPORTAMIENTO DE FRONTEND 3:
          el panel de administración sólo se RENDERIZA si el usuario es admin.

          Es comodidad visual, no seguridad: si alguien fuerza el pedido a la
          API igual recibe un 403, porque la REGLA 5 se aplica en el backend
          (middleware requireAdmin). Esconder un botón nunca es una defensa.
          --------------------------------------------------------------- */}
      {esAdmin && <AdminPanel token={token} onCambio={() => buscar({})} />}

      {error && <div className="alert alert--error">{error}</div>}
      {cargando && <p className="muted">Cargando juegos…</p>}

      {!cargando && games.length === 0 && (
        <div className="empty-state">
          <p>No hay juegos que coincidan con esa búsqueda.</p>
        </div>
      )}

      {/* ---------------- Grilla de juegos ---------------- */}
      <div className="game-grid">
        {games.map((g) => (
          <div className="game-card-wrap" key={g.id}>
            <Link to={`/games/${g.id}`} className="game-card">
              <div className="game-card__notch" aria-hidden="true" />
              <span className="badge">{g.category}</span>
              <h3>{g.title}</h3>
              <p className="muted small">{g.platform}</p>
              <div className="game-card__footer">
                <StarRating value={Number(g.avg_rating)} readOnly />
                <span className="small">
                  {Number(g.avg_rating).toFixed(1)} ({g.review_count})
                </span>
              </div>
            </Link>

            {/* El borrado también depende del rol */}
            {esAdmin && (
              <button
                className="btn btn--danger btn--small"
                onClick={async () => {
                  if (!confirm(`¿Borrar "${g.title}" y todas sus reseñas?`)) return;
                  await api.deleteGame(g.id, token);
                  buscar({});
                }}
              >
                Borrar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Formulario de alta de juegos. Sólo se monta si el usuario es admin.
// ============================================================================
function AdminPanel({ token, onCambio }) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    platform: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Mismo criterio que en Access.jsx: el botón espera a que los campos
  // obligatorios estén completos (los mismos que exige el backend).
  const puedeGuardar =
    form.title.trim() && form.category.trim() && form.platform.trim() && !guardando;

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!puedeGuardar) return;

    setGuardando(true);
    setError("");
    try {
      await api.createGame(form, token);
      setForm({ title: "", category: "", platform: "", description: "" });
      onCambio(); // recarga la lista para que aparezca el juego nuevo
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="card admin-form">
      <h2>Agregar un juego</h2>
      <p className="muted small">Sólo visible para administradores.</p>

      {error && <div className="alert alert--error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>
          Título
          <input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label>
          Categoría
          <input
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Metroidvania, Shooter…"
          />
        </label>
        <label>
          Plataforma
          <input
            value={form.platform}
            onChange={(e) => set("platform", e.target.value)}
            placeholder="PC / Switch"
          />
        </label>
        <label>
          Descripción
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>

        <div className="admin-form__actions">
          <button className="btn btn--primary" type="submit" disabled={!puedeGuardar}>
            {guardando ? "Guardando…" : "Agregar juego"}
          </button>
        </div>
      </form>
    </section>
  );
}
