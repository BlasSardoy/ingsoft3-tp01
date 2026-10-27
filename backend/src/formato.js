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

function nivelDeConfianza(cantidadResenas) {
  if (cantidadResenas === 0) {
    return "sin datos";
  }
  if (cantidadResenas < 5) {
    return "pocas reseñas";
  }
  if (cantidadResenas < 20) {
    return "confianza media";
  }
  return "confianza alta";
}

function formatearPlataformas(plataformas) {
  if (!plataformas || plataformas.length === 0) {
    return "Sin plataforma";
  }
  if (plataformas.length === 1) {
    return plataformas[0];
  }
  if (plataformas.length === 2) {
    return `${plataformas[0]} y ${plataformas[1]}`;
  }
  const todasMenosUltima = plataformas.slice(0, -1).join(", ");
  const ultima = plataformas[plataformas.length - 1];
  return `${todasMenosUltima} y ${ultima}`;
}

function etiquetaDeAntiguedad(fechaCreacion, ahora = new Date()) {
  const dias = Math.floor((ahora - new Date(fechaCreacion)) / (1000 * 60 * 60 * 24));
  if (dias < 0) {
    return "fecha inválida";
  }
  if (dias < 7) {
    return "recién agregado";
  }
  if (dias < 30) {
    return "nuevo en el catálogo";
  }
  if (dias < 365) {
    return "del catálogo";
  }
  return "clásico del catálogo";
}

module.exports = {
  clasificarCatalogo,
  resumenDeResenas,
  nivelDeConfianza,
  formatearPlataformas,
  etiquetaDeAntiguedad,
};
