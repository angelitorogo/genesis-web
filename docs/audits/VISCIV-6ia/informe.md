# Auditoría VISCIV.6i.a

## Incidencia
- Usuario: Vitest 6i 3 tests, 1 fallo.
- Medición original: HABITAT = 0.1439777729101479 radios planetarios.
- Contrato existente: `THREE.Box3().setFromObject(monumental)` debe producir altura HABITAT > 0.20, INDUSTRIAL > 0.24 y TRANSPORT > 0.12.

## Causa y solución
Las bandas arquitectónicas estaban demasiado próximas en Y; no bastaba que los grupos y los `InstancedMesh` existiesen. Se han aumentado separaciones verticales sin cambiar la órbita de los anillos, y añadido pilares instanciados entre las cubiertas.

## Compatibilidad
- No se modifica la semilla ni los planes orbitales VISCIV.6f/6h.
- No se tocan `SystemScene`, ficha 3D, VIDA.7/9 ni IndexedDB: ambas escenas llaman al generador compartido de anillos.
- Se mantienen los mínimos del test original y se añade verificación de pilares instanciados.

## Validación en este entorno
- Auditoría Node de parámetros: PASS.
- Sintaxis TypeScript por transpileModule: PASS.
- Vitest/Angular/Playwright: no ejecutados por falta de dependencias completas de GENESIS; debe verificarse en el proyecto del usuario.
