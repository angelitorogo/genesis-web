# Auditoría 38.2m — Arquitectura fúngica procedural

## Alcance y motivación

Se elimina la reproducción de un único cuerpo tipo seta a partir de tallos cilíndricos y sombreros esféricos. El render fúngico dispone de ocho estrategias geométricas, elegidas a partir de la identidad de especie y con variación anatómica interna determinista.

| Código | Plan corporal visible | Himenio/rasgo terminal |
|---|---|---|
| AGARICOID | pies flexibles con sombreros abovedados y ondulados, grupos | láminas radiales trianguladas, velo opcional |
| BOLETOID | cuerpo robusto de pie engrosado, sombrero denso | superficie porosa inferior |
| BRACKET | eje de fijación, repisas laterales escalonadas | laminillas inferiores y bordes ondulados |
| CORAL | bifurcaciones arborescentes de tubo ahusado | extremos ramificados, sin sombrero |
| GASTEROID | masas ovoides cerradas con superficie orgánica | ostiolo apical según subvariante |
| CUP | copas huecas con reborde lobulado | pared interior fértil |
| GELATINOUS | lóbulos flexibles, plisados y parcialmente translúcidos | membranas plegadas |
| ROSETTE | láminas radiales superpuestas de crecimiento bajo | pliegues con dos caras |

## Determinismo y límites

- `form` depende solo de `speciesId`. La subvariante, densidad, curvatura y demás parámetros dependen adicionalmente de `variantSeedUint32` y `appearanceFingerprint`.
- El color se toma de la pigmentación VIDA del contrato y se mezcla de forma controlada con tonos orgánicos; **no cambia la morfología**.
- El cuerpo científico registrado no se reescribe: `bodyLengthMeters` se preserva en `subject.userData` y la representación se normaliza solo a efectos de encuadre.
- La elección de familia es una **hipótesis artística**, no una clasificación filogenética real.
- Las mallas usan vértices triangulados coloreados, normales interpoladas y materiales físicos locales. No se descargan texturas ni se usa `Math.random`.
- `LOW`, `MEDIUM` y `HIGH` acotan complejidad. Los recursos siguen el `collectDisposables()` del visor.
- El aviso de hipótesis artística y los metadatos del contrato se mantienen en la interfaz.

## Evidencia local ejecutada

1. `node scripts/auditar-genesis-38-2m-hongos.spec.cjs`: **OK**. Sintaxis TypeScript de los archivos modificados y test; 800 perfiles estables; 8 familias, 100 perfiles de cada una en la muestra; morfología invariante al color; importación de renderer en `FUNGI` y supresión del generador antiguo.
2. Compilación TypeScript estricta `tsc --strict --noEmit` de ambos módulos nuevos con dobles de los tipos del contrato y Three.js: **OK**. No sustituye el build de Angular con dependencias reales.
3. Prueba geométrica auxiliar usando un subconjunto compatible de Three.js (sin GPU): generadas las 8 familias en `MEDIUM`, con índices, posiciones y colores finitos; entre 6 y 145 mallas y entre 1.688 y 31.900 triángulos por muestra.
4. Galería `galeria-morfologias-fungicas.png` renderizada con VTK a partir de estas posiciones; técnica y orientativa, **no** es captura del WebGL del proyecto.

## Validación pendiente del usuario

- Ejecutar Vitest 38.2m, regresiones de plantas y soporte CANOPY, arquitectura y build Angular en el proyecto real.
- Comprobar que distintos registros `FUNGI` muestran ocho siluetas perceptiblemente distintas, que los materiales varían con la pigmentación y que no aparecen segmentos flotantes ni artefactos de transparencia.
- Si aparecen artefactos de normales o un morfotipo poco convincente, corregirlo antes de cerrar la subfase.

## Archivos existentes tocados

Solo `vida38-species-visual-preview-scene.ts` y `life-species-visual-preview.ts`; no se alteran modelos físicos ni de biología, generación de otras familias, cámara o persistencia.
