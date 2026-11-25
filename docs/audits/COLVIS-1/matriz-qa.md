# COLVIS.1 — Matriz de validación

Matriz obtenida ejecutando el planificador puro con doce escenarios sintéticos CITY/SEALED_SURFACE/RESEARCH. Las cantidades son **piezas visuales**, no edificios científicos registrados ni habitantes observados.

| Familia | Mundo | Piezas HD | Radio de huella (km) | Altura máxima de diseño (km) | Auditoría |
|---|---|---:|---:|---:|---|
| HUMANOID ADVANCED | PLANET | 37 | 2,341924 | 0,250000 | PASA |
| HUMANOID VERY_ADVANCED | PLANET | 40 | 1,920378 | 0,729743 | PASA |
| REPTILIAN ADVANCED | PLANET | 37 | 2,341924 | 0,250000 | PASA |
| REPTILIAN VERY_ADVANCED | PLANET | 48 | 1,920378 | 0,729743 | PASA |
| INSECTOID ADVANCED | PLANET | 36 | 2,341924 | 0,250000 | PASA |
| INSECTOID VERY_ADVANCED | PLANET | 52 | 1,920378 | 0,729743 | PASA |
| HUMANOID ADVANCED | MOON | 31 | 1,873539 | 0,250000 | PASA |
| HUMANOID VERY_ADVANCED | MOON | 42 | 1,536302 | 0,583795 | PASA |
| REPTILIAN ADVANCED | MOON | 31 | 1,873539 | 0,250000 | PASA |
| REPTILIAN VERY_ADVANCED | MOON | 50 | 1,536302 | 0,583795 | PASA |
| INSECTOID ADVANCED | MOON | 30 | 1,873539 | 0,250000 | PASA |
| INSECTOID VERY_ADVANCED | MOON | 54 | 1,536302 | 0,583795 | PASA |

El laboratorio en `/laboratorio/colvis1` incluye selección de OUTPOST/SETTLEMENT/CITY/NETWORK, hábitat sellado/subsuperficial/escudo y funciones investigación/extracción/habitación/conservación. El panel amplía **solo para diagnóstico** la arquitectura real a tamaño inspeccionable.

| Requisito | Auditoría/estado |
|---|---|
| Diversidad morfológica, seis familias | PASS planificación; WebGL pendiente |
| ADVANCED / VERY_ADVANCED | PASS planificación; WebGL pendiente |
| Planeta / luna | PASS planificación; WebGL pendiente |
| Escalas poblacionales | PASS (cuatro bandas) |
| Tres tecnologías de hábitat | PASS |
| Cuatro especializaciones | PASS |
| No cambios de semillas ni VIDA.8/9 | PASS auditoría de archivos; regresiones completas pendientes |
| Mismo renderer ficha / SystemScene | Wiring estático PASS; visual pendiente |
| Alineación/colisiones superficie irregular | Usa raycasting anterior; visual pendiente |
| Rendimiento GPU y draw calls | Pendiente de navegador |
| Tests unitarios, E2E, arquitectura, build | Pendientes en instalación del usuario |
