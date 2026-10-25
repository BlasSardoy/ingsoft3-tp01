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

# Decisiones TP6
--------------------------------------------

## Enlaces del TP6

- Paquetes públicos (etiquetados `sha-<commit del merge>`, se bajan sin credenciales):
  - https://github.com/BlasSardoy/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend
  - https://github.com/BlasSardoy/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend
- Cadena, eslabón 2 (PR con tests en verde, "Entrar al registry" salteado): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39291635394/job/118193481546
- Cadena, eslabón 3 (main: "Construir y publicar" es el último paso): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39293687910/job/118200598264
- QA: https://gamerate-front-qa.onrender.com · https://gamerate-api-qa.onrender.com
- PROD: https://gamerate-front-prod.onrender.com · https://gamerate-api-prod.onrender.com

## Por qué el artefacto se publica sólo con la verificación en verde

La publicación depende de una cadena de 3 eslabones:

1. **Nada entra a `main` sin el pipeline verde:** los required checks del TP4 más el umbral de cobertura del TP5. El PR #33 sigue frenado.
2. **Sólo `main` publica:** `push: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}`, y "Entrar al registry" corre con `if: github.event_name == 'push'`. En un PR los tests corren y el login se saltea: https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39291635394/job/118193481546
3. **"Construir y publicar" es el ÚLTIMO paso del mismo job que corre los tests:** si fallan, el job muere y nunca llega. No hay un `if` "si los tests pasaron": la condición es el orden de los pasos. https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39293687910/job/118200598264

Si se publicara igual, "estar en el registry" dejaría de significar "pasó la verificación".

**Qué NO garantiza:** un `docker push` a mano desde mi máquina entra igual. La cadena cubre lo que publica el pipeline, no lo que físicamente puede entrar. Además, el tag `sha-` identifica el commit; la imagen exacta la identifica el digest `sha256`.

**Permisos:** `permissions` por job (`contents: read`, `packages: write`), no a nivel workflow: mínimo privilegio. Uso `GITHUB_TOKEN`, sin secrets nuevos. El nombre de la imagen va escrito a mano en minúsculas, porque el usuario `BlasSardoy` tiene mayúsculas y el registry no las acepta.

**Comprobación:** `docker logout ghcr.io` y después `docker pull` de las dos imágenes `sha-2d3e982879ef20e411792213d72bf514a816f5f6`, sin credenciales.
- https://github.com/BlasSardoy/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend
- https://github.com/BlasSardoy/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend

## Continuous Delivery vs Continuous Deployment

Implementé **Continuous Delivery**: QA se despliega solo, PROD sólo con aprobación humana.

No hice Continuous Deployment porque mi red de seguridad hoy es unit tests + smoke, sin e2e ni monitoreo. Automatizar PROD sería automatizar la propagación de errores. Para dar ese paso me faltaría e2e contra QA (TP7) y observabilidad con alertas (TP9).

## Diseño de la cadena y alcance de cada secret

**La cadena:** `build-backend` + `build-frontend` (en paralelo) → `deploy-qa` (`needs:` ambos, `if:` main, `environment: qa`) → `deploy-prod` (`needs: deploy-qa`, `environment: production` con required reviewer, `concurrency` `deploy-prod`). `deploy-prod` no repite el `if`: lo hereda por la cadena. En un PR `deploy-qa` se saltea y `deploy-prod` también.

**`&ref=$GITHUB_SHA` en los 4 hooks:** se despliega el commit verificado/aprobado, no la punta de `main`. Con dos merges seguidos, sin `&ref` la corrida de A desplegaría B; en PROD aprobaría A y subiría lo último. Va con `&` y no con `?` porque la URL del hook ya trae su propio parámetro de clave.

**Secrets:** `RENDER_HOOK_API_QA` y `RENDER_HOOK_FRONT_QA` son environment secrets de `qa`; `RENDER_HOOK_API_PROD` y `RENDER_HOOK_FRONT_PROD`, de `production`. Sin aprobación, ningún job los lee. No hay secrets de deploy a nivel repo: si estuvieran ahí, cualquier job (incluso el de un PR contra `main`) podría disparar PROD. El registry usa `GITHUB_TOKEN`.

**Auto-Deploy en Off** en los 4 servicios de Render: el deploy lo dispara el pipeline, no el proveedor.

**Qué quedó por variable y qué adentro de la imagen:**
- Front: `BACKEND_URL` y `DNS_RESOLVER` por variable, con la plantilla `/etc/nginx/templates/default.conf.template`. Los defaults de compose (`http://backend:8080` y `127.0.0.11`) están en el Dockerfile, así `docker compose up` sigue igual.
- Back: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. `PORT` lo define Render.
- Adentro de la imagen: el código, el build de Vite y las dependencias.

