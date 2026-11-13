# Auditoría 38.2o.e7c — prendas blandas, continuidad y encaje anatómico

## Contrato
Conservar las especies/identidades y el SDF existentes. Sustituir únicamente la confección de las prendas blandas; preservar `TECH_SUIT`, `SEGMENTED_ARMOR`, ojos, accesorios y cola.

## Geometría nueva
- Malla adaptada a perfiles anatómicos del tronco, hombros y caderas.
- Arranque de sisa orgánica: cota superior por ángulo de cuello/pecho/hombro.
- Abertura caudal elíptica o de lágrima sin eliminación brusca de quads completos.
- Bordes cerrados y ribetes de cuello, bajo y salida caudal.
- Mantos dorsales siguiendo la curvatura de la túnica con separación posterior.
- Cinco siluetas visibles: `PRIESTLY_COLUMN`, `TECHNO_LITURGY`, `ROYAL_MANTLE`, `COLONIAL_SPLIT`, `PELAGIC_FLOW`.

## Comprobación local sin runtime Angular
Se ejecutó una comprobación geométrica mediante versión transpiliada del módulo y un sustituto mínimo de las primitivas Three.js, sobre geometría sintética con implantación caudal. Las cinco variantes superaron la comprobación de manifold: **0 aristas abiertas y 0 aristas no-manifold**. La comprobación no equivale a un test visual WebGL ni a `ng build`.

## Validación pendiente en el proyecto
Vitest/Angular y comprobación en la galería. Especialmente ejemplares 7, 17, 26 y 121 (vistas frontal, 3/4 y posterior), revisando cuello/sisas y salida de cola.
