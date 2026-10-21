# =============================================================================
# DOCKERFILE DEL FRONTEND — multi-stage
# =============================================================================
# Caso más extremo que el del backend: la imagen final NO TIENE NODE.
#
# Una SPA de React compila a HTML + CSS + JS estáticos. Una vez compilada,
# Node no hace falta para nada: alcanza un servidor web. Por eso la etapa
# final parte de nginx y sólo copia la carpeta dist/ que produjo la etapa 1.
# =============================================================================

# ---- Etapa 1: compilar la SPA ----------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Dependencias primero (misma estrategia de cache que el backend)
COPY package*.json ./
RUN npm ci

COPY . .

# Vite deja el resultado en /app/dist
RUN npm run build

# ---- Etapa 2: tests (parte del build: ya tiene Node y las dependencias) ----
# Sin WORKDIR: hereda el /app de la etapa "build".
FROM build AS test
ENTRYPOINT ["npm", "run", "test:ci"]

# ---- Etapa 3: nginx sirve los estáticos ------------------------------------
FROM nginx:alpine

# La plantilla de configuración que hace el proxy de /api hacia el backend.
# Es el archivo que más se olvida: sin él la app "levanta" pero no carga datos.
# nginx la procesa al arrancar (envsubst) y genera /etc/nginx/conf.d/default.conf.
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Lo único que cruza de la etapa 1: los archivos compilados.
COPY --from=build /app/dist /usr/share/nginx/html

# Valores por defecto = los de compose, así docker compose up anda sin cambios.
# En Render se pisan con la URL de la api del entorno y un DNS público.
ENV BACKEND_URL=http://backend:8080 \
    DNS_RESOLVER=127.0.0.11

EXPOSE 80
