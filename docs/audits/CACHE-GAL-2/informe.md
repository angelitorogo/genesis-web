# Informe técnico — GENESIS CACHE-GAL.2

## Hallazgos confirmados en el código

| Ruta | Estado anterior | Cambio |
|---|---|---|
| Lecturas del universo (`U`) + galerías (`G`) | Una sola LRU de seis claves, `G` podía expulsar `U` | Separa memoria para dos universos y doce consultas galácticas |
| `GalaxyDetailFacade.load` | Llama `getKnownDiscoveries(generationKey)`, luego filtra por `galaxyIndex` | Llama al índice `getKnownDiscoveriesInGalaxy` con fallback a la API general |
| Snapshot de estadísticas/telemetría | Revisión calculada correctamente; acceso y JSON de IndexedDB repetidos al volver | LRU acotada por identidad y `knowledgeRevision` |
| Estado de exploración, tecnofirmas y población | Debe seguir derivándose de descubrimientos persistidos | Sin bypass de confirmación ni nuevas fuentes de verdad |

## Contratos de regresión

- `A → B → A`: se conserva la lectura de A.
- Consultas intercaladas de múltiples categorías: no expulsan la lectura global.
- Nuevos descubrimientos y cambios de estado: invalidan ambas LRUs de lecturas.
- Distintas semillas/versiones: claves disjuntas.
- Transacciones Dexie: las consultas omiten snapshots anteriores, para leer sus propias escrituras.
- Estadísticas: cacheadas solo con la misma revisión de conocimiento, invalidación al cambiarla.
- Ficha galáctica: nunca obliga a hidratar todo el universo cuando está disponible la lectura por índice.

## Cobertura verificada

Auditorías portátiles: CACHE-GAL.2 15 OK, CACHE-GAL.1 27 OK y CACHE-GAL.1a 9 OK, incluyendo carga real del módulo de caché transpiliado en entorno aislado. AST TypeScript válido en seis archivos. No se ha ejecutado Angular real, Vitest ni IndexedDB con la partida del usuario; estos resultados están expresamente pendientes.

La auditoría CACHE-GAL.1 se adaptó solamente en la aserción de la capacidad de caché para aceptar los límites divididos por ámbito; todas sus pruebas de invalidación, concurrencia y transacciones se mantienen.
