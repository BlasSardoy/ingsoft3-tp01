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
