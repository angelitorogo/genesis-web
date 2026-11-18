# VISSURF.5b — Auditoría técnica del pulido final

## Base
VISSURF.5a, mismo export y misma integración de `SystemScene` y ficha científica.

## Cambios incluidos

1. Aumento moderado y condicionado de las normales de terreno: el refuerzo decrece al aumentar el gradiente y desaparece sobre cambios bruscos. Se conservan macroformas y alturas del modelo visual previo.
2. Refinamiento cromático y de rugosidad de terrenos áridos ligado a grandes regiones sedimentarias, badlands y depósitos aluviales.
3. Distribución forestal regional con densidad, claros pequeños y humedad de valles. La paleta de cada especie sigue siendo su propia paleta procedural y no se convierte automáticamente a verde.
4. Mapa de rugosidad oceánica más alto para moderar las reflexiones especulares, con aguas costeras algo más rugosas y preservación de la batimetría aparente.
5. Mezcla controlada de colores de clases terrestres: ningún suavizado mezcla agua con tierra ni altera la máscara de clases.

## Invariantes

- `classMask` idéntica a VISSURF.2 para la misma semilla, a nivel de píxel.
- Entradas y máscaras científicas inmutables.
- Costura longitudinal cerrada en albedo, relieve, rugosidad y normales.
- Determinismo con el mismo seed y compatibilidad entre resoluciones 1024×512 / 2048×1024.
- Nubes, emisiones urbanas, shaders estelares, sombras orbitales e IndexedDB sin modificaciones.
- Sin retorno de `Math.abs(noise - constante)` como aislínea de crestas/valles.

## Evidencia aislada (muestra sintética mixta, semilla 0x257691ab)

| Métrica | VISSURF.5a | VISSURF.5b |
|---|---:|---:|
| Rugosidad media del agua (0–255) | 67,77 | 117,4 |
| Contraste medio de normales rocosas | 24,42 | 26,39 |
| Normales rocosas extremas (>80) | 1,52 % | 1,93 % |
| Rango tonal verde en desiertos | 45 | 52 |
| Rango tonal verde en vegetación violeta | 74 | 85 |
| Diferencias de máscara científica | 0 | 0 |

Estos datos son de un **fixture sintético**, no de la captura real ni de un render WebGL. La calibración visual final queda pendiente de contrastar en el navegador del usuario.

## Pruebas

- Suite aislada VISSURF.5a + VISSURF.5 + VISSURF.5b: 12/12 casos correctos.
- Auditoría VISSURF.5a: 3 semillas, sin patrones de aislíneas extremas en el escenario rocoso.
- Auditoría VISSURF.5b: 3 semillas mixtas, rugosidad oceánica/relieve/pigmentos/costura.
- Angular/Vitest oficiales y render WebGL: pendientes de ejecución en la instalación completa.
