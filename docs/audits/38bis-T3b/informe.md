# GENESIS 38.bis-T3b — Consolidación de apertura rápida y actualizaciones confirmadas

## Fuentes y estado previo

Se ha reconstruido el código del Archivo a partir del ZIP de fuentes del usuario y los incrementales **38.bis-T1, T2, T3 y T3a**. **T3 ya implementaba** las siete ordenaciones, la cola B6, la actualización anticipada de columnas usadas y la eliminación del barrido general al abrir. **T3a ya corregía** la persistencia visual del selector de ordenación. Esta entrega es una **consolidación incremental**, no una reinstalación de esas funciones.

La base de uso real indicada por el usuario contiene 15 galaxias y 210/210 fragmentos, con ordenaciones persistidas. Esta entrega **no migra ni elimina** esas tablas.

## Diagnóstico y cambios de T3b

1. **Notificaciones de conocimiento prematuras.** En `DexieDiscoveryRepository.setState`, cada transición de estado (incluidas `DETECTED → DISCOVERED`, `DISCOVERED → CATALOGUED` y eliminaciones de datos no confirmados) podía emitir una invalidación. La cola B6 actualizaba innecesariamente varios catálogos de esa galaxia, aunque el archivo de ciencia confirmada no hubiera cambiado. Se añade `archiveConfirmedStateChanged38BisT3b`: solo encola cambios que **entran o salen** del estado `CONFIRMED`. Se comprueba también la baja a `UNKNOWN`; antes notificaba incluso eliminaciones de registros no confirmados. Se conservan las notificaciones autónomas `VIDA9` y `RESTORE` de sus repositorios.
2. **Doble lectura de metadatos en la apertura.** `GenesisUniversalArchiveFacade38Bis.load()` leía `sectionsFor(scope)` y, después, `reloadIndexProgress()` volvía a leer `sections` mediante `progressFor(scope)` junto con sus cabeceras de ordenación y checkpoints. Ahora carga una **instantánea coherente en una sola transacción de lectura** (`openingSnapshot38BisT3b`), que devuelve las cabeceras de los fragmentos, las ordenaciones, los checkpoints y la **cola B6**. Evita la carrera entre una sección obsoleta y una cola recién vaciada. No ejecuta `ensure()` ni `backgroundIndex()` ni relee todas las revisiones científicas de la fuente. Se mantienen los controles de galaxias confirmadas y los filtros de scope.
3. **Refrescos innecesarios de páginas.** Mientras existían tareas pendientes, la vista de progreso llamaba a `refreshPage()` cada 2,2 segundos, aunque la tarea fuera de otra galaxia/categoría. Esto podía recorrer de nuevo las 15 ordenaciones de una consulta global. Ahora solo refresca si cambia un fragmento de la categoría/galaxia visible, si se elimina un fragmento confirmado, o si todavía falta la página. La regla se separa como función pura y dispone de tests.
4. **Instantáneas obsoletas entre rutas.** Se invalida la secuencia de lectura de progreso anterior cuando comienza una nueva carga de Archivo, impidiendo que una lectura asíncrona antigua sobrescriba un estado nuevo.

## Comportamiento conservado

- Siete ordenaciones de planetas/lunas, por galaxia y por estado científico ternario.
- Construcción inicial bajo demanda, cabeceras de uso persistidas y mantenimiento anticipado de ordenaciones afectadas.
- Cola persistente B6, trabajos por `(universo, galaxia, categoría)`, recuperación `RUNNING`, reintento acotado `ERROR` y deduplicación por revisión.
- Filtro de seguridad `CONFIRMED`, identidad de universo, control sobre registros VIDA.9 autorizados.
- Abrir el Archivo sin ejecutar reconciliaciones generales; botón de actualización manual disponible.
- Sin modificaciones al esquema de IndexedDB de GENESIS ni a `genesis-web-archive-38bis` (sigue v4).
- Ninguna modificación a la representación 3D, VIDA, VISCIV, VISSURF o al HTML T3a.

## Verificaciones realizadas en este entorno

- Auditoría portátil T3b: **PASS**, comprobando las rutas de apertura y el filtro de eventos.
- Análisis sintáctico con `typescript.transpileModule` de los archivos TypeScript entregados: **sin diagnósticos sintácticos**.
- Auditoría de paquete: nombres normalizados y sin modificaciones a bases de datos, configuración de paquetes ni scripts PowerShell.

**No se han ejecutado** los tests Angular/Vitest, E2E ni el build completo porque la copia de fuentes disponible no trae `node_modules` ni todos los scripts generales. Sus resultados deben confirmarse con los comandos de LEEME antes del commit.

## Pruebas añadidas

- Transiciones desde o hacia `CONFIRMED` frente a cambios anteriores o repetidos.
- Apertura de 210 secciones con **una única transacción** de metadatos y cola, **cero** verificaciones de catálogos científicos y **cero** reconstrucciones de ordenaciones.
- Lectura real Dexie de un fragmento y sus invalidaciones dentro de la misma instantánea; finalización y persistencia de trabajos de cola sin pérdida de cabeceras.
- Regla de refresco de página: trabajos en otra categoría o galaxia no disparan recálculo; revisión o retirada del fragmento visible sí.

## Limitación transaccional heredada

Las notificaciones científicas se emiten después de confirmar la transacción de `genesis-web` y la cola vive en otra IndexedDB. No existe transacción atómica entre ambas bases. La cola protege los trabajos **ya registrados**, pero una caída exacta entre el commit científico y su aviso auxiliar puede requerir la reconciliación manual. No se ha añadido un barrido oculto por apertura para simular esa garantía.

## Protocolo visual y funcional para el usuario

1. Con sus 210/210 secciones y ordenaciones guardadas, abrir/cerrar Archivo varias veces. Ninguna comprobación universal se inicia, y los contadores siguen persistidos.
2. Confirmar un sistema y esperar a que finalice la cola. Las ordenaciones utilizadas se actualizan y vuelven a estar disponibles.
3. Descubrir/catalogar sin confirmar otro objeto. No se encolan fragmentos nuevos por ese mero cambio de estado.
4. Confirmar o retirar un objeto confirmado. La cola B6 se activa para categorías afectadas; ninguna otra galaxia se reconstruye por ese evento.
5. Abrir el Archivo mientras existen trabajos pendientes. Los resultados de fragmentos obsoletos no se publican; otras categorías se consultan normalmente.
6. Interrumpir la actualización y reabrir GENESIS; la cola B6 recupera solo lo necesario, sin nueva revisión global.
7. Probar las siete nuevas ordenaciones y la permanencia visible de “ORDENAR POR” y “DIRECCIÓN” de T3a.
