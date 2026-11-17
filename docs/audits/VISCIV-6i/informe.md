# VISCIV.6i — Arquitectura monumental de anillos orbitales

## Objetivo
Aumentar radicalmente la espectacularidad visual de los anillos orbitales `VERY_ADVANCED` mediante superestructuras monumentales, multinivel y especializadas por tipo.

## Cambios implementados
- Superestructura monumental común para todos los anillos.
- Niveles de cubierta múltiples y nodos orbitales de gran tamaño.
- Distritos habitacionales para anillos `HABITAT`.
- Astilleros y diques secos para anillos `INDUSTRIAL`.
- Corredores y terminales masivos para anillos `TRANSPORT`.
- Todo ello usando `InstancedMesh` y reutilizando el generador compartido por ficha planetaria y `SystemScene`.

## Validación prevista
- `node scripts/auditar-genesis-visciv-6i.spec.cjs`
- `npx ng test --watch=false --include=src/app/presentation/system/system-scene-orbital-architecture-visciv6i.spec.ts`
- `npx ng build`
