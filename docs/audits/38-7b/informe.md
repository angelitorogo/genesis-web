# GENESIS 38.7b — Informe de reparación

## Incidencias reportadas

- `TS2740` asignación inválida de `MeshBasicMaterial` a `Mesh<..., MeshPhysicalMaterial>` en un test COLVIS.
- Cuatro `TS2353` porque el parche 38.7a estrechó la interfaz `SystemSceneCivilizationVisualRecord` y eliminó campos previamente utilizados en 38.6: `infrastructurePlans`, `moonIndex` y metadatos de identidad.

## Resolución

1. Restaurar metadatos opcionales con sus tipos reales, sin quitar el `tier:null` introducido correctamente por 38.7a.
2. Usar una malla independiente en el test de rechazo de materiales incompatibles, sin cambiar el renderer ni forzar cast.
3. Añadir una prueba de regresión que acepte simultáneamente registros de civilización completos, registros de vegetación sin civilización y fixtures mínimos históricos.

## Verificaciones de cierre

Repetir auditorías 38.7, 38.7a y 38.7b, pruebas dirigidas de las cinco unidades y compilación Angular. Hasta que se realicen, la certificación final de 38.7 sigue pendiente.
