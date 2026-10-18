// ============================================================================
// PANTALLA 2 · DETALLE DEL JUEGO  (/games/:id)
// ============================================================================
// Muestra la ficha del juego, el formulario para dejar tu reseña (si estás
// logueado) y las reseñas de todos.
// ============================================================================

import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import StarRating from "../components/StarRating.jsx";

export default function GameDetail() {
  const { id } = useParams(); // el :id de la URL
  const { token, user } = useAuth();

  const [game, setGame] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Estado del formulario de MI reseña
  const [miPuntaje, setMiPuntaje] = useState(0);
  const [miComentario, setMiComentario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  // -------------------------------------------------------------------------
  // Carga el juego con sus reseñas. Si el usuario ya reseñó este juego,
  // precarga el formulario con lo que había puesto — porque enviar de nuevo
  // ACTUALIZA su reseña en vez de crear otra (REGLA DE NEGOCIO 4 del backend).
  // -------------------------------------------------------------------------
  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const data = await api.getGame(id);
      setGame(data);

      const mia = user && data.reviews.find((r) => r.user_id === user.id);
      if (mia) {
        setMiPuntaje(mia.rating);
        setMiComentario(mia.comment || "");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [id, user]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Espeja la REGLA 2 del backend (puntaje de 1 a 5): sin estrella elegida,
  // el botón queda deshabilitado.
  const puedeEnviar = miPuntaje >= 1 && miPuntaje <= 5 && !guardando;

  async function enviarResena(e) {
    e.preventDefault();
    if (!puedeEnviar) return;

    setGuardando(true);
    setErrorForm("");
    try {
      await api.upsertReview(id, { rating: miPuntaje, comment: miComentario }, token);
      await cargar(); // recarga para ver el promedio actualizado
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function borrarResena(reviewId) {
    if (!confirm("¿Borrar esta reseña?")) return;
    // Si la reseña no es tuya y no sos admin, el backend responde 403
    // (REGLA DE NEGOCIO 6).
    await api.deleteReview(reviewId, token);
    await cargar();
  }

  if (cargando) return <p className="muted page">Cargando…</p>;
  if (error) return <div className="alert alert--error page">{error}</div>;
  if (!game) return null;

  // Separamos mi reseña de las demás para poder destacarla arriba.
  const misResenas = user ? game.reviews.filter((r) => r.user_id === user.id) : [];
  const otrasResenas = game.reviews.filter((r) => !user || r.user_id !== user.id);

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Volver al catálogo
      </Link>

      {/* ---------------- Ficha del juego ---------------- */}
      <section className="game-header card">
        <span className="badge">{game.category}</span>
        <h1>{game.title}</h1>
        <p className="muted">{game.platform}</p>
        <p>{game.description}</p>
        <div className="game-card__footer">
          <StarRating value={Number(game.avg_rating)} readOnly size={22} />
          <span className="muted">
            {Number(game.avg_rating).toFixed(1)} / 5 · {game.review_count} reseña
            {game.review_count === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      {/* ---------------- Mi reseña ---------------- */}
      {user ? (
        <section className="card review-form">
          <h2>{misResenas.length ? "Editar tu reseña" : "Tu reseña"}</h2>

          {errorForm && <div className="alert alert--error">{errorForm}</div>}

          <form onSubmit={enviarResena}>
            <StarRating
              value={miPuntaje}
              onChange={setMiPuntaje}
              readOnly={false}
              size={26}
            />
            <textarea
              placeholder="¿Qué te pareció la jugabilidad?"
              value={miComentario}
              onChange={(e) => setMiComentario(e.target.value)}
              rows={3}
            />
            <button className="btn btn--primary" type="submit" disabled={!puedeEnviar}>
              {guardando ? "Guardando…" : "Guardar reseña"}
            </button>
          </form>
        </section>
      ) : (
        <p className="muted">
          <Link to="/acceso">Ingresá</Link> para dejar tu reseña.
        </p>
      )}

      {/* ---------------- Reseñas de todos ---------------- */}
      <section className="reviews">
        <h2>Reseñas</h2>

        {game.reviews.length === 0 && (
          <p className="muted">Todavía no hay reseñas. Sé el primero.</p>
        )}

        {/* La mía primero, resaltada */}
        {misResenas.map((r) => (
          <article className="review review--mine" key={r.id}>
            <header>
              <strong>{r.username} (vos)</strong>
              <StarRating value={r.rating} readOnly size={14} />
            </header>
            <p>{r.comment}</p>
            <button className="btn btn--ghost btn--small" onClick={() => borrarResena(r.id)}>
              Borrar
            </button>
          </article>
        ))}

        {otrasResenas.map((r) => (
          <article className="review" key={r.id}>
            <header>
              <strong>{r.username}</strong>
              <StarRating value={r.rating} readOnly size={14} />
            </header>
            <p>{r.comment}</p>

            {/* Sólo el admin puede borrar reseñas ajenas (REGLA 6) */}
            {user?.role === "admin" && (
              <button className="btn btn--ghost btn--small" onClick={() => borrarResena(r.id)}>
                Borrar (admin)
              </button>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
