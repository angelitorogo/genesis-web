# GENESIS 38.8 — Informe de implementación

**Alcance:** coherencia científica y trazabilidad de representaciones procedurales.  
**Modalidad:** una única entrega incremental (sin alterar el aspecto visual).  
**Revisión nueva:** `GENESIS.38.8/code-procedural-provenance/v1`.

## 1. Base examinada

Se recuperó un diagnóstico del repositorio correspondiente a 38.7 y se superpusieron
los archivos pertinentes de las últimas entregas: 38.7x, VISCATM.1c, VISCORB.1b,
LODGRP.1, LODGRP.2, MOONCAD.1 y ARCHHOME.1. Esto permite contrastar la implementación
contra código existente, no contra un proyecto inventado. **No es una copia
verificada del árbol local del destinatario**: los archivos incrementales deben
aplicarse sobre la versión compatible de su repositorio, después de disponer de
una copia de seguridad o control de versiones.

Contratos ya existentes:

- `vida38-species-visual-contract.ts` (38.1): identidad, fenotipo, semilla,
  `appearanceFingerprint` y procedencia `SCIENTIFIC_PROCEDURAL_RECONSTRUCTION`.
- `vida38-ficha-conocimiento-38-5.ts` (38.5): autorizador explícito de sistemas
  `CONFIRMED` y `FULL_SYSTEM_REVEAL_ON_CONFIRMED`.
- `system-scene-civilization-visuals.ts` (38.7/38.7x): supresión de biología
  visual en escenas sin confirmación; separación de lunas y planetas.
- `vida38-infrastructure-plan-38-6.ts`: diferenciación canónica entre
  `VIDA7_NATIVE_SETTLEMENT` y `VIDA8_COLONIAL_SETTLEMENT`.
- `ScientificBodyPreviewModel`, `SystemSceneSnapshot`: proyecciones ya elaboradas
  a partir de fuentes científicas, sin necesidad de generación de fotografías.

## 2. Carencia resuelta

Los renderizadores ya compartían fuentes, identidad y aspecto, pero no disponían de
una taxonomía **ligera, uniforme y consultable** que documentara cuáles son los
campos canónicos, las proyecciones y los detalles de renderizador para cada familia.
La fase no modifica esos campos: introduce una traza diagnóstica de procedencia.

## 3. Cambios realizados

| Archivo | Cambio |
|---|---|
| `src/app/presentation/visual-provenance/genesis-visual-provenance-38-8.ts` | Contrato estático, congelado y tipado, para diez familias; traza pura y comprobación opcional de solapamiento canónico |
| `src/app/presentation/system/system-scene.ts` | Traza de escena en `scene.userData` al renderizar un nuevo snapshot, no por fotograma |
| `src/app/presentation/scientific-body-preview/scientific-body-preview.ts` | Traza del tipo de cuerpo en el grupo raíz del visor de fichas |
| `src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts` | Traza de especie y, únicamente si VIDA ya declara nivel de civilización, procedencia civilizatoria |
| `src/app/presentation/infrastructure/vida38-infrastructure-render-38-6.ts` | Trazas diagnósticas de planes existentes, diferenciando VIDA.7 nativa y VIDA.8 colonial |
| `src/app/presentation/visual-provenance/genesis-visual-provenance-38-8.spec.ts` | Tests unitarios, determinismo y referencias TypeScript a contratos reales |
| `scripts/auditar-genesis-38-8.spec.cjs` | Auditor portable sin dependencias adicionales |

Los cambios de trazabilidad solo se guardan en los objetos Three.js (`userData`).
**No se persisten en IndexedDB, no modifican rutas, no sustituyen los contratos de VIDA
ni se muestran como nuevas pantallas o avisos.**

## 4. Cobertura

Estrellas, planetas, lunas, asteroides, cometas, objetos transneptunianos,
objetos extrasolares capturados, especies, civilizaciones e infraestructura
colonial. Archivo GENESIS conserva su política de revelación existente sin
modificación funcional: esta fase no clasifica sus entradas como imágenes.

Los arrays del registro son **clasificación documental de campos de procedencia**,
no validadores físicos ni una nueva fuente canónica. Los detalles que la VIDA
científica define tienen siempre prioridad frente a acabados gráficos.

