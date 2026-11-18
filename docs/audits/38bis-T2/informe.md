# GENESIS 38.bis-T2 — Reanudación y optimización del Archivo confirmado

## Diagnóstico del problema reproducido

El Archivo muestra 160/210 fragmentos persistidos. El método `load()` cancelaba con
`jobSequence` la indexación global previa al cambiar de ruta y, al entrar en una
categoría, ejecutaba únicamente `buildCategory()`. Al terminar, la indexación
universal no se reanudaba. Además, `refreshIndex()` reconstruía con `force=true`
todos los fragmentos, aunque la revisión científica de los ya persistidos no
hubiera cambiado. `backgroundIndex()` salía por completo ante el primer fallo,
por lo que un único error de Asteroides impedía indexar Cometas, TNO y Capturados.

## Cambios

1. La comprobación de la categoría visible continúa con la indexación universal
   mientras la vista siga abierta, sin obligar al usuario a regresar a la portada.
2. El plan de indexación da prioridad a los fragmentos sin publicación; después
   comprueba las secciones existentes frente a las revisiones científicas vivas.
3. «Actualizar índice» verifica y reconstruye solo fragmentos cuya revisión
   haya cambiado o que no existan: se elimina el `force=true` general.
4. Un error localizado conserva su checkpoint y la última publicación íntegra;
   no detiene el trabajo en otras galaxias y categorías y se informa al usuario.
5. En los fragmentos sin cambios, se evita releer el inventario completo de
   secciones y las tres tablas de progreso tras cada verificación.
6. No se introducen categorías de descubrimientos prematuros ni se modifica CT-0;
   la verificación en `index.ensure()` sigue leyendo el estado actual y la huella
   persistida VIDA.9. No se borran ni migran bases IndexedDB.

## Límites de la optimización

La primera construcción de catálogos de cuerpos menores puede seguir siendo
costosa: esta entrega elimina trabajos redundantes y la parada de la cola, pero
no modifica los generadores físicos ni promete un tiempo absoluto de ejecución.

## Pruebas

- `node scripts/auditar-genesis-38bis-t2.spec.cjs`
- `npx ng test --watch=false --include=src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-index-plan-38bis-t2.spec.ts`
- `npm run test:architecture`
- `npx ng build`

La validación completa en Angular/Vitest debe ejecutarse en el entorno GENESIS.
