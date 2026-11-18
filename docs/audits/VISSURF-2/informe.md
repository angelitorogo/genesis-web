# VISSURF.2 — Generación geográfica procedural multirresolución

## Estado
Implementación incremental preparada para validación Angular/WebGL en el proyecto del usuario.

## Problema abordado
VISSURF.1/1a aumentaban el número de píxeles, pero seguían reconstruyendo la misma geografía limitada del atlas D.4d (256×128). VISSURF.2 reemplaza **solo la reconstrucción visual** por un campo continuo de costas y materiales, derivado del atlas y de la misma semilla canónica.

## Contratos preservados
- `buildSystemScenePlanetSurfaceTextureV1` y sus máscaras científicas D.4d quedan intactas.
- Las clases de agua (1), hielo (2), vegetación (5), desierto (4) y vulcanismo (6) conservan exactamente su cuota visual de área (redondeo máximo 1 texel de destino por clase). La clase mineral (3) absorbe el resto.
- Las nubes, el shader atmosférico, las ciudades, máscaras nocturnas, la luz estelar y los datos persistidos no se modifican.
- Geografía y detalles derivan del mismo seed y de UV continuas periódicas, no de ruido por texel dependiente del LOD.
- Las costuras longitudinales de color, rugosidad, relieve y clases son exactas.
- `SystemScene` conserva un único planeta detallado próximo con sustitución y liberación de mapas; la ficha 3D usa la misma función con resolución mayor.
- Gigantes gaseosos permanecen en su pipeline anterior.

## Estrategia
1. Mapa de clasificación visual multiresolución construido con intersecciones semánticas bilineales, deformación costera en cuatro frecuencias y selección de cuotas exactas por histograma (sin ordenar millones de píxeles).
2. Recoloración específica por bioma, combinando el atlas base con microestructura visual diferenciada para agua, roca, desierto, vegetación, hielo y terrenos volcánicos.
3. Rugosidad y relieve locales correlacionados con el material. No constituyen elevaciones físicas nuevas.
4. LOD: 1024×512 para el planeta próximo de `SystemScene`, 2048×1024 para sólidos en la ficha 3D; el resto mantiene resolución existente. Nubes sin cambios.

## Validación realizada
- Auditoría portable `node scripts/auditar-genesis-vissurf2.spec.cjs`: PASS en 512, 1024 y 2048.
- Cuatro pruebas de regresión nuevas ejecutadas aisladamente: PASS (sin Angular por ausencia de dependencias instaladas).
- Sintaxis TypeScript y estructura de ZIP verificadas.
- Referencia orientativa en este entorno, generación aislada: ~0,25 s (1024×512) y ~0,96 s (2048×1024). Los tiempos dependen del equipo y no incluyen la subida de texturas a GPU.

## Pendiente
Compilación Angular, Vitest completo, auditoría de arquitectura del proyecto y validación visual en WebGL con Yamum A-4 y otros planetas representativos. No declararlos completados hasta ejecutarse en el equipo de destino.
