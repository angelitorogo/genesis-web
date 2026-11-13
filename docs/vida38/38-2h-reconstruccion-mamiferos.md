# GENESIS 38.2h — Mamíferos cuadrúpedos orgánicos

## Ámbito e integración

- Activación solo para `MAMMALS` con `bodyPlan=TETRAPOD` en `createVida38SpeciesPreviewModelV1`.
- Especies humanoides, reptiles, aves, insectos, plantas, hongos y microorganismos conservan sus renderizadores.
- No altera VIDA.6/7/8/9, identidad biológica, IndexedDB, ni los modelos físicos de los mundos.
- El modelo es una **reconstrucción artística hipotética** de una especie CT-0 ya confirmada, **no una imagen observada**.

## Diversidad determinista

`vida38-mammal-morphology-38-2h.ts` define `Vida38MammalMorphologyV1` con 11 arquetipos de proporciones, no mallas estáticas:

RODENT, CANID, FELID, BOVID, PROBOSCIDEAN, CERVID, URSID, HIPPOPOTAMOID, MUSTELID, LEAPER, PRIMATOID.

Cada especie combina un arquetipo dominante con una influencia secundaria limitada. Se utilizan canales semilla independientes y restricciones por nutrición, hábitat, locomoción y cobertura. Los rasgos no certificados por VIDA (cuernos, probóscide, número visual de dedos, longitud de orejas) **son hipótesis de reconstrucción artística**. La morfología no depende de los pigmentos.

## Anatomía cuadrúpeda especializada

`vida38-mammal-organic-field-38-2h.ts` implementa un campo implícito 3D cuadrúpedo; no gira el humanoide horizontalmente. Fusiona:

- tronco, tórax, cintura escapular, pelvis, columna, cuello;
- cráneo, mandíbula y hocico con proporciones variables;
- cuatro extremidades, articulaciones, manos/patas/dedos y tipos de apoyo;
- orejas con formas especializadas;
- cola orgánica;
- estructuras opcionales como cuernos, probóscide y defensas.

Marching Tetrahedra genera la isosuperficie. Se verifican malla cerrada, orientación consistente, normales finitas y una sola componente principal. El motor SDF se ha desarrollado de forma aislada para no modificar la arquitectura humanoide ya aceptada.

`bodyLengthMeters` se preserva sin alteración. La ficha aplica una **normalización de exposición** al objeto en pantalla, como en la implementación 38.2 original: no equivale a una actualización de la dimensión física VIDA.

## Materiales y pelaje

- PBR `MeshPhysicalMaterial` con metalness 0, pigmentación 3D anclada a `position`, ruido multiescala de baja amplitud, `fwidth` para umbrales y rugosidad suave.
- Pelaje solo cuando la cobertura VIDA es `FUR`; mechones triangulados, instanciados y estables por `identitySeed`.
- Capas LOW, MEDIUM y HIGH con distinto coste de malla/pelaje.
- Pupilas y globo ocular se componen como estructuras ópticas justificadas, no como articulaciones del cuerpo principal.
- Caché CPU acotada a 4 identidades/revisiones; recursos GPU con disposición normal del visor.

## Validación realizada

`node scripts/auditar-genesis-38-2h-mamiferos.spec.cjs` comprueba la geometría real de once ejemplos: número de triángulos, valores finitos, cero aristas abiertas, cero no manifold, orientación consistente, una componente por cuerpo. También confirma invariancia ante recoloreado y determinismo del perfil.

El documento adjunto `genesis-38-2h-galeria-geometrica-mamiferos.png` es una representación **neutral geométrica** de las once morfologías, no una validación WebGL final. Tests de Angular y build completos deben ejecutarse en la máquina con dependencias y Node soportados.

## Limitaciones y aceptación

La galería muestra diversidad estructural, pero no demuestra automáticamente fotorrealismo ni plausibilidad biomecánica completa de todos los arquetipos. Falta comprobar pelo, materiales, ojos, posturas, animación y cámara en el navegador, así como la consistencia de ejemplares reales de VIDA. 38.2h queda pendiente de aceptación visual del usuario.