Por eso la misma imagen sirve en QA y en PROD: es lo que hace posible el TP7.

Saqué `proxy_set_header Host $host` del nginx: con esa línea Render recibía el host del front y no sabía a qué servicio rutear el pedido.

**Una base por entorno:** `app_qa` y `app_prod` en Neon, en el mismo proyecto. "production" es sólo el nombre de la branch por defecto de Neon; los entornos los separan las dos bases. El esquema lo crea `ensureSchema()` (`CREATE TABLE IF NOT EXISTS`) + `seed()` al arrancar el backend.

**Cómo comprobé que cada entorno usa su base:** inserté un juego "SOY PROD" SÓLO en `app_prod` desde el SQL Editor de Neon. Aparece en https://gamerate-api-prod.onrender.com/api/games y en el front de PROD, y NO en https://gamerate-api-qa.onrender.com/api/games. Lo dejo cargado para repetirlo en la defensa. Además, el Service ID de cada hook de PROD coincide con el de `gamerate-api-prod` y `gamerate-front-prod`.

## Qué mira mi aprobador antes de aprobar

- Que `deploy-qa` de ESA corrida esté verde (smoke OK) y que QA muestre el cambio.
- Qué cambia el commit (el PR y su diff). Si toca config o infraestructura de deploy, más cuidado. Si toca el esquema de la base, que sea compatible con la versión que está en PROD.
- Timing: no aprobar si no voy a poder mirar PROD después (en un equipo real: horas pico, sin guardia).
- Tener anotado el SHA del último deploy bueno de PROD (Deployments → production) ANTES de aprobar: es lo que necesito si tengo que volver.
- Si hay dos corridas esperando, rechazar la vieja a mano. `concurrency` (`group: deploy-prod`, `cancel-in-progress: false`) evita que dos deploys a PROD se pisen, pero NO ordena la cola de aprobaciones: si apruebo la vieja después de la nueva, PROD retrocede.

**Rechazo:** corrida #64 (merge del #41) https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39646268067. Era el primer deploy a PROD con la plantilla de nginx, que en QA había fallado por un typo en `DNS_RESOLVER` (corrida #62, intento 1). Antes de aprobar quise revisar las variables de `gamerate-front-prod` y que los hooks de PROD apuntaran a los servicios `-prod`. Lo revisé: estaban bien.

**Aprobación con cambio visible:** corrida #66 (merge del #42, nuevo subtítulo del catálogo "Puntuá cada juego del 1 al 5…") https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39647027581

**Qué NO puede ver mi aprobador:** si la app funciona para un usuario real más allá del smoke (login, reseñas), errores en logs, métricas de uso. Me falta observabilidad (TP9).

## Letra chica del free tier

- **Render:** 750 h de instancia por mes POR WORKSPACE, compartidas por los 4 servicios. Duermen a los 15 min sin tráfico, con cold start de hasta ~50 s. 500 min de build por mes, y cada promoción reconstruye hasta 4 servicios. Si se acaban los minutos de build, el hook responde igual y el smoke da verde contra la versión vieja.
- **Neon:** 0.5 GB. El cómputo se suspende a los ~5 min sin uso y se despierta solo. Descarté el Postgres de Render porque el gratuito expira a los 30 días.
- **Cómo lo maneja el pipeline:** smoke con 30 reintentos cada 20 s y `--max-time 10` en cada `curl`.
- **Presupuesto:** no tengo nada haciendo ping; los servicios duermen solos, así que las horas alcanzan hasta la defensa. Reviso el consumo en Workspace → Billing.

## Qué garantía pierdo porque Render reconstruye

Promuevo el mismo COMMIT, no la misma IMAGEN. Lo que corre en QA y PROD es otra construcción, no la imagen que verificaron los tests, y puede salir distinta: `node:22-alpine` y `nginx:alpine` son tags que se mueven, y un build posterior puede tomar otra imagen base. La imagen de ghcr.io queda publicada pero sin usar; desplegarla es el TP7.

## Qué prueba mi smoke y qué no

**Prueba:** `/health` (proceso vivo), `/api/games` de la api (la base responde), `/` del front (sirve la SPA) y `/api/games` del front (la plantilla de nginx llega a SU api). El cuarto chequeo lo agregué yo: sin él, un front sin api pasaba en verde.

**Lo frenó de verdad:** corrida #62, intento 1 https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39641950056/attempts/1. En Render la variable del front de QA estaba escrita `DNS_RESVOLER`. nginx no la encontró y usó el valor por defecto del Dockerfile (`127.0.0.11`, el DNS de Docker, que en Render no existe). Render decía Live, pero `/api` del front daba 502. El smoke quedó en rojo tras 30 reintentos. Lo diagnostiqué con el log de nginx (`recv() failed … while resolving, resolver: 127.0.0.11`), corregí el nombre y el re-run (intento 2) dio verde: https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39641950056

