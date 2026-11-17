# GENESIS Web · 38.bis-b1 — Maquetación de listados del Archivo Universal

## Resultado

- La vista de **Galaxias** conserva el marcado original.
- **Sectores** se oculta del dashboard y deja de indexarse en el trabajo automático. El índice histórico y el tipo interno permanecen para compatibilidad; no se altera la base Dexie.
- Las demás categorías utilizan una disposición de **dos líneas**: designación arriba; campos compactos inferiores con desplazamiento horizontal cuando no caben; botones contiguos en el extremo derecho, ocupando ambas filas en escritorio ancho.
- Los campos y el orden de navegación están declarados para **14 categorías** y sus magnitudes provienen de los catálogos científicos existentes. No se inventan masa, radio, edad ni clasificación.
- En **Planetas** y **Lunas**, `Vida` y `Colonias` se consultan solo para las filas de la página visible (lotes de hasta 12), desde registros VIDA.9 con digest validado y tras confirmar el sistema. Se muestra `Sí`, `No` o `No evaluable` si aún no existe un registro certificado. **Vida** abarca vida nativa, vida introducida o población colonial registrada; **Colonias** se refiere a instalaciones coloniales certificadas.
- La columna de planeta anfitrión en **Lunas colonizadas** ahora tiene el nombre público obtenido del índice de destino; se invalida solo ese fragmento de caché y se reconstruye a demanda, sin regenerar biología.
- Los botones se construyen **solo con acciones autorizadas** que ya forman parte del registro público; los mundos natales no certificados no reciben un enlace inventado.

## Límites

- La fuente de planetas/lunas puede carecer de registro VIDA.9 aun siendo conocido el objeto. En ese caso se presenta **No evaluable**, nunca un `No` infundado.
- Una ruta histórica de objeto sin ficha individual no produce un botón inexistente.
- Las 14 categorías de listados conservan los filtros y la paginación IndexedDB existentes, sin materializar la colección global en Angular.
- No se ha ejecutado Angular, Vitest ni el renderer de navegador en este entorno (faltan las dependencias `node_modules` del proyecto).

## Pruebas para Windows

```powershell
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-list-layout-38-bis-b1.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-colonial-rows-a6.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/genesis-archive.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.store.spec.ts"
npx ng build
npm run test:architecture
```

## Preservación

Sin cambios de generadores, VIDA, escenas 3D, satélites, luces, digests, CT-0 o `package.json`. El índice existente no se borra. Las búsquedas y los filtros mantienen sus rutas y claves internas.
