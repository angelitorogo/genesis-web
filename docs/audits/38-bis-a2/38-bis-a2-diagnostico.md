# 38.bis-a2 — Contrato de auditoría colonial

1. Cada fila colonial conocida conserva `colonyOriginTier` y una atribución confirmada o `colonyOriginIssue`, nunca ambos.
2. Las categorías diagnósticas se derivan **sin regenerar datos científicos**; se almacena un código por colonia destino verificada.
3. `summarizeArchiveColonies38Bis` agrega los códigos de causa por galaxia. `combineArchiveColonies38Bis` consolida todas las galaxias sin materializar sus filas completas; las entradas antiguas sin causas se etiquetan `NOT_DIAGNOSED`.
4. `diagnoseArchiveCivilizationCoverage38Bis` distingue falta de sección, sección persistida pero no revalidada y sección sin el desglose `civilizationTierCounts`.
5. La revisión `founder-diagnostics-v2` invalida exclusivamente los fragmentos de la categoría Colonias ya publicados. Las otras categorías no se regeneran por este cambio.
6. Si la fuente natal es privada o no verificable, se mantiene su estado cerrado: no se genera una ruta, ni se muestra identidad alguna de origen.
7. El botón específico comprueba solo Colonias y Civilizaciones; es compatible con la indexación habitual, que verifica estas categorías cuando llega su turno.

La validación de `17` no puede darse por realizada sin ejecutar la indexación sobre la partida del usuario y comparar el desglose con `unattributedColonies`.
