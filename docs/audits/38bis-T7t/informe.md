# Auditoría GENESIS 38.bis-T7t

- Marcadores por colonia solo bajo `layerVisibility.colonies`.
- Círculos grandes verdes de T7n intactos.
- Marcadores individuales anclados a los mismos pivotes `siteHigh` que la infraestructura COLVIS/VIDA.8.
- No reinserción de las mallas de anillos antiguas: preserva puntos luminosos T7r.
- Filtro por capa, hemisferio y tamaño proyectado; radio óptico acotado.
- `raycast` neutralizado solo para los nuevos indicadores (sin interferencia con selección 3D).
- Sin cambios a VIDA.8, VIDA.9 o a la ficha/modal.

Pruebas portátiles: `node scripts/auditar-genesis-38bis-t7t.spec.cjs`.
Vitest y WebGL en navegador pendientes de validación local.
