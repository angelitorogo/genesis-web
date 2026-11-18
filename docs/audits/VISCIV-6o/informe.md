# Informe VISCIV.6o — Sombras: estructuras, penumbras, transiciones y rendimiento

## Diseño

- Mantiene VISCIV.6n.b: la densidad interna es constante (0.80) y el factor total de oscurecimiento permanece en 0.93.
- Los grandes hubs alteran suavemente la anchura proyectada. Dos lóbulos opuestos ligados al eje real del rotor; amplitud por tipo: INDUSTRIAL 0.060, HABITAT 0.050, TRANSPORT 0.034 radios planetarios. Sin franjas periódicas ni cortes de bandas.
- Atenuación `smoothstep` cerca del terminador, evitando saltos duros.
- GPU: test radial sobre distancias al cuadrado antes de evaluar raíz cuadrada y el lóbulo estructural. No crea nuevas luces ni mapas de sombras.
- CPU: fuentes estelares, vector planeta, posición y color reciclados por anillo, sin asignaciones por fotograma en el caso normal. Mantiene la ponderación multiestrella.
- Shader y geometría solo para civilizaciones con infraestructura artificial visible; ambas representaciones 3D comparten código.

## Validaciones efectuadas

- Auditoría VISCIV.6o portable: 4096 orientaciones y contratos GLSL — PASS.
- Auditorías anteriores 6m, 6n, 6na, 6nb — PASS en proyecto reconstruido.
- Verificación de arquitectura — PASS (1212 archivos TypeScript de producción; se reconstruyó carpeta vacía `observation` solo para la auditoría local).
- Sintaxis TypeScript: comprobada.
- Angular/Vitest/WebGL completos: no ejecutados en este entorno (sin dependencias del proyecto).

## Riesgos y prueba manual

Inspeccionar visualmente un planeta de dos o tres anillos en ambos visores. Verificar que no aparecen rayas, que el sombreado multiestrella permanece correcto y que la silueta cambia muy sutilmente alrededor de grandes nodos. Comparar FPS con VISCIV.6n.b si es posible; no se promete un incremento cuantificado.
