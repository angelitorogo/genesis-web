# Informe — GENESIS 38.bis-T7b · Intervalos poblacionales, índices antiguos y actualización acotada

## Diagnóstico técnico

El indicador `No evaluable` no distingue entre (a) una sección derivada persistida ANTES de T7, cuyo `cells.population` no existe, y (b) una colonia válida con intervalo VIDA.8 ausente en su payload histórico. T7a recuperó los contratos T3, pero no forzó una reconstrucción de los fragmentos coloniales antiguos al entrar. No se dispone de una copia de la IndexedDB real para cuantificar cuál de las causas afecta a cada fila; la reparación cubre ambas sin inventar datos.

## Producción

- Helper T7: la fuente directa `settlement.colonialPopulationRange` conserva prioridad. Si es nula o ausente, se lee exclusivamente la banda `settlement.populationBand` y se traduce mediante los cuatro intervalos publicados por `Vida8TechnologicalColonization`. Una tupla presente malformada se rechaza; la suma no asigna cero a valores ausentes; se controlan enteros seguros.
- Índice: incrementa la huella derivada `population-t7b-v2` para las 3 categorías y la clave de la caché compartida `colony-projection-population-t7b-v2`. `ensureFresh` reevalúa solo los fragmentos cuyo encabezado difiere. La escritura atómica del store invalida las ordenaciones secundarias anteriores.
- Fachada: en la apertura rápida T3b ya se leen secciones del índice. Se detectan versiones obsoletas de la categoría colonial SELECCIONADA y se excluyen temporalmente de las filas verificadas; se reconstruyen asíncronamente SOLO esos fragmentos, no todas las categorías ni todo el conocimiento privado. Las actualizaciones de la cola B6 tampoco vuelven a mostrar filas T7 antiguas como verificadas. Las categorías planetarias, lunares y científicas ajenas a colonización no cambian.

## Pruebas

| Auditoría | Resultado en preparación |
| --- | --- |
| T7 — población y proyección real AST | 69 comprobaciones PASS |
| T7a — contratos T3 y compatibilidad | 55 comprobaciones PASS |
| T7b — cuatro bandas de motor VIDA.8 y 3 vistas | 40 comprobaciones PASS |
| Tipado estricto aislado de helper | PASS |
| Compilación Angular, Vitest real y E2E | Pendientes del equipo del usuario |

## Contratos preservados

Solo lectura de VIDA.8 / VIDA.9 CT-0, confirmado y con digest validado por la ruta existente. No muta universo, descubrimientos, IndexedDB científico ni generación. No hay cambios de esquema, no fuerza reindexación universal, no toca componentes visuales, T3a/T3b ni otras ordenaciones.
