# Fase 38.1 — Contrato visual por especie (VIDA.6/7/9)

## Objetivo y estado

Esta entrega **no dibuja** especies todavía. Introduce un contrato de solo lectura,
tipado, versionado y determinista para los futuros renderizadores 38.2 y 38.3.
La ficha existente de VIDA.9c lo consume a partir de un registro **confirmado**
sin generar ni consultar nueva biología. No altera VIDA.6–8, IndexedDB,
los planetas ni las escenas 3D físicas aprobadas.

## Origen de los campos

| Contrato | Origen exclusivo |
| --- | --- |
| `speciesId`, `speciesName` | `Vida6Species.id`, `proceduralName` |
| `morphology.group` | `Vida6Species.group` |
| `morphology.bodyPlan`, `covering`, `appendagePairs` | `Vida6Species.phenotype` |
| `ecology.habitat`, `nutrition`, `niche` | `Vida6Species` |
| `locomotion` | `Vida6Species.phenotype.locomotion` |
| `bodyLengthMeters` | `Vida6Species.phenotype.bodyLengthMeters`, **exacto** |
| `pigmentation` (colores RGB, patrón, bioluminiscencia) | `Vida6Species.phenotype` |
| `adaptations` | `Vida6Species.adaptations`, sin traducir ni inferir |
| `intelligence` (linaje, nivel) | Solo cuando el `speciesId` coincide con VIDA.7 |
| `provenance` | Registro VIDA.9 CT-0 confirmado y digest VIDA.6 |
| `variantSeedUint32` | Hash estable del ID biológico y revisión del contrato |
| `appearanceFingerprint` | Huella de los datos de apariencia; para invalidar cachés |

La longitud se conserva con toda su precisión: tanto especies microscópicas
como árboles y fundadores tecnológicos calibrados por VIDA.T1. No hay redondeos,
cuotas de población, anatomías inventadas ni cambios biológicos por usar la vista.

## Contrato público

Ruta:

`src/app/presentation/life-species-visual/vida38-species-visual-contract.ts`

API:

`vida38SpeciesVisualContractFromConfirmedV1(confirmedRecord, speciesId)`

Devuelve `Vida38SpeciesVisualContract | null`.

Casos `null`: sin registro confirmado, especie no incluida, revisión incompatible,
CT-0 incorrecto, discrepancia de `bodyStorageKey` o digest VIDA.6/7,
pigmento o tamaño inválido, o fundador civilizado incoherente. La función no
busca especies privadas ni genera otras para rellenar huecos.

**Límite de conocimiento:** solo se invoca desde la ficha de especie ya
restringida a un sistema confirmado. Un registro privado NO debe pasarse a
este adaptador. La etiqueta `SCIENTIFIC_PROCEDURAL_RECONSTRUCTION` deja claro
que no es una fotografía ni una observación instrumental.

## Determinismo e identidad

- El `speciesId` original permanece inalterado.
- La variante visual usa una semilla local estable calculada del ID, sin tocar
  el PRNG de VIDA.6–9.
- La huella cambia si cambia un fenotipo fuente, evitando reusar un render
  antiguo para una nueva versión incompatible.
- Las estructuras anidadas son inmutables y serializables. No se guarda nada
  en IndexedDB ni se añade una revisión de Ground Truth.

## Ficha VIDA.9c

Se incorpora únicamente una nota de preparación bajo *Características físicas
y aspecto* con la huella del contrato y el aviso de que no es una imagen
observada. No se añaden modelos 3D de prueba ni galerías prematuras.

## Pruebas

`node scripts/auditar-genesis-38-1-contrato-visual.spec.cjs`

`npx ng test --watch=false --include="src/app/presentation/life-species-visual/vida38-species-visual-contract.spec.ts"`

`npx ng build`

La prueba incluye los ocho grupos biológicos de VIDA.4, fenotipos y tamaños
de los ejemplos aportados, fundador reptiliano muy avanzado, especie inteligente
sin civilización, identidad estable, huellas, acceso al registro e integridad.

## Enlace con 38.2–38.9

- 38.2: construir geometrías para microorganismos, hongos, plantas y animales
  desde `morphology`/`pigmentation`/`bodyLengthMeters`, sin nuevas especies.
- 38.3: añadir morfología de linajes inteligentes únicamente cuando
  `intelligence !== null`, sin fijar una silueta humanoide genérica.
- 38.4: usar `speciesId + appearanceFingerprint` para caché; seed ligada al ID.
- 38.5: ampliar fichas con catálogo visual y cultura ya existente.
- 38.7–38.8: conservar la separación entre conocimiento confirmado,
  reconstrucción visual e imagen realmente observada.
