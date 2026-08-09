# GENESIS Web — Arquitectura

## Principio fundamental

GENESIS separa estrictamente el núcleo procedural y científico de la plataforma Angular.

El motor de generación no debe depender de Angular, del DOM, del Router, de IndexedDB ni de componentes visuales.

## Capas

### domain

Contiene los modelos, value objects, identificadores, contratos e invariantes fundamentales de GENESIS.

Ejemplos futuros:

- UniverseSeed
- Galaxy
- Star
- Planet
- DiscoveryState
- Repository contracts

No puede depender de:

- Angular
- simulation
- observation
- data
- presentation
- ui

---

### simulation

Contiene generación procedural determinista y motores de simulación.

Ejemplos futuros:

- SFC64
- SeedDerivation
- GalaxyGenerator
- StellarGenerator
- PlanetGenerator
- ClimateEngine
- EvolutionEngine

Puede depender de:

- domain

No puede depender de:

- Angular
- observation
- data
- presentation
- ui

---

### observation

Contiene el conocimiento científico observado y su separación respecto al Ground Truth.

Ejemplos futuros:

- ObservationEngine
- Detection
- Measurement
- Uncertainty
- Instrument
- ObservedKnowledge

Puede depender de:

- domain

No debe depender directamente de:

- Angular
- presentation
- ui
- data

La simulación produce Ground Truth y la capa de aplicación/presentación coordina su observación cuando sea necesario.

---

### data/local

Contiene exclusivamente infraestructura de persistencia local.

Tecnología prevista:

- IndexedDB

Contendrá:

- entidades persistentes
- mappers
- repositorios
- migraciones
- backup/importación/exportación

Puede depender de contratos y modelos de:

- domain
- observation

No debe contener lógica procedural ni lógica visual.

---

### presentation

Contiene las funcionalidades visibles y el estado necesario para presentarlas.

Ejemplos:

- home
- galaxy-map
- observatory
- archive
- settings
- system
- planet-detail

Puede coordinar:

- domain
- simulation
- observation
- data/local
- ui

Aquí pueden utilizarse APIs de Angular como:

- Component
- Router
- Signals
- Dependency Injection

---

### ui

Contiene componentes visuales reutilizables y genéricos.

Ejemplos futuros:

- GenesisCard
- GenesisButton
- LoadingState
- EmptyState
- ErrorState
- ScientificValue

No contiene:

- generación procedural
- persistencia
- reglas científicas
- estado global de negocio

El sistema visual base utiliza design tokens globales definidos en:

- `src/styles/_tokens.scss`

Los componentes reutilizables deben utilizar estos tokens en lugar de duplicar valores de color, espaciado, radios o tipografía.

Los componentes visuales base viven en:

- `ui/components`
- `ui/layout`

La capa presentation compone estos componentes, pero no debe redefinir la identidad visual fundamental de GENESIS.

Los controles que representen elementos HTML nativos deben preservar preferentemente su semántica nativa.

## Dirección general de dependencias

domain

simulation -> domain

observation -> domain

data/local -> domain + observation

presentation -> domain + simulation + observation + data/local + ui

ui -> interfaz visual


## Estado reactivo y orquestación

GENESIS utiliza Angular Signals como mecanismo principal para representar estado actual y reactivo de presentación.

### Estados de carga de presentación

Las funcionalidades que carguen o produzcan información deben representar su estado mediante el contrato común `LoadableUiState<T>` cuando resulte aplicable.

Estados estándar:

- `loading`: la información está siendo preparada o recuperada.
- `empty`: la operación ha finalizado correctamente pero no existen datos que mostrar.
- `error`: la operación no ha podido completarse.
- `content`: existen datos disponibles.

Los componentes visuales estándar son:

- `GenesisLoadingState`
- `GenesisEmptyState`
- `GenesisErrorState`

Las features no deben crear versiones visuales propias de estos estados salvo que exista una necesidad funcional específica.

Los estados visuales no contienen lógica de negocio.

Las acciones de recuperación, exploración o reintento pertenecen a la feature que utiliza el componente y se proyectan mediante contenido.

### Signals

Se utilizan para:

- estado local de una funcionalidad
- estado de presentación
- valores reactivos
- valores derivados mediante computed()

