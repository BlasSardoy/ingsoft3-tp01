// ============================================================================
// FORMATO — funciones puras de presentación, SIN TEST a propósito.
// ============================================================================
// PR 5 del TP5: código nuevo, chico, que compila y no rompe nada, pero
// queda bloqueado por el umbral de cobertura. A diferencia del PR 4, éste
// NO se arregla: queda abierto y en rojo hasta la defensa.
// ============================================================================

function clasificarCatalogo(cantidadJuegos) {
  if (cantidadJuegos === 0) {
    return "vacío";
  }
  if (cantidadJuegos < 10) {
    return "chico";
  }
  if (cantidadJuegos < 50) {
    return "mediano";
  }
  return "grande";
}

function resumenDeResenas(cantidad, promedio) {
  if (cantidad === 0) {
    return "Todavía no hay reseñas";
  }
  if (promedio >= 4.5) {
    return `Aclamado por ${cantidad} reseña${cantidad === 1 ? "" : "s"}`;
  }
  return `${cantidad} reseña${cantidad === 1 ? "" : "s"}, promedio ${promedio.toFixed(1)}`;
}

module.exports = { clasificarCatalogo, resumenDeResenas };
