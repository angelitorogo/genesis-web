# Informe de cierre parcial — GENESIS 38.bis-T7l

## Diagnóstico

La textura de T7k utilizaba una dirección de vértice normalizada, escalada mediante una relación `footprintScene/bodyRadiusScene`, mientras los edificios eran instancias de `colony.site`. En lunas de pequeña escala la proyección en grandes direcciones angulares daba una sensación de desplazamiento de escala distinta.

## Corrección

1. `colony.site` constituye el origen y sus ejes tangentes constituyen la base de proyección.
2. El shader recibe coordenadas **de vista** (modelViewMatrix) y los vectores duales de la misma base. Estos valores se actualizan después de cada reposicionamiento de cámara.
3. El terreno permanece en el material nativo: sin mallas superpuestas, sin niebla, sin regenerar atlas durante el zoom.
4. UV macro/fina/grano tienen frecuencia espacial fija. El zoom solo modifica ligeramente la amplitud tonal, no las coordenadas ni el tamaño del patrón.
5. Restauración del material original al salir.

## Comprobaciones

- Auditoría portátil T7l con escalas y orientaciones variadas, comprobación analítica de invariancia del UV entre cinco niveles de zoom y los contratos de shader.
- Pruebas Vitest añadidas para escala, ejes no ortogonales, giro del anfitrión, limpieza y geometría intacta.
- Angular y WebGL completos: pendientes en la instalación del usuario.
