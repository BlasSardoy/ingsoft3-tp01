// ============================================================================
// ESTRELLAS — se usa en dos modos
// ============================================================================
//   readOnly={true}   → muestra un promedio (catálogo, ficha, reseñas ajenas)
//   readOnly={false}  → selector interactivo de 1 a 5 (dejar tu reseña)
// ============================================================================

import React from "react";

export default function StarRating({ value = 0, onChange, readOnly = true, size = 18 }) {
  const estrellas = [1, 2, 3, 4, 5];

  return (
    <span
      className="star-rating"
      style={{ fontSize: size }}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`Calificación ${value} de 5`}
    >
      {estrellas.map((n) => {
        // Redondeamos porque el promedio viene con decimales (ej. 4.33).
        const llena = n <= Math.round(value);

        return (
          <button
            key={n}
            type="button"
            className={`star ${llena ? "star--filled" : ""}`}
            disabled={readOnly}
            onClick={() => onChange && onChange(n)}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            aria-pressed={llena}
          >
            ★
          </button>
        );
      })}
    </span>
  );
}
