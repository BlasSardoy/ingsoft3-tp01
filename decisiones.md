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
# Decisiones TP3

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

------------------------------------
# Decisiones TP4
--------------------------------------------
## Estructura del pipeline: por qué esos jobs y por qué en paralelo

Dos jobs, `build-backend` y `build-frontend`, uno por cada Dockerfile que ya tenía del TP2.
Corren en paralelo porque son independientes entre sí, así que no tiene sentido serializarlos y hacer esperar uno al otro. Cada uno corre en su propio runner limpio, sin compartir filesystem.

## Qué cachea mi pipeline y qué pasa si el cache desaparece

Se cachean las capas de cada imagen (`cache-from`/`cache-to: type=gha`), con un `scope`
distinto por job (`backend` / `frontend`) para que no se pisen entre sí. Como mi Dockerfile
copia primero `package*.json` y corre `npm ci` antes de copiar el resto del código, esa capa se
reutiliza cuando solo cambio código y no dependencias. Si el cache desaparece,el pipeline construye todo de cero,más lento, pero funciona igual: el cache es una optimizacipn, no depenencia.

## Por qué el pipeline construye con mi Dockerfile en vez de compilar por su cuenta

Si el workflow instalara dependencias y armara la app con sus propios comandos (`npm install`,
`npm run build`), tendría dos definiciones de build distintas, la del pipeline y la que
realmente se usa para desplegar, que tarde o temprano divergen. Usando el mismo Dockerfile del
TP2, lo que se verifica en CI es exactamente lo que se despliega.

## Problemas encontrados y cómo los resolví

Activé el gate pidiendo los checks build-backend/build-frontend antes de mergear a main el workflow real, así que la rama de la demo partió de un main viejo con un job distinto (build, del TP3) y quedó bloqueada por checks que nunca iban a existir, no por el build roto. Lo resolví mergeando primero el workflow real y recreando la rama de la demo desde ese main actualizado.

## Declaración de uso de IA

Usé Claude  para elegir dónde romper el build (el frontend, porque el backend Express no compila ni empaqueta). Me ayodó para escribir mis ideas en el archivo de decisiones.md.

------------------------------------
# Decisiones TP5
--------------------------------------------

> Esta sección responde exactamente las preguntas que pide 05-testing-calidad.md (sección
> "Trabajo Práctico 05 › Entregables"), no un registro por PR. Cada link va pegado a la decisión
> que prueba. Los borradores de cada respuesta los propone la IA; quedan para reescribirlos con
> mis propias palabras antes de la defensa.

## Qué lógica elegí testear y por qué ésa

Backend: las REGLA 1 (contraseña ≥ 6 y campos obligatorios), REGLA 2 (rating 1-5, entero),
REGLA 3 (usuario/email único), REGLA 5 (sólo admin crea/borra juegos) y REGLA 6 (sólo el dueño
o un admin borra una reseña) — 32 tests repartidos sobre esas reglas más los servicios que las
rodean. Elegí ésas porque son donde un bug duele de verdad: un usuario borrando reseñas ajenas,
o un usuario cualquiera dándose de alta como si fuera admin desde el cliente (la REGLA 5 se
aplica en el backend aunque el botón esté escondido en el front, por eso el middleware se
testea directo). Frontend: las mismas tres técnicas sobre `puedeEnviarAcceso`,
`puedeEnviarResena`, `puedeGuardarJuego` y `estrellasLlenas`, más el cliente HTTP (`request`).

REGLA 4 (una reseña por usuario y juego) queda **fuera** de la suite: vive en el `ON CONFLICT`
del SQL y en el `UNIQUE` de la tabla (`db.js`), no en código JavaScript — es terreno de
integración (probarla de verdad exige una base real), no unitario.

Link a la corrida con la suite verde (back + front, 47 tests): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39155581112

## Umbral de coverage

**Backend**: `lines: 85`, `branches: 75`. La medición real del día es 90.11% líneas y 79.24%
ramas — puse el umbral unos puntos abajo de cada uno para que no se rompa por una fluctuación
chica, pero sí se rompa si baja de verdad. Gran parte de la brecha en ramas es a propósito: el
`req.user?.role` de `requireAdmin` queda sin testear para el ejercicio del camino sin cubrir.

**Frontend**: `lines: 90`, `branches: 75`. Medición real: 97.5% líneas y 82.35% ramas — acá la
cobertura es más alta porque `src/lib/**` son funciones puras chicas, sin ramas de manejo de
errores de infraestructura como las que sí tiene el backend.

Para subir cualquiera de los dos números haría falta cubrir las ramas de error que hoy no se
ejercitan a propósito (la de `requireAdmin`) o las del `catch` genérico de cada servicio (el
`throw err;` que recae en el 500 del handler, no testeado porque no es una regla de negocio,
es el camino "la base explotó por algo que no previ").

Link a la corrida con el Summary (coverage de los dos lados, publicado y descargable): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39155581112

**Prueba de que el freno funciona de verdad**: antes de mergear este PR, comenté a propósito
los 4 tests de `juegos.test.js` (`it.skip`) en esta misma rama. La cobertura de líneas del
backend cayó a 77.19% — debajo del umbral de 85% — y el job se puso en rojo con
`ERROR: Coverage for lines (77.19%) does not meet global threshold (85%)`:
https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39155760336. Después revertí el
`it.skip` y la corrida siguiente volvió a verde.

## Qué quedó fuera de la cuenta de cobertura

