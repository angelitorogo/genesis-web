# GENESIS 38.bis-T7n — Informe de integración y riesgos

## Fuentes de integración

- `SystemScene`: última fuente original disponible de COLVIS.1, que conserva la integración 38.6c3/38.6c4 con infraestructuras nocturnas y la cámara/superficies de lunas.
- Renderizador compartido COLVIS.2/T7c–T7h: se añade el parámetro optativo `showColonyLocationRingsT7n`, predeterminado `true`. Solo `SystemScene` invoca `false`.
- Ficha científica: base T7m de cámara óptica y detalle superficial T7l.

## Contratos

- No se rotan `root`, el planeta, la luna ni los materiales de luz mientras se inspecciona una colonia; cambia la dirección de la cámara alrededor del grupo colonial.
- `SystemScene` no dibuja anillos individuales de colonia. El anillo verde de un planeta/luna es una superposición seleccionable mediante capa explícita, inicialmente apagada.
- Se usan únicamente `visualInfrastructurePlans` ya públicos en el snapshot, filtrados por `VIDA8_COLONIAL_SETTLEMENT` y `RECONSTRUCTED_NOT_OBSERVED`. El recuento es por **cuerpo**, no por colonia.
- Las luces nocturnas 38.6c3 permanecen independientes de la capa verde.
- El cambio es visual. No se reescriben registros de VIDA.8/VIDA.9, órbitas ni persistencia.

## Tests

La auditoría portable `scripts/auditar-genesis-38bis-t7n.spec.cjs` comprueba sintaxis TS, marcador por cuerpo, filtrado, predeterminado apagado, arcos orbitales de cámara y retirada de anillos de `SystemScene` sin afectar fichas/laboratorio.

Las pruebas de integración Angular/Three.js en el proyecto del usuario siguen pendientes.
