# =============================================================================
# DOCKERFILE DEL BACKEND — multi-stage
# =============================================================================
# Dos etapas. Cada "FROM" abre una imagen nueva y descarta lo anterior, salvo
# lo que se copie explícitamente con COPY --from.
# =============================================================================

# ---- Etapa 1: dependencias -------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# ⚠️ REGLA DE ORO #1 — el orden importa por el CACHE de capas.
# Copiamos SOLO los archivos de dependencias antes de instalar. Docker cachea
# esta capa y la reutiliza mientras package.json no cambie: así, editar una
# línea de código NO vuelve a descargar todo npm.
COPY package*.json ./

# "npm ci" (no "npm install"): instala exactamente las versiones del
# package-lock.json. Reproducible, que es todo el punto del contenedor.
# "--omit=dev" deja afuera las devDependencies: no van a producción.
RUN npm ci --omit=dev

# ---- Etapa 2: runtime ------------------------------------------------------
FROM node:22-alpine AS final
WORKDIR /app

ENV NODE_ENV=production

# La ÚNICA línea que cruza de la etapa 1 a la 2: las dependencias resueltas.
COPY --from=deps /app/node_modules ./node_modules

COPY package*.json ./
COPY src ./src

# EXPOSE sólo DOCUMENTA el puerto. No lo publica: eso lo hace "ports:" en el
# compose (o -p en docker run).
EXPOSE 8080

# CMD define el comando por defecto del contenedor (reemplazable desde
# docker run). ENTRYPOINT, en cambio, fija el ejecutable.
CMD ["node", "src/index.js"]
