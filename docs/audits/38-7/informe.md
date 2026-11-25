# Auditoría GENESIS 38.7 — No filtración biológica en escenas 3D

## Criterio evaluado

> 38.7. Escena científica 3D: no revelar vida no conocida ni mostrar alienígenas como evidencia instrumental automática.

## Fuentes revisadas

- `presentation/system/system.ts`, `system-scene.ts`, `system-scene-civilization-visuals.ts`, `system-scene-civilization-visuals.data-source.ts` y `system-technosignature-37a.data-source.ts`.
- `life-species-detail/vida38-acceso-ficha-38-5.ts`, `vida38-ficha-conocimiento-38-5.ts`, `life-species-detail.ts`.
- `life-species-visual/vida38-species-visual-contract.ts`, `vida38-species-visual-preview-scene.ts` y contratos de laboratorio.
- `planet-detail/planet-vegetation-preview-profile-visbio.ts`, `system/system-scene-planet-surface-texture.ts`.
- Instantánea de `SystemScene` T7t: no se observó una ruta directa de creación de modelos de especies ni de lectura de registros biológicos privados en su renderizador.

## Hallazgos y tratamiento

| Referencia | Hallazgo | Corrección | Riesgo mitigado |
| --- | --- | --- | --- |
| BIO-387-01 | Un mapa asíncrono VIDA.9 de una escena anterior podía permanecer disponible en la señal al navegar a otro sistema, aunque fuese otra identidad. | Identidad de petición / render en cinco dimensiones; proyección desautorizada mientras la identidad no coincida. | Filtración transitoria entre sistemas |
| BIO-387-02 | `decorateSystemSceneSnapshotWithCivilizationTiers` no anulaba datos biológicos ya presentes en una instantánea no confirmada. | Filtro fail-closed por knowledgeLevel y discoveryStateCode, eliminando tiers y perfiles vegetales. | Luces/biomas no autorizados |
| BIO-387-03 | `civilizationLevelFrom` infería PRIMITIVE por la mera presencia de un linaje inteligente en un adaptador reptiliano. | Nivel canónico explícito `intelligence.civilizationTier`; `null` no representa civilización; compatibilidad limitada con fixtures históricos sin campo canónico. | Arte/indumentaria civilizatoria inventada |
| BIO-387-04 | Fixture VISCIV.1d no incluía confirmación explícita a pesar de probar datos ya confirmados. | Actualizado exclusivamente el fixture de prueba. | Falso positivo por nueva autorización explícita |

## Contratos existentes conservados

- `VIDA.9`: `revealPolicy`, CT-0, identificación del cuerpo y digest antes de divulgar una especie.
- `38.5`: autorización de ruta bajo `CONFIRMED`; `observedImageAvailable: false` y `SCIENTIFIC_PROCEDURAL_RECONSTRUCTION`.
- `37.A`: señales y niveles tecnológicos solo en sistemas confirmados, sin generar automáticamente un retrato de su especie.
- VISBIO: ausencia de perfil de vegetación equivale a ausencia de vegetación renderizada, no a asignación decorativa automática.
- `SystemScene`: modelos de especies no instanciados desde registros biológicos privados; luces nocturnas proceden de datos con autorización.

## Matriz de no filtración

| Estado | Datos 3D biológicos específicos | Señal/tecnofirma | Imagen de alienígena |
| --- | --- | --- | --- |
| DETECTED | No | No autoriza | No |
| IDENTIFIED / DISCOVERED | No | No autoriza | No |
| CATALOGUED | No | No autoriza | No |
| CONFIRMED | Sí, al disponer del registro VIDA.9 íntegro | Puede ser consultada | Reconstrucción científica procedural, nunca imagen observada |

## Validación efectuada

`node scripts/auditar-genesis-38-7.spec.cjs`: **49 comprobaciones portátiles superadas** sobre el código de la solución, incluidos escenarios simulados con mapas de civilización obsoletos, falsos positivos, contradicciones entre niveles, identidad de semilla/universo, ausencia de civilización pese a inteligencia y contratos de acceso y procedencia.

**Limitación:** no se ha ejecutado la batería Angular/Vitest ni WebGL ni E2E de la instalación actual; por tanto el estado es **implementado, pendiente de certificación en equipo**. No se ha alterado el motor científico ni la lógica de persistencia.
