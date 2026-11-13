# GENESIS Web — 38.2i.a: refinamiento anatómico aviar

## Alcance

Mejora incremental del generador aviar 38.2i; no sustituye el contrato visual 38.1 ni modifica VIDA.6–9, IndexedDB, humanoides, mamíferos o renderizadores planetarios. Sigue siendo una **reconstrucción artística**, nunca un dato biológico observado.

## Anatomía de las patas

El campo SDF ahora utiliza hitos anatómicos diferenciados:

1. Cadera y fémur alto, en gran parte integrados en el cuerpo.
2. Rodilla alta con flexión hacia delante, normalmente oculta por plumaje.
3. Corvejón posterior visible (articulación intertarsal, no rodilla invertida).
4. Tarsometatarso fino que desciende desde el corvejón.
5. Tres dedos anteriores divergentes, un hallux posterior y uñas curvas pequeñas.

Los hitos (`deriveVida38BirdLegLandmarks38IA`) tienen perfiles y flexiones diferentes por especie; se incluyen en la malla orgánica mediante unión suave. La etiqueta de «3+1» es una hipótesis anatómica visual controlada por perfil, no un nuevo campo de VIDA.

## Mayor divergencia de arquetipos

El contrato aviar ahora tiene una revisión nueva: `VIDA.38.2i.a/bird-morphology/v2`. Se conservan los siete arquetipos, con mayor contraste en las proporciones: corredora, zancuda, rapaz, planeadora, voluminosa, excavadora y paseriforme. La semilla deriva de la revisión y de los campos científicos existentes; la pigmentación nunca interviene en la anatomía.

Los parámetros nuevos incluyen `hockFlexion`, `tarsusLength`, `toeSplay`, `halluxLength`, `footPadWidth`, `wingLift`, `wingSweep`, `primaryFeatherLength`, `wingDisplay` y `tailOrnament`.

## Alas y colas

- Base de ala SDF con codo y extremo más diferenciados, variación de barrido y elevación.
- Dos filas de plumas instanciadas: secundarias más cortas y primarias largas que se abren gradualmente.
- Algunos individuos presentan alas notoriamente amplias por la semilla determinista.
- Rectrices de largo y abanico variables; dos rectrices prolongadas únicamente en perfiles ornamentales.
- Se conserva el LOD (LOW/MEDIUM/HIGH) y el material aviar de coordenadas locales estables.

## Picos

Aparte de cónicos, robustos, anchos y ganchudos, el perfil puede generar picos largos tipo lanza o suavemente curvos. La geometría del pico usa segmentos integrados en el campo SDF, con grosor decreciente y curvatura controlada. Los sesgos ecológicos influyen sin convertirse en una regla fija que invente nueva biología.

## Geometría, escala y rendimiento

- Se mantiene una sola malla principal cerrada y continua con *marching tetrahedra*.
- Las plumas son submallas queratínicas legítimas, separadas de la anatomía SDF principal.
- La caja de muestreo SDF incluye extremos de pico, cola y alas elevadas.
- Se preservan el dato de longitud corporal VIDA y el recuadre automático 38.2h.a.
- Se reusa el cache CPU del visor, cuya clave incluye la nueva revisión.

## Pruebas

- `node scripts/auditar-genesis-38-2ia-aves.spec.cjs`
- `node scripts/auditar-genesis-38-2i-aves.spec.cjs`
- `npx ng test --watch=false --include="src/app/presentation/life-species-visual/vida38-birds-refinement-38-2ia.spec.ts" --include="src/app/presentation/life-species-visual/vida38-birds-38-2i.spec.ts" --include="src/app/presentation/life-species-visual/vida38-species-camera-framing-38-2ha.spec.ts"`
- `npx ng build`

**Validación visual pendiente:** corroborar en fichas reales que el corvejón, los dedos y la apertura alar se distingan con el acabado PBR y las plumas, y que no haya artefactos de sombreado ni intersecciones aparentes. La galería CPU neutral es un diagnóstico de siluetas, no una captura de WebGL.
