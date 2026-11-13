# GENESIS 38.2s5 — Integración efectiva de vestimenta avanzada y caducidad de miniaturas

El error visual de 38.2s4 se podía mantener aunque la implementación estuviera en el proyecto por dos motivos:

1. La selección de `createBiped` no estaba cubierta por un test de **escena completa**. El nuevo integrador prioriza `REPTILIAN + ADVANCED` antes del `switch(descriptor.family)` en `createVida38SpeciesPreviewModelV1`, sin cambiar las demás rutas.
2. La caché de 38.2s3 dependía de la identidad y de la semilla, **no de la versión del motor de vestuario**. El nuevo namespace de caché obliga a recapturar las imágenes de 38.2s4 cuando cambian las prendas.

La spec 38.2s5 comprueba explícitamente que `createVida38SpeciesPreviewModelV1` haya creado los componentes volumétricos del vestuario, no solo que los genere el helper aislado. Incluye comprobación para los tres linajes `VERY_ADVANCED`.

No se reemplaza ningún renderer de `VERY_ADVANCED`; no se toca física, biología ni persistencia. Se mantiene la calidad `LOW` para las miniaturas y la habitual para el visor principal.
