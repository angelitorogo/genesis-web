# 38.bis-b4 — Seguimiento persistente de indexación del Archivo GENESIS

## Alcance

- Conserva los fragmentos `sections` y las ordenaciones `sortRevisions` anteriores.
- Migra de manera no destructiva la caché IndexedDB `genesis-web-archive-38bis` a versión 3, incorporando `progressCheckpoints`.
- Cada checkpoint registra universo, categoría, galaxia, magnitud (`base` para el catálogo), fase y fecha.
- La publicación de un catálogo y la finalización de un índice de ordenación se registran **en la misma transacción** que sus datos.
- Si el navegador se recarga durante una construcción, el último checkpoint `RUNNING` queda persistido. Al regresar aparece como **Interrumpido**, mientras no exista un fragmento final publicado.
- Si ya había índices de versiones anteriores, el panel detecta `sections` y `sortRevisions` como **Guardado** sin exigir una reconstrucción.
- Si cambia el conocimiento, el verificador original `ensure()` sigue validando las revisiones. Mostrar «Guardado» no autoriza mostrar conocimiento privado, ni sustituye la validación CT-0.
- Volver a la portada vuelve a lanzar la verificación en segundo plano. La indexación no empieza de cero cuando los fragmentos guardados siguen siendo válidos.
- Las magnitudes científicas se construyen solo si se seleccionan, como en 38.bis-b3.

## Panel

- Resumen compacto `guardados / total` para todas las galaxias y categorías visibles (sin Sectores).
- Desplegable por categoría, y dentro por galaxia: estado del catálogo y de cada magnitud de ordenación.
- Estados: `Guardado`, `En curso`, `Pendiente`, `Interrumpido`, `Error`, `Desactualizado`.
- Nombres públicos de categorías, galaxias y magnitudes; no se muestran datos científicos privados.

## Validaciones locales de generación

- `node scripts/verify-architecture.mjs`: PASS.
- TypeScript sintáctico de archivos modificados: PASS.
- Tipado estricto del modelo puro de progreso: PASS.
- Comprobaciones ejecutables aisladas de agregación de estados: PASS.
- No se ejecutaron Angular ni Vitest/Dexie reales en esta sesión (sin `node_modules`).

## Pruebas en el proyecto

```powershell
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-progress-38-bis-b4.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-sort-38-bis-b3.store.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.store.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/genesis-archive.spec.ts"
npx ng build
npm run test:architecture
```

## Validación visual sugerida

1. Abrir Archivo GENESIS y desplegar **Progreso persistido de indexación**.
2. Consultar Planetas, seleccionar galaxia y observar «Agua líquida superficial (%)» o «Temperatura superficial (°C)» como **Pendiente** si aún no se ha construido ese índice.
3. Abrir el listado de Planetas, seleccionar una magnitud y regresar al panel de progreso: debería figurar **Guardado** una vez terminada su construcción.
4. Recargar: el índice terminado conserva estado **Guardado**. Si la recarga interrumpe otro fragmento, ese aparece **Interrumpido**, sin perder los terminados.

No borrar IndexedDB, ni la caché existente ni las galaxias.
