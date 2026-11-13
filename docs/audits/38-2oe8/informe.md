# Auditoría 38.2o.e8 — Armaduras y ropa técnica

## Objetivo

Sustituir cajas rectangulares y triangulaciones incompletas por armaduras anatómicas y prendas técnicas materiales sobre reptiles civilizados VERY_ADVANCED.

## Implementación

- `SEGMENTED_ARMOR`: coraza frontal, dorsal, 3–4 láminas abdominales, hombreras curvas, ribete pectoral, protecciones de brazos/piernas, botas y subtraje técnico conformal sobre SDF.
- `COLONIAL_RIG`: chaleco utilitario, panel dorsal, correajes curvilíneos, módulos de cintura y equipamiento conformal para extremidades.
- Materiales diferenciados, selección por cultura/especie, LOD diferenciado.
- No cambia `TECH_SUIT` ni las cinco siluetas blandas 38.2o.e7c.

## Auditorías reproducibles

- `scripts/auditar-genesis-38-2oe8-armaduras.spec.cjs`: identidad determinista, diversidad de material y silueta, integración en renderer.
- `scripts/auditar-genesis-38-2oe8-topologia.spec.cjs`: constructor real de la nueva geometría ejecutado con adaptador mínimo para cuerpos sintéticos; comprueba índices válidos, ausencia de coordenadas no finitas, placas curvas sin aristas abiertas o non-manifold.
- `vida38-civilized-reptilian-38-2oe8.spec.ts`: Vitest en Three.js real, para determinismo, 3D y regresiones.

## Criterio visual pendiente

La armadura debe leerse como placas curvas continuas y articuladas, no cajas flotantes. El traje colonial debe quedar diferenciado de la armadura militar. Comprobar de frente, perfil y espalda; no cerrar solo por pasar tests/build.