**No prueba QUÉ versión corre:** el hook responde al instante y Render sigue sirviendo la versión vieja mientras construye. Me pasó con el #43: el smoke pasó y `/health` de PROD siguió unos minutos con la versión anterior. Por eso `/health` ahora devuelve el commit (`RENDER_GIT_COMMIT`), corrida #68 https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/39648647975. Compararlo con `github.sha` dentro del smoke queda para el TP7. Tampoco prueba login, reseñas ni permisos.

## Deployment pattern para producción real y rollback

**Elegiría blue-green.** GameRate es chica, duplicar el entorno cuesta poco y el rollback es instantáneo: volver el switch. Canary no: necesita métricas para saber si "el canario sangra", y hoy no las tengo. Cuidado con la base compartida entre blue y green: los cambios de esquema van en dos pasos (expand/contract) para que la versión vieja siga funcionando.

**Qué observabilidad me falta hoy para ejecutarlo:** métricas de errores 5xx y latencia por versión para decidir si el switch salió bien, alertas, y un health check que pruebe más que "responde" (hoy `/health` dice el commit pero no si login o reseñas funcionan). Llega en el TP9.

**Feature flags** los usaría para una feature puntual, por ejemplo un sistema de puntaje nuevo: deploy ≠ release, el código llega apagado y se prende por usuario o porcentaje, y apagarlo es el rollback.

**Plan de rollback actual:**
1. Ver en Deployments → production o en Render el último commit bueno.
2. Copiar los dos hooks de PROD desde Render (Settings → Deploy Hook), porque el secret de GitHub no se puede volver a leer.
3. Dispararlos con ese commit.
4. Esperar Live en Deploys de los dos servicios.
5. Comprobar `/health`, que muestra el commit.

Los comandos, sin los valores de los hooks (nunca se escriben en el repo):

```
SHA_ANTERIOR=<sha del último deploy bueno>
curl -fsS "$HOOK_API_PROD&ref=$SHA_ANTERIOR"
curl -fsS "$HOOK_FRONT_PROD&ref=$SHA_ANTERIOR"
```

Alternativa: re-run del job `deploy-prod` de esa corrida. Pide aprobación, y GitHub sólo lo deja hasta 30 días.

**Medido:** rollback de `3c63bae` a `1d0e1c2`. Disparo a las 15:07:38. En Render, api: inicio 15:07:35 → Live 15:08:03 (27,7 s); front: inicio 15:07:36 → Live 15:08:02 (25,7 s). Total ≈ 28 s. Deploys de Render: `dep-dbcfupqfngtc73aflal0` (api) y `dep-dbcfuq6ea8bs73fdt4ig` (front). Fue rápido porque Render reusó la caché del build; desde cero serían minutos, y en un caso real hay que sumar el tiempo de detectar el problema. `/health` volvió a `{"status":"ok"}` sin commit: prueba visible de que volvió. La métrica DORA que ejercito es el tiempo de recuperación (MTTR).

**Lo que el rollback NO deshace: los datos.** Si un deploy borra una columna o filas, volver el código no las recupera: haría falta un backup o el point-in-time restore de Neon.

## Si Render desaparece mañana, qué sobrevive

- **Sobrevive sin cambios:** build + tests + coverage + umbral, la publicación de imágenes en ghcr.io, la plantilla de nginx por variables, las bases de Neon, los environments `qa`/`production` con sus secrets y el required reviewer, la cadena `needs`/`if` y el smoke (sólo cambian las URLs).
- **Migra:** los dos `curl` a los deploy hooks de `deploy-qa` y `deploy-prod` (se reemplazan por el mecanismo del nuevo proveedor, idealmente desplegando la imagen `sha-` de ghcr.io, que es el TP7), las URLs del smoke y la carga de variables en el nuevo proveedor.
- **Por qué casi todo sobrevive:** el deploy lo dispara el pipeline y la configuración vive en variables. Render sólo ejecuta.

## Mi stack y mi nube

