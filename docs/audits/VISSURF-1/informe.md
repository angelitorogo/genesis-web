# VISSURF.1 — Superficies planetarias de mayor definición

## Causa de baja resolución
La geografía 25.3 se genera sobre un atlas base de 256 × 128; la ficha la elevaba a 1024 × 512 mediante interpolación, pero no podía recuperar el relieve ni los detalles que faltaban en origen. `SystemScene` aumentaba solo hasta 512 × 256 para el planeta próximo. Este era el origen principal del aspecto borroso y de las costas demasiado simplificadas.

## Diseño implementado
- Atlas científico D.4d, coberturas, selección de vegetación y máscara nocturna **sin cambios**.
- Nueva clasificación visual de materiales, derivada de las máscaras ya seleccionadas: mar, hielo, roca, desierto, vegetación, volcanismo.
- Síntesis determinista multiescala de color, rugosidad y relieve; límites de clases con ruido coherente periódico, sin inventar nuevas clases ni recalcular geografía física.
- Ficha 3D de planetas sólidos: **2048 × 1024** para superficie/relieve/rugosidad.
- `SystemScene`: **1024 × 512** únicamente para el planeta sólido enfocado y cercano, conservando LOD y liberación de recursos.
- **Nubes intactas**: el atlas de nube continúa con 1024 × 512 en la ficha, 512 × 256 en zoom de sistema y 256 × 128 a distancia. No se modifican generación, composición, shader, ni perfil de opacidad.
- Gigantes gaseosos y otros cuerpos: sin ampliación de las texturas de superficie.
- Luces nocturnas, civilizaciones y científicas: no se regeneran ni redistribuyen.

## Validación
- `node scripts/auditar-genesis-vissurf1.spec.cjs`
- `npx ng test --watch=false --include=src/app/presentation/system/system-scene-planet-surface-detail-vissurf1.spec.ts`
- `npx ng test --watch=false --include=src/app/presentation/system/system-scene-planet-surface-texture.spec.ts`
- `npx ng test --watch=false --include=src/app/presentation/system/system-scene-planet-texture-refinement.spec.ts`
- `npm run test:architecture`
- `npx ng build`

## Limitaciones
Es refinamiento visual procedural. No es una simulación geológica más detallada ni un cambio en la distribución física de biomas. La geometría esférica sigue con su LOD actual. Evaluar GPU/memoria en la ficha de planetas grandes y el sistema antes de declararlo visualmente cerrado.
