# GENESIS — 38.2k: insectos orgánicos y diversidad morfológica

## Fuente y límites científicos

Esta subfase consume únicamente el contrato **38.1** elaborado a partir de una especie VIDA.6/9 de un sistema confirmado CT-0. El perfil `Vida38InsectMorphology38K` **NO** escribe en IndexedDB, no crea especies ni poblaciones, no atribuye inteligencia/civilización y no se presenta como una observación científica.

Los rasgos no determinados por VIDA (número de ocelos, forma exacta de ojos, mandíbula, alas y antenas) son **hipótesis artísticas procedurales**, condicionadas por las propiedades reales del contrato. La etiqueta de reconstrucción 38.2 permanece en pantalla.

## Arquitectura

- `vida38-insect-morphology-38-2k.ts`: perfil inmutable, versionado, diez arquetipos y canales de semilla independientes de la pigmentación.
- `vida38-insect-organic-field-38-2k.ts`: campo SDF continuo (cabeza, tórax, abdomen, patas y apoyos) y extracción de triángulos indexados mediante marching tetrahedra. Audita conectividad, bordes y orientación.
- `vida38-insect-materials-38-2k.ts`: quitina PBR opaca; pigmentación local, bandas/placas, ruido suave antialias con `fwidth`, roughness y clearcoat discretos. No contiene coordenadas de pantalla ni tiempo.
- `vida38-insect-preview-38-2k.ts`: eyes compuestos, ocelli opcionales, antenas curvas/clavadas/plumosas, piezas bucales, alas membranosas con nervaduras o élitros rígidos. Pelillos cortos instanciados según densidad y LOD. Caché de tres mallas CPU y recursos Three.js de vida limitada.
- `vida38-species-visual-preview-scene.ts`: ruta exclusiva `INSECTS`, con encuadre automático y posición basal preservada durante la animación. Las demás familias no cambian de generador.

## Familias morfológicas

Diez referencias: escarabajo, mantis, hormiga, avispa, libélula, saltador, cigarra, cucaracha, insecto palo y larviforme. Son familias de **parámetros**, no modelos prefabricados. La semilla de especie introduce variación adicional dentro de cada familia.

Se respetan los pares de apéndices que comunica VIDA (sin imponer seis patas a las especies que no los tengan). Las alas se condicionan a locomoción `FLYING` o plan corporal `WINGED`; su número y el estilo se diversifican entre cero, uno y dos pares. Los tamaños VIDA se conservan como datos científicos, aunque el encuadre 38.2 normaliza dimensiones visuales para facilitar inspección.

## Validación CPU realizada

Auditoría reproducible `node scripts/auditar-genesis-38-2k-insectos.spec.cjs`:

- 250 identidades: diez arquetipos representados, mismo ID → mismo perfil.
- Diez mallas LOW: una componente principal, sin bordes abiertos, sin aristas no manifold, sin aristas de orientación inconsistente.
- Pruebas adicionales de 3, 4 y 6 pares, incluida una mantis HIGH.
- Selección alar coherente con locomoción y plan corporal; cambio solo cromático no altera anatomía.
- Módulos puros de morfología y SDF: comprobación TypeScript estricta con tipado mínimo equivalente al contrato.

**Pendiente:** ejecutar Vitest/Angular en el proyecto real y verificar render WebGL: materiales, ojos, antenas, alas y legibilidad de las patas durante movimiento/zoom. La galería adjunta muestra *solo mallas SDF sin accesorios ópticos ni membranas*, no implica aceptación visual.

## Seguridad de integración

No se modifica VIDA.6–9, VIDA.T1, IndexedDB, los demás generadores o los renderizadores científicos planetarios. No se incluyen scripts PowerShell ni cambios de package.json.

## Aceptación visual

Inspeccionar insectos alados/ápteros, pequeños/grandes, depredadores y especialistas saltadores. Revisar siluetas en perfil y dorsal, articulaciones, legibilidad de ojos, materiales sin shimmering y recursos liberados al navegar repetidamente. No cerrar sin confirmación del usuario.
