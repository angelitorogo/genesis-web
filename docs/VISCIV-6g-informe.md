# VISCIV.6g — informe de implementación

## Contrato

- El nivel de civilización procede de conocimiento confirmado y no cambia.
- Una representación procedural no equivale a detección científica.
- `ADVANCED` permanece en 3–5 satélites, 0 estaciones, 0 anillos.
- `VERY_ADVANCED` posee 9–14 satélites, ≥1 estación, 1–3 anillos sin solapamiento radial entre bandas de una misma civilización.
- Estilos: HABITAT, INDUSTRIAL y TRANSPORT.
- Luces únicamente como mallas opacas instanciadas. Color por instancia actualizado en el bucle existente, según luz estelar de ambos visores. Sin `PointLight` extra por baliza.

## Error TS2352

Causa: `system-scene-orbital-infrastructure-visciv6e.spec.ts` construía `SystemSceneSnapshot.address` con `bigint` cuando la interfaz oficial exige `string`. Se cambia a cadenas y se elimina el cast inseguro de `wrongSystem`.

## Riesgos controlados

- No se altera posición procedural de satélites y estaciones ni las leyes físicas. Los radios y las bandas de anillos se mantienen separados con una holgura mínima validada de 0,30 radios planetarios.
- Se usan lotes `InstancedMesh` para mantener limitado el número de llamadas de render. La energía de los leds no implica fuentes de luz física en la escena.
- Toda geometría, material y textura nueva figura en el listado de recursos y se libera al desmontar el visor.
- Test visual real con WebGL y tests Angular deben validarse en el proyecto instalado.
