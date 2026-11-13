# GENESIS 38.2o.e5b — Entrada real desde el índice de Laboratorio

El ZIP 38.2o.e5 solo añadía el acceso a la galería dentro del visor 38.2 y no en la portada de Laboratorio. La captura del usuario confirma que permanecían únicamente cinco tarjetas.

## Solución

- Nueva página Angular standalone de Laboratorio con galería de 12/24 ejemplares y visor 3D real conectado a la selección.
- El visor compartido admite ocultar la segunda botonera de galería cuando se usa dentro de esta página.
- Integrador Node que localiza el array `Routes` y el componente real del índice por su texto de cierre, añade ruta y sexta tarjeta.
- Operación idempotente: no duplica la ruta ni la tarjeta.
- Sin cambios de IndexedDB, universos, semillas ni persistencia.
- Detección conservadora: si los patrones no son inequívocos, se interrumpe sin modificar los ficheros del usuario.

## Dependencia

Requiere 38.2o.e5 instalado. Debe ejecutarse `node scripts/integrar-genesis-38-2oe5b-laboratorio.cjs` después de `Expand-Archive`.
