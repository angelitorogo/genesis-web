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



### Persistencia local Web

IndexedDB es el almacenamiento local principal de GENESIS Web.

La infraestructura IndexedDB vive exclusivamente dentro de:

`src/app/data/local`

La implementación base utiliza Dexie como capa sobre IndexedDB.

Clase raíz:

`GenesisIndexedDb`

Nombre canónico de la base:

`genesis-web`

Reglas:

- data/local no depende de Angular.
- data/local no depende de componentes ni de presentation.
- IndexedDB es la fuente persistente principal de estado local.
- localStorage no sustituye a IndexedDB para estado crítico.
- Ground Truth procedural no debe materializarse completamente en IndexedDB.
- UniverseSeed + GeneratorVersion permiten regenerar Ground Truth.
- IndexedDB almacenará principalmente progreso y conocimiento observado.
- La infraestructura de 3.1 no define todavía stores funcionales.
- Las entidades, stores, claves e índices se definirán en 3.2.
- Las migraciones versionadas se implementarán en 3.7.
- La gestión de disponibilidad, cuota, persistencia y pérdida de almacenamiento corresponde a 3.10.

Dexie permanece encapsulado en data/local.

Los tests de IndexedDB utilizan fake-indexeddb y no dependen del navegador real.



### IndexedDB schema v1

El esquema inicial de IndexedDB se define en:

`src/app/data/local/indexed-db/genesis-indexed-db-schema.ts`

Schema version inicial:

`1`

Storage format version inicial:

`1`

Stores definidos en el Punto 3.2:

- `universes`
- `galaxies`
- `discoveries`
- `observations`
- `progress`
- `metadata`

No se crea `favorites` porque actualmente no forma parte del modelo funcional.

No se crea todavía ningún store específico de navegación; corresponde al Punto 3.3.

#### Universe identity

La identidad persistente de un universo es:

`UniverseSeed + GeneratorVersion`

Clave IndexedDB:

`[universeSeed+generatorVersionCode]`

#### 64-bit procedural identities

Los valores procedurales que representan Kotlin Long no se almacenan como JavaScript Number.

Se serializan en representación decimal string:

- galaxyIndex
- sectorKey
- galacticObjectIndex
- bodyIndex
- civilizationIndex
- discoveryPoints cuando corresponda

Esto evita pérdida de precisión en JavaScript y permite persistencia portable.

#### Ground Truth

IndexedDB no contiene una copia materializada del universo.

No se persisten como parte de estas entidades:

- masas
- radios
- temperaturas
- poblaciones estelares
- propiedades físicas completas de galaxias
- sistemas materiales completos
- planetas o cuerpos generados únicamente como Ground Truth

El Ground Truth se regenera mediante:

`UniverseSeed + GeneratorVersion + ProceduralLocator`

IndexedDB almacena principalmente:

- identidad de universos
- conocimiento de galaxias
- targets conocidos
- observaciones
- progreso
- metadatos de persistencia

#### Discoveries

La clave primaria de un descubrimiento es:

`[universeSeed+generatorVersionCode+targetTypeCode+targetSeed]`

Se conserva también el lineage procedural necesario para reconstrucción y consultas.

La semántica exacta de:

- UNKNOWN
- DETECTED
- DISCOVERED
- VISITED
- CATALOGUED
- CONFIRMED

se implementará en el Punto 3.5.

#### Progress

El store `progress` admite scopes globales y de galaxia.

Las reglas de Puntos de Descubrimiento y su persistencia se implementarán en el Punto 3.4.

#### Observations

El store `observations` persiste Observed Knowledge mediante un envelope versionado:

- observationKind
- payloadVersion
- payloadJson

El contenido científico concreto será definido por las fases posteriores de observación.

#### Version metadata

El store `metadata` permite registrar schemaVersion y storageFormatVersion.

Las migraciones entre schemas corresponden al Punto 3.7.

#### Repositories

