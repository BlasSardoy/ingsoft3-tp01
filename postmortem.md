# Postmortem: API de PROD caída — 25/10/2026

Formato blameless: se analiza qué permitió el incidente, no quién lo causó.

## Resumen

La api de PROD estuvo caída 36 min (23:41 → 00:17). El monitor externo avisó a los 6 min.

## Impacto

Front y api de PROD sin servicio durante 36 min. Sin usuarios reales afectados: fue la caída controlada del TP9.

## Timeline

| Hora | Qué pasó |
|---|---|
| 23:41 | Suspensión de `gamerate-api-prod` en Render. |
| 23:47 | UptimeRobot detecta DOWN y manda el mail (detección: 6 min). |
| 23:47 | Resume del servicio en Render. |
| 23:47–00:15 | El servicio queda dormido: Render le contesta 503 al monitor mientras no llegue un pedido real. |
| ~00:15 | Pedido manual a `/health` desde el navegador: el servicio despierta. |
| 00:17 | UptimeRobot detecta UP y manda el mail. |
| Verificación | `/api/games` y `/api/falla` responden; PROD sigue con la imagen del último deploy (Sentry incluido). |

## Causa raíz (del SISTEMA, no de una persona)

- **PROD se puede suspender por fuera del pipeline:** cualquiera con acceso al dashboard de Render puede suspender PROD sin aprobación ni rastro en el repo. El cambio no pasa por el pipeline.
- **La recuperación es lenta:** en free tier, después del Resume el servicio queda dormido hasta recibir tráfico real. El monitor pregunta, pero no alcanza a despertarlo a tiempo.
- **No había nada externo vigilando:** antes de este TP, la primera suspensión de prueba (23:27) la hice sin el monitor creado y nadie se enteró. Es el mismo escenario del sábado del enunciado.

## Acciones (dueño: yo)

- Monitor externo sobre `/health` de PROD. Hecho en este TP; se pausa fuera de uso por las 750 h de Render.
- Limitar quién tiene acceso al workspace de Render. En un proyecto real, los cambios de estado de PROD van sólo por pipeline.
- Después de un Resume, despertar el servicio con un pedido a `/health` como parte del procedimiento (o pagar una instancia sin sleep).
- En un proyecto real, mandar la alerta a un canal del equipo y no sólo a un mail.

## Aprendizajes

- **Tiempo de detección con monitor:** 6 min. Sin monitor: lo que tarde un usuario en avisar (en el enunciado, 40 min).
- **El UP tarda mucho más que el DOWN en free tier:** 30 min desde el Resume, por el sleep de Render.
- **La pregunta no es quién suspendió,** sino qué permitió suspender PROD sin pasar por el pipeline y sin que nadie se entere.
