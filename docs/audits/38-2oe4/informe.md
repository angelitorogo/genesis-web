# GENESIS Web — 38.2o.e4 · Ojos volumétricos para reptilianos civilizados

## Motivación
El renderer 38.2o.e3 dibujaba ojos planos y el sistema de gafas generaba piezas opacas delante de ellos (especialmente SPLIT_GOGGLES). Se sustituye por un sistema volumétrico inspirado en la solución 38.2p2a aprobada para reptiles no civilizados.

## Alcance
- Globos oculares ovoides discretos, anclados al cuerpo SDF ya deformado.
- Iris y pupilas verticales como geometría curvada sobre el propio globo.
- Monturas ópticas abiertas para VISOR, SPLIT_GOGGLES y MONOCLE: conservan la variación determinista sin ocluir los ojos.
- Sin cambios en las diez familias anatómicas, cola SDF, traje 360°, patrón de identidad visual, resto de accesorios ni especies de reptiles cuadrúpedos.

## Criterios
- Mismo contrato, mismos ojos y mismos accesorios.
- Iris siempre situado por delante del globo, sin z-fighting por coplanaridad.
- Saliente del globo respecto a superficie facial cercano a 0,009 unidades del visor; geometría de volumen retranqueada.
- Validar WebGL frontal y lateral; la auditoría de código no sustituye revisión visual.

## Compatibilidad
Se actualizan dos tests antiguos de 38.2o.d3/d5 cuya exigencia de ojos planos contradice el objetivo actual. Se mantienen otras regresiones.
