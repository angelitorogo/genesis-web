# Informe técnico VISCIV.6e

## Diagnóstico causal

Comparación efectuada entre `genesis-web-fuentes-38-6.zip` y el incremento `genesis-38-6-infraestructuras-civilizaciones-CT0-INCREMENTAL.zip` reconstruido hasta 38.6c4.

En la base 38.6 original, `SystemScene.createArtificialSatelliteVisuals` y `ScientificBodyPreview.createArtificialSatellites` invocaban `buildSystemSceneOrbitalStationPlansV1` y `buildSystemSceneOrbitalRingPlansV1`. El incremental 38.6 reemplazó las dos invocaciones con listas vacías; la renderización de sus mallas seguía presente, pero nunca se ejecutaba. Además, `SystemScene.artificialSatelliteCount()` dejó de sumar estaciones/anillos.

Este parche restaura ambos orígenes de planes mediante un único contrato compartido, en los dos renderizadores, sin cambiar ni los algoritmos antiguos ni los índices de civilizaciones.

## Riesgos controlados

- La persistencia y los datos científicos no varían.
- La capa de estaciones y anillos continúa condicionada al tier visual (obtenido exclusivamente de ciencia confirmada).
- Los objetos son representaciones artísticas procedurales; no se anuncian como datos telescópicos ni como objetos confirmados independientes.
- Se preservan los 6 perfiles visuales: industrial, habitat, mixed, single-ring, double-ring y platform.
- Se conservan las capas 38.6a–38.6c4 de infraestructuras coloniales, LOD y oclusión.
- La instrumentación es temporal, activable por parámetro y de solo lectura.

## Resultados de validación local

- Prueba portable de 1.024 semillas con planes reales: PASS.
- Comprobación de sintaxis en archivos TypeScript editados: PASS.
- Script arquitectura del proyecto: PASS.
- Build Angular y batería Vitest: no ejecutados en la copia sin dependencias.
