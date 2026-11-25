# GENESIS LODGRP.1 — Informe de implementación y comprobación

Fecha: 2026-11-24. Base: GENESIS LOD2.1 sobre VISCORB.1b y VISCATM.1c.

## Diagnóstico comprobado

El renderizador `SystemScene` refinaba planetas con `detailedPlanetTexture` y lunas con `focusedLunarSurfaceLUNSURF1`, ambos limitados a UN cuerpo cada uno. `updateBodyLod()` liberaba un mapa al seleccionar un candidato distinto y ejecutaba generación CPU síncrona al instalar el nuevo atlas. Por eso, incluso tras eliminar el tercer LOD gaseoso, cambiar entre planeta y sus satélites podía provocar regeneraciones y retrasos.

El LOD geométrico de `system-scene-lod.ts` es independiente del atlas, y la capa fina VISCATM.1c es otro refinamiento independiente. No se ha modificado el motor orbital VISCORB.1b, la información científica, las semillas ni las fichas.

## Implementación

- Un `PlanetaryLodGroupControllerV1` administra un único anfitrión y los IDs de sus lunas *ya materializadas y autorizadas en el snapshot visible*, con fases LOW/PREPARING/READY/HIGH/BUDGET_LIMITED/FAILED y generación monotónica para descartar resultados obsoletos.
- Evaluación de proximidad de grupo cada 120 ms (o más rápidamente durante calentamiento de GPU). Utiliza el foco directo sobre planeta/luna o la esfera visual del conjunto, con histéresis de 62/100 px para preparación/entrada y 54/35 px en la salida progresiva. La esfera visual queda acotada para no activar múltiples grupos a distancia estelar.
- Generación real en `Worker` de un cuerpo por mensaje. El worker reutiliza `buildSystemSceneMoonTextureV1`, `refineGiantAtmosphereMultiresVISCATM1`, `refinePlanetRgbaTextureV1` y las composiciones `VISSURF.5/5d` con la corrección óptica VISSURF.5c. No se simula asincronía envolviendo trabajo síncrono en `Promise`.
- El planeta gaseoso se refina solo a **512 × 256**, con base 256 × 128; no se recupera LODMAX.1 ni se reactiva el atlas de escena gaseosa de 1024 × 512. Los planetas sólidos conservan su detalle de VISSURF y las lunas sus mapas albedo/normal/rugosidad de 1024 × 512 según la política ya existente.
- La generación entrega arrays transferidos mediante `postMessage(...,{transfer})`. La preparación de GPU precalienta **una textura por frame** (`renderer.initTexture`). Solo después de que todos los miembros hayan terminado se aplica un cambio conjunto de materiales y geometrías. Mientras tanto se conserva el LOD geométrico presentado y se inhibe la regeneración individual de texturas.
- Grupos excepcionalmente grandes (estimación superior a 128 MiB: presupuesto inicial 16 MiB + 8 MiB por luna) permanecen **sin refinamiento HD grupal** con geometría estable de detalle medio. No se les aplica una falsa activación parcial ni se intenta reservar memoria ilimitada. Esta degradación explícita necesita comprobación práctica con muchos satélites.
- Caché CPU de atlas de hasta 144 MiB (LRU) para volver al grupo anterior. Los recursos GPU del grupo abandonado se restauran y liberan. La caché se vacía al sustituir el snapshot/sistema. Un único worker se cancela por `terminate()` en cambio de grupo o al desmontar la escena; cada respuesta lleva una generación y un identificador.
- Compatibilidad con VISCORB.1b, selección de lunas, activación de capas y capa fina de VISCATM.1c. La ficha individual no cambia.
- Instrumentación opcional: `?genesisLodGrpDebug=1` registra en consola cambios de estado, duración de preparación, FPS aproximados, percentiles de frame, texturas/geometrías GPU y draw calls (instrumentación ligera; no implica telemetría real de VRAM).

## Validación ejecutada en este entorno

- **PASS** `node scripts/auditar-genesis-lodgrp1.spec.cjs`: 66 comprobaciones sobre el controlador real, caché, fases, cancelación lógica, histéresis, atlas planetarios, atlas lunares 1024×512, AST TS e integración.
- **PASS** `node scripts/verify-architecture.mjs` en árbol de fuentes reconstruido: 6 capas, 1290 archivos TypeScript.
- **PASS** auditorías LOD2.1 (37), VISCORB.1 (48), VISCORB.1b (30), VISCATM.1 (55), VISCATM.1b (26), VISCATM.1c (27), además de la nueva LODGRP.1 (66). La auditoría VISCORB.1a (31) es histórica y, al exigir los valores anteriores al reajuste del 15 %, no debe ejecutarse directamente sobre la versión vigente VISCORB.1b: fallaría por un contrato deliberadamente sustituido. No se modifica ninguna de estas auditorías en el ZIP.
- **PASS** análisis sintáctico de los 6 archivos TypeScript nuevos/modificados; comprobación semántica estricta de los módulos nuevos de lógica y worker sin dependencias externas: 0 errores. La compilación estricta de `SystemScene` requiere las declaraciones de Three.js y Angular del proyecto, ausentes en este contenedor.

## Validaciones pendientes (NO declarar superadas)

- `npx ng test --watch=false --include=src/app/presentation/system/system-scene-planetary-lod-group-lodgrp1.spec.ts`
- `npx ng test --watch=false --include=src/app/presentation/system/system-scene-group-atlas-lodgrp1.spec.ts`
- `npx ng build`, arquitectura completa, worker, e2e y suites generales.
- Probar bundling de Web Worker y precalentamiento de WebGL en navegador real, navegando en Xephus B-11 y Droveria.
- Comparación A/B de tiempos de frame, FPS, p95/p99 y picos respecto a LOD2.1, sobre la misma máquina, sistema y zoom.
- Verificar entrada desde vista global, seguimiento directo de luna, mostrar/ocultar lunas y grupos con muchos satélites.

## Límites reales

La generación CPU del worker es no bloqueante para la animación, **pero no instantánea**: una luna 1024 puede tardar segundos según hardware. Durante la preparación se conserva el detalle anterior y el cambio coordinado ocurre cuando la unidad completa está lista. Si se llega a una luna antes, no se puede garantizar ausencia total de cambio visual. El upload de una textura por fotograma también puede ocasionar picos de GPU, aunque evita concentrarlos todos en una sola actualización. Para grupos mayores que el presupuesto se mantiene el detalle inferior, evitando la degradación de LODMAX.1.

El tiempo de frame de la consola es una muestra de intervalos entre renderizados, no una medición GPU precisa. Las estimaciones de CPU/VRAM no sustituyen un perfilado WebGL real.