En 3.2 solo se definen entidades y stores.

No se implementan repositorios todavía.

Los repositorios locales corresponden al Punto 3.8.


### Persistencia de navegación

El Punto 3.3 añade persistencia de navegación por universo.

Store:

`navigation`

Clave primaria:

`[universeSeed+generatorVersionCode]`

Existe como máximo un registro de navegación para cada:

`UniverseSeed + GeneratorVersion`

La entidad persistida es:

`UniverseNavigationEntity`

Campos:

- universeSeed
- generatorVersionCode
- activeGalaxyIndex
- recentGalaxyIndices
- updatedAtEpochMs

#### Galaxia activa

activeGalaxyIndex representa la galaxia actualmente enfocada.

Es conceptualmente equivalente al activeGalaxyIndex de GENESIS Android.

El índice procedural es Long signed no negativo.

En Web se almacena como decimal string para evitar pérdida de precisión mediante JavaScript Number.

El valor lógico inicial cuando todavía no exista navegación persistida será:

`0`

La aplicación de este valor por defecto corresponderá a la futura capa Repository.

#### Navegación reciente

recentGalaxyIndices conserva los índices de galaxias visitadas recientemente.

Los valores se almacenan como decimal string.

El orden persistido es significativo:

- posición 0 = más reciente
- posiciones posteriores = visitas anteriores

El Punto 3.3 únicamente persiste esta información.

La política futura de:

- deduplicación
- número máximo de entradas
- actualización automática
- restauración del foco

pertenecerá a la capa de repositorio/estado correspondiente.

#### Schema

El schema IndexedDB evoluciona:

`v1 -> v2`

v1 corresponde al esquema cerrado en 3.2.

v2 añade únicamente el store:

`navigation`

Se conserva explícitamente la declaración del schema v1.

No se introducen todavía transformaciones personalizadas mediante `upgrade()`.

La estrategia completa de migraciones y validación histórica corresponde al Punto 3.7.

#### Separación procedural

La navegación es estado de usuario.

No forma parte del Ground Truth.

Cambiar activeGalaxyIndex o recentGalaxyIndices:

- no cambia ninguna seed
- no cambia ningún resultado procedural
- no materializa galaxias
- no modifica GeneratorVersion



### Persistencia de Puntos de Descubrimiento

El Punto 3.4 fija la persistencia de Puntos de Descubrimiento globales y por galaxia.

Se reutiliza el store IndexedDB:

`progress`

No se modifica el schema IndexedDB.

Schema actual:

`v2`

#### Scopes

Existen dos scopes persistentes:

- GLOBAL = 0
- GALAXY = 1

Progreso global:

`scopeCode = GLOBAL`
`scopeKey = "GLOBAL"`
`galaxyIndex = null`

Progreso de galaxia:

`scopeCode = GALAXY`
`scopeKey = galaxyIndex`
`galaxyIndex = galaxyIndex`

La clave primaria continúa siendo:

`[universeSeed+generatorVersionCode+scopeCode+scopeKey]`

Esto permite que un mismo universo mantenga:

- un único contador global
- un contador independiente por cada galaxia
- progreso independiente entre GeneratorVersion

#### Representación de 64 bits

Los Puntos de Descubrimiento son enteros Long no negativos.

Rango válido:

`0 .. 9223372036854775807`

No se almacenan mediante JavaScript Number.

Se reciben como BigInt y se serializan a decimal string antes de persistir.

Los galaxyIndex siguen la misma regla.

Esto evita cualquier pérdida de precisión.

#### Separación entre PD globales y por galaxia

Los PD globales y los PD de galaxia son estados persistentes distintos.

Actualizar los PD globales no modifica automáticamente los PD de galaxia.

Actualizar los PD de una galaxia no modifica automáticamente:

- los PD globales
- los PD de otra galaxia

Las reglas futuras que determinen cuándo y cuánto se recompensa pertenecen a la fase de ExplorationEngine.