Los WritableSignal deben permanecer privados cuando el estado sea propiedad de una facade o servicio.

Los componentes deben consumir preferentemente Signals de solo lectura.

### RxJS

RxJS se reserva para flujos realmente asíncronos o basados en eventos.

Ejemplos:

- Router events
- flujos temporales
- eventos externos
- composición de operaciones asíncronas
- cancelación o transformación de streams

No se utilizarán Subjects u Observables artificiales cuando un Signal sea suficiente.

Cuando sea útil presentar un Observable como estado síncrono a Angular, se utilizará la interoperabilidad oficial entre RxJS y Signals.

### Facades

Las facades pertenecen a presentation y actúan como frontera entre componentes y lógica/orquestación.

Responsabilidades:

- poseer estado de presentación
- exponer Signals de solo lectura
- derivar estado
- coordinar servicios
- transformar resultados para la UI
- coordinar flujos asíncronos

Los componentes deben centrarse principalmente en:

- render
- interacción
- eventos del usuario
- delegación hacia la facade


## Regla esencial

La existencia de Angular debe ser irrelevante para el resultado procedural.

Una misma seed y una misma GeneratorVersion deben poder producir el mismo Ground Truth aunque el motor se ejecute en otra plataforma compatible.


## PWA y funcionamiento offline

GENESIS Web se distribuye como Progressive Web App.

La infraestructura PWA utiliza:

- Web App Manifest
- Angular Service Worker
- caché del app shell
- instalación standalone
- funcionamiento offline tras una primera carga correcta

El service worker solo gestiona recursos de aplicación y caché web.

No es responsable de persistir el universo ni el progreso del usuario.

La persistencia funcional de GENESIS pertenece a `data/local` y utilizará IndexedDB.

### Desarrollo

Durante `ng serve` normal el service worker permanece desactivado para evitar interferencias de caché durante el desarrollo.

### Producción

En builds de producción el service worker se registra mediante `provideServiceWorker`.

El app shell incluye:

- index.html
- CSS
- JavaScript
- manifest
- recursos esenciales

Los datos procedurales continúan generándose desde seed y no deben almacenarse de forma masiva en la caché PWA.


## Web Workers y cálculo procedural

Los cálculos procedurales o científicos que puedan consumir CPU de forma significativa deben poder ejecutarse fuera del hilo principal mediante Web Workers.

La arquitectura utiliza:

- `ProceduralWorkerClient`: API utilizada por la capa de presentación.
- `ProceduralWorkerPort`: abstracción del mecanismo de ejecución.
- `procedural.worker.ts`: entrada del Web Worker real.
- `procedural-worker.handler.ts`: despachador compartido de tareas.
- `procedural-worker.protocol.ts`: contrato tipado de mensajes.
- fallback inline para entornos sin soporte de Web Workers.

El motor procedural continúa perteneciendo a `simulation` y no puede depender del navegador ni de Angular.

La relación futura será:

`presentation/runtime -> worker -> simulation`

y nunca:

`simulation -> Worker`

Los datos enviados al worker deben ser serializables mediante el algoritmo structured clone del navegador.

No se deben enviar componentes Angular, servicios, Signals, elementos DOM ni estado visual al worker.

Un único worker puede procesar múltiples solicitudes identificadas mediante IDs independientes.

Los workers se crean bajo demanda y deben liberarse cuando su cliente sea destruido.


## Estrategia de tests

GENESIS utiliza dos niveles principales de pruebas.

### Unitarias y de componentes

Angular utiliza su runner integrado con Vitest.

Estas pruebas cubren:

- modelos y contratos puros
- lógica determinista
- facades
- componentes
- handlers
- estados de presentación
- adaptadores aislados

Los tests unitarios deben ser rápidos y no depender de una aplicación servida.

La cobertura puede generarse mediante:

`npm run test:unit:coverage`

### End-to-End

Los flujos reales de usuario utilizan Playwright.

Playwright ejecuta GENESIS en un navegador Chromium real y verifica:

- arranque de la aplicación
- navegación entre rutas
- render de pantallas
- estados visibles
- integración entre componentes
- APIs reales del navegador cuando sean relevantes
- Web Workers

