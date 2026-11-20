# GENESIS 38.bis-T3 — Informe de integración

## Punto de partida

Fuentes del Archivo 38.bis-B7/T1/T2 reconstruidas sobre el ZIP de código facilitado. El usuario ya tiene 15 galaxias, 210 fragmentos y ordenaciones persistidos. **No hay migración de esquema** y la base científica `genesis-web` no se modifica.

## Diagnóstico del código original

1. `GenesisUniversalArchiveFacade38Bis.load()` iniciaba `buildCategory()` y después `backgroundIndex()` incluso con todos los fragmentos guardados. El trabajador recalculaba la revisión científica por cada fragmento al abrir.
2. `GenesisUniversalArchiveStore38Bis.publish()` eliminaba las filas **y las cabeceras** de los índices derivados de ese fragmento. Después de confirmar un sistema se perdía qué campos había utilizado el jugador.
3. `GenesisUniversalArchiveAutoIndex38BisB6` actualizaba categorías por eventos, pero terminaba el trabajo al publicar el catálogo sin regenerar las ordenaciones usadas.
4. La información VIDA.9 se consultaba solo para la página visible. Un índice global Vida/Colonias/Civilización debe aplicar esa misma autorización para *todas las filas elegibles*, antes de ordenar y paginar.
5. Una notificación recibida durante el intervalo ocioso podía quedar esperando al siguiente intento de 30 segundos.

## Corrección

- Apertura: lectura de universos/galaxias confirmadas y de metadatos de secciones + cola persistida; se suprimen `buildCategory`, `backgroundIndex`, `pruneUnknownGalaxies` y limpieza v1 automática del flujo de apertura. Los fragmentos guardados se presentan inmediatamente si no tienen un trabajo pendiente; el Archivo no revisa la revisión científica de los 210.
- El actualizador de aplicación arranca independientemente del Archivo. Las confirmaciones publican trabajos de categorías afectadas en la cola B6, agrupados por `(scope, galaxy, category)`.
- `publish()` retiene las cabeceras de ordenaciones como **registro de campos usados**, elimina solo los datos de ordenación obsoletos y publica atómicamente las nuevas filas científicas. Incluso la publicación con igual revisión marca el campo como desactualizado.
- El trabajador reconstruye después únicamente los campos usados en esa categoría/universo y persiste cada revisión completa mediante la transacción Dexie ya existente; finaliza el trabajo solo después de esas escrituras. Una galaxia nueva hereda los campos usados de esa categoría, no crea todas las columnas posibles.
- Se deduplican las tareas de ordenación concurrentes entre un usuario que consulta y el trabajador de mantenimiento. Se cede ejecución entre campos.
- `VIDA9` invalida también **planets** y **moons**: sus ordenaciones biológicas dependen del registro confirmado y de su digest. El digest de esos registros se incorpora a la revisión científica de los fragmentos correspondientes cuando el indexador procesa un evento; para planetas y lunas se contabilizan exclusivamente registros de sistemas confirmados.
- `GALAXY` activa los catálogos de una galaxia recién confirmada sin obligar a recorrer las demás.
- El intervalo de trabajo pendiente se adelanta al llegar un evento, en lugar de esperar a un reintento ocioso largo.
- Si hay cola en curso al abrir, la vista espera a la categoría afectada, actualiza el progreso y recupera las secciones cuando finaliza. **No presenta filas antiguas como vigentes**.

## Las siete opciones nuevas

- **Planetas:** Galaxia (texto público), Vida, Colonias, Civilización nativa (booleanos ternarios).
- **Lunas:** Galaxia, Vida, Colonias.
- Booleanos: `No=0`, `Sí=1`, valores no autorizados o ausentes `null`; el desconocido siempre se muestra al final independientemente del sentido.
- La proyección biológica usa `DexieVida9BiologyExplorationRepository.get()` (que valida registros y digests) y exige confirmación persistida del sistema anfitrión. Colonias se validan con `validatedColonies38Bis`. Civilización utiliza `nativeCivilizationPresent` coherente con el snapshot VIDA.7, **no** el número de colonias. Nunca se almacena el registro biológico privado en el índice derivado, solo sus etiquetas autorizadas.
- Galaxia se obtiene de la denominación pública confirmada; no del índice numérico, y se normaliza para ordenación internacional.

## Compatibilidad

- El esquema de `genesis-web-archive-38bis` permanece en versión 4. Las cabeceras y filas anteriores se reutilizan sin reconstrucción obligatoria.
- Los índices *nuevos* se crean la primera vez que el usuario selecciona cada campo.
- El total 210 no está codificado como límite; depende de galaxias y categorías visibles.
- La base `genesis-web`, VIDA, generadores físicos, cámaras 3D, VISSURF y VISCIV no se modifican.
- Las consultas de categorías sin secciones guardadas no desencadenan un barrido universal implícito; se indica que puede hacerse mantenimiento manual con «Actualizar índice» o esperar una confirmación.

## Garantías y limitaciones

- La cola de B6 es persistente y recupera estados `RUNNING` y errores transitorios; una actualización interrumpida no publica sortRows parciales. No se trabaja con la aplicación cerrada.
- El evento de confirmación se emite **después** del commit científico, por lo que no bloquea ni modifica las transacciones del conocimiento. Se conserva el mecanismo B6 existente; **no hay transacción atómica entre las dos bases IndexedDB**. Un cierre o caída en la mínima ventana entre commit y registro de la cola puede requerir «Actualizar índice» explícito. No se promete una garantía transaccional que no existe.
- La autorización para la vista rápida se basa en la galaxia confirmada, el scope y la ausencia de trabajos en la cola. Si una copia externa cambia silenciosamente el contenido de IndexedDB sin emitir RESTORE, será necesaria una reconciliación manual. Las restauraciones habituales del servicio emiten eventos RESTORE.
- Sin `node_modules` ni el script general de arquitectura en las fuentes adjuntas, las pruebas completas Angular/Vitest/WebGL **no pueden darse por ejecutadas** aquí. Ejecutarlas en la instalación real antes del commit.

## Verificación reproducible

```powershell
node scripts/auditar-genesis-38bis-t3.spec.cjs
npx ng test --watch=false --include=src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-t3-scientific-sorts.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-autoindex-38-bis-b6.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-progress-38-bis-b4.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/genesis-archive.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-list-layout-38-bis-b1.spec.ts
npm run test:architecture
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```

## Comprobación de rendimiento en navegador

1. Partir de la base existente con todas las secciones y campos usados; abrir y cerrar el Archivo varias veces. Sin eventos, la cola deberá estar vacía, los fragmentos almacenados mantenerse y no verse barra «revisadas en esta apertura».
2. Elegir las siete opciones nuevas por primera vez y registrar su coste, especialmente Vida/Colonias; repetirlas y verificar que consultan el índice.
3. Confirmar un sistema que cambie planetas y lunas; esperar a que la cola termine; volver a elegir esas opciones y comprobar resultados actualizados y tiempo sin reconstrucción en primer plano.
4. Cerrar a mitad de un trabajo y reabrir GENESIS: debe recuperar solo la cola pendiente.
5. Verificar con fixtures de Vida = No, Vida = Sí, Colonias = Sí y Civilización nativa = Sí que colonización y civilización no se confunden. Repetir con registros VIDA.9 ausentes o dañados: «Sin determinar».
