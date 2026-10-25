# =============================================================================
# INFRAESTRUCTURA DE PREPROD — declarada con Terraform
# =============================================================================
# Sin bloque "backend" a propósito: el estado vive en infra/terraform.tfstate,
# en mi máquina. Ese archivo tiene contraseñas en texto plano, por eso
# *.tfstate está en el .gitignore y nunca se commitea.
# =============================================================================

terraform {
  required_version = ">= 1.5"

  # Versiones FIJADAS: el mismo código crea la misma infraestructura hoy y
  # dentro de seis meses. El .terraform.lock.hcl sí se commitea.
  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.18.0"
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.7.2"
    }
  }
}

# Lee NEON_API_KEY del entorno: ninguna credencial escrita en el HCL.
provider "neon" {}

# Lee RENDER_API_KEY y RENDER_OWNER_ID del entorno: ninguna credencial en el HCL.
provider "render" {}

# -----------------------------------------------------------------------------
# Proyecto de Neon PROPIO para preprod, separado del de QA/PROD: se puede
# destruir entero sin tocar las bases app_qa ni app_prod.
# -----------------------------------------------------------------------------
resource "neon_project" "preprod" {
  name      = "gamerate-preprod"
  org_id    = "org-summer-mud-80119838"
  region_id = "aws-us-east-1"

  # Sin esto el primer apply falla: el default (86400 s = 24 h) supera el tope
  # de historia del plan gratis. 21600 s = 6 h.
  history_retention_seconds = 21600
}

# El usuario dueño de la base.
resource "neon_role" "preprod" {
  project_id = neon_project.preprod.id
  # default_branch_id, NO branch_id: es la branch que Neon crea con el proyecto.
  branch_id = neon_project.preprod.default_branch_id
  name      = "app_preprod_owner"
}

# La base nace VACÍA: las tablas las crea ensureSchema() + seed() de mi backend
# al arrancar, igual que en QA y PROD.
resource "neon_database" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod"
  owner_name = neon_role.preprod.name
}

# -----------------------------------------------------------------------------
# Secretos de preprod: los genera Terraform, nadie los copia.
# -----------------------------------------------------------------------------
resource "random_password" "jwt" { # JWT_SECRET de preprod
  length  = 48
  special = false
}

resource "random_password" "admin" { # ADMIN_PASSWORD de preprod
  length  = 24
  special = false
}

locals {
  # La URL de la base se ARMA con lo que devolvió Neon: nadie la copia y pega
  # (el error más caro del TP6: un entorno apuntando a la base de otro).
  # Mi backend es Node: lee DATABASE_URL en formato URI (no ConnectionStrings__Default).
  database_url = "postgresql://${neon_role.preprod.name}:${urlencode(neon_role.preprod.password)}@${neon_project.preprod.database_host}/${neon_database.preprod.name}?sslmode=require"
}

# -----------------------------------------------------------------------------
# Servicios de Render. En el plan free se CREAN y se DESTRUYEN, nunca se
# modifican: cualquier cambio pasa por recrearlos (ver image_tag).
# -----------------------------------------------------------------------------
resource "render_web_service" "api" {
  name              = "gamerate-api-preprod"
  plan              = "free"
  region            = var.region
  health_check_path = "/health"

  # La etiqueta va en su campo, NO pegada a image_url.
  runtime_source = {
    image = {
      image_url = var.image_repo_api
      tag       = var.image_tag
    }
  }

  # PORT no se declara: lo pone Render.
  env_vars = {
    DATABASE_URL   = { value = local.database_url }
    JWT_SECRET     = { value = random_password.jwt.result }
    ADMIN_EMAIL    = { value = "admin@gamerate.local" }
    ADMIN_PASSWORD = { value = random_password.admin.result }
  }
}

resource "render_web_service" "front" {
  name   = "gamerate-front-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_front
      tag       = var.image_tag
    }
  }

  env_vars = {
    # Sale de Terraform, no de un copy-paste; sin barra final.
    BACKEND_URL  = { value = trimsuffix(render_web_service.api.url, "/") }
    DNS_RESOLVER = { value = "8.8.8.8" }
  }
}
