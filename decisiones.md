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

## Qué lógica elegiste testear y por qué ESA (¿dónde duele un bug en tu app?)

Testeé las reglas de negocio de GameRate, que es donde un bug le pega directo al usuario:

- **REGLA 1** (contraseña de 6+ caracteres y campos obligatorios): si falla, se crean cuentas inválidas.
- **REGLA 2** (rating entero de 1 a 5): si falla, entran puntajes como `2.5` o `"abc"` y la API devuelve 500 en vez de 400.
- **REGLA 3** (usuario/email único): si falla, dos personas quedan con la misma cuenta.
- **REGLA 5** (sólo admin crea/borra juegos): si falla, cualquier usuario borra el catálogo. Se aplica en el backend aunque el botón esté escondido en el front, por eso el middleware se testea directo.
- **REGLA 6** (sólo el dueño o un admin borra una reseña): si falla, un usuario borra reseñas ajenas.

Backend: 25 métodos de test (34 casos contando cada fila de `it.each`). Frontend: 10 métodos (19 casos) sobre `puedeEnviarAcceso`, `puedeEnviarResena`, `puedeGuardarJuego`, `estrellasLlenas`, `etiquetaDePuntaje` y el cliente HTTP `request`.

La **REGLA 4** (una reseña por usuario y juego) queda afuera: vive en el `UNIQUE` y el `ON CONFLICT` de la base, no en código JavaScript. Probarla exige una base real, así que es un test de integración.

Corrida con la suite verde: https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39155581112

## Tu umbral de coverage: el número, sobre qué métrica y por qué ése — y el número de rama que te da hoy

El umbral va sobre **líneas y ramas**, en los dos lados:

| | Umbral (líneas / ramas) | Hoy en `main` (líneas / ramas) |
|---|---|---|
| Backend | 85% / 75% | 92.83% / 84.21% |
| Frontend | 90% / 75% | 97.58% / 86.95% |

**Por qué esos números:** los fijé unos puntos abajo de lo que medía cuando armé la suite (backend 90.11% / 79.24%, frontend 97.5% / 82.35%), para que no se rompa por una fluctuación chica pero sí cuando entra código nuevo sin tests. Puse ramas además de líneas porque la de líneas puede dar 100% con un `if` recorrido por un solo camino.

**Por qué no lo subí aunque hoy haya margen:** con esa holgura el umbral igual frena un archivo nuevo sin tests (el PR que dejé abierto bajó el backend a 81.84% con un solo archivo). Para subirlo a 90/80 en el backend tendría que testear lo que hoy queda sin cubrir: el detalle de un juego que existe y el borrado exitoso en `servicios/juegos.js` (66.66% de ramas) y el `catch` genérico de cada servicio, que no es una regla de negocio sino "la base falló por algo que no preví". En el frontend lo que falta es el armado del query string de `listGames` en `api.js`.

Summary con el coverage de los dos lados (y el reporte descargable): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39155581112

## Qué dejaste afuera de la cuenta de cobertura, backend y frontend, y por qué cada cosa

**Backend** (`exclude` en `vitest.config.js`; todo lo demás de `src/` entra solo):
- `src/index.js`: el arranque, cablea Express. No tiene reglas.
- `src/seed.js`: datos de ejemplo.
- `src/db.js`: el esquema SQL, terreno de integración.
- `src/routes/**`: las rutas sólo reciben el pedido, llaman al servicio y responden. Las pude excluir porque **antes** saqué toda su lógica a `reglas.js` y `servicios/**`; si la hubiera dejado ahí, excluirlas sería esconder código sin testear.

**Frontend** (`include` en `vite.config.js`): sólo entran `src/lib/**` y `src/api.js`. Quedan afuera los componentes y las páginas, que son UI y se verifican con e2e en el TP7.

## Por qué coverage alto no garantiza calidad (con TU ejemplo)

`validarRating` tenía `!rating || rating < 1 || rating > 5`. Esa línea estaba 100% cubierta por los tests que probaban 0 y 6, pero la regla dejaba pasar `"abc"` y `2.5`. La base los rechazaba recién al guardarlos y la API respondía 500 en vez de 400. El coverage marcaba la línea como cubierta porque se ejecutó, no porque la regla estuviera bien. Lo corregí con `Number.isInteger` y agregué `2.5` al test parametrizado, que antes del arreglo daba rojo.

## Tu Pull Request bloqueado: qué check se puso en rojo, en qué métrica, por qué, y qué escribiste para arreglarlo

**Primer PR (la secuencia completa):** agregué `etiquetaDePuntaje` en `frontend/src/lib/etiquetas.js`, una función con cuatro caminos y sin tests. Compilaba y todos los tests pasaban, pero el check **`build-frontend`** se puso en rojo por **líneas**:

```
ERROR: Coverage for lines (82.25%) does not meet global threshold (90%)
```

Para arreglarlo escribí un test parametrizado (`it.each`) con un caso por cada camino de la función. La cobertura volvió arriba del umbral, el check pasó a verde y lo mergeé.

- Corrida roja: https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39156227929
- PR mergeado: https://github.com/BlasSardoy/ingsoft3-tp01/pull/32

**Segundo PR (el freno vigente, abierto hasta la defensa):** agregué `backend/src/formato.js` sin tests. El check **`build-backend`** quedó en rojo por **líneas**:

```
ERROR: Coverage for lines (81.84%) does not meet global threshold (85%)
```

- Corrida roja: https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39156607976
- PR abierto: https://github.com/BlasSardoy/ingsoft3-tp01/pull/33

