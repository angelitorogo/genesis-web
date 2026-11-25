# GENESIS MOONCAD.1 — Paridad de velocidad orbital lunar

Fecha: 2026-11-25.

## Diagnóstico

- La vista conjunta de las fichas (`scientific-body-preview.ts`) fija un reloj visual común: la luna de período orbital mayor del planeta completa una revolución en **90 segundos reales**. El resto conserva la relación física entre períodos.
- `SystemScene` aplicaba antes límites individuales de **8 segundos** en sistemas simples, aproximadamente **42 segundos** en algunas rutas de sistemas múltiples y una expresión independiente (`periodDays / 480`) en anfitriones compactos. No existía paridad con las fichas.
- Es un problema de **cadencia de presentación**, no de períodos orbitales físicos ni geometría. Ningún cambio es necesario en la simulación ni en la persistencia.

## Solución

Se centraliza el contrato visual en `system-scene-secondary-motion.ts`:

- `SCIENTIFIC_MOON_OUTERMOST_CYCLE_REAL_SECONDS_V1 = 90`.
- `scientificMoonGroupDaysPerRealSecondV1(periodos) = max(periodos) / 90`.
- `systemSceneMoonGroupPresentationTimeScaleV1(periodos, playback) = max(periodos) / (90 × playback)`.

La ficha utiliza el mismo contrato. La escena aplica el factor **solo a la contribución orbital local de la luna**; las contribuciones de su planeta, las estrellas y otros cuerpos mantienen sus relojes anteriores.

Rutas cubiertas: `projectMoonLayer` (SINGLE), `SystemSceneMultihostComposition` (A/B/C en BINARY/TRIPLE), `appendSystemSceneMultihostCircumbinary` (planetas P), `projectCompactHostSecondaries` (anfitriones compactos). Las agrupaciones se basan en el planeta anfitrión real y las lunas visibles del modelo ya autorizado.

Al cambiar la cámara entre el planeta y una luna, todos los satélites siguen usando el mismo factor del grupo. Los períodos, excentricidades, inclinaciones, anomalías, tamaños, fases y semillas originales no se alteran. Tampoco los anillos, las infraestructuras, las velocidades de rotación axial, los planetas ni los cometas.

## Ejemplo numérico

Para lunas con períodos físicos de 2, 8 y 24 días: la ficha y la escena completan una vuelta en 7,5, 30 y 90 segundos reales, respectivamente, independientemente de la aceleración del reloj general de `SystemScene`.

## Pruebas ejecutadas en entorno de reconstrucción

| Prueba | Resultado |
|---|---|
| Auditoría portátil MOONCAD.1 | PASS, 93 comprobaciones |
| Arquitectura GENESIS | PASS, 6 capas y 1291 archivos TS |
| Auditoría LODGRP.2 | PASS, 65 |
| Auditoría LODGRP.1 | PASS, 66 |
| Auditoría LOD2.1 | PASS, 37 |
| Auditoría VISCORB.1 | PASS, 48 |
| Auditoría VISCORB.1b | PASS, 30 |
| Auditoría VISCATM.1c | PASS, 27 |
| TypeScript estricto aislado del helper y motor Kepleriano | PASS |
| Angular/Vitest integrado | Pendiente: dependencias no instaladas en el entorno |
| Three.js/WebGL, percepción visual | Pendiente: validación en el navegador del usuario |

La auditoría histórica VISCORB.1a todavía espera los tamaños lunares anteriores a VISCORB.1b y no es aplicable al contrato vigente; no se ha modificado para evitar falsos positivos.

## Restricciones conservadas

Ningún cambio en mecánica física, días de período real, modelos V3, conocimiento autorizado, IndexedDB, LODGRP.2, VISCORB.1b, VISSURF, VISCATM.1c o COLVIS. No añade recursos GPU ni geometría.

## Criterio visual de cierre

Comprobar en Xephus B-11 y un planeta de Droveria que el satélite de período más largo completa aproximadamente una vuelta en 90 segundos tanto en MOSTRAR LUNAS como en `SystemScene`, y que las lunas más internas siguen conservando sus velocidades relativas. Comprobar también sistemas binarios/triples y navegación con seguimiento activo.
