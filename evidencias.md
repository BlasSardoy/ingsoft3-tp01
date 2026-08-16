# Evidencias — TP1

## 1. Push directo a main rechazado
![push rechazado](img/push-rechazado.png)
GitHub rechaza el intento de `git push` directo a `main` con "protected branch hook declined" — la protección de rama alcanza incluso al dueño del repositorio.

## 2. El PR de la rama B no se puede mergear: conflicto
![aviso de conflicto](img/aviso-conflicto.png)
Al intentar mergear el PR de `feature/titulo-b`, GitHub avisa "This branch has conflicts that must be resolved" porque la rama A ya modificó la misma línea del README.

## 3. Marcadores del conflicto
![marcadores del conflicto](img/marcadores-conflicto.png)
El editor de conflictos de GitHub muestra los marcadores `<<<<<<<`, `=======` y `>>>>>>>` delimitando la versión de `feature/titulo-b` (arriba) y la versión ya mergeada en `main` (abajo), sobre la primera línea del README.

## 4. Release v1.0.0 publicada
![release v1.0.0](img/release-v1.png)
La release `v1.0.0` publicada en GitHub, con las notas describiendo qué incluye: main protegida, el flujo de Pull Requests funcionando y un conflicto de merge resuelto.
