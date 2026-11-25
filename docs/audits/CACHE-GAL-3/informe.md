# Informe de auditoría GENESIS CACHE-GAL.3

## Diagnóstico

- `GalaxyDetailFacade.scientificTelemetryCache` retenía **4 entradas** y, al expulsar una, reconstruía `GalaxyExplorationTelemetryEngine.build`, que puede implicar materialización costosa de inventario de sistemas confirmados.
- `DexieGalaxyKnowledgeSnapshotRuntime.hotSnapshots` retenía **6 entradas** de estadísticas y exploración; esas dos proyecciones sí disponían de respaldo persistido.
- `GalaxyDiscoveryReadCacheRuntime` retenía **12 consultas galácticas/tipo**. Mezclaba consultas de varias galaxias, de modo que visitar suficientes podía expulsar también los registros hidratados.
- El test anterior A → B → A no provocaba la expulsión de ninguna de las tres capas. Por eso era insuficiente.

## Contratos implementados

1. Persistir fragmentos de telemetría confirmada en **tabla ya existente**, sin modificación de esquema ni de datos científicos.
2. Restaurar fragmento solo con igualdad de revisión de conocimiento y estado; reconstruir si está ausente o dañado.
3. Escritura transaccional parcial comprobando revisión actual; no sobrescribir un snapshot posterior.
4. Coalescencia de solicitudes simultáneas y protección frente a resultados tardíos de revisiones antiguas.
5. Retención acotada de 64 consultas galácticas, independientemente de la persistencia de telemetría.
6. Pruebas de 18 galaxias, nueva instancia, nueva evidencia y escritura atrasada; test de 20 galaxias para caché de descubrimientos.

## Límites de certificación

- Las 33 comprobaciones portátiles incluyen la ejecución del runtime transpiliado con 19 galaxias y una instancia nueva, con dependencias externas simuladas. Siguen sin sustituir la compilación Angular, Vitest integrado ni el E2E.
- La primera visita a una galaxia sin fragmento materializado puede continuar siendo lenta: las visitas posteriores recuperan el fragmento, inclusive tras superar las seis entradas en memoria.
- Si persiste otra demora, medir fases de carga individualmente para determinar qué reconstrucción restante consume el tiempo.
