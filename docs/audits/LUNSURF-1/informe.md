# GENESIS LUNSURF.1 — Superficies lunares HD y materiales físicos

## Hallazgo en el código existente

- `buildSystemSceneMoonTextureV1` generaba un atlas equirectangular de **128×64 o 192×96** para la escena 3D y **1024×512** para la ficha científica.
- La mayor resolución de la ficha solo incrementaba la cantidad de muestras de un relieve de bajo espectro: `sampleMoonTerrainD` terminaba a aproximadamente 41 ciclos de ruido sobre la esfera.
- `createSystemSceneMoonRenderableV1` reutilizaba `reliefRgba` simultáneamente como `bumpMap` y `roughnessMap`. Por tanto, la reflectancia quedaba correlacionada artificialmente con el relieve, mientras la ficha carecía de un `normalMap` propio.
- El atlas D.3 contiene geometría científica de superficie **visualizada**, con cuencas, cráteres y fracturas deterministas. Suprimirla o usar los continentes procedurales de planetas destruiría la diversidad lunar. Se conserva.

## Cambios realizados

1. Nuevo refinamiento LUNSURF.1 derivado de ruido tridimensional cartesiano, con distorsión de dominio suave, escalas mineral/provincial/regolítica y amplitudes pequeñas. No introduce anillos ni rayas de latitud.
2. El acabado cromático se añade sobre el **albedo D.3 ya calculado** para las fichas HD y el zoom lunar cercano. Los cráteres, sus centros/radios, las regiones de hielo y las máscaras de agua no se modifican.
3. El mismo mapa de altura refinado alimenta un **mapa de normales tangentes** con diferencia central, compensación polar acotada y costura longitudinal idéntica.
4. Una nueva rugosidad **independiente** separa regolito rocoso (mate), materiales helados (menos rugosos), volcánicos y líquido visualmente admitido. No modifica la clasificación ni las coberturas científicas.
5. El renderizador lunar crea y libera los mapas HD de normales y rugosidad en Three.js, en espacio de color de datos (`NoColorSpace`), conserva el mapa de relieve como respaldo y mejora el filtrado anisotrópico solo para mapas HD sólidos.
6. `SystemScene` genera el atlas HD solo al acercarse a una luna (umbral de 300 píxeles; histéresis de 210); selecciona como máximo una luna, compite con el foco HD planetario y recupera los materiales originales cuando deja de ser la más cercana. La geometría lunar irregular y sus colonias no se reemplazan ni deforman.
7. Las lunas lejanas mantienen **idéntico presupuesto de texturas y LOD**, sin nuevos mapas HD. Las capas de nubes, atmósferas, colonias y estaciones no se modifican.

## Validaciones ejecutadas

- Auditoría Node de funciones de producción: **25 comprobaciones superadas** con una luna rocosa y otra helada, determinismo, conservación del registro, consistencia longitudinal de los cuatro mapas, geometría del focus e histéresis.
- Transpilación de los cinco archivos TypeScript modificados/añadidos: sin errores sintácticos.
- Comparación experimental del atlas 1024×512 en un fixture rocoso: diferencia media de brillo entre píxeles adyacentes de 0,559 a 2,091; en el fixture helado de 1,113 a 2,394. Esta medida refleja mayor estructura de alta frecuencia, **no una calificación de calidad visual en WebGL**.
- Muestras de 1024×512 en Node: anterior ~1,2 s; LUNSURF.1 ~1,5 s. Son mediciones aisladas, no tiempos garantizados en navegador.

## Limitaciones y riesgos pendientes de comprobar en el PC del usuario

- No se han ejecutado aquí Angular completo, Vitest, E2E ni renderizado WebGL real por ausencia de dependencias del proyecto en este entorno. La auditoría portable no sustituye estas validaciones.
- La generación HD al entrar por primera vez en zoom cercano puede causar una pausa breve. Se libera al cambiar el objeto enfocado, sin modificar la escena base.
- Comparar Aaras A-11 I (helada), Aaras A-9 IV (helada) y Aaras C-5 I (rocosa) con un encuadre equivalente. Revisar cráteres, grietas, continuidad, sombras, satélites y colonias.
- No modifica capas de nubes, atmósfera, iluminación VISSURF.6, VIDA.8/9, física, semillas ni IndexedDB.