El Punto 3.4 únicamente fija la persistencia y la identidad de esos contadores.

#### Ground Truth

Los PD son estado de progreso del usuario.

No forman parte del Ground Truth procedural.

Modificar los PD:

- no modifica UniverseSeed
- no modifica GeneratorVersion
- no modifica las seeds derivadas
- no modifica el universo procedural


### Estados de descubrimiento

El Punto 3.5 fija el contrato persistente de DiscoveryState.

Los códigos son compatibles con GENESIS Android:

- UNKNOWN = 0
- DETECTED = 1
- DISCOVERED = 2
- VISITED = 3
- CATALOGUED = 4
- CONFIRMED = 5

Los códigos son parte del contrato persistente y no deben cambiar dentro de la misma GeneratorVersion sin una migración explícita.

#### UNKNOWN

UNKNOWN representa ausencia de conocimiento observado.

No se materializa una fila DiscoveryEntity para UNKNOWN.

Por tanto:

`ausencia de DiscoveryEntity = DiscoveryState.UNKNOWN`

Los estados materializados son exclusivamente:

- DETECTED
- DISCOVERED
- VISITED
- CATALOGUED
- CONFIRMED

Esto evita almacenar explícitamente objetos todavía desconocidos y mantiene la persistencia compatible con la generación lazy.

#### DiscoveryEntity

discoveryStateCode solo admite códigos persistentes conocidos:

`1 .. 5`

La identidad de una fila continúa siendo:

`[universeSeed+generatorVersionCode+targetTypeCode+targetSeed]`

Cambiar el estado de un mismo target sustituye el conocimiento observado asociado a esa misma identidad.

#### GeneratorVersion

Los estados de conocimiento quedan aislados por GeneratorVersion mediante la propia clave primaria.

Una misma UniverseSeed puede tener conocimiento observado distinto bajo versiones procedurales diferentes.

#### Ground Truth

DiscoveryState pertenece a Observed Knowledge.

No modifica Ground Truth.

Cambiar:

DETECTED -> DISCOVERED -> VISITED -> CATALOGUED -> CONFIRMED

no altera:

- UniverseSeed
- GeneratorVersion
- targetSeed
- propiedades físicas procedurales

#### Reglas de transición

El Punto 3.5 no introduce reglas de transición.

La persistencia admite los estados conocidos pero no decide qué acciones permiten avanzar entre ellos.

Tampoco concede PD automáticamente.

La lógica de exploración y recompensas se implementará en su fase correspondiente.



### Ground Truth regenerable

El Punto 3.6 establece que Ground Truth no se materializa como estado persistente.

La identidad procedural completa de un target es:

`UniverseGenerationKey + ProceduralLocator`

ProceduralTargetResolver reconstruye determinísticamente la seed exacta del target.

Jerarquía V1:

UniverseSeed
-> GalaxySeed
-> SectorSeed
-> GalacticObjectSeed
-> SystemSeed
-> BodySeed
-> HistorySeed
-> EvolutionSeed
-> CivilizationSeed

Los vectores producidos deben permanecer compatibles con GENESIS Android.

#### Persistencia

IndexedDB guarda principalmente conocimiento observado y progreso.

DiscoveryEntity conserva:

- universeSeed
- generatorVersionCode
- targetTypeCode
- targetSeed
- lineage procedural
- discoveryStateCode
- timestamps de conocimiento

No almacena propiedades físicas completas del target.

No se almacenan como Ground Truth materializado:

- masa
- radio
- temperatura
- composición física
- órbitas completas
- propiedades estelares
- propiedades planetarias
- posiciones procedurales regenerables
- modelos físicos completos

Estas propiedades serán regeneradas desde la seed correspondiente cuando se necesiten.

#### Lineage

El lineage persistido permite reconstruir ProceduralLocator.

Matriz:

GALAXY:
- galaxyIndex requerido

SECTOR:
- galaxyIndex
- sectorKey

