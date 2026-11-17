# Auditoría de entrega — 38.bis-b7

## Incidencia

La versión 38.bis-b6a actualizaba índices locales correctamente, pero sus fuentes permitían registros con estado de exploración anterior a `CONFIRMED`. El Archivo Universal y la ficha galáctica podían mostrar objetos detectados o descubiertos como parte de inventarios científicos.

## Implementación

| Área | Modificación |
| --- | --- |
| Dominio | Nuevo adaptador de lectura `scientific-confirmation-38-bis-b7.ts`; política pura, sin escritura ni elevaciones de estado |
| Archivo Universal | Solo se aceptan galaxias `CONFIRMED`; las categorías físicas consultan el catálogo en modo `scientificOnly`; los registros biológicos mantienen sus validaciones de fuente y sistema |
| Índice del Archivo | Revisión `scientific-confirmed/v2`; invalidación del ámbito heredado `observed-index/v1` y poda de galaxias que ya no están confirmadas, preservando íntegra la BD de fuentes |
| Actualización automática b6 | Una notificación de descubrimiento en galaxia no confirmada no la publica: purga su fragmento derivado, termina la tarea y conserva el descubrimiento |
| Catálogos | Sistemas/cúmulos/nebulosas/extremos se filtran por estado confirmado; planetas/lunas filtran la proyección científica por confirmación individual o de sistema completo; las búsquedas se hacen después del filtrado, antes de paginar |
| Ficha galáctica | `explorationTelemetry` conserva la cobertura y los hitos de exploración; `scientificTelemetry` alimenta los inventarios científicos y sus enlaces a catálogos |
| UX | Leyendas distinguen datos confirmados y exploración |

## Invariantes

- Invariantes CT-0: ni semillas, ni generadores, ni descubrimientos, ni PD, ni biosferas cambian.
- No promover automáticamente estados científicos, ni inferir confirmación a partir de conocimiento parcial.
- La confirmación de sistemas mantiene la publicación de su inventario planetario y lunar completo, en su proyección pública determinista.
- No exponer Ground Truth privado a la vista pública por usar filtros/ordenaciones o el índice derivado.
- El índice antiguo no se lee tras actualizar la revisión, incluso si la limpieza local se interrumpe.

## Pruebas incorporadas

1. `scientific-confirmation-38-bis-b7.spec.ts`: transiciones `DETECTED→DISCOVERED→VISITED→CATALOGUED→CONFIRMED`, cobertura de galaxias/sistemas/objetos, excepción del sistema completo, cuerpos históricos, galaxia no confirmada.
2. `genesis-universal-archive-confirmed-38-bis-b7.store.spec.ts`: migración de ámbito heredado, preservación del nuevo ámbito, idempotencia y eliminación selectiva al perder la confirmación.

**Verificación efectivamente ejecutada:** compilación TypeScript del módulo puro (`tsc --strict --noEmit`), ejecución Node de 8 aserciones con artefactos transpilados y análisis sintáctico de 14 archivos TypeScript: resultados correctos.

**Pendiente de validar en el entorno del usuario:** suites Vitest, arquitectura, workers, Playwright y compilación Angular completa. Motivo: Node 22.16.0 disponible aquí, inferior al requerido por Angular del proyecto, y `npm ci` no pudo completar las dependencias en el entorno aislado. No se declaran aprobadas esas pruebas.
