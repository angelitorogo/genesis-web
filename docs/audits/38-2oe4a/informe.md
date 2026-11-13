# GENESIS Web — 38.2o.e4a · Hotfix de tests (orbital + accesorios)

## Diagnóstico

1. **OE3 timeout**: la comprobación estadística instanciaba 24 cuerpos SDF completos y accesorios 3D bajo `testTimeout=15000 ms`. El cuello de botella es el mallado, no un fallo de variedad.
2. **OE4 `frame=null`**: al consultar la malla desde un test **después** de `normalizeSubject()`, las coordenadas `eyeY` y `eyeSpacing` seguían siendo locales, pero se usaban directamente como origen *world-space* de `THREE.Raycaster`. El rayo ya no apuntaba a la cabeza.

## Solución

- OE3: 48 identidades calculadas mediante `selectVida38ReptilianVariation38OE1` y `deriveVida38ReptilianAccessoryPlan38OE3`, sin generar mallas. Se conservan las mismas exigencias de diversidad. Las pruebas de integración 3D continúan en los otros `it`.
- OE4: transformar cada origen local mediante `body.localToWorld` y el vector de dirección mediante `transformDirection(body.matrixWorld)`; convertir `hit.point` de world a local con `body.worldToLocal`.
- OE4: intentar ligeros desplazamientos locales de ojo y, solo ante fallo, buscar un vértice real del rostro como respaldo determinista. No crear puntos oculares flotantes.
- OE4: nueva regresión verificando equivalencia de anclajes antes y después del centrado/escalado del visor.

## Alcance

No se modifica el renderer visual ni la morfología SDF, la pigmentación, el outfit, los accesorios ni los parámetros CT-0. Únicamente la función de anclaje de ojos y dos pruebas de regresión.

## Validación local

`node scripts/auditar-genesis-38-2oe4a-regresiones.spec.cjs` — muestra local: 48 especies, 43 firmas, 3 variantes de gafas y 4 de accesorios de mano.

Los tests Vitest/Angular y el build han de ejecutarse dentro de genesis-web.
