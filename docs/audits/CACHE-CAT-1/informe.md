# Auditoría GENESIS CACHE-CAT.1

## Hipótesis verificada en código

Las fichas galácticas persistían telemetría (CACHE-GAL.3), pero `PendingGalaxyKnowledgeCatalogDataSource.query` no retenía las **páginas finales** de los catálogos. Una nueva consulta volvía a pasar por la carga del índice, el filtrado y el ordenado de registros incluso cuando la respuesta pública solicitada era idéntica.

## Solución

Intercepción de la consulta científica **después** de validar la galaxia mediante `GalaxyKnowledgeCatalogFacade`. Una clave completa incluye identidad, revisión del conocimiento y parámetros normalizados. La página final se conserva como fragmento `catalogPagesJson` de `GalaxyKnowledgeSnapshotEntity`; la actualización transaccional se limita a ese campo. El tamaño y cardinalidad están acotados.

## Invariantes de seguridad

- Conservación únicamente de registros ya publicados por los adaptadores, nunca generación privada.
- `scientificOnly !== true` no usa caché.
- `knowledgeComplete === false` nunca persiste resultados VIDA.9 incompletos.
- Revisión de los registros de descubrimiento antes de cada hit; no leer vistas obsoletas tras una nueva confirmación.
- No se eleva `DiscoveryState`, no se conceden señales de la fase 37 ni se modifica 38.7.
- Claves distintas para mundos, versiones, galaxias, estados y filtros.

## Pruebas disponibles

- Script Node portátil: 23 comprobaciones, ejecutadas localmente, todas superadas.
- 7 pruebas Vitest añadidas, ejecución pendiente en proyecto Angular completo.
- `npx ng build`, suite de arquitectura y E2E pendientes en el entorno del usuario.
- Medición real de tiempo pendiente sobre el volumen IndexedDB del usuario.

## Riesgos/limitaciones

- La primera materialización de un catálogo o del índice biológico VIDA.9 puede seguir siendo costosa. CACHE-CAT.1 elimina reconstrucciones repetidas de **la misma página**, no calcula anticipadamente todas las categorías.
- Si el snapshot científico de la galaxia existe con revisión anterior, se evita escribir encima de sus fragmentos antiguos; la página nueva funcionará desde RAM y será persistible en cuanto el snapshot se actualice a la nueva revisión.
- La aceleración es por página y consulta; filtros nunca visitados requieren su primera ordenación y paginación.
