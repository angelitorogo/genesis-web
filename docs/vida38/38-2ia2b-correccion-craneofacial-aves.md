# GENESIS 38.2i.a.2b — Corrección real de la visibilidad craneofacial aviar

## Defecto observado

Una especie aviar de GENESIS mantenía una cabeza casi esférica sin pico ni ojos legibles. El hotfix anterior (38.2i.a.2) modificó el volumen facial, pero **no** corrigió la localización de las córneas ni aseguró que el pico sobresaliera del cráneo extraído por el SDF. La nueva captura confirmó que seguía ocurriendo.

## Causas identificadas en código

1. El pico se calculaba mediante una longitud fija desde el centro craneal (`headZ + 0.19 * headSize + ...`) sin verificar el límite exterior del cráneo. Según la combinación de `headSize` y `billLength`, su relieve quedaba demasiado poco expuesto.
2. La geometría del iris y el ojo se construía en puntos fijos calculados a partir de `headRadius` y `headSize`, sin consultar el verdadero campo SDF. El SDF puede tener varias entradas/salidas a lo largo de la dirección ocular por la combinación de cuencas y mejillas, así que incluso una **primera** intersección con el SDF no garantiza visibilidad.
3. Las fibras del plumaje de contorno podían poblar también la superficie facial, reduciendo la legibilidad de ojos y raíz del pico.
4. La punta de algunas formas de pico podía tener un radio inferior al tamaño de celda de la malla LOW/MEDIUM, haciendo desaparecer volumen durante la extracción.

## Corrección

- `billTipZ` ahora garantiza una salida exterior de **al menos 0,145 × headSize** frente al extremo frontal del elipsoide craneal, conservando picos más largos de perfiles especializados.
- Las variantes `BROAD` utilizan un volumen que alcanza el extremo calculado, y las demás tienen grosor mínimo en la punta que sobrevive mejor al grillado SDF.
- Nuevo `deriveVida38BirdEyeSurface38IA2`: recorre una semirrecta desde el centro craneal y encuentra la **última salida al exterior** del SDF. Aloja allí el globo y sitúa el iris en su parte expuesta.
- Se añade una corrección mínima y determinista de protrusión cuando el campo SDF cerca de una mejilla cóncava todavía queda excesivamente cerca del iris.
- Nuevo `isVida38BirdProtectedFace38IA2`: reserva el área facial y suprime solamente las instancias de plumaje de contorno que nacerían sobre ella.
- La caché de mallas incluye la revisión del campo anatómico, para no reutilizar geometrías antiguas tras actualizar el generador.

La corrección **no** cambia la semilla morfológica 38.2i.a ni los parámetros de VIDA, y no reorienta la cámara ni altera la geometría de especies no aviares.

## Pruebas realizadas en el entorno de desarrollo

- Nueva auditoría CPU de **600 identidades aviares** que comprueba proyección visible de pico, anclaje al SDF de ambos ojos, iris fuera de la superficie y máscara de exclusión.
- Siete arquetipos generados en detalle LOW, con mallas cerradas y conectadas y pico exterior verificable a partir de los vértices reales.
- Auditorías previas 38.2i y 38.2i.a correctas.
- Comprobación semántica TypeScript estricta de morfología y campo geométrico, y sintaxis de módulos e integración.

## Pendiente

- Tests Vitest de Angular y `npx ng build` en el proyecto del usuario.
- Confirmación visual en Three.js de la **misma especie** que mostró el defecto, con vista frontal y de tres cuartos. No cerrar la incidencia hasta confirmar que el pico y ambos ojos se reconocen.
