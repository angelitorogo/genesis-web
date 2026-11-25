# Auditoría técnica — GENESIS 38.bis-T7h

## Causa reproducida

T7g invocaba `heightField` hasta tres veces por píxel de una textura RGBA de 1024²; cada llamada recorría docenas de cráteres y funciones de ruido. Esta evaluación síncrona bloqueaba la interacción al abrir el modal.

La misma geometría desplazaba el terreno hasta aproximadamente `0.0062 × bodyRadiusScene`, un relieve muy superior a la escala real de los edificios; al combinarlo con la opacidad 0,97 y una textura gris formaba una capa de aparente niebla por delante de la colonia.

## Corrección

- Generación lineal de texturas con `Float32Array`, cinco niveles de ruido, normalización local y estampación espacial de cráteres.
- Dos LOD: terreno amplio 512×512 y microdetalle próximo 768×768; no se recalculan al mover la cámara.
- Límite estricto de microrelieve `min(footprintScene × 0.025, bodyRadiusScene × 0.000012)`, con zona central aplanada.
- Materiales de transparencia moderada, `depthTest: true`, `depthWrite: false` y caída de alfa en los bordes.
- Integración en el grupo de la colonia y liberación de ambos LOD al cerrar.
- Sin cambios físicos/persistentes, cámara local sin zoom adicional ni renderizador WebGL extra.

## Limitaciones

Auditoría portátil y de CPU no sustituyen la comprobación Angular/E2E en la aplicación completa. La latencia real de apertura (objetivo 2–3 s) depende de GPU/driver, renderización y número de escenas vivas.
