# GENESIS LIVE-SCI.2 — Reconciliación de conocimiento y progresión sin F5

## Diagnóstico

La captura reporta una tarjeta en nivel `VISITED` (etiquetado como «Identidad científica») que intenta ejecutar `ACTIVE_NUCLEUS_MULTIBAND_CHARACTERIZATION`. La transacción rechaza la acción con `isStateEligible=false` mientras que el instrumento y el objetivo sí son válidos. Esto es compatible con un estado de conocimiento ya avanzado en persistencia frente a una tarjeta obsoleta. **No se ha inspeccionado la IndexedDB del usuario**, por lo que la causa exacta de la divergencia no puede certificarse sin una reproducción local.

El parche anterior `LIVE-SCI.1` solo actualizaba la ficha después de una transacción exitosa; no conciliaba una tarjeta obsoleta **antes** de iniciar la transacción ni reaccionaba a una carrera concurrente durante ella.

El comando directo `npx vitest run ...` mostró `ReferenceError: describe is not defined` en tres suites. Sus pruebas usan globales que normalmente ofrece el ejecutor Angular. Se importan explícitamente `describe`, `it`, `expect` y `beforeEach` (cuando procede), evitando depender de globales implícitos. La validación recomendada se realiza con `ng test`.

## Modificaciones

1. **Prevalidación de estado:** `performScientificAction()` consulta el estado persistido inmediatamente antes de ejecutar la acción y lo compara con el mostrado. Si difiere, actualiza la tarjeta y abandona la acción antigua sin llamar a `commitAction()`.
2. **Recuperación de carrera:** cuando la transacción rechaza una acción cuya elegibilidad ya no coincide, el flujo vuelve a consultar la persistencia y reconstruye la ficha, conservando su renderer. Si persiste la inconsistencia, bloquea la repetición y ofrece `Actualizar ficha`.
3. **Identidad de ruta:** se descartan resultados tardíos tras navegar a otro objeto.
4. **Pruebas:** reconocimiento de un objeto recién detectado; paso `VISITED`→`CATALOGUED`; prevalidación frente a avance en otro lugar y conflicto concurrente durante la transacción. Se conserva la prueba `DISCOVERED`→`CATALOGUED`→`CONFIRMED` de LIVE-SCI.1.

No se cambian la generación científica, la física, los modelos/renderizadores 3D, los requisitos instrumentales, las probabilidades, las reglas de concesión de PD ni la persistencia. No se añaden migraciones.

## Validación local

Desde la raíz del proyecto:

```powershell
node scripts/auditar-genesis-live-sci-2.spec.cjs
npx ng test --watch=false --include=src/app/presentation/genesis-archive/archive-scientific-stage-live-sync.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/archive-discovery-detail.facade.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/archive-discovery-detail.spec.ts
npx ng build
```

Continuar después con la batería completa del proyecto. Los tests Angular/Vitest y el build no se han ejecutado aquí por ausencia de `node_modules`. Las comprobaciones sintácticas y la verificación de arquitectura no equivalen a una ejecución funcional.

## Límite científico intencional

En `DETECTED` la ficha del objeto puede contener solamente datos de señal y acciones de reconocimiento; esto procede del contrato de niveles de conocimiento existente, no de esta incidencia. Al completar las acciones, las secciones deben ampliarse conforme al nivel y las restricciones de 38.7. No se relajan esos controles.
