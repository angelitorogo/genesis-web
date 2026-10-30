# Fase 38.2 — Representación 3D procedural de microorganismos, hongos, plantas y animales

## Objetivo

A partir del contrato visual 38.1, esta subfase añade una **reconstrucción 3D procedural**
integrada en la ficha de especie. No sustituye el motor de VIDA ni cambia identidades.
Cada especie confirmada obtiene una maqueta coherente y determinista basada exclusivamente
en los datos que ya estaban certificados: grupo, plan corporal, cobertura, locomoción,
longitud, pigmentación, patrón, apéndices, hábitat y adaptaciones.

## Arquitectura

### 1. Descriptor puro 38.2

Ruta:

`src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts`

La función `describeVida38SpeciesPreviewV1(contract)` resume el contrato en un descriptor
inmutable con:

- familia de render (`MICROBIAL_COLONY`, `FUNGAL_CLUSTER`, `PLANT_FORM`, `INSECT_BODY`,
  `AVIAN_BODY`, `QUADRUPED_BODY`, `BIPED_BODY`),
- pista de hábitat (`ROCK`, `SOIL`, `WET`, `CANOPY`, `AIR`, `SUBSURFACE_WATER`),
- clase de escala visual,
- distancia de enfoque,
- apéndices, locomoción y adaptaciones,
- indicador `specialistIntelligenceDeferred` para 38.3.

Este descriptor es puro y no depende de WebGL.

### 2. Maqueta procedural Three.js

`createVida38SpeciesPreviewModelV1(contract)` construye un `THREE.Group` con:

- base ambiental suave (roca, suelo, margen húmedo, dosel, aire o microhábitat),
- sujeto normalizado a caja unitaria para estabilizar el encuadre,
- materiales `MeshStandardMaterial` / `MeshPhysicalMaterial`,
- auto-rotación e idle motion específicos por familia,
- colorimetría derivada de los pigmentos y patrón derivado del fenotipo.

No usa activos externos ni texturas pesadas; todo es procedural y ligero.

## Familias implementadas

### Microorganismos

- colonia de células y vesículas,
- filamentos tubulares,
- membrana/transparencia de microcolonia,
- apta para especies como `Tesyl al1`.

### Hongos

- grupo de estípites y sombreros,
- red basal de hifas,
- materiales fibrosos y tonos orgánicos,
- apta para `Isvar al2`.

### Plantas y árboles

- tronco/tallo principal,
- ramas secundarias,
- masa foliar procedural o frondes según plan corporal,
- apta para `Kathar ix2`.

### Animales

- insectos: cuerpo segmentado, seis patas mínimas, antenas y alas si vuelan,
- aves: cuerpo alado, beak, cola, patas,
- cuadrúpedos: cuerpo principal, cuello, cabeza, patas, cola y placas si hay armadura,
- bípedos base: torso, pelvis, cabeza y miembros. Esta familia sirve como base y **no**
  pretende cerrar la morfología final inteligente de 38.3.

## Adaptaciones y rasgos usados

Sin inventar órganos nuevos, 38.2 utiliza algunos rasgos existentes para modular la maqueta:

- `SENSORY_ORIENTATION`: apéndices sensoriales sutiles.
- `EXTERNAL_ARMOR`: placas dorsales o superficies reforzadas.
- `AERIAL_STABILITY`: estabilizador adicional en morfologías aéreas.
- `RESOURCE_SEARCH` / `MACROSCOPIC_TOOL_MANIPULATION`: énfasis leve en miembros distales.
- `bioluminescent: true`: emisor puntual tenue en la vista.

Rasgos no interpretados anatómicamente siguen presentes en el descriptor y pueden ampliarse
más adelante sin romper compatibilidad.

## Integración Angular

Se añade el componente standalone:

`src/app/presentation/life-species-visual/life-species-visual-preview.ts`

Características:

- canvas Three.js dentro de la ficha,
- controles locales (pausar/reanudar, restablecer vista),
- interacción por arrastre y rueda,
- leyenda clara indicando que es una reconstrucción científica procedural,
- aviso de continuidad hacia 38.3 cuando la especie pertenece a un linaje inteligente.

## Rendimiento y límites

- Sin texturas externas ni GLTF.
- Una sola escena/renderer por ficha abierta.
- Geometrías simples, materiales estándar y postprocesado nulo.
- No se instancia una galería ni una escena planetaria completa.
- Los modelos se liberan correctamente al desmontar la ficha.

## Pruebas

`vida38-species-visual-preview-scene.spec.ts` valida:

- clasificación por familias,
- determinismo geométrico,
- distinción estructural entre microbios y animales,
- propagación de pigmentación, bioluminiscencia y adaptaciones,
- continuidad hacia 38.3 para linajes inteligentes.

Además existe una auditoría Node portable que comprueba integración y tipado básico.
