# Decisiones — TP1
--------------------------------------------
1. Por qué Git no pudo resolver el conflicto solo — y qué habría tenido que pasar para que nunca apareciera.

Las ramas feature/titulo-a y feature/titulo-b partieron las dos del mismo commit de main y modificaron la misma línea del README.md (la primera línea, el título) con contenidos distintos. 
Al mergear la rama A primero, main avanzó con ese cambio. Al intentar mergear B, Git comparó tres versiones: el ancestro común, lo que hizo A (ya en main) y lo que hizo B — y en esa línea, A y B decían cosas distintas 
sobre el mismo punto exacto del archivo. Git fusiona automáticamente cambios en líneas distintas, pero no tiene ningún criterio para elegir entre dos ediciones humanas incompatibles sobre la misma línea.

Para que este conflicto nunca hubiera aparecido: Los desarrolladores de A y B se avisaran antes de tocar el mismo archivo.

--------------------------------------------
2. Problemas encontrados
- Después de instalar Git y Claude Code, los comandos no se reconocían en la misma ventana de PowerShell donde había corrido el instalador — tenía cargado el PATH viejo. Se resolvió abriendo una terminal nueva.
  
- git switch main && git pull tiraba error de sintaxis en PowerShell clásico ("El token '&&' no es un separador de instrucciones válido"). && es sintaxis de bash/PowerShell 7, no de Windows PowerShell 5.x.
Lo resolví separando en dos líneas.

- Al subir la carpeta img con las capturas, quedó anidada un nivel de más (img/img/archivo.png en vez de img/archivo.png), porque la arrastré desde el navegador estando ya parado dentro de otra carpeta img. Los links de evidencias.md apuntaban a img/archivo.png, así que las 4 imágenes se veían rotas. Lo solucioné borrando los 4 archivos mal ubicados y subiéndolos de nuevo sueltos, escribiendo la ruta img/ a mano en cada nombre antes de confirmar.
--------------------------------------------  
3. Declaración de uso de IA

Usé Claude para facilitarme la instalación y configuración de entorno. Interpretar mensajes de error de la terminal y para redactar la primera versión de este archivo y de evidencias.md a partir de mis propias capturas.

--------------------------------------------

# Decisiones TP2
--------------------------------------------
## Qué app elegiste y por qué (contra los criterios de la guía).

**GameRate** es un catálogo de videojuegos con reseñas: los usuarios buscan juegos, califican la
jugabilidad de 1 a 5 y dejan un comentario, y un administrador mantiene el catálogo (altas y bajas
de juegos, moderación de reseñas ajenas). Lo elegí porque queria hacer algo parecido al sistema de Steam.

Contra los 4 criterios de la guía (§3.3):

¿Buildea y corre localmente hoy, sin magia? Sí. `docker compose up -d --build` levanta los 3 servicios desde cero, sin ningún paso manual salvo copiar el `.env`. Lo probé antes de comprometerme y lo sigo probando en cada entrega.

¿Tiene (o podés escribirle) tests?  Todavía no tiene tests escritos, pero es testeable sin cambiar la arquitectura: el backend es una API REST de Express con rutas finas (`supertest` contra `auth.js`/`games.js`/`reviews.js` alcanzaría), y el frontend son componentes React chicos (Vitest + Testing Library). 

¿Entendés el código lo suficiente como para modificarlo?  Sí, a medida que lo codeaba con la Claude Code revisaba cada aspecto del código.
|
Tamaño (CRUD + 2-3 pantallas, no más) | Backend con CRUD sobre 3 entidades (usuarios, juegos, reseñas); frontend con exactamente 3 pantallas (Catálogo, Detalle de juego, Acceso). 



--------------------------------------------
## Decisiones de contenerización: imágenes base elegidas, estructura multi-stage, qué persiste y qué no.

### Imágenes base elegidas

| Componente | Imagen de build | Imagen final | Razón |
|---|---|---|---|
| Backend | `node:22-alpine` | `node:22-alpine` (solo copia `node_modules` ya resueltos) | Alpine usa musl en vez de glibc; un backend Express no necesita nada del sistema operativo completo |
| Frontend | `node:22-alpine` | `nginx:alpine` | Node y Vite no hacen falta en runtime, solo en build. nginx sirve los estáticos compilados y hace de proxy hacia `/api/` |
| Base de datos | — | `postgres:16-alpine` | Versión que usa el proyecto. Alpine por el peso mínimo |

