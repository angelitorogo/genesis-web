# Informe — VISCORB.1a

## Incidencia
TS2352 en `viscorb-system-local-presentation.spec.ts`: cast de un fixture parcial a `SystemSceneMoonSnapshot` con metadatos y rotación omitidos. El build de producción podía finalizar porque la incidencia surgía al compilar bundles de Vitest.

## Reparación
Completar los campos obligatorios y utilizar la función existente `buildSystemSceneMoonPresentationV1` para obtener el contrato completo de la presentación lunar. Verificación de tipo estructural estricta y comprobaciones portátiles.

## Ajuste visual
La escala aparente de lunas en el contexto planetario de ficha y en SystemScene comparte el mismo helper `viscorbPresentedMoonRadiusV1`. Se reduce aproximadamente el 20 % en cada escenario, manteniendo su ratio físico entre lunas. No se modifica tamaño de la órbita ni su mecánica.

## Control de regresiones
Se conservan las orientaciones estelares VISCORB.1, la proyección local, los retornos globales, la selección, LOD, VISCATM.1c, 38.7x, COLVIS, CACHE-GAL y CACHE-CAT sin cambios en sus archivos. Tests Angular y WebGL requieren ejecución en el repositorio completo.
