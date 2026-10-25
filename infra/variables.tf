# Valores NO secretos, con default: este archivo se commitea.

# El repositorio de cada imagen, SIN la etiqueta: la etiqueta va aparte.
variable "image_repo_api" {
  default = "ghcr.io/blassardoy/ingsoft3-tp01-backend"
}

variable "image_repo_front" {
  default = "ghcr.io/blassardoy/ingsoft3-tp01-frontend"
}

# La imagen de v7.0.0 (TP7). Fija a propósito: preprod corre la imagen de un
# merge concreto. En Render free cambiarla NO se puede actualizar en caliente
# (el provider manda maintenance mode y el plan free lo rechaza): para otra
# imagen, se recrea con terraform destroy/apply o con apply -replace.
variable "image_tag" {
  default = "sha-fd0875a5eb9d63a8cc133397a16a6f79b4908e6b"
}

# La misma región que QA/PROD; Neon está en aws-us-east-1.
variable "region" {
  default = "virginia"
}
