# 38.bis-b3 — Auditoría del índice de ordenación científico

## Contrato

- 14 categorías de listado; Galaxias sin cambios; Sectores sigue retirado del inventario.
- Ordenación global previa a paginación: filas provenientes de todas las galaxias conocidas y filtradas por conocimiento persistido.
- Orden numérico científico (ej.: 2,8 < 10,1 < 80,8; -90 < -20 < 30), sin ordenar lexicográficamente cadenas formateadas.
- Nulos no se convierten en 0; siempre al final cuando no hay intervalo; con intervalo numérico quedan excluidos.
- Origen científico: magnitudes públicas de los snapshots catalogados cuando se reindexa la categoría, o texto visible ya persistido para índices históricos no reconstruidos.
- Construcción lazy por categoría/galaxia/columna; Índices derivados atómicos e invalidados junto a los fragmentos originales.
- Filtros: universo, galaxia, categoría, prefijo de nombre, subtipo existente (civilización/familia/destino) y rango de la magnitud numérica elegida. Orden ASC/DESC.
- No se almacena dato VIDA.9 privado adicional, no se regeneran objetos ni se altera CT-0.

## Riesgos / decisiones de diseño

La primera selección de una magnitud puede construir un índice secundario para múltiples galaxias. Este trabajo se amortiza en consultas posteriores y no se reproduce si las revisiones no cambian. Las combinaciones de búsqueda por prefijo y ordenación numérica recorren el índice ordenado aplicando el prefijo, pero no cargan el catálogo completo en el componente.

La clasificación de Vida/Colonias en los listados generales de Planetas/Lunas continúa resolviéndose exclusivamente en la página visible, por lo que no es una ordenación global disponible en este incremento. Los valores numéricos no presentes o sin resolución científica figuran como «No evaluable».

## Pruebas efectuadas en el entorno de entrega

- `node scripts/verify-architecture.mjs`: PASS, 1.221 TypeScript revisados. Carpeta `observation` reconstruida como directorio vacío para el auditor; no forma parte del incremento.
- `tsc` estricto del planificador puro y tipos: PASS.
- `tsc` estricto del store con declaración temporal de contrato Dexie: PASS (no sustituye el contrato Dexie real).
- 12 fuentes modificadas: sintaxis TypeScript sin incidencias.
- Pruebas puras Node de conversión y catálogo de ordenaciones: PASS.
- Vitest en Dexie real, compilación Angular y render UI: pendientes de la instalación local del usuario.
