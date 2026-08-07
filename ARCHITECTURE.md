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