Los tests E2E se almacenan fuera de `src`, dentro de `e2e`.

Playwright puede iniciar automáticamente `ng serve` mediante su configuración `webServer`.

Durante los E2E se utiliza la configuración de desarrollo, por lo que el Service Worker PWA permanece desactivado y no interfiere con los resultados.

### Principio de responsabilidad

No debe utilizarse E2E para comprobar lógica que pueda verificarse mediante un test unitario.

La lógica procedural determinista debe verificarse principalmente mediante tests puros.

Playwright debe reservarse para flujos e integración real entre navegador, Angular y usuario.


## Seeds y determinismo procedural

### UniverseSeed

`UniverseSeed` es el identificador procedural raíz de un universo GENESIS.

Características:

- tamaño exacto de 128 bits
- representado internamente mediante dos enteros de 64 bits con `bigint`
- formato canónico hexadecimal:
  `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`
- la representación canónica utiliza siempre mayúsculas
- el parseo acepta caracteres hexadecimales en mayúsculas o minúsculas, pero exige la estructura exacta
- es inmutable
- las copias mantienen exactamente el mismo valor
- la igualdad se define por sus 128 bits

`UniverseSeed.random()` utiliza un origen criptográficamente seguro para crear únicamente nuevas seeds raíz.

La aleatoriedad ambiental no forma parte de la simulación procedural.

Una vez elegida una `UniverseSeed`, toda Ground Truth debe derivarse de forma determinista a partir de esa seed y de la versión del generador.

`Math.random()` no debe utilizarse dentro del motor procedural.

`UniverseSeed` pertenece a `domain` y no depende de Angular, RxJS, presentación, persistencia ni APIs visuales.


### PRNG SFC64

GENESIS utiliza SFC64 como generador pseudoaleatorio determinista de simulación.

El estado está compuesto por cuatro palabras de 64 bits:

- `a`
- `b`
- `c`
- `counter`

En Web todas las palabras se representan mediante `bigint`.

Las operaciones con semántica uint64 deben normalizarse explícitamente módulo `2^64` mediante `BigInt.asUintN(64, ...)`.

No se permite utilizar `Number` para:

- estado SFC64
- resultados uint64
- operaciones de mezcla
- multiplicaciones uint64
- rotaciones
- derivaciones futuras de seeds de 64 bits

La inicialización desde `UniverseSeed` utiliza:

- `a = high64`
- `b = low64`
- `c = mix64(high64 XOR low64 XOR 0xD1B54A32D192ED03)`
- `counter = 1`
- 12 iteraciones de warm-up

La transición SFC64 es:

`result = a + b + counter`

`counter = counter + 1`

`a = b XOR (b >>> 11)`

`b = c + (c << 3)`

`c = rotateLeft(c, 24) + result`

Todas las operaciones anteriores tienen semántica modular uint64.

`nextDouble()` utiliza los 53 bits superiores del siguiente uint64 y produce un valor en `[0, 1)`.

`nextBoolean()` utiliza el bit menos significativo.

`nextInt(bound)` utiliza rejection sampling unsigned para evitar modulo bias y mantiene semántica compatible con el contrato Android.

`Math.random()` no forma parte del motor procedural.

El PRNG no es criptográfico. Su función es reproducibilidad procedural.


### Derivación jerárquica de seeds

La jerarquía procedural V1 es:

UniverseSeed
→ GalaxySeed
→ SectorSeed
→ GalacticObjectSeed
→ SystemSeed
→ BodySeed
→ HistorySeed
→ EvolutionSeed
→ CivilizationSeed

SeedDeriver reproduce el contrato Android:

SHA-256(
  MAGIC
  || PARENT_SEED_BYTES
  || DOMAIN_TAG
  || KEY_BIG_ENDIAN
)

MAGIC:

`GENESIS-SEED-DERIVE-V1`

Domain tags:

- Galaxy: `0x01`
- Sector: `0x02`
- GalacticObject: `0x03`
- System: `0x04`
- Body: `0x05`
- History: `0x06`
- Evolution: `0x07`
- Civilization: `0x08`

Los índices y keys utilizan `bigint` y semántica exacta de `Long` signed de 64 bits.

