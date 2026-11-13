# GENESIS Web — 38.2s8b · Diagnóstico de la batería general

**Origen:** registro completo aportado el 11/11/2026. **No incluye cambios de código de producción ni aserciones debilitadas.**

## Inventario

- **55 tests fallidos distribuidos en 44 archivos `.spec.ts`.**
- **35 timeouts** (15, 30, 35 o 45 segundos según el test), que pueden deberse a sobrecarga de la ejecución masiva o a costes reales.
- **20 fallos de aserción/ejecución**, que necesitan reconciliar el test y el contrato de producción.

## Primeras causas comprobables desde el log

1. **38.2o.e7 / e7b / e7c / e8b:** buscan `ordinal` 7, 17 o 121 dentro de una selección de 24 ejemplares optimizada por diversidad, no una lista de los ordinales 1–24. Es un error de fixture dependiente de la composición de la galería.
2. **38.2o.d3 / d5 / e / e2:** siguen esperando metadatos legados `FULL_360`, `vida38Full360Suit38OD5`, etc. Hay que confrontarlos con la versión final de las prendas antes de modificar tests o renderers.
3. **38.2q1a:** ausencia del marcador `vida38CivilInsectoidOrganicRevision38Q1A` en un renderer que ha evolucionado tras 38.2q1a. Revisión de ruta/marcador pendiente.
4. **38.2o.d2:** el límite espacial del cuerpo en la escena ya no coincide (`min.y` obtenido -1,4307 frente al rango esperado -0,79 a -0,48). Puede ser contrato de encuadre antiguo o regresión: no hay información suficiente para decidirlo sin medir coordenadas normalizadas en el modelo actual.
5. **38.2o.e8 / e9:** cobertura inferior a la esperada (`3/4` siluetas, `3/5` sesgos de accesorios). No reducir umbrales arbitrariamente; comprobar si cambió la galería o el generador.
6. **VISCIV.2:** el conteo de satélites (12 frente al máximo 9) y radio orbital (2,539584 frente al máximo 2,5) requieren decidir si prevalece el límite científico o el generador. No se ajusta ningún valor sin revisar el dominio.
7. **Fase 38.2 / 38.3:** `specialistIntelligenceDeferred` esperado `true` cuando devuelve `false`. La especialización posterior a 38.3 probablemente dejó antiguo ese contrato; verificar con el nuevo selector.
8. **Decoración CANOPY y dentición 38.2j.b:** fallos de regresión reales o expectativas obsoletas; verificar con la lógica vigente sin reintroducir elementos decorativos ni alterar bocas aprobadas.

## Repetición en ejecución aislada

Se incluye un **diagnosticador Node** que usa únicamente `npx ng test --watch=false --include=<archivo>` sobre los archivos con fallos. Los ejecuta secuencialmente, sin editar código, package.json ni Vitest. Las opciones son:

```powershell
node scripts/diagnosticar-genesis-38-2s8b-regresiones.cjs
node scripts/diagnosticar-genesis-38-2s8b-regresiones.cjs --run=critical
node scripts/diagnosticar-genesis-38-2s8b-regresiones.cjs --run=assertions
node scripts/diagnosticar-genesis-38-2s8b-regresiones.cjs --run=timeouts
node scripts/diagnosticar-genesis-38-2s8b-regresiones.cjs --run=all
```

Los resultados se escriben en `docs/audits/38-2s8b/resultado-aislado-<grupo>.json`.

**Criterio:** si un timeout desaparece al aislar el archivo, indica sensibilidad a la carga del conjunto; si persiste, investigar el coste y el límite de tiempo específico. Los 20 fallos lógicos necesitan revisión independiente aunque los demás se resuelvan.

## Matriz de archivos afectados

| Archivo | Fallos del registro | Tipo |
|---|---:|---|
| `src/app/presentation/galaxy-map/galactic-map-particle-layout.spec.ts` | 3 | timeout |
| `src/app/presentation/laboratory/galactic-objects/galactic-object-laboratory.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s4.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s7.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s8.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-bird-face-visibility-38-2ia2b.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-birds-38-2i.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-birds-refinement-38-2ia.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-civilized-insectoid-38-2q1a.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2o.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od2.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od3.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od5.spec.ts` | 2 | assertion, timeout |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe.spec.ts` | 2 | assertion, timeout |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe2.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe4.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe6.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe6a.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe7.spec.ts` | 2 | execution |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe7b.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe7c.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe8.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-humanoid-morphology-38-2f.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-humanoid-organic-field-38-2e.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2g.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2gc.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-insects-38-2k.spec.ts` | 2 | timeout |
| `src/app/presentation/life-species-visual/vida38-mammals-38-2h.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-no-decorative-rocks-38-2mb.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-no-decorative-support-38-2ma.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-plant-canopy-support-38-2la.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-reptile-dentition-38-2jb.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-reptile-eyes-38-2p.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-reptiles-38-2j.spec.ts` | 1 | timeout |
| `src/app/presentation/life-species-visual/vida38-reptilian-cultural-diversity-38-2oe9.spec.ts` | 1 | assertion |
| `src/app/presentation/life-species-visual/vida38-reptilian-wardrobe-38-2oe8b.spec.ts` | 2 | execution |
| `src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.spec.ts` | 4 | assertion, timeout |
| `src/app/presentation/scientific-body-preview/scientific-minor-body-texture-vis3d2e.spec.ts` | 1 | timeout |
| `src/app/presentation/system/system-scene-artificial-satellites-visciv2.spec.ts` | 2 | assertion |
| `src/app/presentation/system/system-scene-civilization-surface-parity-visciv1d.spec.ts` | 1 | timeout |
| `src/app/presentation/system/system-scene-planet-clouds-vis3d2f.spec.ts` | 1 | timeout |
| `src/app/presentation/system/system-scene-planet-texture-refinement.spec.ts` | 1 | timeout |
| `src/app/simulation/life/vida-t1-civilized-founder.spec.ts` | 1 | timeout |
