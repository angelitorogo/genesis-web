# GENESIS 38.2g.a — Estabilización de materiales biológicos humanoides

## Objetivo
Eliminar shimmering/pixelado del material biológico de humanoides manteniendo determinismo, pigmentación procedural, microrelieve y variación visual por especie.

## Cambios realizados

### 1. Coordenadas anatómicas estables
- La pigmentación procedural y el microrelieve se evalúan en `vida38StableCoord(point)`.
- Esa coordenada deriva de `position` local y `uVida38MetersPerUnit`, por lo que el patrón queda fijado a la anatomía y no depende de pantalla ni cámara.
- No se usa `gl_FragCoord` ni espacio de vista para decidir el patrón de color.

### 2. Pigmentación de baja/media frecuencia
- Se sustituyó el patrón granular de alta frecuencia por manchas más amplias basadas en:
  - `vida38Fbm` de macroforma,
  - deformación suave (`macroWarp`),
  - variantes `SOLID`, `BANDS`, `SPOTS` y `MOTTLED` con transiciones suaves.
- Las manchas quedan integradas en la piel en vez de aparecer como ruido digital.

### 3. Antialias procedural
- Se añadieron auxiliares `vida38AA` y `vida38AABand` basados en `fwidth(...)`.
- Los umbrales de bandas, motas, poros y escamas se suavizan adaptativamente según resolución y distancia.

### 4. Microrelieve y especular reducidos
- Se redujo la frecuencia e intensidad del relieve superficial.
- La rugosidad ahora varía con amplitud más baja.
- `clearcoat`, `sheen`, `specularIntensity` y `uVida38SkinDetail` se bajaron para evitar parpadeo y aspecto plástico.

## Criterios cubiertos
- El patrón permanece “pegado” al cuerpo.
- Se elimina el aspecto de ruido pixelado.
- Las manchas son orgánicas, más amplias y suaves.
- El sombreado deja de producir shimmering evidente por exceso de microdetalle.

## No cambia
- No cambia la malla anatómica 38.2e/38.2f/38.2g.
- No cambia el contrato 38.1.
- No se altera el determinismo por `speciesId` / semilla.
