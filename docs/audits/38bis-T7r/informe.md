# Auditoría GENESIS 38.bis-T7r

## Causa diagnosticada

Las colonias de VIDA.38.6c3 tienen lámparas autoluminosas (`InstancedMesh` + `MeshBasicMaterial`) calculadas con proporciones geométricas minúsculas respecto al radio del planeta/luna. En la escena científica 3D, desde una vista de luna completa, pueden proyectarse a menos de un píxel. La activación de las lámparas no implica que sean perceptibles.

## Modificación

Un pequeño número de puntos luminosos ópticos anclados al emplazamiento confirmado se dibuja directamente en `SystemScene`, sin anillos UI y sin depender de la capa COLONIAS. Son un recurso visual, no una fuente de luz física ni una marca medida científicamente. Se actualiza posición relativa a la cámara, tamaño en píxeles, visibilidad frontal y opacidad nocturna por las contribuciones estelares existentes.

El recurso de textura se crea una vez por visual y se libera con los recursos del cuerpo.

## Pruebas ejecutadas

- Auditoría portátil T7r: 46 comprobaciones superadas.
- Auditoría portátil T7n: 56 comprobaciones superadas.
- Auditoría portátil T7o: 27 comprobaciones superadas.
- Auditoría portátil T7p: 47 comprobaciones superadas.
- Auditoría portátil T7q: 51 comprobaciones superadas.

La compilación completa Angular, Vitest real y pruebas WebGL/E2E siguen pendientes de validación en `genesis-web`.
