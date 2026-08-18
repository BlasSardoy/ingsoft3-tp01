# Proyecto IngSoft3 — GameRate

**GameRate** es un catálogo de videojuegos con reseñas: los usuarios buscan juegos, califican la
jugabilidad de 1 a 5 y dejan un comentario; un administrador mantiene el catálogo.

- **Backend**: Node.js + Express + PostgreSQL (API REST, JWT para autenticación)
- **Frontend**: React + Vite, servido en producción por nginx
- **Base de datos**: PostgreSQL en contenedor, con volumen para que los datos persistan

Tres pantallas: catálogo (con buscador), detalle del juego con sus reseñas, y acceso
(ingresar / crear cuenta).

---

## Instalación

Levantar el sistema completo en una máquina limpia. Único requisito: **Docker instalado y
corriendo** (`docker ps` tiene que responder sin error).

```bash
git clone https://github.com/BlasSardoy/ingsoft3-tp01.git
cd ingsoft3-tp01

cp .env.example .env          # ⚠️ PRIMERO esto: el .env real no viaja en el repo
docker compose up -d --build
```

Son **dos comandos, no uno**, y es a propósito: el secreto es lo único que no puede estar en el
repositorio, así que el arranque necesita ese paso manual.

Esperá a que la base quede sana:

```bash
docker compose ps             # "db" tiene que decir healthy, back y front running
```

Listo:

| | |
|---|---|
| **Frontend** | http://localhost:3000 |
| **API** | http://localhost:8080 |
| **Health check** | `curl http://localhost:8080/health` → `{"status":"ok"}` |

La primera vez que arranca, la API crea las tablas y carga datos semilla: un usuario **admin** (las
credenciales salen de `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`) y tres juegos de ejemplo.

### Apagar

```bash
docker compose down           # apaga los contenedores; los datos quedan
docker compose down -v        # el -v borra TAMBIÉN el volumen de la base
```

---

## Probar la persistencia

Los datos viven en el volumen `db_data`, no dentro del contenedor de la base:

```bash
# 1. Creá algún juego o reseña desde la app, y mirá qué hay:
curl -s localhost:8080/api/games

# 2. Apagar y volver a levantar: los datos SIGUEN
docker compose down && docker compose up -d
curl -s localhost:8080/health          # esperá a que responda
curl -s localhost:8080/api/games

# 3. Con -v: el volumen se borra y vuelve a arrancar de cero
docker compose down -v && docker compose up -d
curl -s localhost:8080/health
curl -s localhost:8080/api/games       # sólo los 3 juegos semilla
```

`down` apaga; `down -v`, además, olvida.

> Si un `curl` contesta `Empty reply from server`, no se borraron los datos: el backend todavía está
> arrancando. Por eso conviene pegarle primero a `/health`.

---

## Correr con las imágenes publicadas (sin compilar nada)

```bash
cp .env.example .env
docker compose -f docker-compose.registry.yml up -d
```

Baja `ghcr.io/blassardoy/gamerate-backend` y `ghcr.io/blassardoy/gamerate-frontend` del registry en
vez de construirlas desde el código. Es como consumiría el sistema un entorno de QA o producción.

Comparado con el `docker-compose.yml`, cambian **dos líneas**: donde uno dice `build: ./backend`,
el otro dice `image: ghcr.io/...`. Todo lo demás es idéntico.

---

## Desarrollo local sin Docker (opcional)

Útil para iterar con recarga en caliente, sin reconstruir imágenes en cada cambio:

```bash
# Base de datos como contenedor suelto
docker run -d --name pg-gamerate \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app \
  -p 5432:5432 postgres:16-alpine

# Backend
cd backend
cp .env.example .env
npm install
npm run dev                   # http://localhost:8080

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173 — Vite proxea /api al backend
```

---

## Variables de entorno

El `.env` real **no se commitea** (está en `.gitignore`). Lo que sí está versionado es
`.env.example`, como plantilla:

| Variable | Para qué |
|---|---|
| `DB_PASSWORD` | contraseña del PostgreSQL del compose |
| `JWT_SECRET` | clave con la que se firman los tokens de sesión |
| `ADMIN_EMAIL` | email del admin que se crea al arrancar por primera vez |
| `ADMIN_PASSWORD` | su contraseña |

El backend recibe la conexión a la base en **una sola** variable, `DATABASE_URL`. Dentro de compose
el host es `db` (el nombre del servicio, resuelto por el DNS interno de la red); corriendo suelto en
tu máquina es `localhost`. La misma imagen sirve en los dos casos porque no tiene ninguna dirección
escrita adentro.

---

## Estructura

```
backend/
  src/
    index.js            arranca Express, prepara la base y escucha
    db.js               pool de PostgreSQL + creación del esquema
    seed.js             admin y juegos de ejemplo
    middleware/auth.js  verificación del JWT y chequeo de rol admin
    routes/auth.js      registro y login
    routes/games.js     catálogo (lectura pública, escritura sólo admin)
    routes/reviews.js   alta/edición y borrado de reseñas
  Dockerfile            multi-stage: dependencias → runtime
  .dockerignore

frontend/
  src/
    main.jsx            monta React
    App.jsx             rutas + barra de navegación
    api.js              cliente HTTP (único lugar que habla con la API)
    context/            estado de sesión (token y usuario)
    components/         StarRating
    pages/              Catalog · GameDetail · Access
    styles.css
  Dockerfile            multi-stage: build con Vite → nginx sirve los estáticos
  nginx.conf            proxea /api hacia el servicio "backend"
  .dockerignore

docker-compose.yml            construye y levanta el sistema completo
docker-compose.registry.yml   la misma topología, bajando imágenes del registry
.env.example                  plantilla de variables (el .env real no se commitea)
decisiones.md                 decisiones técnicas de cada TP y por qué
evidencias.md                 capturas y salidas que respaldan cada entrega
```

---

## Reglas de negocio

**Backend** (validadas en la API, y varias también como restricciones de la base):

1. La contraseña debe tener al menos 6 caracteres.
2. El puntaje de una reseña va de 1 a 5.
3. Nombre de usuario y email son únicos.
4. Un usuario tiene como máximo **una** reseña por juego: volver a enviarla la actualiza.
5. Sólo un admin puede crear o borrar juegos del catálogo.
6. Sólo el autor de una reseña (o un admin) puede borrarla.

**Frontend**:

1. Los formularios no se envían con campos inválidos (el botón queda deshabilitado).
2. El buscador consulta al servidor en cada búsqueda; no filtra en el navegador.
3. El panel de administración sólo se muestra si el usuario tiene rol admin.

---

## Trabajos prácticos

| TP | Tema | Tag |
|---|---|---|
| TP1 | Git colaborativo: ramas, Pull Requests, protección de `main`, versionado | `v1.0.0` |
| TP2 | Contenedores: Dockerfiles multi-stage, compose, registry | `tp2` |

Las decisiones técnicas de cada entrega están en [`decisiones.md`](decisiones.md) y las capturas que
las respaldan en [`evidencias.md`](evidencias.md).

`main` está protegida: todo cambio entra por Pull Request, incluidos los de quien administra el
repositorio.