**Backend**: `src/index.js` (arranque, cablea Express), `src/seed.js` (datos de ejemplo),
`src/db.js` (el esquema SQL, terreno de integración) y `src/routes/**` — este último se pudo
excluir porque **primero** se sacó toda la lógica que tenía (los obligatorios de
`POST /games`, el 404 de juego/reseña inexistente, la traducción del 23503, la comparación de
credenciales del login) a `src/reglas.js` y `src/servicios/**`; si algo de eso se hubiera
quedado en la ruta, excluir `routes/**` habría sido esconder código sin testear, no medir lo
que importa.

**Frontend**: todo lo que no es `src/lib/**` ni `src/api.js` — components y pages, que se
verifican con e2e en el TP7 (ahí sí importa el DOM, acá los tests son sin DOM a propósito).

## Por qué coverage alto no garantiza calidad

El ejemplo propio: `validarRating` tenía `!rating || rating < 1 || rating > 5`. Esa línea
estaba 100% cubierta por los tests que probaban 0 y 6 — y la regla igual dejaba pasar `"abc"`
y `2.5`, que JavaScript no rechaza con ese chequeo. Recién la base los rechazaba al convertir a
`SMALLINT`, así que la API respondía 500 en vez de 400: un bug real, invisible para el
coverage, porque coverage mide que la línea se ejecutó, no que la regla esté bien escrita. Lo
corregí con `Number.isInteger` (PR 1) y agregué el caso `2.5` al test parametrizado, que antes
del fix se ponía en rojo.

## Mi Pull Request bloqueado

El PR 4 agrega `frontend/src/lib/etiquetas.js` (función `etiquetaDePuntaje`) sin ningún test: una función con cuatro
caminos (sin reseñas / mixto / bien valorado / aclamado) que compila perfecto y no rompe nada.
El check `build-frontend` se puso en rojo, en la métrica **líneas** (82.25% medido, contra el
umbral de 90%), con vitest 3: `ERROR: Coverage for lines (82.25%) does not meet global
threshold (90%)`. El paso `Construir la imagen del frontend` (el build normal) y el de
`Construir la etapa de tests` compilaron los dos sin problema — lo que frenó fue sólo el paso de
coverage, no la compilación: es la prueba de que éste es el gate del TP5 y no el del TP4.

Corrida roja: https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39156227929
PR: https://github.com/BlasSardoy/ingsoft3-tp01/pull/32

Para arreglarlo escribí un test por cada camino de `etiquetaDePuntaje` (parametrizado,
`it.each`), con lo que la cobertura volvió a estar arriba del umbral.

## Refactor para poder mockear

Antes, `registrarUsuario` y `borrarResena` (y el resto de los handlers) importaban `pool`
directamente adentro del archivo de rutas — no había forma de reemplazarlo por un doble desde
un test sin pegarle a una base de verdad. El refactor del PR 1 movió esa lógica a
`src/servicios/{usuarios,resenas,juegos}.js`, donde cada función recibe `db` **por parámetro**
en vez de importar `pool`; quien la llama decide qué le pasa (la app real le pasa el pool de
verdad, el test le pasa un objeto falso con un `.query` controlado). Lo mismo del lado del
front: `request` en `api.js` recibe `fetchFn` por parámetro (`fetch` por defecto), así el test
le pasa un `vi.fn()` en vez de salir a la red.

Link al PR 1: https://github.com/BlasSardoy/ingsoft3-tp01/pull/29
Link al PR 2: https://github.com/BlasSardoy/ingsoft3-tp01/pull/30

## Mi stack contra la tabla «Tu stack, de un vistazo»

GameRate no es el stack de la cátedra (.NET + vitest): el backend es Node 22 + Express
(CommonJS), no .NET — pero se usa **vitest 3** en los dos lados igual, así que la fila del
medidor de cobertura y la del umbral son las mismas que la guía. Parametrizado: `it.each`
(igual que en vitest de la guía). Doble: `vi.fn()` (no hay Moq porque no hay .NET). Dónde
viven los tests: al lado del código (`algo.test.js`), como en cualquier proyecto JS/TS — no
hay carpeta de tests aparte, porque ni CommonJS ni vitest la piden. Qué entra en la cuenta:
`include`/`exclude` de `coverage` en `vitest.config.js`/`vite.config.js` (el backend excluye,
el frontend sólo incluye). Etapa de tests: `npm ci` **sin** `--omit=dev` en una etapa propia del
Dockerfile, ni `FROM deps` (que instaló sin devDependencies) ni `FROM build` del backend (no
existe esa etapa ahí) — el frontend sí puede `FROM build AS test` porque esa etapa ya tiene
Node y todas las dependencias.

## El ejercicio del camino sin cubrir

_(se completa en el PR 4 o el PR 5, con el reporte HTML de coverage: qué línea es, qué entrada la
recorrería, y qué se decidió)_

## Problemas encontrados

- Corriendo `docker run -e COVERAGE_DIR=/salida/reporte ...` desde Git Bash en Windows, la ruta
  `/salida/reporte` se traducía sola a una ruta de Windows (mangling de MSYS) antes de llegarle
  al contenedor, y vitest fallaba con "No test files found" interpretando el pedazo mangleado
  como un filtro de archivos. Se resolvía con `MSYS_NO_PATHCONV=1` antes del `docker run` — sólo
  hace falta para probar la receta a mano en Windows; en el pipeline (Linux) no pasa.

## Declaración de uso de IA

_(se completa al cierre, con qué hizo Claude Code, qué hizo Blas, y cómo se verificó cada parte)_
