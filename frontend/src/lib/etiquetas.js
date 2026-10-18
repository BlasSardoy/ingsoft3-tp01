// ============================================================================
// ETIQUETA DE PUNTAJE — cómo se lee el promedio de un juego de un vistazo.
// ============================================================================
// Función pura, varios caminos, SIN TEST a propósito: es la demostración del
// PR 4 del TP5 — el umbral de cobertura tiene que frenar un merge aunque el
// código compile y no rompa nada.
// ============================================================================
export function etiquetaDePuntaje(promedio, cantidad) {
  if (cantidad === 0) {
    return "sin reseñas";
  }
  if (promedio < 3) {
    return "mixto";
  }
  if (promedio < 4.5) {
    return "bien valorado";
  }
  return "aclamado";
}
