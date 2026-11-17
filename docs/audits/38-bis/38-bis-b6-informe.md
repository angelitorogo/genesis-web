# 38.bis-b6 — Actualización automática por eventos de conocimiento

## Alcance implementado

- La instancia raíz de Angular inicia `GenesisUniversalArchiveAutoIndex38BisB6` al arrancar la aplicación: **no depende de navegar a `/archive`**.
- `DexieDiscoveryRepository.setState()` notifica únicamente después de confirmar en IndexedDB un cambio de estado de descubrimiento. El estado UNKNOWN invalida; no hay publicación de datos privados.
- `DexieVida9BiologyExplorationRepository.ensure()` notifica solo después de insertar un registro VIDA.9 válido e inmutable. Las lecturas o reusos de registros previos no generan eventos espurios.
- `DexieGenesisBackupService.importSnapshot()` notifica después de finalizar una restauración para las galaxias presentes en el conocimiento recuperado.
- Los eventos contienen solo identidad de universo, versión, galaxia y clase de cambio; **no almacenan payload biológico, identificadores privados ni coordenadas de origen colonial**.
- `GenesisUniversalArchiveStore38Bis` incorpora la migración **v4**: `dirtyJobs` persistente y deduplicada por `[scope, galaxy, categoría]`. Mantiene intactos `rows`, `sections`, `sortRows`, `sortRevisions` y `progressCheckpoints`.
- El consumidor recupera trabajos tras recarga, reclama uno cada vez, permite como máximo tres intentos automáticos en caso de error y no borra un evento si llega otro durante la indexación. Usa Web Locks cuando está disponible para excluir procesamientos simultáneos entre pestañas, con alquiler temporal de seguridad como alternativa.
- `GenesisUniversalArchiveIndex38Bis.ensure()` vuelve a verificar la revisión del conocimiento y el digest de VIDA.9 antes de publicar el fragmento. La publicación sigue siendo atómica y solo invalida las ordenaciones de ese fragmento si su fuente cambió.
- Nunca se reindexan **otras galaxias por el evento de una galaxia**. Los sectores no crean trabajo porque ya no tienen listado propio.

## Límite de granularidad

El motor actual del Archivo construye los catálogos por **galaxia y categoría**. Por tanto, la cola detecta y actualiza únicamente esos fragmentos afectados, pero un fragmento muy grande —por ejemplo asteroides de una galaxia— aún puede requerir recorrer su catálogo local para verificar o reconstruir las filas. La optimización **por fila individual** no está certificada ni incluida en b6. No confundir fragmento afectado con objeto individual.

La tarea se ejecuta como trabajo cooperativo de baja prioridad mediante temporización y los puntos de cesión de las fuentes de catálogo existentes; **no se ha creado un Web Worker dedicado**. No sigue procesándose si el navegador se cierra, pero los trabajos ya registrados se retoman al abrirlo. La notificación y la cola están en bases IndexedDB diferentes y no hay transacción atómica entre ambas: si falla el registro en la base derivada, la confirmación científica permanece válida y la verificación ordinaria al abrir el Archivo puede recuperarla.

## Pruebas incluidas

`genesis-universal-archive-autoindex-38-bis-b6.spec.ts` verifica selección de categorías, deduplicación, persistencia y reanudación, cambios simultáneos, segregación por universo/galaxia, errores y suscriptores.

## Validación local recomendada

```powershell
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-autoindex-38-bis-b6.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.store.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-progress-38-bis-b4.spec.ts"
npx ng test --watch=false --include="src/app/data/local/repository/dexie-vida9-biology-exploration.repository.spec.ts"
npx ng build
npm run test:architecture
```

### Prueba funcional

1. Esperar a que termine la primera indexación pendiente del Archivo (si existe), para facilitar la comparación.
2. Salir del Archivo; descubrir o confirmar un sistema nuevo, manteniendo GENESIS abierto.
3. Abrir el Archivo y comprobar que aparece el sistema sin pulsar «Actualizar índice». Comprobar que los fragmentos ajenos no han perdido sus datos ni sus claves de ordenación.
4. Confirmar un sistema que genere biología VIDA.9: las categorías civiles/coloniales se actualizarán mediante avisos propios.
5. Interrumpir una actualización con recarga: debe mantenerse la cola y reanudarse según el mecanismo de recuperación. En dos pestañas, comprobar que la actualización no se publica duplicada.
6. Restaurar una copia de seguridad: el Archivo debe revalidar el conocimiento importado, sin modificar los datos de origen.

## Verificaciones de esta entrega

- `npm run test:architecture`: PASS, 1227 fuentes TypeScript.
- Tipado estricto de los módulos puros de eventos y clasificación: PASS.
- Análisis sintáctico de nueve archivos TS modificados: PASS.
- Comprobaciones ejecutables puras de clasificación y deduplicación: 5/5 PASS.
- Angular, Dexie, Vitest y E2E integrales: no ejecutables aquí sin `node_modules`; se dejan para instalación local.
