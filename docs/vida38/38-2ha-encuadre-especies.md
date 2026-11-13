# GENESIS 38.2h.a — Reencuadre automático y centrado visual de especies

## Problema diagnosticado
En la vista 38.2, `normalizeSubject()` centra cada especie según su dimensión **mayor** y después apoya su base visual en `y=-0.66`. En un cuadrúpedo largo y bajo, el centro de la especie queda cerca de `y=-0.35`, mientras la cámara anterior apuntaba siempre a `y=0.6`, provocando un encuadre excesivamente bajo.

## Implementación
- `vida38-species-camera-framing-38-2ha.ts`: utilidad pura que calcula el objetivo y la distancia de cámara desde el `Box3` **del sujeto, no del decorado**. Considera FOV vertical, relación de aspecto y una envolvente conservadora para giro horizontal completo.
- `life-species-visual-preview.ts`: obtiene el `Box3` al crear la especie; carga inicial y botón **Restablecer vista** comparten la misma función de encuadre. Redimensionar la ventana conserva el zoom relativo. Los límites de zoom escalan con el modelo.
- El centro se ajusta ligeramente por debajo del punto medio geométrico para situar el animal algo por encima del centro visible, evitando que quede bajo los paneles informativos.

## Alcance y preservación
No cambia geometría, pigmentación, SDF, arquetipos, VIDA, tamaños biológicos, IndexedDB ni los renderizadores planetarios. Los elementos decorativos siguen en su posición. No modifica la animación ni los controles existentes.

## Tests
`vida38-species-camera-framing-38-2ha.spec.ts` comprueba encuadre de cuadrúpedos largos y bajos, humanoides, plantas, variantes voluminosas, formatos estrechos y anchos, recorrido angular completo de la especie, exclusión de la peana, reset de cámara y ausencia de NaN.

## Validación visual pendiente
Comprobar Vazor um8 (cuadrúpedo bajo), un humanoide, una planta y un microorganismo. Cargar, orbitar, hacer zoom, pulsar **Restablecer vista** y redimensionar el navegador. El cuerpo debe conservarse completo y aparecer centrado, sin obligar a cambiar su geometría.
