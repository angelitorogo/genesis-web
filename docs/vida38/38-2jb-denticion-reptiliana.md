# GENESIS — 38.2j.b Exposición, anclaje y lectura visual de la dentición reptiliana

## Problema observado

Tras 38.2j.a, el cuerpo reptiliano se ve correctamente, pero los dientes aparecen parcialmente enterrados y la comisura se confunde con la piel.

**Causa geométrica encontrada:** en 38.2j, el código colocaba raíces dentales, surcos bucales y dientes con una coordenada lateral derivada de `snoutWidth`. Esa aproximación no sigue el exterior del SDF: según arquetipo, la superficie real puede estar mucho más adentro o afuera.

## Intervención

- Nuevo módulo puro `vida38-reptile-dentition-38-2jb.ts`.
- Se resuelve la salida lateral **real** del SDF para cada raíz, línea de boca y labio inferior. Si la sección no existe, se omite el elemento en vez de situarlo arbitrariamente.
- Dientes superiores, y también inferiores en dentición depredadora, orientados hacia la mordida. La raíz comienza sobre la superficie; la punta se orienta para permanecer fuera de la superficie, sin flotación.
- El labio inferior se desplaza ligeramente según `jawGap` y se reduce la fusión SDF mandibular, sin separar el cuerpo principal.
- Se distinguen perfiles `HIDDEN`, `SUBTLE`, `MODERATE` y `PRONOUNCED` derivados de la dentición que VIDA ya permite. La nutrición `PREDATOR`/`OMNIVORE`/otros modula la apertura sin modificar el perfil VIDA.
- Nueva clave de caché de geometría para evitar reutilizar mallas anteriores de 38.2j.a.
- La hendidura y el borde labial usan materiales opacos y posiciones sobre superficie: no se toca el material de escamas corregido en 38.2j.a.

## Limitaciones expresas

- Boca, dientes y rasgos hipotéticos continúan siendo **reconstrucciones artísticas**: no son observaciones de la especie.
- No se simula mordida, masticación ni se modifica fisiología, alimentación o datos VIDA.
- La boca se define por cambios discretos en la mandíbula SDF y por el surco superficial; no se ha implementado cavidad oral articulada.
- La galería es un **diagnóstico CPU en sección sagital y proyección lateral**. No prueba el acabado WebGL ni ausencia de artefactos al mover la cámara.

## Pruebas

`node scripts/auditar-genesis-38-2jb-denticion-reptiles.spec.cjs`

`node scripts/auditar-genesis-38-2j-reptiles.spec.cjs`

Tests Angular con `vida38-reptile-dentition-38-2jb.spec.ts`, tests de 38.2j, 38.2j.a, visor y encuadre; después `npx ng build`.

## Condiciones para cerrar

Probar una especie real como **Omera on7, Devor um3 y Loluna en4** con vistas lateral y tres cuartos. Las raíces dentales deben tocar la encía, las puntas correspondientes deben sobresalir y la boca debe leerse sin colmillos suspendidos. Validar estabilidad con giro y zoom. No cerrar solo por pruebas CPU.