## 5. Confirmación y protección de información

- La fuente de información sigue siendo VIDA o el dominio científico.
- El permiso de visualización sigue siendo 38.5/38.7/38.7x y el descubrimiento
  vigente. 38.8 no concede ni revoca permisos.
- Una civilización de un sistema `CONFIRMED` conserva acceso a todo lo autorizado
  por el sistema existente; no exige imágenes de telescopio ni pruebas adicionales.
- El contrato nuevo nunca consulta Ground Truth y no deriva tier civilizatorio
  a partir de la apariencia, tecnología simulada ni tecnofirmas.
- Las rutas para sistemas no confirmados siguen idénticas: la traza no es una
  nueva barrera ni una forma de publicar información privada.

## 6. Integridad visual y rendimiento

Comparación con los correspondientes archivos de referencia recuperados:

| Archivo modificado | Líneas previas eliminadas | Líneas añadidas |
|---|---:|---:|
| `system-scene.ts` | 0 | 4 |
| `scientific-body-preview.ts` | 0 | 12 |
| `vida38-species-visual-preview-scene.ts` | 0 | 11 |
| `vida38-infrastructure-render-38-6.ts` | 0 | 9 |

No se han tocado shaders, materiales, geometrías, iluminación, paletas,
parámetros orbitales ni bucles de animación. La traza se crea una vez por
construcción de la correspondiente escena/modelo o por reconstrucción de snapshot;
las enumeraciones de infraestructura recorren únicamente los planes ya
facilitados por el autorizador existente.

## 7. Validación realmente ejecutada

1. `node scripts/auditar-genesis-38-8.spec.cjs`: **OK**, 23 comprobaciones
   estáticas de cobertura, integración y preservación de contratos existentes.
2. `tsc --target ES2022 --module commonjs --strict --skipLibCheck ...`
   sobre el contrato puro nuevo: **OK**, sin errores de tipos.
3. Ejecución aislada Node del módulo transpilado, diez familias, ausencia de
   duplicados y consistencia determinista: **OK**.
4. Análisis sintáctico/transpilación individual con el compilador TypeScript
   disponible de los cuatro archivos de integración y los dos archivos nuevos:
   **OK**, sin errores de sintaxis.
5. Comparación `diff` con las cuatro versiones anteriores relevantes:
   **OK**, cero líneas existentes suprimidas.

**No ejecutado:** Angular/Vitest, `npm run test:architecture`,
`npm run test:unit:coverage`, `npm run test:worker`,
`npm run test:e2e:typecheck`, `npx ng build` y Playwright.
La copia recuperada no incluye dependencias instaladas y npm no pudo acceder
al registro (error `EAI_AGAIN`). No se atribuyen resultados positivos
ficticios a esas pruebas.

## 8. Validación local recomendada (PowerShell, raíz del proyecto)

```powershell
Expand-Archive -Path .\genesis-38-8-coherencia-trazabilidad-procedural-INCREMENTAL.zip -DestinationPath . -Force
node scripts/auditar-genesis-38-8.spec.cjs
npx ng test --watch=false --include=src/app/presentation/visual-provenance/genesis-visual-provenance-38-8.spec.ts
npx ng test --watch=false --include=src/app/presentation/life-species-detail/vida38-ficha-conocimiento-38-5.spec.ts --include=src/app/presentation/system/system-scene-civilization-visuals.spec.ts
npm run test:architecture
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```

No se añaden scripts PowerShell ni modificaciones a `package.json`.

## 9. Limitaciones declaradas

- La clasificación de procedencia es documental y no sustituye una auditoría
  científica detallada del algoritmo de cada shader/renderizador.
- `SystemScene` conserva un resumen de procedencia en su raíz y no crea una
  traza por cada vértice o instancia; esto es deliberado por rendimiento.
- Las pruebas integradas y el build deben ejecutarse en el repositorio local
  actualizado del usuario para considerar 38.8 **cerrada sin reservas**.
- No se introduce ningún sistema de «imagen observada» ni se propone otro
  mecanismo de revelación de civilizaciones.
