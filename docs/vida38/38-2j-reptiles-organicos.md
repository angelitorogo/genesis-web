# GENESIS 38.2j — Reptiles orgánicos procedurales

## Estado de esta entrega

Implementación del generador especializado para reptiles de plan corporal `TETRAPOD`. La validación visual Three.js en el proyecto del usuario y su build Angular siguen pendientes. **No se declara cerrada la subfase** hasta su aceptación visual.

## Alcance funcional

- Selector y contrato morfológico inmutable/versionado `Vida38ReptileMorphologyV1`.
- Nueve familias de proporciones, con interpolaciones moderadas: lacértido, iguánido, geco, varano, cocodriliano, acorazado, cuello largo, reptil extendido y semiserpentiforme.
- Cuerpo, cuello, cráneo, mandíbula, patas, dedos, garras y cola integrados en **un mismo campo SDF** con malla indexada cerrada. Las formas menos corrientes conservan plan cuadrúpedo.
- Hocicos y mandíbulas variables; dentición visible diferenciada por `nutrition` (`PREDATOR`, `HERBIVORE`, otros). Los dientes son elementos anatómicos diferenciados y no alteran la malla principal.
- Piel reptiliana `MeshPhysicalMaterial`, escamas triplanares por coordenadas locales, diferenciación dorsal/ventral, anillado y marcas según el patrón VIDA (`SOLID`, `BANDS`, `SPOTS`, `MOTTLED`). Máscaras suavizadas con `fwidth`. Sin `gl_FragCoord`, sin dependencia temporal.
- Detalle dorsal de tipo escudo/cresta en arquetipos compatibles. Los elementos inferidos siguen marcados como hipótesis de reconstrucción, nunca como observación.
- LOD `LOW/MEDIUM/HIGH`, caché CPU limitada a tres mallas, liberación GPU por el ciclo de vida del visor.
- La integración utiliza el reencuadre **38.2h.a** existente; no introduce una cámara nueva.

## Reglas de reproducibilidad

La semilla combina `speciesId`, `variantSeedUint32`, nicho, alimentación, hábitat, locomoción, plan corporal y adaptaciones ordenadas. El pigmento no modifica anatomía. El mismo contrato y revisión generan el mismo perfil y malla. La longitud real de VIDA se conserva como metadato `reptileScientificLengthMeters`.

No se modifica VIDA.6–9, VIDA.T1, IndexedDB ni la ficha de conocimiento. El grupo `REPTILES` con plan `BIPED` queda **sin modificar**: requiere reconstrucción especializada posterior (38.3), no adaptar una malla cuadrúpeda a la fuerza.

## Validación realizada

- Comprobación semántica TypeScript estricta de morfología y campo geométrico, usando un stub aislado del contrato visual para no depender de Angular.
- Comprobación de sintaxis de los siete archivos TypeScript editados.
- Auditoría de 9 arquetipos LOW y 180 semillas: 144.664 triángulos, 0 aristas abiertas, 0 aristas no manifold, 0 inconsistencias de orientación y 1 componente por malla.
- Ensayo HIGH de un iguánido: 55.192 triángulos, 0 errores topológicos detectados.
- Galería ortográfica neutral de 9 mallas reales. **No sustituye revisión WebGL** de piel, ojos, dientes, normales y sombreado.

## Riesgos y limitaciones

- Los modelos son hipótesis morfoanatómicas; no se infieren órganos certificados, población ni capacidades nuevas.
- No se ha ejecutado aquí `npx ng build` ni los tests Vitest porque el entorno no dispone de `three`, Angular ni Vitest instalados.
- Los materiales con `onBeforeCompile`, la escala final y el encuadre deben revisarse en el navegador. En especial, comprobar que los ojos y dientes no queden enterrados y que las escamas no parpadeen durante la órbita/zoom.
- La primera generación HIGH tiene coste CPU apreciable; la caché está limitada y no se genera por fotograma.

## Archivo de galería

`docs/vida38/38-2j-galeria-geometrica-reptiles.png` — vistas lateral y dorsal con material neutro. El escalado de cada panel es independiente para mostrar la silueta; no debe interpretarse como escala comparativa entre especies.
