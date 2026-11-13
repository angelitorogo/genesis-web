# 38.2o.e5c — Retirar la galería de las fichas del juego

## Alcance
Se cambia exclusivamente el valor predeterminado de `showReptilianGalleryToggle` a `false` en `LifeSpeciesVisualPreviewComponent`. La ficha normal del juego no presenta el botón «Galería comparativa reptiliana».

La galería independiente de Laboratorio **no depende de este botón**: utiliza `Vida38ReptilianGalleryLaboratory38OE5BComponent` y `Vida38ReptilianGallery38OE5Component`, que permanecen intactos. También sigue disponible el visor 3D en esa página.

No se modifican rutas del laboratorio, modelos SDF, procedurales, IndexedDB ni controles del visor.
