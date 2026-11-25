# GENESIS 38.8R — Reconciliación de 44 fallos tras integrar 38.8

## Alcance y evidencia

Se analizaron los 44 errores de Vitest incluidos en `Texto pegado(20261125-122541).txt` (15 archivos afectados, 6.905 tests superados / 44 fallidos). El log no prueba que los fallos hayan sido introducidos por 38.8; varias pruebas conservan expectativas anteriores a 38.7x, T3b/T7, VISSURF.6 y MOONCAD.1.

Se reconstruyó una copia de trabajo a partir de la instantánea de diagnóstico 38.7 y las entregas incrementales posteriores hasta 38.8, disponibles en el entorno. Esta reconstrucción NO sustituye al repositorio local ni garantiza que no existan cambios locales no entregados.

## Cambios en ejecución (2 archivos)

1. `vida38-species-visual-preview-scene.ts`: acepta el alias **histórico** anidado `intelligence.civilization.level` en fixtures/laboratorio. Conserva la prioridad de `intelligence.civilizationTier`; si es `null`, no crea una civilización visual ni infiere el nivel a partir de otros campos.
2. `vida38-infrastructure-render-38-6.ts`: si la geometría COLVIS.2 real no contiene las combinaciones antiguas de `role/finish` seleccionadas como soportes de luces, utiliza las piezas reales existentes como soporte, sin crear objetos científicos ni añadir luces a colonias no verificadas. Esto restaura indicadores en algunas colonias confirmadas; puede recuperar puntos de luz antes ausentes, por lo que no se considera una entrega estrictamente sin cambios visuales.

## Reconciliación de pruebas (15 archivos)

| Bloque | Fallos en registro | Resolución prevista |
|---|---:|---|
| Contacto y visibilidad COLVIS | 2 | Medir contacto contra la malla triangulada real; identificar lámparas por metadatos 38.6c3 |
| Iluminación colonial 38.6c3/4 | 3 | Comprobar presupuestos luminosos en cada LOD sin la distribución obsoleta 1/2/5; mock de shader con chunk `<defaultnormal_vertex>` |
| Reptiliano histórico 38.2od4 | 1 | Resolver alias anidado y probar explícitamente prioridad del `civilizationTier:null` canónico |
| Tarjeta científica lunar | 7 | Completar el fixture de fuente estelar VISSURF.6 (lista vacía para la escena de prueba) |
| Paridad ficha/SystemScene | 4 | Dotar a la estrella ficticia de una posición tridimensional compatible con VISSURF.6 |
| Control biológico de conocimiento 38.7 | 6 | Completar los snapshots antiguos con `moons:[]`; conservar el bloqueo de datos sin confirmar |
| VISCIV.1d | 1 | Añadir lunas vacías al snapshot verificado de prueba |
| Claves de lunas 38.7x | 1 | Comprobar clave independiente `bodyIndex:MOON:moonIndex`; prohibir solapamiento con planeta |
| Infraestructura orbital VISCIV.6e | 1 | Hacer que el fixture confirmado incluya también `discoveryStateCode:5` |
| Commits científicos B6/T3b | 1 | Ya no se publica aviso del Archivo durante VISITED→CATALOGUED: validar atomicidad, coste y ausencia de indexación prematura |
| Campos coloniales Archivo | 1 | Incorporar los campos de población individual y agregada ya previstos en T7 |
| Layout de Archivo GENESIS | 15 | Completar stub del índice persistente T3: señales `sortIndexStats38BisT3` y `dirtyJobCount38BisT3` |
| Laboratorio multihost lunar | 1 | Validar MOONCAD.1: cadencia conjunta por planeta anfitrión, 90 s orbital exterior |
| **Total** | **44** | 17 archivos TS modificados: 2 de ejecución, 15 de tests |

## Límites y evaluación honesta

- No se ha ejecutado aquí la batería Angular/Vitest completa ni el build. No hay dependencias `node_modules` instaladas en la reconstrucción. No afirmar 44 tests corregidos empíricamente hasta ver una nueva ejecución local.
- Se ha comprobado la **sintaxis TypeScript de los 17 archivos** mediante el transpilador TypeScript disponible en el entorno. Esto no reemplaza el chequeo de tipos de Angular ni Vitest.
- Se adjunta auditor portátil de **15 comprobaciones estáticas** que inspecciona la presencia de los contratos acordados. Tampoco reemplaza la ejecución de pruebas.
- No se alteran datos científicos, persistencia IndexedDB, semillas, órbitas físicas, escala de cámara ni shaders productivos. Solo se modifica la selección de soportes de luces para colonias verificadas cuando la geometría actual no contiene roles heredados.
- Si quedan fallos, usar la salida completa nueva para identificar el problema restante, no reducir tolerancias ni marcar tests como omitidos.

## Pruebas locales recomendadas

```powershell
node scripts/auditar-genesis-38-8r.spec.cjs
npx ng test --watch=false --include=src/app/presentation/infrastructure/colvis3-colony-visibility-t7c.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/system-biology-knowledge-38-7.spec.ts
npx ng test --watch=false --include=src/app/presentation/scientific/scientific-body-preview-parity.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-list-layout-38-bis-b2.spec.ts
npm run test:architecture
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```
