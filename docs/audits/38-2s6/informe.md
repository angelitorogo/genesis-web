# GENESIS Web — 38.2s6 · Investigación y resolución de vestuario invisible

## Causa demostrada con el código histórico y las capturas

La banda diagonal del pecho, el peto superficial y las pequeñas hombreras visibles en las capturas pertenecen al bloque heredado `addGarments38OD` de `vida38-civilized-reptilian-preview-38-2o.ts` para nivel `ADVANCED`.

38.2s2/38.2s4 implementaron otra construcción de vestimenta pero dependían de que la selección de `createVida38SpeciesPreviewModelV1` llegara al nuevo renderer. Las auditorías anteriores comprobaban mayoritariamente el plan de ropa, la presencia del integrador o la invocación aislada, y no bloqueaban que la galería real terminase renderizando la prenda antigua.

No disponemos de una copia del proyecto local de Windows del usuario; por tanto no es posible afirmar si en su equipo falló la ejecución de un integrador, alguna modificación fue sobrescrita por otro parche o existe una variación en el selector. La solución evita depender de esa distinción.

## Solución

1. Hook de **postcondición** al final de `createVida38SpeciesPreviewModelV1`, antes de `normalizeSubject`. Reconstruye con 38.2s4 si el selector heredado generó un reptiliano `REPTILIAN/ADVANCED` sin la ropa nueva.
2. No reconstruye si ya detecta una escena correcta, por lo que evita duplicar mallas y coste SDF.
3. Verificación de **objetos reales** en el modelo, no únicamente de etiquetas, con conteo y dimensiones de las prendas tridimensionales y sus accesorios. Prohíbe cualquier `VIDA38_2OD_REPTILIAN_GARMENT` heredado.
4. La galería no captura ni cachea una miniatura que no cumpla esa postcondición. Muestra «ERROR: vestuario no aplicado» y registra la causa en consola.
5. Se renueva la revisión de la caché, conservando la calidad LOW y las tres vistas.
6. Test Vitest ejecutado sobre el modelo devuelto por la escena real; prueba además que el hook no actúa sobre otros linajes o niveles.

## Exclusiones

No se han modificado implementaciones de ninguna civilización `VERY_ADVANCED` (reptiliana, insectoide o humanoide), ni su galería, accesorios, vestimenta o persistencia. No se toca el renderer 38.2o ni las fichas de especies sin civilización.

## Validación

- Auditoría estática Node tras ejecutar el integrador, que exige su ubicación correcta tras el `switch` y antes de la normalización.
- Tests Vitest de la escena real, no únicamente planes de ropa.
- `npx ng build` y revisión de galería y visor en el navegador del usuario.