GALACTIC_OBJECT:
- galaxyIndex
- sectorKey
- galacticObjectIndex

SYSTEM:
- galaxyIndex
- sectorKey
- galacticObjectIndex

BODY:
- galaxyIndex
- sectorKey
- galacticObjectIndex
- bodyIndex

CIVILIZATION:
- galaxyIndex
- sectorKey
- galacticObjectIndex
- bodyIndex
- civilizationIndex

Los campos que no pertenecen al target deben ser null.

#### targetSeed

targetSeed es una identidad derivada compacta.

No sustituye al lineage procedural.

Debe poder regenerarse siempre a partir de:

`UniverseGenerationKey + ProceduralLocator`

#### Separación de capas

data/local reconstruye únicamente la referencia procedural persistida.

data/local no depende de simulation.

simulation/regeneration contiene la regeneración determinista de Ground Truth.

La combinación entre persistencia y regeneración se realiza fuera de ambas capas cuando sea necesario.

#### Schema

El Punto 3.6 no modifica la estructura IndexedDB.

`GENESIS_INDEXED_DB_SCHEMA_VERSION = 2`

No se añade ningún store.

No se implementan todavía migraciones ni repositorios.


### Migraciones IndexedDB

El Punto 3.7 formaliza la cadena histórica de migraciones IndexedDB.

Schema actual:

`schemaVersion = 2`

Cadena existente:

`v1 -> v2`

La migración v1 -> v2 añade el store navigation definido en el Punto 3.3.

Dexie conserva explícitamente las definiciones históricas:

- schema v1
- schema v2

No se redefine retrospectivamente un schema antiguo.

#### Registro de migraciones

GENESIS_INDEXED_DB_MIGRATIONS contiene la cadena histórica ordenada.

Cada migración declara:

- id
- fromSchemaVersion
- toSchemaVersion
- estrategia respecto a GeneratorVersion

La cadena debe:

- comenzar en el primer schema soportado
- no contener huecos
- avanzar exactamente una versión por migración
- terminar en GENESIS_INDEXED_DB_SCHEMA_VERSION

Una cadena inválida impide abrir la base.

#### schemaVersion

schemaVersion representa exclusivamente la estructura de persistencia IndexedDB.

Cambiar schemaVersion puede implicar:

- añadir/eliminar stores
- cambiar índices
- transformar representación persistida
- validar datos históricos

No cambia por sí mismo el universo procedural.

#### GeneratorVersion

GeneratorVersion pertenece a la identidad procedural:

`UniverseSeed + GeneratorVersion`

Una migración de schema no debe modificar GeneratorVersion silenciosamente.

La estrategia actual para v1 -> v2 es:

`PRESERVE`

Los generatorVersionCode persistidos permanecen intactos.

Si una futura modificación estructural necesitase una transformación dependiente de GeneratorVersion, deberá declararse e implementarse explícitamente.

Nunca se asumirá que:

`schemaVersion == GeneratorVersion`

Son versionados independientes.

#### Migración v1 -> v2

La migración:

- conserva universes
- conserva galaxies
- conserva discoveries
- conserva observations
- conserva progress
- crea navigation vacío
- actualiza metadata.schemaVersion de 1 a 2 cuando existe metadata
- conserva storageFormatVersion
- conserva updatedAtEpochMs
- conserva generatorVersionCode

Si no existe metadata, la migración no inventa una fila.

#### Corrupción y datos no reconstruibles

Las migraciones son no destructivas.

Si una transformación no puede hacerse con certeza:

- no se inventan datos
- no se cambian seeds
- no se cambia GeneratorVersion
- no se usa fallback destructivo

La migración debe abortar con un error explícito.

#### Ground Truth

Las migraciones IndexedDB actúan sobre persistencia local.

No materializan Ground Truth.

El universo sigue regenerándose mediante:

`UniverseSeed + GeneratorVersion + ProceduralLocator`

