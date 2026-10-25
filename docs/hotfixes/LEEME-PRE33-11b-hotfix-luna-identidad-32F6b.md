# GENESIS Web — Hotfix identidad lunar multihost / 32.F.6b

## Síntoma

Al abrir ciertas fichas lunares de sistemas BINARY/TRIPLE, la pantalla queda en
«Resolviendo sistema anfitrión y caracterización lunar...» y se lanza:

`RangeError: 32.F.6b: moon/ocean identities differ; refuse physical evidence.`

## Causa

La identidad pública del planeta en un sistema multianfitrión utiliza el ordinal
contiguo del catálogo principal (por ejemplo, 14). Las entidades físicas lunares
32.F.1–32.F.5 retienen el ordinal del anfitrión de origen en su sistema hijo
(por ejemplo, 8). Ambas identidades son válidas, pero 32.F.6b las comparaba como
si pertenecieran a un único espacio de índices.

## Corrección localizada

* El resolver multihost, que posee simultáneamente la identidad pública y la
  materialización física, valida la correspondencia `sourcePlanetOrdinal` con
  `planet.planetOrdinal`, la identidad lunar original y `RelevantMoon`.
* Transporta `physicalHostPlanetOrdinal` **solo en el DTO de resolución interno**.
* La integración 32.F.6b contrasta océano, radiación, química e historia con el
  ordinal físico, conservando el ordinal público para la ruta/ficha y el
  `bodyKey` observado del jugador.
* El puente 31.10 utiliza el ordinal físico de la fuente lunar, sin alterar sus
  índices, conclusiones ni pruebas biológicas.
* Ausencia de cruce de identidad: se mantiene el comportamiento anterior;
  ausencia real de luna: no se fabrica una ficha ni evidencia.

Sin cambios en generadores, semillas, conservación de H2O, balances químicos,
probabilidades, V1/V2 ni persistencia. Ningún dato privado se añade al modelo
público de tarjeta o a conocimiento observado.

## Instalación (PowerShell desde la raíz del proyecto)

```powershell
Expand-Archive -Path .\genesis-PRE33-11b-hotfix-luna-multihost-32F6b.zip -DestinationPath .\ -Force
```

## Tests dirigidos

```powershell
npx ng test --watch=false `
  --include="src/app/simulation/habitability/habitability-moon-integration-32-f-6b.spec.ts" `
  --include="src/app/simulation/stellar/stellar-multihost-scientific-target-resolver.spec.ts" `
  --include="src/app/presentation/system/system-multihost-scientific-session.spec.ts" `
  --include="src/app/presentation/moon-detail/moon-scientific-card.spec.ts"
```

```powershell
npm run test:architecture
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```

## Validación visual

Reabrir la luna que fallaba en sistema BINARY/TRIPLE, confirmar que la ficha
finaliza y que el estado de conocimiento/océano no cambia; recargar F5 y repetir.
Comparar otra luna SINGLE y una luna de «solo identidad» V3.

## Validación efectuada fuera del proyecto original

* Arquitectura de seis capas: PASSED.
* Prueba Node aislada de puente 32.F.6b: 4/4 (identidad pública 14 frente a física
  8, origen falso y ausencia de cruce rechazados).
* Comprobación TypeScript en entorno incompleto: sin nuevos diagnósticos en el
  motor 32.F.6b ni en el resolver multihost. El repositorio reconstruido desde
  instantáneas históricas carece de dependencias y presenta errores previos en
  otras integraciones; no equivale a build Angular oficial.
* Angular/Vitest/Playwright oficiales: PENDIENTES de ejecución por el usuario.
