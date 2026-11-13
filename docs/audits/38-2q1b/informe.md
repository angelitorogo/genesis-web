# Auditoría 38.2q1b — Integración torácica, abdomen terminal y patas insectoides

## Alcance

Verificación estructural del incremental 38.2q1b:

- anatomía orgánica q1b presente,
- renderer insectoide actualizado a q1b,
- test Vitest específico,
- auditoría portable CT-0.

## Comprobaciones

- Presencia de nuevas funciones de anclaje alar y aguijón abdominal.
- Ausencia de `Math.random()`.
- Ausencia de `THREE.BoxGeometry` en la nueva anatomía.
- Determinismo de firmas anatómicas sobre galería y sobre lote sintético de 4096 identidades.

## Resultado esperado

`GENESIS_38_2Q1B_AUDIT_OK`
