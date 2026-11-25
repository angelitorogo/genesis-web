# GENESIS LOD2.1 — Dos niveles de atlas en gigantes gaseosos

## Motivación
El experimento LODMAX.1 resultó inviable por rendimiento y se revierte. VISCATM.1c utilizaba en SystemScene atlas 256→512→1024 para gaseosos, con dos regeneraciones progresivas de texturas y un salto cercano adicional (umbral 370/270 píxeles). Otros planetas utilizan 256→512 para sus atlas de SystemScene.

## Cambios
- En SystemScene, todos los planetas usan **dos niveles de atlas**: distante 256×128, cercano 512×256. Se elimina exclusivamente la transición gaseosa 512→1024.
- Se mantiene el umbral del LOD cercano del sistema (entrada 300px, salida 210px) y la regla de un único planeta enfocado. En zoom no se vuelve a regenerar al cruzar 370px.
- Se preserva el generador procedural VISCATM.1c, las semillas, la versión 3 y las estructuras nubosas.
- **Las fichas** pueden seguir utilizando 1024×512: la medida se aplica solo a SystemScene.
- Se restaura el SystemScene de VISCORB.1b (los archivos de VISCORB.1a/1b son independientes), retirando la instrumentación, precarga general y modo de estrés LODMAX.1. Si quedó en disco el módulo `system-scene-max-lod-experiment.ts`, no se importa ni usa: no es necesario eliminarlo para desactivar el experimento.
- No cambia el LOD geométrico, la geometría de las envolturas VISCATM.1c, la simulación física, las órbitas, VIDA ni IndexedDB.

## Advertencia
El máximo detalle 1024 de la escena gaseosa ya no se activa: es una reducción de calidad deliberada a cambio de fluidez. La ficha científica conserva su máximo detalle. Este parche **no elimina** el salto único 256→512 ni garantiza quitar por completo el retardo de la generación bajo demanda. Si aún molesta, la siguiente solución debería ser precarga limitada/asíncrona de un solo cuerpo, no todas las texturas a resolución máxima.

## Instalación (aplicar sobre VISCORB.1b, haya o no LODMAX.1)
```powershell
Expand-Archive -Path .\genesis-LOD2-1-dos-niveles-gaseosos-reversion-LODMAX-INCREMENTAL.zip -DestinationPath . -Force
```

## Comprobación
```powershell
node scripts/auditar-genesis-lod2-1.spec.cjs
node scripts/auditar-genesis-viscatm1.spec.cjs
node scripts/auditar-genesis-viscatm1b.spec.cjs
node scripts/auditar-genesis-viscatm1c.spec.cjs
npx ng test --watch=false --include=src/app/presentation/system/system-scene-giant-atmosphere-two-level-lod.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/system-scene-giant-atmosphere-multires-viscatm1.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/system-scene-giant-atmosphere-clarity-viscatm1b.spec.ts
npm run test:architecture
npx ng build
```

## Verificación
Auditorías portátiles y sintaxis TypeScript ejecutadas donde hay herramientas. **Pendiente** Angular/Vitest/build completos y validación visual/FPS en navegador. No dar la mejora por validada sin esas comprobaciones.

## Resultados registrados en entorno de pruebas reconstruido
- `node scripts/auditar-genesis-lod2-1.spec.cjs`: **PASS, 37 comprobaciones**.
- `node scripts/auditar-genesis-viscatm1.spec.cjs`: **PASS, 55 comprobaciones**.
- `node scripts/auditar-genesis-viscatm1b.spec.cjs`: **PASS, 26 comprobaciones**.
- `node scripts/auditar-genesis-viscatm1c.spec.cjs`: **PASS, 27 comprobaciones**.
- `node scripts/verify-architecture.mjs`: **PASS**, 6 capas y 1287 archivos TS.
- Angular, Vitest y WebGL en navegador: **no ejecutados** en este entorno.
