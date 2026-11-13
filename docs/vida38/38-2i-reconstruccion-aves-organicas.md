# GENESIS 38.2i — Aves orgánicas procedurales

**Estado:** implementada técnicamente; aceptación visual WebGL pendiente.

## Objetivo
Sustituir las aves de primitivos geométricos (versión 38.2) por una anatomía aviar SDF especializada, con plumaje regional instanciado, variación de silueta determinista y coherencia con el contrato visual 38.1.

## Arquitectura

- `vida38-bird-morphology-38-2i.ts` — perfil morfológico puro, inmutable, versionado. No utiliza pigmentos para seleccionar la anatomía; usa `speciesId`, semilla del contrato, plan, locomoción, hábitat, nicho, alimentación, cobertura y adaptaciones. Modulación ecológica probabilística, no inventario de capacidades científicas. Siete familias con variación continua (PASSERINE, CURSORIAL, RAPTOR, WADER, HEAVY, GLIDER, BURROWER).
- `vida38-bird-organic-field-38-2i.ts` — cuerpo, cuello, cabeza, pico, hombros, alas, muslos, tarsos, dedos y cola en un campo SDF único. Extracción de malla indexada por *marching tetrahedra*, corrección de orientación de caras, componente principal cerrada y auditoría topológica. Tres niveles LOW, MEDIUM y HIGH.
- `vida38-bird-materials-38-2i.ts` — pigmentación y rugosidad estables sobre coordenadas anatómicas locales. Antialias con `fwidth` y sin ruido temporal. Plumaje de contorno sobre triángulos reales con instanciación. Rémiges y rectrices mediante láminas curvadas de geometría propia, instanciadas. No se crean plumas cuando la cobertura de VIDA no es `FEATHERS`.
- `vida38-bird-preview-38-2i.ts` — integración Three.js, ojos insertados en cavidades, caché CPU limitada a tres geometrías por identidad/revisión y metadatos explícitos de hipótesis artística.
- `vida38-species-visual-preview-scene.ts` — ruta especializada **solo para BIRDS**, conservando las demás familias. Preserva el desplazamiento vertical de encuadre 38.2h.a al animar las aves y deja de añadir varillas sensoriales genéricas a aves.

## Reglas científicas

La variación aviforme es una **reconstrucción artística hipotética**, no un órgano detectado instrumentalmente. Se conserva `bodyLengthMeters` como metadato científico; la normalización de cámara del visor no modifica el valor VIDA. Solo se activa después de que las fichas existentes resuelvan los datos confirmados del sistema. No se toca VIDA.6–9, VIDA.T1, persistencia, ni renderizadores físicos.

## Diversidad

- **PASSERINE:** cuerpo compacto, cabeza más grande y patas proporcionadas.
- **CURSORIAL:** patas largas y cuello alargado; alas relativamente reducidas.
- **RAPTOR:** mayor volumen torácico, pico ganchudo y pies robustos.
- **WADER:** piernas y cuello muy alargados, pico fino/largo.
- **HEAVY:** tronco profundo y voluminoso, patas de soporte, alas reducidas.
- **GLIDER:** cuerpo ligero, alas extensas y cola estabilizadora.
- **BURROWER:** cuello robusto, cabeza compacta y pico más contundente.

Los perfiles poseen mezcla secundaria leve y variaciones continuas por especie; no son siete mallas fijas.

## Validación implementada

`vida38-birds-38-2i.spec.ts` comprueba determinismo, diversidad de siete familias, independencia de pigmentos, invariancia del tamaño VIDA, topología, plumaje condicionado por cobertura y la integración/restablecimiento del desplazamiento vertical.

`node scripts/auditar-genesis-38-2i-aves.spec.cjs` ejecuta la auditoría CPU sin Three.js sobre siete arquetipos. No sustituye los tests Angular ni la inspección WebGL.

## Límites conocidos

El detalle de rémiges y plumón visible en pantalla depende de WebGL y no puede certificarse con una galería geométrica de la malla base. La aproximación de pigmentos y la selección de formas concretas son hipótesis artísticas que deberán revisarse visualmente con capturas de varias especies reales. El visor sigue normalizando el tamaño aparente de una especie aislada para mejorar el encuadre; la longitud científica permanece en el contrato.
