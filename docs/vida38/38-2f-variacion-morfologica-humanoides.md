# GENESIS Web — 38.2f: variación morfológica procedural determinista de humanoides

**Estado:** implementada; pendiente de validación visual final y tests/build Angular del usuario.

## Alcance

Sobre el generador de geometría orgánica continua 38.2e se incorpora un **perfil morfológico tipado, versionado e inmutable** que modifica los campos SDF antes de Marching Tetrahedra. No se escala una colección de primitivas tras el renderizado. Solo se activa en el camino visual HUMANOIDS; las familias no humanoides mantienen su renderer.

### Nuevos componentes

- `vida38-humanoid-morphology-38-2f.ts`: define `Vida38HumanoidMorphologyProfileV1`, 37 canales anatómicos adimensionales, límites explícitos y la función pura `deriveVida38HumanoidMorphologyV1`.
- `vida38-humanoid-morphology-38-2f.spec.ts`: regresiones sobre estabilidad, pigmentos, diversidad geométrica real, datos VIDA, seis especies de prueba y rechazo de familias ajenas.
- `scripts/auditar-genesis-38-2f-diversidad-humanoide.spec.cjs`: auditoría Node que usa la implementación real (sin WebGL).

### Código modificado

- `vida38-humanoid-organic-field-38-2e.ts`: deriva e integra el nuevo perfil; modifica cabeza, cara, cuello, volumen torácico, abdomen, pelvis, musculatura, brazos/manos/dedos, piernas/pies y postura **en el campo implícito**. Incorpora la función `measureVida38HumanoidMeshV1`, que conserva una conversión explícita de unidades geométricas a metros VIDA.
- `vida38-humanoid-organic-material-38-2e.ts`: coloca los ojos siguiendo el perfil craneal/torso y expone `anatomyFingerprint` y `metersPerUnit` como metadatos locales del renderizador.
- `vida38-species-visual-preview-scene.ts`: identifica la reconstrucción como 38.2f en `subject.userData`.

## Derivación estable

La semilla morfológica utiliza:

- revision 38.2f y `speciesId`;
- longitud biológica de VIDA;
- hábitat y nicho;
- plan corporal, locomoción y cobertura;
- adaptaciones ordenadas canónicamente;
- linaje inteligente acreditado si existe.

**No utiliza** colores, patrón, `appearanceFingerprint`, tiempo, estado de la cámara, orden de carga ni `Math.random()`.

Los 37 canales se obtienen por hashes etiquetados e independientes; corregir uno no avanza una secuencia RNG compartida. Los factores de hábitat y locomoción son **sesgos de hipótesis artística**, no afirmaciones científicas sobre las especies. Las restricciones funcionales acotan cabezas, cuello, robustez, brazos y piernas. No se actualizan registros VIDA ni IndexedDB.

## Semántica de longitud corporal

`bodyLengthMeters` se conserva sin modificación. La malla SDF se genera en unidades normalizadas de modelado; se calcula el factor real `metersPerUnit = bodyLengthMeters / alturaGeométrica`. La cámara de la ficha puede reencuadrar el espécimen por motivos visuales; no se redefine su longitud certificada ni se modifica VIDA.T1.

## Pruebas aisladas realizadas

Con seis **identidades de prueba** (no registros de nuevas especies en el universo):

| Identidad de prueba | Anchura/altura de malla | Anchura craneal SDF | Alcance de brazos SDF |
|---|---:|---:|---:|
| Kamera ix1 | 0,410 | 0,236 | 0,550 |
| Sania on1 | 0,355 | 0,247 | 0,722 |
| Elvar um3 | 0,446 | 0,307 | 0,565 |
| Lonia aj2 | 0,427 | 0,204 | 0,650 |
| Ivar en8 | 0,431 | 0,217 | 0,543 |
| Amier or5 | 0,492 | 0,251 | 0,614 |

Las seis geometrías LOW resultaron cerradas y conexas (0 aristas frontera, 0 no-manifold, 0 inconsistentes). Se verificaron además dos identidades en MEDIUM y HIGH con los mismos resultados. Recolorear un contrato mantuvo los mismos arrays de vértices e índices.

El archivo `genesis-38-2f-comparativa-humanoides-geometria.png` se ofrece **aparte** para inspección visual neutral: 6 identidades × 5 ángulos, con material uniforme y render geométrico fuera de Angular. Es un control de silueta, **no un render WebGL/PBR ni una imagen observada**.

## Validaciones aún pendientes

1. Tests Vitest/Angular y `npx ng build` en el proyecto del usuario.
2. Inspección de seis especies VIDA reales con materiales procedurales, desde ficha y detalle.
3. Comprobación visual y rendimiento en la GPU objetivo; la comparativa neutra no sustituye el acabado final PBR.

## Criterio de aceptación

No declarar cerrada 38.2f hasta comprobar, con modelos reales del usuario y misma cámara, diferencias visibles de silueta y anatomía sin pérdida de continuidad orgánica o generación de deformidades. Mantener 38.3 pendiente.
