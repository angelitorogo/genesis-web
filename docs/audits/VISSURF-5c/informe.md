# Informe técnico VISSURF.5c

## Diagnóstico

El atlas VISSURF.5b ya contiene albedo, altura, rugosidad y normales de más resolución, pero el pipeline inicial aplicaba `normalScale=0.72`, conservaba `bumpMap` aun en presencia de `normalMap` y filtraba todos los atlas con la configuración genérica de textura. El agua procedimental seguía teniendo rugosidad suficientemente baja para generar un reflejo directo muy visible.

Una mancha blanca en capturas no permite afirmar que sea especular: pueden intervenir capas de nubes y atmósfera. Se añaden modos de diagnóstico para comprobarlo sin modificar esas capas.

## Cambios acotados

- Intensidad de normales a `0.98` (sin aumentar altura geológica).
- Exclusión explícita de `bumpMap` cuando existe `normalMap`.
- Anisotropía `4`, mipmap lineal y colorSpace correcto **solo** en los atlas sólidos.
- Rugosidad perceptual reescalada únicamente en los píxeles WATER de la copia HD del mapa de rugosidad; resto de clases y color de superficie intactos.
- Modos diagnósticos por URL con composición por capas y visualización de mapas.

## Criterios de cierre

1. Pasa el test nuevo y la batería general existente.
2. La misma superficie conserva sus costas, regiones vegetales y atlas científico.
3. El foco cercano sigue usando LOD de detalle y libera las texturas temporales.
4. La comparación en WebGL muestra el relieve sin reintroducir anillos/círculos artificiales.
5. El diagnóstico confirma de dónde viene el blanco del océano (reflejo, nubes, atmósfera o combinación).

No considerar el punto 4/5 demostrado hasta revisar capturas reales.
