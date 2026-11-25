# Auditoría GENESIS LODGRP.2

## Causa principal de la latencia LODGRP.1

`system-scene.ts` comenzaba a preparar texturas GPU únicamente después de que `PlanetaryLodGroupControllerV1` entrase en `READY`, es decir, una vez que el worker había calculado todos los atlas del planeta y sus lunas. La duración de generación y la de subida GPU se **sumaban secuencialmente**. La finalización del grupo también destruía el worker, obligando a crear uno nuevo en la siguiente visita. El umbral de preparación se iniciaba a 62 píxeles de envoltura orbital proyectada.

## Implementación

- `system-scene-planetary-lod-acceleration-lodgrp2.ts`: política anticipada, orden de prioridad, deduplicación de staging, decisión de terminación del worker y métricas puras.
- `system-scene-planetary-lod-group-lodgrp1.ts`: la identidad de grupo ya no depende del orden de las lunas: cambiar de seguimiento dentro del grupo no puede invalidarlo.
- `system-scene-group-atlas-lodgrp1.worker.ts`: conserva la transferencia sin copia de los ArrayBuffer y añade `cpuMs` al resultado del atlas.
- `system-scene.ts`: preinicializa worker al seguir un cuerpo; recibe atlas e inicia preparación GPU de inmediato; el worker procesa la siguiente luna en paralelo; reduce trabajo de arranque en visitas posteriores; mantiene el presupuesto GPU de una textura por fotograma; registra tiempos separados; conserva el commit atómico y rollback.
- Pruebas Vitest y auditoría Node del controlador y funciones puras.

## Invariantes

- No se modifican los generadores de atlas, las semillas, el modelo orbital ni los niveles LOD2.1.
- El grupo usa un único estado lógico `HIGH`, solo tras preparación completa.
- Un solo grupo alto a la vez. No se carga toda la escena.
- Si se abandona un grupo durante el cálculo, el worker obsoleto se termina y la respuesta no puede instalarse.
- Se reutilizan los atlas CPU de la caché con política y presupuesto previos.
- La preparación GPU empieza antes de `READY`, pero la instalación en los materiales no.

## Limitaciones

No hay prueba integrada de navegador en este entorno. Los datos reales de FPS, p95/p99 y memoria deben medirse en Xephus B-11 y Droveria. La subida `renderer.initTexture` se mide por duración de la llamada en JavaScript, no mediante consultas GPU de tiempo transcurrido. Los grupos demasiado grandes siguen degradándose de forma estable a detalle medio cuando supera el presupuesto. Los umbrales 112/160 son iniciales y ajustables tras medir la distancia real de aproximación.
