# 38.2o.e5 — Galería comparativa de reptilianos civilizados

## Alcance
Se incorpora como panel dentro del visor existente `LifeSpeciesVisualPreviewComponent`, accesible desde su barra de herramientas. No requiere rutas adicionales ni acoplamiento a IndexedDB. Se abre pulsando «Galería comparativa reptiliana».

## Diseño
- Modo 12 (predeterminado) o 24 ejemplares.
- Selección reproducible con búsqueda greedy de cobertura de 10 familias, 6 líneas de atuendo y 6 culturas en los primeros 12.
- Contratos sintéticos marcados `LAB_ONLY`, siempre `REPTILES`, linaje `REPTILIAN`, `VERY_ADVANCED` y tamaño >= 1.5 m.
- Miniaturas del renderer de producción en calidad `LOW`, un único contexto WebGL y liberación de modelo tras capturar cada imagen.
- Selección abre el ejemplar en el visor 3D existente, conservando rotación, desplazamiento y zoom.
- Botón para volver a la especie real original; sin modificar universo ni persistencia.

## Límites y validación pendiente
La galería es una herramienta artística de contraste, NO mide unicidad perceptual de pixeles ni representa las distribuciones reales de civilizaciones. Validar compilación y render en navegador con el proyecto original.
