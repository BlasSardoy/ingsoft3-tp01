# =============================================================================
# DOCKERFILE DEL FRONTEND — multi-stage
# =============================================================================
# Caso más extremo que el del backend: la imagen final NO TIENE NODE.
#
# Una SPA de React compila a HTML + CSS + JS estáticos. Una vez compilada,
# Node no hace falta para nada: alcanza un servidor web. Por eso la etapa 2
# parte de nginx y sólo copia la carpeta dist/ que produjo la etapa 1.
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

# ---- Etapa 2: nginx sirve los estáticos ------------------------------------
FROM nginx:alpine

# La configuración que hace el proxy de /api hacia el backend.
# Es el archivo que más se olvida: sin él la app "levanta" pero no carga datos.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Lo único que cruza de la etapa 1: los archivos compilados.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
