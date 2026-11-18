# GENESIS VISSURF.3 — Geografía estructurada y materiales planetarios

## Alcance único
Incluye conjuntamente geografía procedural con corredores de relieve y valles, materiales diferenciados por clase científica, batimetría litoral, alturas visuales, rugosidad y normales para iluminación, y LOD en los dos visores. No se divide en subentregas.

## Integración
El atlas D.4d es la autoridad de las clases y porcentajes. VISSURF.2 produce la nueva máscara visual multirresolución con las mismas cuotas que D.4d. VISSURF.3 postprocesa **solo** albedo, rugosidad y alturas por clase; crea un mapa de normales tangentes a partir del campo de alturas visuales. `SystemScene` genera la textura detallada únicamente para el planeta enfocado y libera color, roughness, bump y normales al abandonar ese LOD. La ficha 3D usa `createSystemScenePlanetAppearanceV1`, por lo que ambas rutas consumen el mismo generador y seed.

## Cambios visuales
- Rocas: corredores de falla, crestas y valles visuales; relieve y sombras por normales.
- Desiertos: depósitos minerales, colinas y matices sedimentarios sin tramas repetitivas.
- Vegetación: variación de densidad de dosel respetando la paleta cromática de cada especie.
- Océanos: plataforma litoral y profundidad aparente; normales ópticas planas en agua.
- Hielo: fracturas y relieve glacial, sin modificar su cobertura.
- Volcánicos: morfologías de elevación y materiales oscuros.

## Restricciones invariantes
Sin cambios en máscaras/coberturas científicas, vegetación procedente de VIDA, velocidades, rotación, nubes, iluminación nocturna, anillos orbitales, IndexedDB o `package.json`.

## Validación ejecutada
- `node scripts/auditar-genesis-vissurf3.spec.cjs`: PASS, salida 1024x512 y 2048x1024, semillas, máscaras, normales, rugosidad, relieve, continuidad longitudinal y LOD. En la muestra sintética, acuerdo de clases entre resoluciones 99,2 %.
- `node scripts/verify-architecture.mjs`: PASS al restaurar localmente el directorio vacío de capa `observation` que no venía en el ZIP fuente (6 capas, 1.247 archivos TS de producción).
- Archivos TS nuevos/modificados sin errores de sintaxis.

## Pendiente
Pruebas Angular/Vitest, build y comparación visual real en WebGL (no disponibles aquí por falta de `node_modules`).

## Aplicación
Extraer el ZIP desde la raíz del proyecto, sobre VISSURF.2. No borrar IndexedDB. No hay migración de datos.
