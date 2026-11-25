# Auditoría 38.bis-T7e

**Problema original:** T7d dibujaba un disco plano opaco alrededor de cada asentamiento (también en la ficha). Durante el zoom, el plano se superponía al cuerpo y su material ocultaba la textura original. COLVIS.2 limitaba además el alejamiento a 8 y los planos de clipping quedaban orientados solo a edificios.

**Solución:** eliminación completa del disco T7d; retorno a la malla esférica original y sus materiales. Una capa de microtextura semitransparente, de casquete esférico, se añade solo en la inspección colonial. Su intensidad desaparece al pasar a escalas planetarias. La cámara usa un nuevo tramo suave a partir del zoom 8 y encuadra el centro del cuerpo al llegar a 24.

**Salvaguardas:** no se modifican posiciones/semillas/población colonial, archivos científicos, IndexedDB ni escalas de arquitectura. Se mantiene la UI T7d de marcador, metadatos limpios, luz y bloqueo de scroll. La microtextura T7e es un recurso de presentación y se libera al cerrar el modal o destruir el visor.

**Validación portátil**: `scripts/auditar-genesis-38bis-t7e.spec.cjs`, y regresiones `t7d`, `t7c`. Las pruebas completas Angular/Vitest/E2E requieren el repositorio original con dependencias.
