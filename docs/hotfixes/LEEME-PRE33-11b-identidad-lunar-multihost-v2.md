# GENESIS Web — Hotfix PRE-33.11b / 32.F.6b — Identidad lunar real BINARY/TRIPLE (v2)

## Causa comprobada

El hotfix anterior definió `physicalHostPlanetOrdinal` en `MoonScientificResolvedTarget` y enseñó al validador 32.F.6b a usarlo, **pero el adaptador de producción `StellarMultihostScientificTargetResolver.resolveMoonDetailed` nunca lo adjuntaba al resultado**. El validador recibía el ordinal público (`hostPlanetOrdinal`) y lo comparaba con el ordinal físico guardado en 32.F.2c, disparando `RangeError: 32.F.6b: moon/ocean identities differ` y dejando la ficha lunar cargando.

## Corrección de producción

- `StellarMultihostScientificTargetResolver.resolveMoonDetailed`: tras recuperar el objetivo científico existente, adjunta **`physicalHostPlanetOrdinal: publicMoon.parent.sourcePlanetOrdinal`**, procedente exclusivamente del índice materializado. No se obtiene del propio océano, evitando validaciones circulares.
- Conserva `identity.hostPlanetOrdinal` como índice **público** para navegación, designaciones y rutas.
- El validador 32.F.6b del hotfix anterior permanece intacto y **sigue lanzando** una excepción ante modelos con procedencia física falsa.
- Sin alteraciones en generadores de planetas/lunas, seed, persistencia, V1/V2, catálogo ni conocimiento observado.

## Prueba reproducible incorporada

Regresión sobre un agregado múltiple **real**, con semilla `7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5`, localizador G0/S0/O2, donde el ordinal público 14 corresponde al anfitrión físico 8. La prueba verifica identidad pública, procedencia de 32.F.2c, `ct0ObserverGrants`, la llamada `ObservedHabitabilityFiche31Fe.moon` que fallaba en el navegador y la conservación del rechazo a un alias físico falso.

## Instalación (PowerShell, en la raíz del proyecto)

```powershell
Expand-Archive -Path .\genesis-PRE33-11b-hotfix-real-identidad-lunar-multihost-32F6b-v2.zip -DestinationPath .\ -Force
```

## Tests dirigidos

```powershell
npx ng test --watch=false `
  --include="src/app/simulation/stellar/stellar-multihost-scientific-target-resolver.spec.ts" `
  --include="src/app/simulation/habitability/habitability-moon-integration-32-f-6b.spec.ts" `
  --include="src/app/presentation/system/system-multihost-scientific-session.spec.ts" `
  --include="src/app/presentation/moon-detail/moon-scientific-card.spec.ts"
```

```powershell
npm run test:architecture
npx ng build
npx playwright test e2e/v2-persistence-navigation.spec.ts --project=chromium
npm run test:e2e
```

## Validación local realizada

- Ensayo de ejecución real de la misma ruta física con 3 lunas: público 14 / físico 8; `ObservedHabitabilityFiche31Fe.moon` resuelve sin error. La prueba local emplea SHA-256 de Node como sustituto de la dependencia npm ausente **solo en el entorno de prueba**, no incluida en el ZIP.
- Ensayo negativo: alterar el ordinal físico sigue provocando `moon/ocean identities differ`.
- Verificador de arquitectura: PASSED, 6 capas.
- Análisis sintáctico de ambos archivos TS: OK.
- Angular/Vitest, compilación de plantilla y E2E: **pendientes de ejecución en el proyecto del usuario**.

## Comprobación visual

Volver a la misma luna BINARY/TRIPLE que quedaba en «Resolviendo sistema anfitrión y caracterización lunar...». Con el nuevo adaptador, el observador 31.F.e debe recibir el ordinal físico correcto y la ficha debe completarse. Si aparece un error diferente, conservar la traza: puede indicar otra incoherencia independiente que no debe enmascararse.
