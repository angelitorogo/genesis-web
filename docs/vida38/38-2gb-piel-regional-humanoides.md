# GENESIS 38.2g.b — Piel regional y materiales biológicos de humanoides

## Objetivo
Dar un salto cualitativo en el material biológico de humanoides sin perder la estabilidad lograda en 38.2g.a.

## Mejoras introducidas

### 1. Material biológico por regiones anatómicas
Se añaden máscaras procedurales estables derivadas de la anatomía:
- `vida38FaceRegion(...)`
- `vida38TorsoRegion(...)`
- `vida38LimbRegion(...)`
- `vida38ExtremityRegion(...)`

Estas regiones permiten variar aspecto y sombreado en rostro, tronco, brazos, manos, piernas y pies sin usar coordenadas de pantalla.

### 2. Pigmentación integrada con anatomía facial
La pigmentación ya no es solo una mezcla global de dos colores. Ahora se introduce:
- integración en cejas / reborde orbital,
- mejillas,
- morro / boca,
- puente nasal.

Esto se realiza mediante `vida38FacialPigmentContribution(...)`, que modula el color sobre la geometría facial sin romper determinismo.

### 3. Materiales más ricos por tipo de cobertura
`vida38BiologicalRelief(...)` ahora distingue mejor:
- **piel / cuero**: poros, arrugas faciales, grano torácico y estriación suave en extremidades;
- **escamas**: placas más convincentes con relieve regional;
- **fibra / pelaje**: flujo de fibras y subcapa suave;
- **plumas**: vane y rib simplificados pero más plausibles;
- **membrana**: ondulación y venado tenue.

### 4. Variación regional de color y roughness
- `vida38RegionalChromaticVariation(...)` modifica sutilmente el balance cromático por regiones anatómicas.
- `vida38RegionalRoughness(...)` evita que rostro, torso y extremidades compartan exactamente el mismo acabado superficial.

## Estabilidad conservada
Se mantienen intactas las garantías de 38.2g.a:
- coordenadas anatómicas estables;
- ausencia de `gl_FragCoord`;
- antialias procedural con `fwidth`;
- reducción del shimmering.

## No cambia
- No cambia la malla anatómica ni el generador 38.2e/38.2f.
- No cambia el contrato 38.1.
- No cambia el determinismo ni la calibración VIDA.T1.