Los `sectorKey` admiten todo el rango:

`[-2^63, 2^63 - 1]`

Los índices de Galaxy, GalacticObject, Body y Civilization exigen:

`[0, 2^63 - 1]`

System, History y Evolution utilizan key `0`.

La salida procedural utiliza los primeros 16 bytes de SHA-256.


### Independencia del orden de consulta

La derivación procedural debe ser independiente del orden en el que se consulten las ramas.

Consultar cualquier galaxia, sector, objeto galáctico, sistema, cuerpo, historia, evolución o civilización no puede modificar el resultado de otra rama.

`SeedDeriver` es stateless.

No mantiene:

- contador global
- PRNG compartido
- cache mutable
- estado de consulta
- orden de generación

Cada seed hija depende exclusivamente de:

- seed padre
- domain tag
- key de 64 bits correspondiente

Los tests de independencia de consulta verifican:

- orden directo e inverso
- ramas hermanas
- ramas completas intercaladas
- universos raíz distintos
- repetición intensiva
- inmutabilidad de seeds padre
- preservación de vectores canónicos Android



### Gestión manual de UniverseSeed

La aplicación mantiene una UniverseSeed activa en memoria mediante `UniverseSeedFacade`.

La representación serializada utiliza siempre el formato canónico:

`XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`

La entrada manual:

- exige 128 bits
- acepta hexadecimal en mayúsculas o minúsculas
- exige la estructura canónica con guiones
- normaliza la seed aplicada a mayúsculas
- no modifica la seed activa si la entrada es inválida

La seed puede copiarse al portapapeles desde Settings.

La UI no implementa su propio parser.

Toda validación y parseo delega en `UniverseSeed`.

La seed activa de este punto permanece en memoria.
La persistencia definitiva corresponde a la capa de persistencia local de fases posteriores.


### GeneratorVersion

Todo universo procedural se identifica mediante un `UniverseGenerationKey`.

El `UniverseGenerationKey` está compuesto por:

- `UniverseSeed`
- `GeneratorVersion`

La versión inicial es:

`GeneratorVersion.V1`

Código persistente:

`V1 = 1`

Los códigos de GeneratorVersion forman parte del contrato de compatibilidad y no deben reutilizarse para algoritmos diferentes.

Las futuras modificaciones incompatibles del Ground Truth deberán introducir una nueva GeneratorVersion en lugar de modificar silenciosamente V1.

`GeneratorVersion.fromCodeOrNull(code)` permite resolver códigos persistidos sin asumir que son conocidos.

`GeneratorVersion.fromCode(code)` rechaza códigos desconocidos.

No existe actualmente V2.

Los generadores futuros deberán hacer dispatch explícito por `generationKey.generatorVersion`.

No debe utilizarse una referencia mutable tipo `CURRENT` dentro de algoritmos deterministas congelados.


### Regresión determinista y vectores dorados

GeneratorVersion.V1 queda protegido mediante pruebas de regresión determinista.

Contrato fundamental:

`misma UniverseSeed + misma GeneratorVersion = mismo Ground Truth procedural`

La identidad de generación utilizada por los tests es:

`UniverseGenerationKey(UniverseSeed, GeneratorVersion)`

Seed canónica V1:

`7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1`

Los vectores compartidos con GENESIS Android se congelan como datos de regresión.

GalaxySeed:

- galaxyIndex 0: `8BA08585BCBD4D3041C1FD9EEBD048E4`
- galaxyIndex 1: `A448D6B11BAF31F30904C808DE482290`
- galaxyIndex 2: `36476A29035F432790C617E3E6D3D5A6`
- galaxyIndex 3: `EFED806D7A693EAE0FA47F004B80F283`

Rama canónica:

- GalaxySeed: `8BA08585BCBD4D3041C1FD9EEBD048E4`
- SectorSeed: `02DF63D582A1F3E9BFB71AA643FDBB92`
- GalacticObjectSeed: `22D2E7D76E3C1EB35611802BC34E378E`
- SystemSeed: `58691B1E4E539DBA3EB173F795FDE7E2`
- BodySeed: `86FE2CB4F2CC4678D23F310333F15EF7`
- HistorySeed: `2103F53D83EB40DC1381A8B8FD21DD22`
- EvolutionSeed: `4FD989860C1B323DF20342876B486958`
- CivilizationSeed: `ED3EC33F28E7B841CBDE4307F71D3C64`