| Lo que hay que lograr | Cómo lo hice |
|---|---|
| Publicar la imagen | `docker/build-push-action` a ghcr.io |
| Sólo main publica | `push:` atado a push + main |
| Etiquetar con el commit | `sha-${{ github.sha }}` |
| Entorno con su configuración | Environments `qa` / `production` de GitHub |
| Deploy disparado por el pipeline | Deploy hooks de Render |
| Desplegar el commit verificado | `&ref=$GITHUB_SHA` |
| Gate humano | Required reviewers |
| Secrets con alcance | Environment secrets |
| Una base por entorno | `app_qa` / `app_prod` en Neon |
| Esquema | `ensureSchema()` + `seed()` al arrancar |
| Smoke | `curl` en loop con reintentos |
| Release | GitHub Releases |
| Conexión a la base | `DATABASE_URL` en formato URI de Postgres con `?sslmode=require` (sin `channel_binding`) |
| Endpoint de vida | `/health` (ahora con commit) |
| Endpoint que toca la base | `/api/games` |
| Front servido | nginx con `dist/` de Vite |
| Dirección del backend | Plantilla con `BACKEND_URL` |

## Problemas encontrados y cómo los resolví

- **Typo `DNS_RESVOLER` en la variable de `gamerate-front-qa`:** nginx usó el default `127.0.0.11` y el front daba 502 con Render diciendo Live. Lo detectó el smoke (corrida #62, intento 1) y lo diagnostiqué con el log de nginx. Lección: un typo en el nombre de una variable no tira error, cae al default en silencio.
- **La cadena de conexión de Neon traía `&channel_binding=require`:** la saqué. El driver `pg` usa la URI con `?sslmode=require`.
- **Se expusieron los deploy hooks de PROD en una captura:** los regeneré en Render y actualicé los environment secrets de `production`. El deploy de este mismo PR a PROD prueba que los hooks nuevos funcionan.
- **El PR #38 quedó desactualizado tras mergear el #39** (el repo exige ramas al día): Update branch y nueva corrida de checks.
- **Corrí sin querer el ejemplo del SQL Editor de Neon** (tabla `playing_with_neon` en `app_qa`): la borré.

## Declaración de uso de IA

Usé Claude (chat) como guía paso a paso y para revisar cada PR antes de mergear, y Claude Code para escribir los cambios del `ci.yml`, la plantilla de nginx, el `/health` con commit y esta sección.

Lo verifiqué así:
- Los PRs con `deploy-qa`/`deploy-prod` salteados y las corridas de `main`.
- `docker pull` sin credenciales.
- "SOY PROD" sólo en PROD.
- El Service ID de los hooks contra los servicios.
- `/health` mostrando el commit.
- El rollback cronometrado en Render.

Leí el `ci.yml` completo y puedo explicar qué pasa entre el merge y PROD: cada compuerta, cada secret y cada espera.

# Decisiones TP7
--------------------------------------------

## Enlaces del TP7

- Paquetes públicos con sus etiquetas `sha-<commit>` (sin `latest`):
  - https://github.com/BlasSardoy/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend
  - https://github.com/BlasSardoy/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend
- Corrida con integración VERDE y e2e ROJA (frenó la promoción):
  - Commit que rompió la app: https://github.com/BlasSardoy/ingsoft3-tp01/commit/d37862dfce6bb923d50ea6c6ed96bfff7d14bdb0
  - Corrida: https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/40134059692
  - Reporte de integración (verde): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/40134059692/artifacts/12576780674
  - Reporte e2e (rojo, con screenshot y traza): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/40134059692/artifacts/12576795973
- Corrida completa en verde posterior, hasta PROD (fix `967bb5c`): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/40134936011
- QA: https://gamerate-front-qa.onrender.com · https://gamerate-api-qa.onrender.com
- PROD: https://gamerate-front-prod.onrender.com · https://gamerate-api-prod.onrender.com

## Build once, deploy many: qué problema del TP6 resuelve

En el TP6 Render reconstruía mi app desde el repo en cada deploy: QA y PROD corrían dos construcciones distintas del mismo commit. `node:22-alpine` y `nginx:alpine` son tags que se mueven: un build de PROD horas después del de QA podía salir con otra imagen base, y lo que probé en QA no era bit a bit lo que llegaba a PROD.

Ahora la imagen se construye UNA vez en `build-backend`/`build-frontend` (último paso, después de los tests) y se publica como `sha-<commit>`. Los 4 servicios de Render son "Existing Image": la bajan y la ejecutan. Prueba: en la corrida verde, `deploy-qa` y `deploy-prod` mandan el MISMO `imgURL` (`…:sha-967bb5cc41d603fc00b8370d5531d4215feb5c57`). https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/40134936011

Cambié la FUENTE de los 4 servicios, no creé servicios nuevos: conservan URL, variables, deploy hooks e historial.

## Estrategia de etiquetas

- **En el registry:** `sha-<commit>` (los 40 caracteres): dice de qué commit salió la imagen. **En git:** `v7.0.0`, el nombre de la versión que está en PROD.
- **`sha-<commit>` es un tag:** se puede volver a publicar con otro contenido (por ejemplo, re-corriendo la corrida de ese commit). Por eso no re-corro corridas viejas para desplegar. Lo que no se mueve es el digest `sha256`. Lo vi en Render: el front de `sha-6534b41…` y el de `sha-608cd54…` tienen el mismo digest (`cb99344…`), porque entre esos commits el front no cambió. Dos etiquetas, el mismo contenido.
- **No publico `latest`:** `latest` no dice qué contenido hay detrás. Un deploy que lo nombre ejecuta "lo último que se publicó", haya pasado las e2e o no.
- **La imagen de Settings no es la que corre:** los 4 servicios están configurados en Render con `sha-6534b4159e6e9c5f1ca68300d7eb642f5a9c6b04`, el último merge cuando cambié la fuente. Cada deploy de mi pipeline manda su `imgURL`, y Render sólo exige que coincidan registry y nombre; el tag puede ser otro. Por eso no uso Manual Deploy: desplegaría la de Settings, la vieja, y llevaría PROD para atrás sin avisar.

## De la release a la imagen, en un paso

`git rev-list -n1 v7.0.0` → el commit → `ghcr.io/blassardoy/ingsoft3-tp01-backend:sha-<ese commit>` y `…-frontend:sha-<ese commit>`. Volver a esa versión = mandar esa imagen al hook con `imgURL`.

## Cómo compruebo desde afuera que un entorno ejecuta mi imagen

- **Events de cada servicio de Render:** "Triggered via Deploy Hook" + la etiqueta `sha-<commit>` de esa corrida. Lo muestro en vivo, porque Events no es público. Además, en el log de la corrida está el `imgURL` de cada deploy.
- **Qué NO prueba el smoke:** sólo pregunta si responde. Si el deploy falla, Render sigue sirviendo la versión anterior y el smoke da verde igual.
- **Hallazgo propio:** mi `/health` devolvía el commit con `RENDER_GIT_COMMIT`, pero esa variable sólo existe cuando Render construye desde git. Con imagen, `/health` ahora dice `"commit":"local"`. Cerrarlo sería hornear el commit en la imagen (un `ARG` en el Dockerfile que el pipeline pase con `build-args`) y que el smoke lo compare con `github.sha`. Es el concepto de §2.4; no lo implementé.

## Qué pruebo en cada suite y por qué

**Integración** (`frontend/e2e/api.spec.js`, fixture `request`, sin navegador, sin dobles, contra https://gamerate-api-qa.onrender.com):
- **(a)** Login admin → `POST /api/games` → `GET` lo encuentra → `DELETE` → `GET` ya no está.
- **(b)** `POST` con título vacío → 400 "obligatorios", y la cantidad de juegos no cambia.
- **(c) La elegí yo: REGLA 4.** Reseñar dos veces el mismo juego deja UNA reseña, con el último puntaje. Esa regla vive en el `UNIQUE(game_id, user_id)` + `ON CONFLICT` de Postgres: en el TP5 la dejé afuera porque ningún unitario con un `db` falso la ve. Si se rompe, un usuario tiene reseñas duplicadas y el promedio queda mal: me escribe cualquiera que reseñe.

**e2e** (`frontend/e2e/juegos.spec.js`, Chromium real contra https://gamerate-front-qa.onrender.com):
- **(1) Creación:** el admin agrega un juego, lo ve, lo borra (acepta el `confirm`) y ya no está.
- **(2) Error:** registrarse con el usuario "admin" (ya existe) muestra "ya existe", y después ingresar con ese email da "Credenciales inválidas": la cuenta no se creó.
- **(3) La elegí yo: la búsqueda por título.** Es lo que el usuario hace todos los días; toca la base y no crea nada. Si no anda, nadie encuentra un juego.

**Qué NO puse:** las reglas finas (rating 1–5, contraseña ≥ 6, bordes) quedan en los unitarios del TP5, que corren en milisegundos. Las reseñas desde el navegador no van en e2e: la regla ya la cubre la integración, y cada e2e cuesta un minuto. Pirámide: muchos abajo, pocos arriba.

**Datos:** todas las que crean datos usan un título con `Date.now()` y borran lo que crean, comprobándolo (en la REGLA 4, en un `finally`).

**Límite:** el flujo 3 depende de que "Celeste" (del seed) exista en QA. Es un dato que el test no fabrica.

**Accesibilidad:** para que las pruebas encuentren los controles como una persona, agregué `role="alert"` en los errores, `aria-label="Borrar <título>"` en cada botón Borrar y `aria-label="Acceso"` en el formulario (el encabezado también tiene un "Ingresar").

## Integración vs e2e: el par que diagnosticó mi rotura

**Rompí el FRONT, no el test:** en el commit `d37862d` cambié el texto del botón "Agregar juego" por "Guardar juego", sin tocar `e2e/`. Unit tests: verdes. https://github.com/BlasSardoy/ingsoft3-tp01/commit/d37862dfce6bb923d50ea6c6ed96bfff7d14bdb0

**Corrida 40134059692:** smoke VERDE (el sistema respondía) → integración VERDE (13 s) → e2e ROJA (2 min 27 s: esperó el botón 60 s y reintentó) → `deploy-prod` no arrancó ni pidió aprobación. PROD siguió con `e497c4c`. https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/40134059692

**Lectura (fila 1 de la tabla de §2.5):** la api y la base están sanas: la integración creó, listó y borró con la base de verdad. El que no usa bien la app es el front. En el reporte e2e sólo falló el flujo de alta; los otros dos, verdes. La traza muestra que el test buscaba el botón "Agregar juego", la captura muestra "Guardar juego", y en Network no hay ningún `POST /api/games`: el alta ni se intentó. Diagnóstico sin abrir el código.
- Reporte de integración (verde): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/40134059692/artifacts/12576780674
- Reporte e2e (rojo): https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/40134059692/artifacts/12576795973

**Si hubiera roto la api:** la integración quedaba roja y la e2e no corría, porque su `needs` no se cumple. Fila 2.

**Arreglo:** PR #49 (`967bb5c`), corrida completa en verde, aprobación, PROD con la misma imagen. https://github.com/BlasSardoy/ingsoft3-tp01/actions/runs/40134936011

**Qué NO ataja mi gate:** lo que no recorren mis 3 flujos y mis 3 pruebas (por ejemplo, reseñas desde el navegador o permisos de un usuario común), lo que sólo pasa con datos o tráfico de PROD, y un problema de PROD que no tenga QA (variables o base distintas).

## Por qué la integración amplia y no la estrecha

**Amplia:** contra la api de QA ya desplegada, ejecutando la imagen exacta de esta corrida, con su Postgres de Neon.
- **Gana:** prueba además que el deploy quedó bien, con el mismo driver y la misma base que PROD, y no tengo que levantar un Postgres en el job.
- **Pierde:** llega más tarde (necesita build + deploy), depende de que Render esté arriba, y QA es compartido: si una prueba no limpia, ensucia la siguiente corrida.

**La estrecha** (la api armada dentro del job contra un Postgres como `services:`) daría feedback antes y aislado, con bastante más configuración.

## Cold start, timeouts y flaky

QA duerme a los 15 min. El smoke de `deploy-qa` lo despierta antes de las suites. Además, `playwright.config.js` tiene timeout de 60 s por test, 15 s por aserción y 1 retry. Nada de `sleep`: Playwright espera solo a que aparezca lo que busca.

**Flaky:** un test que a veces pasa y a veces falla. Es peor que no tener test, porque entrena a ignorar el rojo. Con `retries: 1`, uno que pasa recién al reintentar sale "flaky" en el reporte con la corrida en verde: por eso miro el reporte aunque esté verde.

## La misma imagen del front en QA y PROD

La dirección del backend no está en la imagen: nginx la lee del entorno con la plantilla del TP6 (`BACKEND_URL` y `DNS_RESOLVER`). Adentro de la imagen están el build de Vite, la plantilla y nginx. Por eso la misma `…-frontend:sha-<commit>` corre en QA y en PROD, y cada una habla con su api.

## Límite conocido: QA compartido

- **El problema:** con dos merges seguidos, la corrida B puede redesplegar QA mientras la integración o la e2e de A lo usan. A da un rojo que no es de su código, o un verde que en parte probó la imagen de B.
- **Cómo lo reconozco:** en Events de QA, qué imagen corre y a qué hora; en Actions, si el `deploy-qa` de B fue durante la e2e de A.
- **Qué hago:** rechazo la corrida A con motivo (`concurrency` no ordena la cola de aprobaciones) y vale la B, que trae los dos cambios. Regla: un merge por vez mientras la cadena corre. Un equipo real usaría un entorno por corrida.

## Credenciales de las pruebas

Las suites entran como admin de QA con `QA_ADMIN_EMAIL` y `QA_ADMIN_PASSWORD`. Son secrets de REPOSITORIO porque los jobs `integracion` y `e2e` no están dentro de un environment. Son sólo de QA: las de PROD no las ve ningún job de prueba.

## Mi stack

| Lo que hay que lograr | Cómo lo hice |
|---|---|
| Publicar la imagen etiquetada con el commit | `docker/build-push-action`, tags `sha-${{ github.sha }}` (desde el TP6) |
| Que el entorno ejecute esa imagen | Render "Existing Image" + `imgURL` en el deploy hook |
| Pedirle a la api de verdad, sin navegador | Fixture `request` de Playwright (`api.spec.js`) |
| Navegador de verdad | Playwright + Chromium (`juegos.spec.js`) |
| Apuntar a un entorno u otro | `API_BASE_URL` (api) y `E2E_BASE_URL` (front), variables, no en el código |
| Buscar como una persona | `getByRole` / `getByLabel`, sin selectores CSS |
| Reportes | HTML de Playwright como artefactos `playwright-report-integracion` y `playwright-report-e2e` |

## Problemas encontrados y cómo los resolví

- **`/health` pasó a decir "local" al ejecutar la imagen:** `RENDER_GIT_COMMIT` sólo existe si Render construye desde git. Lo documenté como el hueco de §2.4.
- **vitest toma cualquier `*.spec.js`:** excluí `e2e/**` en `vite.config.js` para que no corra los specs de Playwright.
- **El borrado usa `confirm()`:** Playwright descarta los diálogos por defecto; el test lo acepta con `page.once("dialog")`.
- **Dos botones "Ingresar"** (encabezado y formulario): le di `aria-label="Acceso"` al formulario.
- **Cambié de PC y no estaba el `.env` del compose:** lo recreé desde `.env.example` (no se versiona).
- **Cold start:** el smoke de PROD falló un intento por timeout y pasó en el reintento. Es el contrato del free tier.

## Declaración de uso de IA

Usé Claude (chat) como guía y para revisar cada PR antes de mergear, y Claude Code para escribir el cambio de `imgURL`, las dos suites, los dos jobs, la accesibilidad del front, la rotura y su arreglo, y esta sección.

Lo verifiqué así:
- Corrí las 6 pruebas contra mi compose.
- Vi en Events de los 4 servicios "Triggered via Deploy Hook" con el `sha-` de cada corrida.
- Leí el log con el mismo `imgURL` en QA y PROD.
- Abrí el reporte rojo, la captura y la traza.

Puedo explicar qué verifica cada test, contra qué entorno corre y qué pasa si falla.

# Decisiones TP8
--------------------------------------------

## Riel y versiones

- **Riel canónico:** Terraform (1.16.6 en mi máquina) + Neon + Render. Declaré un entorno NUEVO, preprod: el proyecto de Neon `gamerate-preprod` con su base `app_preprod`, y `gamerate-api-preprod` + `gamerate-front-preprod` en Render con la imagen `sha-fd0875a5eb9d63a8cc133397a16a6f79b4908e6b` del TP7. QA y PROD no se tocaron: siguen clickeados.
- **Providers fijados:** `kislerdm/neon` 0.18.0, `render-oss/render` 1.9.1, `hashicorp/random` 3.7.2. El `.terraform.lock.hcl` está commiteado.
- **Estado:** vive en `infra/terraform.tfstate`, en mi máquina. Está en el `.gitignore` y nunca se commitea: tiene la contraseña del rol en texto plano (lo vi).
- **Ninguna credencial en el HCL:** `NEON_API_KEY`, `RENDER_API_KEY` y `RENDER_OWNER_ID` los leen los providers del entorno.
- **Nada se copia y pega:** mi backend es Node, así que la api recibe `DATABASE_URL` en formato URI, ARMADA en el HCL con el host, el rol y la contraseña que devuelve Neon (con `urlencode`). `JWT_SECRET` y `ADMIN_PASSWORD` los genera `random_password`. La `BACKEND_URL` del front sale de `render_web_service.api.url` (con `trimsuffix` de la barra).

## Diseño del entorno preprod

- **Por qué un entorno NUEVO y no llevar a código QA/PROD:** el valor de IaC se ve creando: "necesito un entorno" se responde con un archivo y un `apply`, no con una tarde de clicks. QA y PROD quedaron intactos (mismas URLs, misma cadena del TP7, cero riesgo antes de la defensa) y sirven de contraste: en mi dashboard conviven entornos que existen porque alguien los clickeó y uno que existe porque está escrito. El escrito lo recreo con un comando; los otros, no.
- **Dónde va en la cadena:** en un equipo, CI → QA → preprod → [aprobación] → PROD. En este TP no lo conecté al pipeline: lo creo y lo pruebo a mano.
- **La misma imagen del TP7:** preprod corre `sha-fd0875a5eb9d63a8cc133397a16a6f79b4908e6b` (la de `v7.0.0`), la misma que verificaron QA, la integración y la e2e. `image_url` va SIN la etiqueta y la etiqueta en `tag`. `image_tag` es fijo a propósito: en Render free un servicio no se puede modificar (el provider manda "maintenance mode" y el plan free lo rechaza), así que para cambiarlo se recrea: `terraform destroy` + `apply`, o `terraform apply -replace=render_web_service.api`. Un entorno desechable no se actualiza: se vuelve a hacer.
- **Un proyecto de Neon propio** (`gamerate-preprod`), no una base más en el de QA/PROD: se destruye entero sin rozar `app_qa` ni `app_prod`.
- **Terraform crea la base, no el esquema:** la base nace vacía y las tablas las crean `ensureSchema()` + `seed()` de mi backend al arrancar (lo vi: `/api/games` trajo los 3 juegos con `created_at` del momento del apply).
- **El orden lo decide el grafo:** de las referencias entre recursos (`neon_project.preprod.id`, `render_web_service.api.url`…) Terraform arma el grafo de dependencias. En el apply: proyecto → rol → base, los `random_password`, la api, y recién después el front (necesita la URL de la api). El destroy lo recorre al revés: front → api → base/rol → proyecto. El plan del destroy los lista alfabéticos; el orden real se ve en las líneas `Destroying...`.
- **`(known after apply)`:** ids, el host de Neon y la URL de la api los asigna el proveedor al crear; por eso la `BACKEND_URL` del front aparece así en el plan.
- **Lo que sigue siendo artesanal en mi cuenta:** QA y PROD (clickeados), sus deploy hooks (el provider de Render no los expone), las API keys de Neon y Render, y el `org_id`/owner id que saqué de las consolas.

## Higiene de secretos y estado

- **Credenciales fuera del código y del disco:** las cargo en cada terminal con `$env:NEON_API_KEY = Read-Host …` (PowerShell), así no quedan en el historial ni en ningún archivo. El `org_id` de Neon y el `RENDER_OWNER_ID` no son secretos.
- **El estado vive en mi máquina** (`infra/terraform.tfstate`, sin bloque `backend` a propósito). El `.gitignore` cubre `*.tfstate`, `*.tfstate.*`, `.terraform/` y `*.tfvars` desde ANTES del primer apply. Lo abrí y vi la contraseña de `app_preprod_owner` en texto plano: por eso nunca se commitea.
- **Si pierdo el estado no pierdo la infraestructura: pierdo la prueba de que es mía.** El próximo plan propondría crear todo de nuevo contra recursos que ya existen; habría que traerlos con `import`. Por eso hago la defensa desde esta máquina.
- **En equipo** el estado iría a un backend remoto con bloqueo (un Postgres, S3, Azure Storage), creado por fuera de este código, para que dos personas o un pipeline no apliquen a la vez.
- **Outputs:** la cadena de conexión NO sale por output (tiene la contraseña); sólo host, nombre de la base y URLs. `admin_password` sale marcado `sensitive`.

## Problemas y cómo los resolví

- **Neon devolvió "org_id is required":** las cuentas nuevas crean proyectos dentro de una organización. Agregué `org_id` al `neon_project`; lo saqué de Organization settings y no es secreto. La guía no lo menciona porque se midió con otra cuenta.
- **Terraform no estaba en el PATH** de la terminal después de instalarlo con winget: había que reabrir VS Code.
- **Al recrear preprod** (destroy → apply), Render devolvió las MISMAS URLs (sin sufijo), y Neon creó un host nuevo (otro proyecto). La URL igual la leo siempre del output.
- **Medido:**
  - Drift: borré `app_preprod` a mano → el plan dio "1 to add" → el apply la repuso.
  - Una `base_intrusa` creada a mano no aparece en el plan ("No changes"): Terraform sólo vigila lo que declaré.
  - Idempotencia: el segundo plan dio "No changes".
  - `prevent_destroy` hizo que el destroy se negara, nombrando `neon_database.preprod`.
- **Regla operativa:** destruyo preprod al terminar cada sesión. Las 750 h de Render son del workspace y ahora son 6 servicios: si me paso, se suspende también PROD.
- **Previstos (no me fallaron porque los apliqué desde el principio siguiendo la guía):** `history_retention_seconds = 21600` (sin eso el primer apply falla: el default de 86400 s supera el tope del plan free) y `default_branch_id` en vez de `branch_id` (con el nombre viejo da `Unsupported attribute`).
- **PowerShell vs Bash:** los comandos de la guía son de Bash (`export`, `read`, `grep`); en la terminal de VS Code (PowerShell) usé `$env:…`, `Read-Host` y `Select-String`.

## Uso de IA

Usé Claude (chat) como guía y Claude Code para escribir los `.tf`. Los `terraform init`/`plan`/`apply`/`destroy` los corrí yo, leyendo cada plan. Puedo explicar qué crea cada acción, qué es `(known after apply)`, de dónde sale la cadena de conexión y la `BACKEND_URL`, y por qué el destroy va en orden inverso al grafo.
