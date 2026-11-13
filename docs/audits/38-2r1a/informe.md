# 38.2r1a — Auditoría de boca y tercio facial inferior

## Corrección

Se reemplaza por completo el montaje oral de coordenadas aproximadas de 38.2r1.
El nuevo modelo tiene dos etapas:

1. Deformación espacial restringida al tercio facial inferior, aplicada a la malla orgánica continua tras la morfología corporal de 38.2r.
2. Abertura oral y labios ajustados sobre la isosuperficie anatómica por búsqueda numérica en el SDF; materiales derivados de pigmentación biológica y no de la ropa.

## Límites

- No cambia los contratos ni la generación VIDA.
- No modifica ojos, cabello, dientes, accesorios, ropa, laboratorio o cámara.
- Los detalles reconstruidos solo se activan en `HUMANOID / VERY_ADVANCED`.
- La diversidad facial se mantiene determinista mediante morfología, arquetipo y rasgos faciales.

## Validación

`node scripts/auditar-genesis-38-2r1a-boca-facial.spec.cjs`

`npx ng test --watch=false --include="src/app/presentation/life-species-visual/vida38-civilized-humanoid-38-2r1a.spec.ts"`

`npx ng build`

## Estado

Auditoría estructural y transpilación TypeScript local; aceptación visual pendiente en laboratorio.
