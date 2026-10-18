// ============================================================================
// REGLAS DE NEGOCIO DEL FRONTEND — funciones puras, sin DOM ni React.
// ============================================================================
// Reciben los datos del formulario, devuelven un booleano. Por eso se pueden
// testear sin levantar un componente: son la misma idea que src/reglas.js
// del backend, del otro lado.
// ============================================================================

// -----------------------------------------------------------------------
// COMPORTAMIENTO DE FRONTEND 1 (Access.jsx): el botón de acceso espera a
// que los campos sean válidos. Espeja la REGLA 1 del backend (contraseña
// ≥ 6), pero no la reemplaza: la validación de verdad está en la API.
// -----------------------------------------------------------------------
export function puedeEnviarAcceso({ esRegistro, email, password, username, enviando = false }) {
  return (
    email.includes("@") &&
    password.length >= 6 &&
    (!esRegistro || username.trim().length >= 3) &&
    !enviando
  );
}

// -----------------------------------------------------------------------
// GameDetail.jsx: espeja la REGLA 2 del backend (puntaje de 1 a 5).
// -----------------------------------------------------------------------
export function puedeEnviarResena(rating, guardando = false) {
  return rating >= 1 && rating <= 5 && !guardando;
}

// -----------------------------------------------------------------------
// Catalog.jsx (AdminPanel): mismos campos obligatorios que exige el backend
// al crear un juego (title, category, platform).
// -----------------------------------------------------------------------
export function puedeGuardarJuego({ title, category, platform, guardando = false }) {
  return Boolean(title.trim() && category.trim() && platform.trim()) && !guardando;
}

// -----------------------------------------------------------------------
// StarRating.jsx: cuántas estrellas se pintan llenas para un promedio con
// decimales (ej. 4.33). Redondeo estándar: .5 para arriba.
// -----------------------------------------------------------------------
export function estrellasLlenas(value) {
  return Math.round(value);
}
