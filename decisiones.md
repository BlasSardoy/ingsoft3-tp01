Decisiones — TP1
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