Los vectores V1 son inmutables.

Modificar un algoritmo V1 de forma que cambie cualquiera de estos resultados debe hacer fallar la suite de regresión.

Una futura modificación incompatible deberá introducir una nueva GeneratorVersion.

Las pruebas de esta fase cubren únicamente los contratos procedurales ya implementados.

Los vectores físicos completos de Galaxy se añadirán cuando el modelo y GalaxyGenerator existan en la Web.


### Independencia entre ramas procedurales

GeneratorVersion.V1 garantiza independencia entre ramas procedurales.

Una consulta o generación realizada en una rama no puede modificar los resultados de otra rama.

La independencia se verifica entre:

- galaxias hermanas
- sectores hermanos
- objetos galácticos hermanos
- cuerpos hermanos
- civilizaciones hermanas
- universos distintos

Cada nodo procedural depende exclusivamente de su propia cadena jerárquica de seeds.

No existe estado procedural global compartido entre ramas.

No existe PRNG global compartido entre ramas.

No existe contador mutable compartido entre ramas.

No existe dependencia del orden de generación.

La derivación intensiva e intercalada de otras ramas debe dejar intacta cualquier rama previamente reproducible.

Los vectores dorados Android/Web de GeneratorVersion.V1 deben permanecer idénticos.


### Vectores oficiales procedurales V1

El Punto 2.9 congela los contratos binarios y estructurales que deben permanecer compatibles entre GENESIS Web y GENESIS Android cuando comparten algoritmo.

La fuente de referencia Web es:

`src/app/simulation/regression/v1-golden-vectors.ts`

Se congelan:

- UniverseSeed canónica
- GeneratorVersion
- stream SFC64
- derivación jerárquica de seeds
- GalaxySectorKeyCodec
- estructura de ProceduralLocator

#### SFC64 V1

Primeros valores uint64 oficiales:

- `7AA3326A3671994E`
- `252D3D0DA1C89BA2`
- `98ED90416CA62029`
- `D0D2FD05833601AE`
- `229118A5F6B5ABF2`
- `4AF3B4689B465EA1`
- `7E746EB987000C9F`
- `8F58D85FEF3BBB4F`
- `AF2D01FC9AF30478`
- `6934E6ED1D75D47B`

Todo estado SFC64 utiliza BigInt y normalización uint64 explícita.

#### GalaxySectorKeyCodec

Contrato:

`sectorKey = (x << 32) | unsigned32(y)`

Vectores oficiales:

- `(0, 0) -> 0`
- `(0, 1) -> 1`
- `(1, 0) -> 4294967296`
- `(-1, 0) -> -4294967296`
- `(0, -1) -> 4294967295`
- `(-1, -1) -> -1`

Las coordenadas son Int32 signed.

sectorKey es Long signed de 64 bits.

El codec es reversible, biyectivo y no utiliza hashing.

#### ProceduralLocator

Jerarquía oficial:

- `GalaxyLocator(galaxyIndex)`
- `SectorLocator(galaxyIndex, sectorKey)`
- `GalacticObjectLocator(galaxyIndex, sectorKey, galacticObjectIndex)`
- `SystemLocator(galaxyIndex, sectorKey, galacticObjectIndex)`
- `BodyLocator(galaxyIndex, sectorKey, galacticObjectIndex, bodyIndex)`
- `CivilizationLocator(galaxyIndex, sectorKey, galacticObjectIndex, bodyIndex, civilizationIndex)`

Los índices son Long signed no negativos.

sectorKey puede utilizar cualquier Long signed válido.

Los locators no almacenan UniverseSeed.

Los locators no almacenan GeneratorVersion.

Los locators no almacenan targetSeed.

La identidad procedural completa se forma combinando:

`UniverseGenerationKey + ProceduralLocator`

Cualquier modificación futura que cambie uno de los vectores oficiales V1 debe romper los tests de regresión.

Un cambio intencionadamente incompatible deberá introducir una nueva GeneratorVersion.