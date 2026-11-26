# GENESIS BULKCONF-ARCHPERF.1 — Confirmación masiva reanudable y Archivo no saturado

## Contexto y diagnóstico

El código administrativo `C0DE-6A1A-C0DE-F11A` recorría los sectores de la galaxia activa y llamaba a `DiscoveryRepository.setState(..., CONFIRMED)` para **cada** sector, sistema y objeto. `DexieDiscoveryRepository.setState` realiza consultas/escrituras individuales y publica cambios a la cola del Archivo al entrar o salir de `CONFIRMED`. Con muchos descubrimientos y el actualizador universal activo, la operación puede prolongarse y generar reconstrucciones intermedias.

## Cambios incluidos

1. **Ruta de confirmación en lotes (hasta 256 objetivos)**: `DiscoveryRepository.confirmLocatorsBatch` es un contrato opcional; la implementación real en `DexieDiscoveryRepository` efectúa `bulkGet` + `bulkPut` dentro de una transacción de Dexie, sin modificar descubrimientos que ya tienen estado `CONFIRMED`. Conserva `firstKnownAtEpochMs`, valida las direcciones y los identificadores regenerados y no introduce tablas ni migraciones.
2. **Reanudación segura por reconciliación**: el recorrido de la galaxia vuelve a enumerar las direcciones canónicas y *solo escribe las pendientes*. No confía en que un sector `CONFIRMED` implique que todos sus hijos estén confirmados (la implementación anterior podía interrumpirse entre esas escrituras). Si se interrumpe durante un lote, IndexedDB revierte **ese lote**, mientras que los anteriores permanecen guardados. Una ejecución posterior reconcilia lo que falta.
3. **Archivo protegido**: la invalidación `GALAXY` se registra y espera antes de comenzar a escribir y vuelve a registrarse al finalizar. Las confirmaciones por lote **no envían eventos por cada descubrimiento**, evitando la tormenta de 11/14 categorías repetidas miles de veces. En navegadores con Web Locks (Chrome/Edge) se mantiene el mutex compartido `genesis-archive-38bis-b6` para que el actualizador no procese fragmentos intermedios, incluso desde otra pestaña. El guard local impide la competencia dentro de la misma pestaña cuando Web Locks no está disponible.
4. **Progreso visible**: `/codes` muestra los sectores recorridos/confirmados por lotes; no modifica los PD ni concede otras recompensas.
5. **Preparación biológica V3**: una vez concluida la operación, la lectura del catálogo científico se limita a la galaxia activa (`getKnownDiscoveriesInGalaxy`), no a todo el universo. Mantiene la materialización VIDA.9 que ya existía, sin modificar sus reglas.
6. **Compatibilidad**: los repositorios alternativos/tests que no implementan la API de lote usan la ruta antigua con consulta previa de estado, omitiendo confirmados.

## Seguridad y alcance

- Solo funciona para galaxias conocidas de universos V2/V3, y solo actúa sobre la galaxia en foco al iniciarse.
- Las fechas, estados ajenos, universos/galaxias distintas, PD, observaciones, datos VIDA y renderizadores no cambian.
- La cola del Archivo sigue siendo derivada: no participa en la transacción científica ni contiene datos privados.
- No se guardan checkpoints de progreso que puedan quedar incorrectos tras un restore o una edición posterior. Se utiliza el propio estado persistido de cada objetivo como checkpoint fiable, de forma que **las escrituras previas no se repiten**. El recorrido procedural completo sigue siendo necesario para encontrar posibles hijos pendientes en sectores ya marcados `CONFIRMED` por ejecuciones antiguas.
- Una desconexión del navegador puede interrumpir el procedimiento; no se pierde lo ya confirmado. Repetir el código completa únicamente las filas faltantes. La marca inicial de actualización del Archivo persiste para reconstruir los índices una vez desbloqueado el worker.
- Si se usan navegadores sin Web Locks en varias pestañas simultáneas, la exclusión de trabajo entre pestañas no está garantizada; sí lo está en la misma pestaña. Se recomienda ejecutar el canje en una sola pestaña.

## Pruebas y auditoría

Archivo `bulk-galaxy-confirmation-archperf1.integration.spec.ts`:
- Escrituras solo para estados no confirmados; conservación de fechas.
- Identidades de galaxia/versiones y persistencia tras reapertura.
- Recuperación de sectores confirmados cuyos hijos quedaron incompletos.
- Interrupción después de una transacción y continuación posterior.
- Fallo al registrar el Archivo antes de comenzar: no se inicia la modificación.
- Límites máximos de lote y progreso sobre una secuencia de 320 sectores.

**Ejecutado en este entorno:** auditor estático `node scripts/auditar-genesis-bulkconf-archperf-1.spec.cjs` (22/22); verificador de arquitectura `node scripts/verify-architecture.mjs` (correcto); análisis sintáctico TypeScript de los archivos modificados (correcto); prueba de integridad del ZIP.

**No ejecutado aquí:** Vitest/Angular completos, `ng build` y medición del tiempo real con Erylaune: el entorno no contiene las dependencias npm del proyecto.

## Validación recomendada en Windows

```powershell
node scripts/auditar-genesis-bulkconf-archperf-1.spec.cjs
npx ng test --watch=false --include=src/app/presentation/codes/bulk-galaxy-confirmation-archperf1.integration.spec.ts
npx ng test --watch=false --include=src/app/presentation/codes/focused-galaxy-confirmation.runtime.spec.ts
npx ng test --watch=false --include=src/app/presentation/codes/focused-galaxy-confirmation-v3.integration.spec.ts
npm run test:architecture
npx ng build
```

Antes del canje, guardar una copia de seguridad desde las herramientas existentes de GENESIS. Durante el canje observar el progreso en `/codes`; al terminar verificar la galaxia, sus sistemas y el Archivo con la cola a cero. No es necesario reconstruir previamente los 280 fragmentos guardados.
