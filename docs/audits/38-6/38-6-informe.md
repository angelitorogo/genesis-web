# GENESIS Web · 38.6 — Infraestructuras físicas de civilizaciones

Estado: **Implementación integrada en una única entrega. Pendiente de compilar y ejecutar la batería completa en el proyecto del usuario.**

## Contratos productivos identificados

| Objeto | Fuente productiva | Regla de aparición |
|---|---|---|
| Asentamiento nativo | `Vida9BiologyRecord.intelligence.civilization.settlementPatterns` de VIDA.7 | Solo CT-0 V3, sistema confirmado por el llamador, digest válido, fundadora existente, hábitat ocupado y patrón de emplazamiento registrado |
| Colonia en planeta o luna | `Vida9BiologyRecord.colonization.colonies` y `outcome` de VIDA.8 | Solo `COLONIZED`, `colonialPopulationPresent`, origen distinto del destino, tecnología de hábitat identificada |
| Hábitat colonial subterráneo | `settlement.habitatTechnology=SUBSURFACE_VAULT` | Solo acceso exterior pequeño; no ciudad exterior inventada |
| Proyecto de terraformación | `terraform` de VIDA.8 | `environmentChanged=false`: **no** añadir océanos, vegetación, oxígeno ni atmósfera |
| Luces nocturnas | VISCIV.1, ya existente | **No modificado** el atlas, brillo, color, distribución ni material nocturno |
| Satélites artificiales | VISCIV.2, ya existente | **Conservados** los satélites y sus órbitas existentes |
| Estaciones y anillos orbitales | VISCIV.4/5 anterior tenía generadores decorativos según nivel `VERY_ADVANCED` | **No instanciados en producción**: VIDA.7/8/37 no identifica estaciones orbitales concretas con órbita/identidad. Los generadores de laboratorio existentes se mantienen para compatibilidad pero no autorizan su presencia física. |
| Tecnoanomalías Fase 37 | 37.A/37.B/37.C | No sirven para desvelar la ubicación de una estación o colonia desconocida |

## Arquitectura nueva

- `vida38-infrastructure-plan-38-6.ts`: proyector puro y determinista. Firma del cuerpo, especie fundadora, patrones y colonias. No recibe información de cámara ni genera nuevas entidades científicas. Latitud/longitud son **posiciones reconstruidas visualmente, no datos observados**.
- `vida38-infrastructure-render-38-6.ts`: estructuras Three.js no emisivas con `InstancedMesh`; asentamientos primitivos y modernos diferenciados por forma, escala, linaje y tecnología de hábitat. Colonias bajo bóveda con acceso superficial mínimo. Grupos anclados al giro local, LOD 0/1/2 y recursos liberables.
- `scientific-body-preview.ts` + su ensamblador: añade solo las instalaciones del cuerpo inspeccionado, nunca de cuerpos vecinos sin registro confirmado. El componente reutiliza el mismo renderer.
- `planet-scientific-card.ts` y `moon-scientific-card.ts`: transmiten el registro VIDA.9 solo tras `AVAILABLE`, que requiere descubrimiento `CONFIRMED`.
- `system-scene-civilization-visuals.data-source.ts`: lectura desde IndexedDB solamente para sistemas confirmados, filtrado en lotes de 32, validación íntegra con `DexieVida9BiologyExplorationRepository.get`, conservación del validador previo de civilización para las luces.
- `system-scene-civilization-visuals.ts`: traslada al snapshot los planes planetarios y lunares, con comprobación del sistema, universo, versión, cuerpo y estado confirmado. No reutiliza planes del sistema anterior.
- `system-scene.ts` + `system-scene-snapshot.ts`: infraestructura anclada al `spinPivot` planetario/lunar con recursos de textura/geométricos independientes y detalle condicionado al diámetro aparente. Los satélites artificiales anteriores permanecen presentes, pero estaciones y anillos no demostrados no se renderizan.

## Límites científicos y visuales

1. Las coordenadas son recreaciones de apariencia deterministas: VIDA.7/8 no registra emplazamientos geográficos medidos. No es posible demostrar mediante estos registros que el edificio queda en un continente específico, fuera del hielo o a cierta altitud. No se presentan coordenadas al jugador.
2. En lunas `MINOR_IRREGULAR`, la nueva infraestructura queda omitida para evitar edificios suspendidos o intersecciones en superficies no esféricas mientras no exista un punto de anclaje geométrico fiable. Los registros biológicos y coloniales no se alteran.
3. En gigantes gaseosos no se generan estructuras superficiales.
4. La calidad 3D y el rendimiento deben validarse visualmente a tres distancias en la máquina del usuario; las geometrías han sido implementadas, no renderizadas con navegador en este entorno.
5. No existen nuevos hechos orbitales científicos ni cambios en cuerpos, órbitas o atmósferas. No se modifican las nueve especies 3D.

## Validaciones realmente ejecutadas en el entorno de creación

- `node scripts/verify-architecture.mjs`: **PASS**, 6 capas, 1208 fuentes TS analizadas (resultado anterior a la generación de los archivos de infraestructura; repetir en la entrega final).
- Compilación aislada del proyector científico `tsc --strict --target ES2022`: **PASS**.
- Comprobación de tipos del renderer 38.6 con contrato superficial de Three.js: **PASS** (no equivale a compilación Angular).
- Siete casos Node sobre `Vida9BiologyExploration.evaluate` y el proyector real: **7/7 PASS** (colonia subterránea, nativos, determinismo, corrupción y ausencia de estaciones).
- `npx ng build`, Vitest y Playwright completos: **NO EJECUTADOS** aquí; no están disponibles `node_modules` ni acceso a npm en el contenedor.

## Comandos de validación en Windows

```powershell
npx ng test --watch=false --include="src/app/presentation/infrastructure/vida38-infrastructure-38-6.spec.ts"
npx ng test --watch=false --include="src/app/presentation/system/system-scene-civilization-visuals.spec.ts"
npx ng test --watch=false --include="src/app/presentation/system/system-scene-civilization-surface-parity-visciv1d.spec.ts"
npx ng test --watch=false --include="src/app/presentation/scientific-body-preview/scientific-body-preview.spec.ts"
node scripts/verify-architecture.mjs
npm run test:architecture
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```

## Pruebas visuales de aceptación

- En un planeta confirmado con `settlementPatterns`: zoom intermedio muestra formas compactas; zoom cercano muestra viviendas/estructuras según `tier`, `builtForm` y linaje; zoom lejano no exagera construcciones.
- Una luna colonizada registrada `SEALED_SURFACE` presenta cúpulas/módulos; `SUBSURFACE_VAULT` solo un acceso exterior. Sin colonias, no debe aparecer geometría.
- Una civilización `VERY_ADVANCED` sin evidencia orbital **no** debe crear estaciones/anillos a partir de su nivel tecnológico. Los satélites VISCIV.2 anteriores permanecen.
- Inspeccionar sistema no confirmado / navegar a otra galaxia: ninguna infraestructura VIDA.7/8 privada.
- Las luces nocturnas deben permanecer visualmente idénticas a la versión aprobada.
