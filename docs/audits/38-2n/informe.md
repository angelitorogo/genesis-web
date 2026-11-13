# GENESIS Web — Auditoría 38.2n · Microorganismos orgánicos

## Alcance

Partimos de la escena `38.2m.b` (sin rama decorativa de CANOPY ni rocas de ROCK), más la etiqueta de hongo de 38.2m. Se sustituye el antiguo `createMicrobialColony` por un componente exclusivo de `MICROORGANISMS`.

### Diez morfotipos de reconstrucción artística

| Forma | Elemento anatómico y distribución visible |
| --- | --- |
| COCCOID_AGGREGATE | Células subesféricas agrupadas en racimos o cadenas, algunas gemaciones |
| BACILLI | Cuerpos bacilares alargados, septos/constricciones y flagelos polares ocasionales |
| SPIRILLA | Espirales celulares tubulares, con varias vueltas y grosores propios |
| VIBRIOS | Células curvas tipo coma, dispersas o en colonias |
| BRANCHING_FILAMENTS | Filamento principal + ramas septadas y secundarias ancladas |
| BIOFILM | Matriz continua adherida al sustrato con islotes celulares |
| CILIATED | Cuerpo individual alargado + cilios instanciados y surco de membrana |
| AMOEBOID | Lámina con lóbulos + pseudópodos y vesículas |
| DIATOM | Frústulas oblongo-silíceas + costillas superficiales y quilla |
| RADIOLARIAN | Envoltura radial con espículas instanciadas y poros |

**Importante:** son *planes de forma visuales*, no identificaciones científicas observadas de organismos de las especies generadas en VIDA. La metadata `ARTISTIC_HYPOTHESIS_NOT_OBSERVED` se conserva.

## Estabilidad y compatibilidad

- `speciesId` determina el morfotipo, de manera estable. El resto de la anatomía depende de semilla de especie (`variantSeedUint32`) y huella (`appearanceFingerprint`), sin RNG global.
- Cambiar los colores no cambia familia ni anatomía.
- `sourceLengthMeters` conserva el tamaño científico VIDA; el visor normaliza el tamaño de visualización según 38.2h.a.
- Geometría indexada y normales por vértice; colores por vértice; `MeshPhysicalMaterial`; sin texturas remotas.
- Geometrías con LOD `LOW`, `MEDIUM`, `HIGH`; instancing de cilios y espículas.
- Ninguna malla microbiana utiliza la antigua burbuja/cápsula envolvente. En subsuelo se omite la esfera decorativa de la base *solo* para microorganismos.
- `addBaseCue` sigue sin ramas ni piedras. Se conservan los demás taxones, sus generadores y los controles de cámara.
- Actualización de la etiqueta visible a nombre de morfotipo en visor 38.2.

## Verificación realizada en el entorno de preparación

- **Auditoría estructural y de determinismo:** `node scripts/auditar-genesis-38-2n-microorganismos.spec.cjs` — OK, 800 perfiles; 10/10 morfotipos encontrados, todos en un margen de 57–99 sobre 800 perfiles.
- **Análisis sintáctico** de los cinco TS modificados o añadidos — 0 errores de análisis.
- **Chequeo TypeScript estricto de los dos módulos nuevos** con stubs locales para `three`/contrato: OK. No equivale al build Angular.
- Galería auxiliar conceptual generada por VTK, no renderizado real Three.js.

## Pendiente de aceptación

El árbol Angular completo no está disponible en este entorno. Se requiere ejecutar los tests Vitest del ZIP, las regresiones fúngicas/vegetales y `npx ng build` en la raíz real de `genesis-web`. También verificar capturas en el visor 38.2 para descartar artefactos de sombreado, LOD o encuadre y valorar la fidelidad orgánica. **No cerrar definitivamente 38.2n solo por pasar tests y build**.
