# La cadena de conexión NO sale por output: tiene la contraseña. Acá sólo
# lo que se puede mostrar en una terminal sin problema.

output "db_host" {
  value = neon_project.preprod.database_host
}

output "database" {
  value = neon_database.preprod.name
}

output "api_url" {
  value = render_web_service.api.url
}

output "front_url" {
  value = render_web_service.front.url
}

# Por si quiero entrar como admin a preprod: terraform output -raw admin_password
output "admin_password" {
  value     = random_password.admin.result
  sensitive = true
}
