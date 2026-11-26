# Informe técnico · GENESIS STARVIS.1

## Auditoría previa

La representación original asignaba a la mayoría de estrellas convencionales radios `adaptiveSystemStarRadiusScene()` comprimidos entre 0,20 y 0,40. El dominio ya disponía de `StellarEvolutionState`, ramas `RED_GIANT_BRANCH` / `ASYMPTOTIC_GIANT_BRANCH` y `StellarSpectralAppearance`, pero `SystemScene` consumía principalmente radio, temperatura y color sin la clasificación evolutiva.

Los límites existentes eran `buildSystemSceneHostVisualEnvelopeV3`, `buildSystemSceneMultistellarPresentationV4` y `buildSystemSceneStellarOrbitClearanceV5`; algunos mínimos/porcentajes bloqueaban tamaños pequeños o grandes. La selección en Three.js ya utiliza proxies instanciados distintos de la fotosfera. Las estrellas compactas se representan mediante el grafo de laboratorio separado.

## Decisiones

Se añade `system-scene-star-visual-profile-starvis1.ts` como contrato puro, determinista y sin nuevos modelos científicos. La ficha de datos de cada estrella incorporó sólo metadatos de presentación para el render. No se reescriben los colores que provienen de temperatura, la fuente luminosa ni el radio físico.

V3 y V5 aplican las nuevas proporciones solamente con `starvis1OptIn`. V4 conserva las separaciones estelares. La comprobación final por periapsis y tamaño de cuerpo, antes de emitir la instantánea, aplica el límite geométrico a la fotosfera y a sus sprites de halo. Los perfiles se generan una sola vez por estrella y snapshot, no por fotograma. En composición de múltiples anfitriones, los radios previamente validados se escalan junto con sus órbitas, suprimiendo el min/max que igualaba tamaños.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| `node scripts/auditar-genesis-starvis1.spec.cjs` | 23/23 correcto |
| 14 tests aislados de TypeScript (transpilación + assert Node) | 14/14 correcto |
| `node scripts/verify-architecture.mjs` | correcto; 6 capas, 1295 TS |
| `tsc --strict --noEmit` del helper puro | correcto |
| Parse TypeScript (6 módulos) | 0 errores |
| Angular build / Vitest oficial | no ejecutados; dependencias ausentes |

## Riesgos y validación pendiente

La protección espacial de P-type utiliza la envoltura conservadora del movimiento del anfitrión y el periapsis proyectado, no una nueva simulación física de N cuerpos. Se ha priorizado no introducir una reinterpretación de órbitas S-type/P-type existentes. Si una arquitectura geométrica heredada ya presenta un cruce de centros, la única solución sin mover cuerpos es la supresión de la fotosfera; conviene auditar visualmente esos casos extremos. Comparar escenarios SINGLE, BINARY, TRIPLE y V2/V3 multi-anfitrión, tanto con periapsis cercanos como sin planetas. Confirmar FPS, geometría orbital y selección con zoom a 1440×900. La batería Angular y el build deben pasar en el repositorio completo.
