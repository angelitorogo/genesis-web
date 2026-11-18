# 38.bis-T1 — Reconciliación de la batería general de GENESIS

## Entrada
Batería del usuario: 6.631 tests, 47 fallidos, 6.584 correctos, 12 archivos afectados (18/11/2026).

## Contratos corregidos

1. **IndexedDB y Dexie en Vitest**. El almacén derivado `GenesisUniversalArchiveStore38Bis` admite ahora un segundo argumento opcional de dependencias `indexedDB`/`IDBKeyRange`. Los siete archivos de pruebas que usan este almacén construyen cada instancia con `fake-indexeddb` explícito mediante `createArchiveTestStore38Bis`. Este cambio evita depender del estado global del worker, que en la batería extensa carecía de `indexedDB`. En producción el segundo argumento se omite y Dexie usa el IndexedDB nativo; la base principal GENESIS y la base de índices derivada permanecen separadas.
2. **Stub de la fachada del Archivo**. La prueba de layout B2 incorpora los contadores y el detalle persistido de indexación, además del estado de ordenación, requeridos por la plantilla actual tras B4/B7.
3. **Galaxia confirmada**. La expectativa de `galaxy-detail.spec.ts` se actualiza a `Inventario confirmado y exploración`; se conserva la regla de que lo descubierto no se considera confirmado.
4. **Reptilianos**. Dos pruebas heredadas usan ahora el nivel civilizatorio tipado actual y comprueban el vestuario 38.2u (primitivo), 38.2s (avanzado) y la construcción 38.2o del muy avanzado. Se elimina la exigencia de una malla heredada que los renderizadores modernos retiran expresamente. La comprobación de anclaje primitivo utiliza el contrato real SDF 38.2u7.
5. **VISCIV.6i**. Se mide el relieve vertical con la raíz y el rotor en el marco orbital local. El anterior `Box3` en mundo incluía la extensión vertical del círculo inclinado y confundía diámetro con altura arquitectónica. Se mantienen las cotas exigentes; ningún modelo visual se modifica.

## Alcance de producción
Solo cambia **el constructor del almacén derivado**, de manera retrocompatible y exclusivamente para permitir inyección de dependencias en pruebas. No se modifican esquemas IndexedDB, versiones de base de datos, inventarios científicos, generadores VIDA ni ninguna geometría, shader o material de producción.

## Validación realizada en el entorno de preparación
- Reconstrucción de fuentes 38.6 y todos los incrementales disponibles hasta VISCIV.6o.
- `node scripts/verify-architecture.mjs`: PASS (1.243 archivos TypeScript analizados, 6 capas).
- Auditoría portátil del parche y comprobación de sintaxis: PASS.

## Validación pendiente en el repositorio del usuario
No se dispone en este entorno de Angular, Three, Vitest ni Dexie instalados para ejecutar el test completo. No se certifica que los 47 casos hayan pasado hasta ejecutar la batería real con las dependencias del proyecto.

### Comandos
```powershell
node scripts/auditar-genesis-38bis-t1.spec.cjs
npm run test:architecture
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```
