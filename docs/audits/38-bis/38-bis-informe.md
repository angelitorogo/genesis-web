# GENESIS 38.bis — informe de implementación

## Criterios cubiertos

- Inventario global de 16 clases a partir de catálogos galácticos y descubrimientos persistidos.
- Caché separada Dexie de solo lectura lógica; publicación por galaxia/categoría en transacción.
- Índices compuestos para filtros y paginación real en almacenamiento.
- Civilizaciones derivadas de VIDA.7/9 CT-0; colonias de VIDA.8/9 únicamente en sistemas CONFIRMED; no lectura directa al renderer.
- Saneamiento del conocimiento con verificación de revisión; cobertura parcial explícita y filas bloqueadas mientras no se haya cotejado el origen.
- Conservación total de 38.6/38.6a/38.6b: ningún cambio en 3D, satélites, iluminación ni modelos científicos.

## Límites y acciones de validación

1. Abrir `/archive` en universo V3 con varias galaxias descubiertas y comprobar que no hay «Archivo vacío».
2. Ver 16 categorías y cambio de universo sin mezcla de identidades.
3. Abrir `/archive/catalog/colonized-moons`, seleccionar galaxia y verificar enlaces a la ficha de la luna.
4. Una luna con varias colonias debe representar un único cuerpo en «Lunas colonizadas».
5. Probar civilizaciones y filtro `VERY_ADVANCED` y objetos extremos con filtro `BLACK_HOLE`.
6. Confirmar que un sistema DISCOVERED pero no CONFIRMED no aporta colonias ni civilizaciones privadas.
7. Recargar la web: la portada debe reutilizar contadores y los listados validar la revisión de origen.
8. Probar restauración/cambio de universo y el botón «Actualizar índice».
9. Medir paginación de catálogos grandes con Chrome Performance/Memory.

## Estado de ejecución

- `npm run test:architecture`: PASS.
- Parseo TypeScript de fuentes entregadas: PASS.
- Tipado parcial con stubs de dependencias: no detectó errores en los módulos 38.bis; el conjunto de fuentes externas registró errores por stubs incompletos. No equivale a Angular compilado.
- Pruebas nuevas en Vitest, `npx ng build`, E2E y rendimiento real: PENDIENTES DE USUARIO.

## Archivos modificados

- `src/app/app.routes.ts`
- `src/app/presentation/genesis-archive/genesis-archive.ts`
- `src/app/presentation/genesis-archive/genesis-archive.html`
- `src/app/presentation/genesis-archive/genesis-archive.scss`
- `src/app/presentation/genesis-archive/genesis-archive.spec.ts`
- `src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.facade.ts`
- `src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.index.ts`
- `src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.model.spec.ts`
- `src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.model.ts`
- `src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.store.spec.ts`
- `src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.store.ts`
