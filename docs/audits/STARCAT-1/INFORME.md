# GENESIS STARCAT.1 — Categoría individual de estrellas

## Objetivo y alcance

Integrar **Estrellas**, distinta de **Sistemas**, en el conocimiento persistido de la ficha galáctica y en el Archivo GENESIS. Cada fila representa un componente A, B o C de un sistema estelar **CONFIRMED**, con identidad estable por galaxia, sector, índice de sistema y letra. El enlace se resuelve siempre hacia la ficha del sistema anfitrión o su escena científica (sin inventar ruta propia para cada estrella).

El catálogo utiliza las mismas fuentes procedurales que las fichas: V1 físico congelado para la secuencia individual, y la formación multianfitrión real V2/V3 para las componentes B/C, incluidas las edades coevolutivas de V3. Registra radio y masa solar, temperatura efectiva, luminosidad, edad, evolución, etapa (RGB/AGB), tipo y familia espectral. Estas son magnitudes del **modelo físico**, **no** los tamaños artísticos de STARVIS.1.

## Integraciones

- Ficha galáctica: tarjeta «Estrellas individuales confirmadas», basada en descomposición `single + 2*binary + 3*triple`, sin incluir sistemas aún no clasificados. Enlace a `/galaxies/:galaxyIndex/knowledge/stars`.
- Catálogo local: ordenaciones por designación, radio, masa, temperatura, luminosidad, edad, evolución, etapa, espectro, familia, sistema y componente. Filtros de enanas blancas, marrones, secuencia principal, RGB, AGB y supergigantes. Paginación y búsqueda del catálogo existente.
- Archivo global: categoría en navegación y estadísticas, filtros por evolución, ordenación numérica `sortNumbers` sin convertir etiquetas redondeadas, búsqueda y rangos por atributos numéricos. Una sola fila por cada componente.
- Cola BULKCONF-ARCHPERF.1/ARCHFAST.1: eventos `SYSTEM`, `GALAXY` y `RESTORE` invalidan y coalescen el nuevo fragmento, sin abrir nuevos trabajos por cambios `BODY`, `VIDA9`, `SECTOR`, `CIVILIZATION` ni otros objetos galácticos. Confirmación masiva mantiene su barrera de consolidación previa. ARCHFAST reutiliza la lectura conocida de la galaxia y las ordenaciones de estrellas.
- Migración inicial: en el arranque, sólo se encolan fragmentos `stars` ausentes en galaxias que ya tenían fragmento `systems`, sin reindexar las demás categorías ni alterar índices persistidos. Idempotente con trabajo existente; no altera la versión de esquema Dexie.
- Fuente galáctica: snapshot temporal limitado a **una galaxia** y **30 s**, revisión de conocimiento, resultados de 1 sola categoría, cache de vista única, reuso de perfiles por sector, yield cada 32 sistemas e invalidación por cambios confirmados. V2/V3 múltiples requieren materializar la formación multianfitrión para obtener B/C idénticos a la ficha: la primera construcción de una galaxia muy grande puede ser costosa, después se reutilizan sus fragmentos.

## Garantías

Sin alteración de generadores, semillas, estados de descubrimiento, fichas científicas, visuales STARVIS.1, leyes orbitales MOONCAD, IndexedDB de conocimiento original, ni tabla de migraciones. El nuevo índice es derivado y descartable; no concede nuevos descubrimientos. Los resultados se ordenan con sus magnitudes numéricas originales y el registro mostrado enlaza a su sistema público. Las notificaciones descartan resultados en caché, e impiden sobrescribir una instantánea nueva con una tarea antigua.

## Verificaciones realizadas en este entorno

- `node scripts/auditar-genesis-starcat1.spec.cjs` — **40/40** comprobaciones de contratos/sintaxis (estáticas).
- `npm run test:architecture` — **PASS**, 6 capas, 1296 archivos TypeScript de producción.
- `node scripts/auditar-genesis-archfast-1.spec.cjs` — **18/18**.
- `node scripts/auditar-genesis-bulkconf-archperf-1.spec.cjs` — **22/22**.
- `node scripts/auditar-genesis-starvis1.spec.cjs` — **23/23**.

**Pendiente de ejecución en el equipo del usuario:** Vitest/Angular, compilación Angular completa, batería general, observación visual y mediciones de carga en galaxias con miles de sistemas. Esta copia reconstruida no contiene `node_modules`, por lo que `tsc` completo y `ng build` no son verificables aquí; las pruebas orientadas del ZIP están escritas, pero no se afirma haberlas ejecutado.

## Comportamiento esperado

Con 20 galaxias ya indexadas, el Archivo pasará de 280 fragmentos existentes a un máximo de 300 una vez terminada la indexación de **Estrellas**; las ordenaciones se crearán bajo demanda y se mantendrán con ARCHFAST.1. Las galaxias nuevas que se confirmen integrarán la nueva categoría desde el primer ciclo de mantenimiento. Cualquier error de categoría queda visible en el panel de mantenimiento ya existente.
