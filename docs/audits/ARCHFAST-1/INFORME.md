# GENESIS ARCHFAST.1 — Consolidación del mantenimiento del Archivo

## Base revisada

Fuentes de `genesis-diagnostico-progresion-conocimiento.zip`, con los parches LIVE-SCI.1, LIVE-SCI.2, NUCLEUS-SYNC.1 y BULKCONF-ARCHPERF.1 superpuestos según su orden de entrega. No se ha reconstruido ni modificado ninguna base de datos de usuario.

## Hallazgos

El mantenedor previo fusionaba correctamente las notificaciones por universo/galaxia/categoría, y BULKCONF.1 bloqueaba el autoindexado durante la confirmación masiva mediante Web Locks. Sin embargo, cada categoría de un mismo conjunto de trabajos volvía a cargar los descubrimientos de la galaxia y a calcular la revisión científica. Las categorías biológicas repetían también su recorrido de huellas VIDA.9. Después de publicar cada sección, cada ordenación usada volvía a cargar sus filas completas, aunque perteneciera al mismo fragmento. El panel no permitía conocer la categoría concreta que se procesaba ni el campo actual.

## Modificaciones

1. **Instantánea efímera por galaxia para la cola automática:** reutiliza `known`, `galaxyKnowledgeRevision` y dos huellas separadas de VIDA.9: pública (solo sistemas confirmados, planetas/lunas) y general (resto de categorías biológicas). La caché tiene una sola entrada, expiración de 90 segundos y se invalida al recibir un nuevo commit científico local de la galaxia. Las consultas manuales siguen verificando la revisión directamente. **No se persiste la instantánea**.
2. **Ordenaciones consolidadas:** selecciona únicamente los campos utilizados que no tienen la revisión vigente, consulta las filas del fragmento una sola vez, y reutiliza también la proyección biológica para los campos que la comparten. Cada ordenación conserva una transacción propia, comprueba la revisión de la sección y se coordina con el mapa de deduplicación `sorting38BisT3` existente. No se mezclan los datos de galaxias diferentes.
3. **Progreso persistido:** la cola conserva fase `FRAGMENT` / `SORTS`, páginas completadas/total (donde exista paginación), campo actual y ordenaciones terminadas/total. Los nuevos metadatos son opcionales y compatibles con trabajos persistidos antes del parche. Cada escritura de progreso valida el `serial` y el estado `RUNNING`, para no sobreescribir una invalidación posterior. La información solo afecta al índice derivado.
4. **Interfaz:** despliega las tareas por galaxia y categoría, mostrando el progreso de páginas o campo actual, y estados `PENDING`, `RUNNING`, `ERROR`, con intentos y mensaje de error. Se refresca mediante el mecanismo de cola ya existente, también cuando llega un commit con el Archivo abierto y previamente inactivo.
5. **Conservación:** BULKCONF-ARCHPERF.1 sigue siendo responsable de escrituras de descubrimientos por lotes y agrupación de eventos. ARCHFAST.1 **no toca** `DiscoveryRepository`, transacciones CT-0, VIDA, PD, visualizadores, shaders, rutas ni esquema IndexedDB.

## Garantías e interrupciones

- Nunca se da un fragmento por vigente por el simple hecho de aparecer almacenado: `ensureFresh` conserva la comparación de revisión.
- Publicación de cada fragmento atómica; ordenaciones individuales atómicas, con revalidación de sección durante la transacción.
- La cola conserva trabajos tras interrupciones; el `serial` impide borrar una invalidación nueva al terminar un trabajo antiguo.
- La instantánea se invalida con commits locales y expira. **Límite conocido:** las modificaciones científicas desde otra pestaña no generan necesariamente este evento local; la expiración limita la ventana de reutilización, pero no sustituye una futura sincronización explícita entre pestañas. La confirmación masiva usa el Web Lock existente.
- No se calcula un porcentaje ficticio para censos que no exponen progreso paginado: se muestra únicamente la fase actual. El avance por páginas y ordenaciones sí corresponde a operaciones reales completadas.
- No hay promesa de tiempo fijo: la generación de catálogos completos y el tamaño de las escrituras dependen del número de objetos y del hardware.

## Comprobaciones realizadas en este entorno

- `node scripts/auditar-genesis-archfast-1.spec.cjs`: **18/18 comprobaciones estructurales/sintácticas**, con TypeScript disponible en el entorno.
- `node scripts/verify-architecture.mjs`: **PASS** (6 capas, 1.294 TS productivos). Para ejecutar sobre la copia diagnóstica local fue necesario restablecer el directorio vacío `src/app/observation`; el ZIP de origen solo traía el placeholder de carpeta, y este directorio no forma parte del parche.
- Scripts de auditoría previos de BULKCONF.1 y NUCLEUS-SYNC.1: **PASS**.
- **No ejecutados:** Vitest, la compilación Angular, cobertura, tests de worker o E2E. El proyecto de diagnóstico carece de `node_modules`, y no se han descargado dependencias.

## Validación local

```powershell
node scripts/auditar-genesis-archfast-1.spec.cjs
npx ng test --watch=false --include=src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-archfast1.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-autoindex-38-bis-b6.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-sort-38-bis-b3.store.spec.ts
npm run test:architecture
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```

Tras validar el build, registrar una copia de seguridad y confirmar una galaxia de pruebas: comprobar que la cola no crece por cada sistema, que los campos ya vigentes se reutilizan, que el progreso muestra las fases de cada galaxia/categoría/ordenación y que una interrupción deja trabajos pendientes que se recuperan. Comparar tiempos con el mismo tamaño de galaxia y el mismo estado inicial de la base.