#### storageFormatVersion

storageFormatVersion permanece actualmente en:

`1`

No se incrementa por la migración de schema v1 -> v2.

Su evolución corresponde al formato portable de persistencia/exportación y es independiente de schemaVersion.


### Repositorios locales

El Punto 3.8 encapsula IndexedDB detrás de repositorios locales independientes de Angular y de la UI.

Contratos actuales:

- UniverseRepository
- UniverseNavigationRepository
- DiscoveryPointsRepository
- DiscoveryRepository

Los contratos viven en domain/repository y no importan Angular, Dexie, DOM ni componentes de presentación.

Las implementaciones viven en data/local/repository:

- DexieUniverseRepository
- DexieUniverseNavigationRepository
- DexieDiscoveryPointsRepository
- DexieDiscoveryRepository

#### UniverseRepository

Responsabilidades:

- createIfAbsent
- exists
- getAll
- delete

La identidad continúa siendo:

`UniverseSeed + GeneratorVersion`

IndexedDB no dispone de foreign keys ni ON DELETE CASCADE.

Por ello delete ejecuta una transacción Dexie y elimina:

- navigation
- galaxies
- discoveries
- observations
- progress
- universe

No se elimina metadata global.

#### UniverseNavigationRepository

Un universo existente sin fila navigation devuelve:

- activeGalaxyIndex = 0
- recentGalaxyIndices = []

Los índices se exponen como BigInt y se persisten como decimal string.

#### DiscoveryPointsRepository

Mantiene independientemente:

- PD globales
- PD por galaxia

La ausencia de una fila devuelve 0.

No existen recompensas automáticas ni sincronización automática entre scopes.

#### DiscoveryRepository

La ausencia de fila equivale a UNKNOWN.

Persistir UNKNOWN elimina la fila.

Los estados conocidos se almacenan mediante upsert.

La actualización de un estado conserva firstKnownAtEpochMs y actualiza updatedAtEpochMs.

getKnownDiscoveries devuelve modelos de dominio KnownDiscovery.

#### ProceduralTargetSeedResolver

data/local no importa simulation.

DexieDiscoveryRepository recibe por inyección una abstracción capaz de resolver targetSeed desde:

`UniverseGenerationKey + ProceduralLocator`

Esto conserva la separación estricta entre simulation y persistencia.

La implementación real puede delegar posteriormente en ProceduralTargetResolver sin acoplar el repositorio a simulation.

#### Corrupción

Los repositorios rechazan explícitamente:

- UniverseSeed persistida inválida
- GeneratorVersion desconocida
- Long decimal inválido
- índices negativos o fuera de rango
- lineage corrupto
- DiscoveryState.UNKNOWN materializado
- targetSeed incompatible con la identidad procedural

No se inventan datos para reparar corrupción.

#### Angular

Los repositorios no utilizan:

- Injectable
- inject()
- Signals
- RxJS
- Component
- Router
- DOM

Angular queda reservado para orquestación/presentación.


### Backup portable

El Punto 3.9 introduce el formato portable de exportación/importación.

BackupFormatVersion actual:

`V1 = 1`

BackupFormatVersion es independiente de:

- IndexedDB schemaVersion
- storageFormatVersion
- GeneratorVersion

#### Contenido V1

El snapshot raíz contiene:

- formatVersion
- exportedAtEpochMs
- universes

Cada universo conserva:

- UniverseSeed
- GeneratorVersion
- timestamps de identidad persistida
- navegación
- galaxias conocidas materializadas
- descubrimientos
- observaciones
- progreso global y por galaxia

No contiene:

- metadata interna IndexedDB
- schemaVersion
- propiedades Ground Truth regenerables
- estado completo materializado del universo

#### Validación estricta

Antes de importar se valida completamente el snapshot.

Se rechazan:

