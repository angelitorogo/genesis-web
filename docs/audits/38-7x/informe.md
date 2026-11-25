# GENESIS 38.7x — Informe de auditoría y corrección de paridad científica

Fecha de ejecución: 2026-11-24. Base examinada: ZIP `genesis-38-7-vegetacion-systemscene-diagnostico.zip`, recibido del usuario (3217 entradas). Entrega incremental de cambios sobre esa base.

## Hallazgo 1 — Droveria c sin flora en SystemScene

**Causa demostrable (código):** `SystemSceneCivilizationVisualsDataSource` exigía `nativeCivilizationPresent` o `colonialPopulationPresent` antes de verificar el registro de VIDA.9. Además, `vegetationProfile` estaba ligado a `tier !== null`. Esto excluía vegetación de biosferas confirmadas sin civilización, mientras `ScientificBodyPreviewAssembler` recibía un perfil obtenido directamente de VIDA.9.

**Corrección:** admitir como *candidatos* las filas que contienen `PLANTS_TREES` y verificar igualmente los registros VIDA.9 mediante `DexieVida9BiologyExplorationRepository`, sin confiar en JSON bruto. Proyectar `resolvePlanetVegetationPreviewProfileV1(record, undefined)` independientemente de la presencia de civilización. Las luces siguen condicionadas al tier genuino, sin inferencia tecnológica.

## Hallazgo 2 — Atlas de vegetación no invalidado

**Causa demostrable:** la clave de `SystemSceneBoundedResourceCacheV1` de planetas no incluía el perfil de vegetación, sino solo el tier. Si se generaba una textura sin flora antes de terminar VIDA.9, podía recuperarse tras recibir la flora autorizada.

**Corrección:** clave de atlas con firma estable completa de cobertura, exuberancia, número de especies y paleta; se mantiene el aislamiento por sistema, cuerpo, resolución y tier.

## Hallazgo 3 — Planeta y luna con la misma clave

**Causa demostrable:** `civilizationVisualMapOf` registraba ambos bajo `bodyIndex`. Una fila lunar podía desplazar los datos del planeta, aun cuando éste tuviera vegetación propia.

**Corrección:** claves lunares específicas, binding explícito para sistemas múltiples y fallback de IDs históricos únicamente para sistemas simples; separación de infraestructura según destino y validación de procedencia exacta.

## Paridad de otros cuerpos

Las fichas ya usan los renderizadores reales de `SystemScene` para lunas y cuerpos menores, pero agregan atlas de inspección en alta resolución a los cuerpos menores. Se integra ese atlas en `SystemScene` de modo selectivo y reversible (un objeto a la vez, >320px con histéresis); para TNO/CAP se reemplaza provisionalmente también la geometría de baja resolución por la geometría canónica de la ficha. Cometas conservan coma y colas, con atlas solo en núcleo. No se inventan observaciones geológicas.

## Contratos de seguridad / regresión

- VIDA.9 se obtiene desde repositorio verificado; el prefiltrado no concede autorización.
- Solo la confirmación de sistema autoriza la visualización de biosferas y asentamientos; sistemas incompletos se saneean.
- No inferir civilización a partir de vida, ni vida a partir de anomalía de fase 37.
- Respetar asociación de planeta, luna, universo, versión de generación y sistema.
- Mantener todos los modelos físicos, semillas y nivel de LOD aprobados.
- Liberar atlas y geometrías temporales al alejarse, cambiar de foco o cerrar `SystemScene`.

## Evidencia de validación local

- `node scripts/auditar-genesis-38-7x.spec.cjs`: **25 comprobaciones portátiles superadas** (TypeScript transpile, módulo real de mapeo, clave de caché, escenarios de confirmación y fuente de atlas).
- `node scripts/verify-architecture.mjs`: **PASSED**, 6 capas y 1281 archivos TS de producción examinados.
- No fue posible ejecutar Vitest/Angular/WebGL en este contenedor sin las dependencias `node_modules` del proyecto; estas comprobaciones quedan pendientes en la máquina del usuario.

## Criterio para declarar cierre

Build y pruebas completas en la instalación del usuario, más verificación visual de Droveria c y de un ejemplo por categoría de cuerpo. Comparar a zoom y ángulo equivalentes: los cambios de terminador, luz estelar, nubes y rotación no deben considerarse diferencias en el mapa físico/procedural.
