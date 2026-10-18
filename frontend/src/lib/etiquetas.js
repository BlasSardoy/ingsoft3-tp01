// ============================================================================
// ETIQUETA DE PUNTAJE — cómo se lee el promedio de un juego de un vistazo.
// ============================================================================
// Función pura, varios caminos. Entró SIN TEST a propósito en el PR 4 del TP5
// (#32) para mostrar que el umbral frena un merge aunque el código compile;
// los tests se agregaron en ese mismo PR (etiquetas.test.js), uno por camino.
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
