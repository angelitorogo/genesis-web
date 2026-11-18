# VISCIV.6n — Sombras de anillos artificiales sobre superficie planetaria

## Alcance
- Proyección de los 1–3 anillos `VERY_ADVANCED` sobre el material superficial del planeta.
- Intersección por fragmento del rayo superficie→estrella con cada plano orbital y sus bandas radiales.
- Hasta tres fuentes de luz; se reutilizan los pesos y direcciones actualizados por el shader GENESIS 25.6.
- Penumbra radial y diferenciación visual de cubiertas/nodos mediante función angular (aproximación de detalle).
- Shader añadido después del atenuador día/noche y antes de la emisión urbana; las luces nocturnas no se apagan.
- Igual en `SystemScene` y ficha científica 3D; el material recibe las matrices actuales de los anillos cada fotograma.
- Al ocultar infraestructura artificial, se desactivan también las sombras; no afecta a los anillos naturales.
- Sin nuevos shadow maps, texturas ni lights; hasta 3 anillos y 3 estrellas, evaluación limitada en el shader.

## Limitaciones declaradas
- Se proyectan bandas con patrones de estructura aproximados; no cada geometría individual de las decenas de `InstancedMesh`.
- El efecto se aplica a la esfera principal, no a la capa volumétrica de nubes ni a todos los objetos coloniales superficiales.
- Penumbra suavizada visualmente, no dispersión estelar físicamente exacta.

## Ejecución de validación
`node scripts/auditar-genesis-visciv-6n.spec.cjs`

`npx ng test --watch=false --include=src/app/presentation/system/system-scene-orbital-surface-shadow-visciv6n.spec.ts`

`npm run test:architecture && npx ng build`

Validaciones completas de GPU y Angular: ejecutar en el proyecto del usuario.
