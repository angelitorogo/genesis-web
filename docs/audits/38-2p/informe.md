# GENESIS 38.2p — Ojos de reptiles y traslación en el visor de especies

## Alcance

**Reptiles no civilizados** (`REPTILES`, cuerpo `TETRAPOD`): sustituye globos oculares de la preview 38.2j por un contorno almendrado de superficie, iris pigmentado y pupila vertical. Las geometrías nacen de intersecciones con la malla SDF real, y varían de forma determinista según la identidad morfológica. No se modifica el motor del cuerpo ni las especies reptilianas civilizadas.

**Visor universal de especies** (`life-species-visual-preview.ts`): añade traslación 2D de la cámara en su plano imagen, respetando giro y zoom. Se calcula desde altura real del canvas y FOV de la cámara.

## Controles

| Entrada | Acción |
| --- | --- |
| Arrastre izquierdo | Girar / orbitar (actual) |
| Arrastre derecho o central | Desplazar espécimen en pantalla |
| Ctrl+izquierdo o Shift+izquierdo | Desplazar |
| Botón «Modo mover» + izquierdo | Desplazar |
| Rueda | Zoom |
| «Restablecer vista» | Giro, zoom y desplazamiento por defecto |

La traslación no altera la anatomía SDF, el estado del mundo ni la posición física de la especie.

## Validación pendiente en el proyecto

Tests Vitest del modelo ocular y cálculo de pan, auditor estructural Node, build Angular y validación en navegador. Un test de la geometría ocular con tres ejemplos LOW comprueba anclajes en ambos lados.