### Estructura multi-stage y persistencia

**¿Por qué multi-stage?**
Separar una etapa de "instalar dependencias/compilar" de una etapa de "correr" evita que la imagen
final cargue con herramientas de build (compiladores, el propio `npm`) que solo hacen falta una
vez, en build time. En el backend la etapa final solo copia `node_modules` ya resueltos; en el
frontend, la etapa final ni siquiera tiene Node adentro: es `nginx:alpine` sirviendo los estáticos
que generó Vite en la etapa anterior.

**Orden de instrucciones para aprovechar el cache:**
Copiamos primero `package*.json`, instalamos dependencias con `npm ci`, y recién después copiamos
el código fuente (`src/` o el resto del proyecto). Así Docker no reinstala todas las dependencias
cada vez que cambia una línea de código — solo cuando cambia el manifiesto de dependencias.

**Qué persiste**
Solo los datos de PostgreSQL, vía el volumen nombrado `db_data`. Los contenedores de `backend` y
`frontend` son descartables a propósito: no guardan estado, así que se pueden recrear
(`docker compose up -d --build`) sin perder nada. Si el volumen se borra explícitamente
(`down -v`), la app vuelve a arrancar con el esquema y los 3 juegos semilla, nunca vacía sin más:
`ensureSchema()` + `seed()` corren en cada arranque y son idempotentes.

**Secretos fuera de las imágenes**
Ninguna contraseña ni clave está escrita en el `Dockerfile` ni en `docker-compose.yml` — entran
todas por variables de entorno (`${DB_PASSWORD}`, `${JWT_SECRET}`, etc.) que a su vez vienen del
`.env` local, no versionado. Esto también permite que la misma imagen sirva en desarrollo y en el
registry sin reconstruirse.

## Problemas encontrados y cómo los resolviste.

Tuve problemas para generar el token, ponerlo en la terminal pero los resolví consultando con la IA y usando la terminal de bash.

## Declaración de uso de IA

Use Claude code para la redacción de este archivo y el de evidencias.md. Me ayudo a seguir los pasos de la guía con explicaciones sencillas.

La app fue creada totalmente por Claude Code en base a una idea mía sobre hacer un sistema similar al de las reseñas de Steam.

--------------------------------------
#Decisiones TP3

Duración del sprint.
Elegí sprints de 1 semana, alineados con el ritmo de entrega de la materia. Cerraría la historia de CI antes de arrancar el TP4.

Número del límite de trabajo en progreso
Puse 2 tareas como límite para evitar el hecho de hacer demasiadas cosas al mismo tiempo y que nada se termine estancando el progreso. El video sugiere n trabajadores +1, y como yo estoy solo serían 2.

Diagnóstico de la historia mal escrita: por qué está mal escrita y cómo la reescribirías. Dos renglones.

"Como desarrollador quiero crear la tabla reseñas" es una tarea disfrazada de historia: no hay un beneficio observable para un usuario, es trabajo técnico interno de infraestructura de datos. La reescribiría como "Como usuario quiero dejar una reseña de un juego para compartir mi opinión con otros jugadores",  ahí sí hay un rol, una capacidad y un beneficio claros, y "crear la tabla reseñas" pasaría a ser una tarea técnica dentro de esa historia, no una historia en sí misma.

Problemas encontrados y cómo los resolviste.

Un problema fue con Closes #123: lo puse en un comentario del PR en vez de en la descripción original, y el número tampoco correspondía a una tarea real de mi repo. GitHub solo cierra un issue automáticamente si Closes #N está en la descripción del PR o en un commit.  Lo resolví editando la descripción original del PR (#16) con el número de la tarea real (#13); ahí quedó como link activo y, al mergear, la tarea se cerró sola y pasó a Done en el board.

Declaración de uso de IA
Utilicé IA para adaptar el ejemplo del video del historia mal escrita a mi trabajo.