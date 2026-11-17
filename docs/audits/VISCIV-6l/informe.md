# VISCIV.6l — Cadencia orbital cinematográfica lenta

## Objetivo
Reducir la velocidad de reproducción VISUAL de satélites, estaciones y tráfico de los anillos orbitales sin detenerlos, ni alterar la simulación científica o la geometría procedimental.

## Tasas
| Elemento | Multiplicador frente a VISCIV.6k | Reducción |
|---|---:|---:|
| Satélites artificiales | 0,22× | 78 % |
| Estaciones orbitales | 0,30× | 70 % |
| Convoyes orbitales | 0,35× | 65 % |
| Lanzaderas | 0,30× | 70 % |
| Vehículos entre terminales | 0,30× | 70 % |

Los anillos gigantes conservan su rotación lenta propia. Ninguna familia se detiene o invierte el sentido.

## Integración
- `system-scene-artificial-satellites-visciv2.ts` aplica factores en los planes de satélites y estaciones.
- `system-scene-orbital-traffic-visciv6k.ts` aplica factores en los planes de convoyes, lanzaderas y terminales.
- `system-scene-orbital-tempo-visciv6l.ts` define la configuración central.
- El auditor VISCIV.6k se adapta para cargar ese módulo al evaluar los planes reales sin WebGL.
- Ambas representaciones 3D consumen estos planes; no hay que modificar sus relojes ni crear una nueva animación.
- Se mantienen radios, fases iniciales, tipos, nodos y geometrías, así como persistencia científica VIDA/CT-0.

## Validación
1. `node scripts/auditar-genesis-visciv-6l.spec.cjs`
2. `node scripts/auditar-genesis-visciv-6k.spec.cjs`
3. `npx ng test --watch=false --include=src/app/presentation/system/system-scene-orbital-tempo-visciv6l.spec.ts`
4. `npx ng test --watch=false --include=src/app/presentation/system/system-scene-orbital-traffic-visciv6k.spec.ts`
5. `npm run test:architecture`
6. `npx ng build`

## Auditoría ejecutada sobre la reconstrucción 6k + 6l
- 35.706 satélites y estaciones auditados en planes puros
- 98.655 vehículos verificados en planes de tráfico puros
- Auditoría previa VISCIV.6k: 12.288 configuraciones, PASS
- Arquitectura: PASS, 1.219 archivos TS revisados
- Angular/Vitest requieren las dependencias del proyecto y no se han ejecutado aquí
