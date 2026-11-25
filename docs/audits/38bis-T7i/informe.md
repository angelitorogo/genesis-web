# Auditoría técnica — GENESIS 38.bis-T7i

## Causa

T7h adjuntaba `context.mesh` y `context.detailMesh` a `site.site`. Ambos eran
cuadrículas `PlaneGeometry`, curvadas respecto a una esfera teórica. La
geometría auténtica de la luna/planeta tiene su propia escala, teselación y
relieve. Las aproximaciones diferentes creaban intersecciones y bordes rectos
visibles, en particular en el encuadre oblicuo del modal.

## Solución

- Se elimina por completo la llamada a `site.site.add(context.mesh,context.detailMesh)`.
- Las fichas vinculan cada entrada de infraestructura con el **surfaceMesh
  nativo del cuerpo**, sin duplicar la malla.
- La superficie recibe una variante temporal de su material estándar/físico,
  conservando el material original, sus mapas y su hook de compilación.
- El detalle es una modulación fotográfica local de luminancia, generada desde
  el helper de ruido T7h, aplicada únicamente dentro de un radio angular con
  borde suave y sobre las normales/posiciones reales del cuerpo.
- Material y textura temporal se liberan al salir; no se almacena nueva
  información científica ni se altera IndexedDB.

## Verificaciones

- Auditoría T7h adaptada: 49 comprobaciones portátiles.
- Auditoría T7i: 24 comprobaciones portátiles de lógica, compilación sintáctica,
  ausencia de nuevas geometrías y restauración del material.
- Prueba Vitest nueva `colvis3-native-terrain-t7i.spec.ts`: contrato para el
  material real de Three.js, zoom y limpieza. Pendiente de la instalación del usuario.
- Angular completo y validación visual/WebGL: pendientes de su proyecto.

## Limitación

La textura local sigue siendo una reconstrucción procedural. Se utiliza para
realzar el terreno visible y no como topografía científica observada.