- formatVersion desconocido
- campos ausentes
- campos adicionales
- tipos JSON incorrectos
- UniverseSeed no canónica
- GeneratorVersion desconocida
- universos duplicados
- índices Long no canónicos
- Long fuera de rango
- estados UNKNOWN materializados
- DiscoveryState desconocido
- DiscoveryTargetType desconocido
- lineage procedural incoherente
- targetSeed incoherente con UniverseGenerationKey + ProceduralLocator
- discoveries duplicados
- observations con id duplicado
- payloadJson inválido
- progress duplicado o incoherente
- navegación corrupta

No se modifica IndexedDB si el snapshot no supera toda la validación.

#### Importación

La importación V1 es una restauración completa.

Una vez validado el snapshot, una única transacción reemplaza:

- universes
- navigation
- galaxies
- discoveries
- observations
- progress

metadata se conserva.

No existe importación parcial ni reparación silenciosa.

#### JSON

exportJson produce JSON portable.

importJson acepta exclusivamente JSON que cumpla el formato V1.

La capa data/local no utiliza:

- Angular
- DOM
- File API
- Blob
- descarga del navegador
- selectores de archivos

La futura UI podrá transportar el JSON sin que el formato portable dependa de Angular.



### Browser storage health — Punto 3.10

GENESIS gestiona el estado del almacenamiento del navegador sin alterar el
modelo procedural ni materializar Ground Truth.

No cambia:

- IndexedDB schemaVersion = 2
- storageFormatVersion = 1
- BackupFormatVersion V1 = 1
- GeneratorVersion

La capa `data/local/storage` es independiente de Angular y de la UI.

#### Cuota

La cuota del origen se consulta cuando la API del navegador está disponible.

Estados:

- NORMAL: uso inferior al 80 %
- HIGH: uso desde el 80 %
- CRITICAL: uso desde el 95 %
- UNKNOWN: estimación no disponible o inválida

HIGH y CRITICAL producen:

- operatingMode = LIMITED
- writePolicy = ESSENTIAL_ONLY

La estimación de cuota es diagnóstica y no forma parte del estado canónico
del universo.

#### Persistencia

Estados:

- PERSISTENT
- BEST_EFFORT
- UNSUPPORTED
- UNKNOWN

La persistencia se solicita únicamente mediante una acción explícita.
No se solicita automáticamente al arrancar la aplicación.

Una negativa del navegador no se trata como corrupción.

#### IndexedDB no disponible

Si IndexedDB no existe o no puede abrirse:

- availability = UNAVAILABLE
- operatingMode = VOLATILE
- writePolicy = BLOCKED
- no se considera disponible el progreso persistido

El Ground Truth sigue siendo regenerable desde la seed y GeneratorVersion,
pero Observed Knowledge y progreso no deben fingirse como persistidos.

#### Detección de limpieza

La continuidad se comprueba mediante dos marcadores:

1. un identificador externo en localStorage;
2. una fila centinela correspondiente en el store metadata de IndexedDB.

Si el marcador externo existe pero la fila IndexedDB ya no existe:

- availability = CLEARED
- continuity = CLEARED
- operatingMode = RECOVERY_REQUIRED
- writePolicy = BLOCKED
- shouldOfferBackupRestore = true

GENESIS no recrea automáticamente el progreso perdido y no inventa
Observed Knowledge.

La continuidad únicamente puede restablecerse mediante una operación
explícita posterior a una recuperación o a una decisión explícita de
comenzar de nuevo.

Si navegador/origen elimina simultáneamente IndexedDB y localStorage,
una aplicación ejecutándose únicamente dentro de ese mismo origen no puede
distinguir de forma fiable ese borrado total de una primera ejecución.
En ese caso GENESIS inicializa una nueva continuidad sin afirmar que haya
recuperado datos antiguos.

#### Backup

Los marcadores internos de continuidad pertenecen a metadata y no forman
parte del backup portable del Punto 3.9.

Una futura restauración de backup deberá restablecer explícitamente la
continuidad después de completar satisfactoriamente la importación.