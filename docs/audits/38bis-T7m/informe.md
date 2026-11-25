# GENESIS 38.bis-T7m — Informe de corrección

## Diagnóstico

Las capturas de Aaras A-11 I muestran que el patrón de textura superficial
cambia muy poco de escala al pasar por distintos niveles de zoom, mientras
los edificios varían notablemente. T7l sólo corrigió las coordenadas del
shader, pero conservó el desplazamiento de la cámara multiplicado por el zoom.

Un desplazamiento de cámara en perspectiva (dolly) amplía de manera distinta
objetos a distintas profundidades. Sustituirlo por zoom de proyección con
posición fija garantiza la misma escala proyectada para todas las distancias.

## Cambio

Utilizar `colvis3ColonyOpticalFramingT7m` para fijar posición, objetivo,
planos near/far y orientación de la cámara para todos los niveles. Variar
únicamente `PerspectiveCamera.zoom`; restaurar el zoom al salir.

## Limitaciones de validación

Las pruebas automáticas acreditan la invariancia matemática de la proyección
y los contratos de código. La renderización WebGL sobre IndexedDB real sólo
puede validarse en el proyecto completo.
