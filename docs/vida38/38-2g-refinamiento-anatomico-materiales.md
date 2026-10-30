# GENESIS — Fase 38.2g · Refinamiento anatómico y materiales biológicos humanoides

**Estado:** Implementación incremental, pendiente de aceptación visual en Angular/WebGL.
**Base:** 38.1 (contrato) + 38.2e (malla SDF continua) + 38.2f (variación anatómica).

## 1. Objetivos y alcance

El paquete reemplaza la pigmentación de manchas discretas interpoladas entre vértices por un modelo procedural en shader; también mejora la integración anatómica y facial **antes de extraer la isosuperficie SDF**. Se limita a humanoides; las demás familias 38.2 permanecen intactas. No modifica VIDA.6–9, VIDA.T1, IndexedDB ni los renderizadores de mundos.

## 2. Integración craneofacial

En `vida38-humanoid-organic-field-38-2e.ts`:

- Variantes deterministas de pómulos, mentón, anchura labial, puente nasal y arco orbital, independientes de pigmentación.
- Párpados superiores/inferiores fusionados en la misma isosuperficie; cavidades orbitales reformadas y labios integrados en el SDF.
- Mejora del volumen nasolabial y de la proyección de la mandíbula.
- `createVida38HumanoidOcularDetailsV1` elimina las tres esferas superpuestas de cada ojo (globo, iris, pupila). Cada ojo se representa con una única esfera hundida y con **iris, pupila y limbo** distribuidos sobre su propia superficie mediante colores de vértice del ojo (no de la piel).
- Lo que no se desprende del contrato sigue siendo una hipótesis artística procedural, no un rasgo observado.

## 3. Anatomía, manos, pies y postura

Se mejoran las transiciones de hombros, bíceps, antebrazos, cuádriceps, gemelos y tendón de Aquiles con volúmenes de SDF unidos suavemente. La orientación de codos y muñecas ya no describe una línea completamente recta. Se añaden dos canales deterministas, `stanceBias` y `shoulderTilt`, para una postura más natural, manteniendo el contacto de los pies con el suelo, el plan corporal bípedo y la escala corporal VIDA.

La geometría principal sigue siendo una malla única, no se vuelven a introducir muñones articulados ni objetos separados para el cuerpo. Los ojos continúan siendo órganos independientes, como corresponde.

## 4. Materiales biológicos

En `vida38-humanoid-organic-material-38-2e.ts`:

- Material PBR Three.js (`MeshPhysicalMaterial`) con shader `onBeforeCompile`.
- Los pigmentos principal y secundario proceden del contrato 38.1.
- El patrón de pigmentación se calcula **por fragmento en espacio tridimensional local** (fBm + Worley), evitando grandes polígonos coloreados y costuras UV.
- `BANDS`, `SPOTS`, `MOTTLED` y `SOLID` son transiciones suaves, no manchas esféricas adheridas a la malla.
- Microrelieve mediante perturbación de normales con derivadas de pantalla. Cubre piel coriácea, escamas, pelaje, plumas y membrana; lo que no se conoce se representa como reconstrucción.
- Rugosidad variable por fragmento y especular orgánico discreto; metalness=0.
- Semilla de apariencia estable, sin aleatoriedad temporal. La morfología no depende de pigmentos.

La implementación evita introducir texturas externas o nuevas dependencias. **El código del shader está incluido, pero no se ha podido probar su compilación WebGL en este entorno.** El build Angular tampoco ha podido ejecutarse aquí al faltar las dependencias del proyecto.

## 5. Regresión y criterios

Auditor portable: `scripts/auditar-genesis-38-2g-refinamiento-organico.spec.cjs`.

Test Vitest: `src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2g.spec.ts`.

Verifica:

1. Determinismo y morfología independiente de los colores.
2. Que los rasgos faciales sí modifican el campo SDF.
3. Topología cerrada, conectada y con normales/índices válidos para seis identidades.
4. Longitud corporal VIDA intacta.
5. Configuración del shader por fragmento, rugosidad y microrelieve.
6. Dos ojos integrados —no seis esferas superpuestas— con color propio.

**Verificación visual en tu equipo:** revisar Kamera ix1, Sania on1 y al menos otro humanoide a distancias de retrato y cuerpo completo, de frente, tres cuartos, lateral y posterior. Comprobar ojos sin protrusión excesiva, transiciones de pigmentos, relieves de piel, pose, manos y pies. Dejar abierto 38.2g hasta esa validación.

## 6. Instalación

ZIP situado en la raíz del proyecto:

```powershell
Expand-Archive -Path .\genesis-38-2g-refinamiento-anatomico-materiales-INCREMENTAL.zip -DestinationPath . -Force

node scripts/auditar-genesis-38-2g-refinamiento-organico.spec.cjs

npx ng test --watch=false `
  --include="src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2g.spec.ts" `
  --include="src/app/presentation/life-species-visual/vida38-humanoid-organic-field-38-2e.spec.ts" `
  --include="src/app/presentation/life-species-visual/vida38-humanoid-morphology-38-2f.spec.ts" `
  --include="src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.spec.ts"

npx ng build
```
