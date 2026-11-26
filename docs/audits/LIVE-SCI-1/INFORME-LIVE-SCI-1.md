# GENESIS LIVE-SCI.1 — Corrección integral de transición científica en el Archivo

## Diagnóstico sobre el código recibido (25-11-2026)

Repositorio analizado: `genesis-diagnostico-progresion-conocimiento.zip`, versión real del usuario tras 38.8R1 y FASTSCAN.1.

Hallazgos en `ArchiveDiscoveryDetailFacade`:

1. La acción científica se persiste atómicamente en `DexieGalacticObjectScientificActionRuntime`: el estado del descubrimiento y sus PD se escriben en la misma transacción. **No se ha modificado ese runtime ni su economía.**
2. Al volver a proyectar la ficha, varias acciones posteriores (`pulsar`, `magnetar`, `jets`, `lente`, `horizonte`, observaciones y campañas de sistemas) llamaban `resolveDetails(request)` y pasaban por `loading`, destruyendo el árbol visual y los renderizadores WebGL aunque el usuario permanecía en el mismo objeto.
3. La acción principal conservaba la tarjeta durante la resolución (PERF-GO1), pero su relectura de `DiscoveryState` dependía exclusivamente de una segunda consulta a IndexedDB. Si esta lectura fallaba o devolvía temporalmente el estado anterior, se podía sustituir la tarjeta por `error` o presentar de nuevo la etapa anterior, pese a que el commit ya se había completado.
4. Los cambios de ruta y las respuestas asíncronas tardías no estaban protegidos contra la publicación fuera de orden de las fichas.

No se ha reproducido el problema en un navegador con la base de datos real del usuario: el ZIP no contiene la base de datos ni `node_modules`. Las causas 2 y 3 son vulnerabilidades verificables directamente en el código proporcionado; no deben confundirse con una confirmación instrumental de cuál fue el disparador puntual en su navegador.

## Implementación

- Las reconstrucciones posteriores a acciones científicas conservan el contenido y el renderizador montados hasta publicar **de una sola vez** el nuevo modelo de ficha. El estado `loading` queda reservado para navegación inicial a otra ficha.
- `resolveDetails` compara su resolución con un contador de versión para descartar resultados que lleguen fuera de orden; no publica modelos de rutas superadas.
- Tras `commitAction`, la nueva etapa científica devuelta por la transacción se utiliza como mínimo canónico del objeto, evitando una regresión de conocimiento por relecturas temporalmente desfasadas. No se concede ningún PD adicional ni se fuerza el nivel sin un commit exitoso.
- Si falla la lectura después del commit, se realiza **un único reintento de lectura**, no de observación. Si también falla, permanece el render anterior y aparece «Actualizar ficha», que vuelve a leer la base de datos sin repetir la acción ni consumir o conceder PD.
- Mientras está pendiente esa sincronización, las acciones de la ficha se deshabilitan para evitar ejecutar una etapa antigua.
- Se preserva la confirmación automática, la persistencia, los contratos visuales de 38.8, el acceso científico de 38.7 y la diferenciación de las etapas de conocimiento.
- No se han modificado shaders, materiales, modelos de galaxia, generadores, órbitas, escenas, tablas ni esquemas de IndexedDB.

## Cobertura

Los cambios usan el único `ArchiveDiscoveryDetailFacade` que sirve las fichas de objetos galácticos, incluyendo núcleos AGN/QUASAR, nebulosas, cúmulos, remanentes y objetos extremos, y las fichas de sistemas estelares. Los flujos adicionales de medidas (jets, lente, magnetar, púlsar, horizonte) dejan de desmontar el modelo visual durante el refresco.

## Pruebas añadidas y actualizadas

- `archive-scientific-stage-live-sync.spec.ts`: progresión real del núcleo galáctico V2 `DISCOVERED → CATALOGUED → CONFIRMED` sin F5, lectura desfasada, fallo tras commit con recuperación sin repetir la acción y reintento automático limitado.
- `archive-system-stage-entry-regression.spec.ts`: adapta su contrato de visualización mantenida, sin variar la semántica de `DISCOVERED → VISITED`.
- `archive-discovery-detail.spec.ts`: añade `refreshRequired` a los dobles de prueba de Angular.
- `scripts/auditar-genesis-live-sci-1.spec.cjs`: auditor de invariantes estructurales.

## Validación que SÍ se ha realizado

- Auditor LIVE-SCI.1: 17/17 verificaciones estructurales superadas.
- `node scripts/verify-architecture.mjs`: PASSED (6 capas, 1293 archivos TypeScript de producción, 1204 specs existentes), reconstruyendo la carpeta vacía `src/app/observation` que estaba representada como entrada de directorio en el ZIP de Windows.
- Compilación sintáctica aislada con el compilador global de TypeScript de los archivos TypeScript modificados: sin diagnósticos de sintaxis.
- Integridad del archivo ZIP final: verificada mediante `ZipFile.testzip()`.

## Validación local pendiente

Sin instalación Angular/Three.js/Vitest de `node_modules` en el entorno de empaquetado. No se han ejecutado aquí Vitest, `npx ng build` ni Playwright. Verificar en la máquina del usuario:

```powershell
node scripts/auditar-genesis-live-sci-1.spec.cjs
npx vitest run src/app/presentation/genesis-archive/archive-scientific-stage-live-sync.spec.ts src/app/presentation/genesis-archive/archive-discovery-detail.facade.spec.ts src/app/presentation/genesis-archive/archive-discovery-detail.spec.ts src/app/presentation/genesis-archive/archive-system-stage-entry-regression.spec.ts
npm run test:architecture
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```

Verificación manual especialmente importante: abrir el CUÁSAR afectado con V3, realizar «Caracterización multibanda», comprobar que aparece «Confirmación independiente» sin recargar y que el objeto sigue visible; continuar hasta CONFIRMED, repetir con un objeto de cada familia y con un sistema estelar. La sincronización del Archivo debe conservar exactamente el conocimiento persistido. Si se muestra «Actualizar ficha», no repetir la observación: utilizar el botón y anotar el error para un diagnóstico posterior.

## Instalación

Situado en la carpeta raíz del proyecto, con el ZIP descargado en dicha carpeta:

```powershell
Expand-Archive -Path ".\genesis-LIVE-SCI-1-progresion-objetos-sin-recarga-INCREMENTAL.zip" -DestinationPath "." -Force
```

**Entrega incremental única; no reemplaza el repositorio completo.**
