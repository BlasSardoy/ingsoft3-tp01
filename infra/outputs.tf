# La cadena de conexión NO sale por output: tiene la contraseña. Acá sólo
# lo que se puede mostrar en una terminal sin problema.

output "db_host" {
  value = neon_project.preprod.database_host
}

output "database" {
  value = neon_database.preprod.name
}