En los dos casos frenó por líneas, no por ramas — pero las ramas también bajaron, no es que una función sin uso no sume ninguna: de 82.35% a 77.77% en el front, de 79.24% a 77.77% en el back. Lo que pasó es que ninguna de las dos cruzó su propio umbral (75%), mientras que las líneas sí cruzaron el suyo (90% y 85%). El umbral de ramas tenía más margen que el de líneas en los dos lados.

## Si refactorizaste para poder mockear: qué cambiaste y por qué no se podía testear antes

Antes, la lógica estaba adentro de las rutas e importaba `pool` (la conexión a PostgreSQL) directamente. No había forma de reemplazar la base por un doble desde un test.

La moví a `src/servicios/{usuarios,resenas,juegos}.js`, donde cada función recibe `db` **por parámetro**. La app real le pasa el `pool`; el test le pasa un objeto falso con un `query: vi.fn()`. Así puedo verificar la interacción, por ejemplo que borrar una reseña ajena llama a la base una sola vez (el `SELECT`) y nunca llega al `DELETE`.

En el frontend hice lo mismo: `request` en `api.js` recibe `fetchFn` por parámetro (`fetch` por defecto), y el test le pasa un `vi.fn()` en vez de salir a la red.

- Refactor del backend: https://github.com/BlasSardoy/ingsoft3-tp01/pull/29
- Refactor del frontend: https://github.com/BlasSardoy/ingsoft3-tp01/pull/30

## Si tu stack no es el de la cátedra (.NET + vitest): qué herramienta usaste para cada fila de la tabla «Tu stack, de un vistazo»

El backend es Node 22 + Express, no .NET. Uso vitest en los dos lados.

| Lo que tenés que lograr | Backend (Node + Express) | Frontend (React + Vite) |
|---|---|---|
| Dónde viven los tests | Al lado del código, `algo.test.js` | Al lado del código, `algo.test.js` |
| Un test parametrizado | `it.each` | `it.each` |
| Que la dependencia entre desde afuera | `db` como parámetro de cada servicio | `fetchFn` como parámetro de `request` |
| Fabricar el doble | `vi.fn()` | `vi.fn()` |
| Medir la cobertura | `vitest run --coverage` con `@vitest/coverage-v8` | Igual |
| Un umbral que rompe el build | `coverage.thresholds` en `vitest.config.js` | `coverage.thresholds` en `vite.config.js` |
| Qué entra en la cuenta | `include: src/**` + `exclude` | `include` |
| Reporte legible | Reporter `html` y `json-summary` (para el Summary) | Igual |
| Herramientas de test en la etapa de tests del Dockerfile | Etapa `test` propia con `npm ci` sin `--omit=dev` (la etapa `deps` instala sin devDependencies) | `FROM build AS test`, que ya tiene todas las dependencias |

## El ejercicio del camino sin cubrir

1. **Qué línea era:** en `backend/src/middleware/auth.js`, función `authenticate`, la línea 24 (`header.startsWith("Bearer ") ? header.slice(7) : null`) y el `if (!token)` de la 26. Ningún test tomaba el camino "sí hay token".
2. **Qué entrada la recorre:** un pedido con el header `Authorization: Bearer <algo>`. Los tests que había mandaban el pedido sin ese header.
3. **Qué decidí:** agregarlos. Escribí dos tests: uno con un token válido (llama a `next()` y completa `req.user`) y otro con un token inválido (responde 401). Con eso `auth.js` pasó de 60% a 100% de ramas.

## Problemas encontrados y cómo los resolviste

- **El reporte HTML no marca bien las ramas:** el reporte de vitest muestra la línea como cubierta aunque uno de sus caminos no lo esté. El detalle real está en `coverage/lcov.info`, en las líneas `BRDA`, que dicen cuántas veces corrió cada rama; la que dice 0 es la que falta.
- **Git Bash en Windows rompía el `docker run`:** al probar el comando a mano, Git Bash convertía `/salida/reporte` en una ruta de Windows y vitest decía "No test files found". Se resuelve con `MSYS_NO_PATHCONV=1` antes del comando. En el pipeline (Linux) no pasa.

## Declaración de uso de IA

Escribí el refactor de inyección de dependencias, los tests de backend y frontend, las etapas `test` de los Dockerfiles y los pasos nuevos del `ci.yml` con asistencia de la IA (Claude Code), que también me ayudó a proponer los umbrales a partir de la medición real.

Lo verifiqué así:
- Probé cada endpoint tocado por el refactor con `curl` contra la app en Docker, antes y después, comparando las respuestas.
- Hice mutantes a mano: invertí `||` por `&&` y corrí bordes de `>` a `>=` en `validarRating`, `puedeBorrarResena`, `puedeEnviarResena` y `puedeEnviarAcceso`, y confirmé que algún test se ponía en rojo.
- Vi el freno funcionar de verdad en los dos PRs, con el mensaje exacto de vitest y el merge bloqueado.
- Hice el ejercicio del camino sin cubrir leyendo yo el `lcov.info`.
- Probé la app completa en el navegador después de cada refactor grande.

**Qué verifican los tests y qué NO cubren.** Revisé cada test que escribí con asistencia de la IA: los de reglas comprueban el resultado (`ok` y el mensaje de error), y los de servicios comprueban además la interacción con la base (por ejemplo, que borrar una reseña ajena llama a `db.query` una sola vez y nunca llega al `DELETE`). Lo que NO está cubierto: el detalle de un juego que existe (`obtenerJuego` con sus reseñas), el borrado exitoso de un juego (`borrarJuego` → 204), el `throw err;` del `catch` genérico de cada servicio, la REGLA 4 (vive en la base, es de integración) y, en el frontend, los componentes y el query string de `listGames`.
