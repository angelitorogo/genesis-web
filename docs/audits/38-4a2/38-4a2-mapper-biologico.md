# GENESIS 38.4a2 — Trazabilidad del mapper biológico

**Estado:** SIN_DEPENDENCIA_ESPACIAL_DIRECTA

**Archivo:** `src/app/presentation/life-species-visual/vida38-species-visual-contract.ts`

## Semilla 1 · línea 182
- Estado: SIN_DEPENDENCIA_ESPACIAL_DIRECTA
- `variantSeedUint32: hash32(identity)`
- Construcción de identidad (línea 168): ``VIDA.38.1|${species.id}``
- Dependencias espaciales: ninguna directa detectada
- Símbolos sin resolver: ninguno identificado

### Dependencias locales
- Línea 152 · `species = matches[0]!`
- Línea 150 · `matches = confirmedRecord.ecosystem.species.filter(species => species.id === speciesId)`

## Funciones exportadas que pueden construir el contrato
- vida38SpeciesVisualContractFromConfirmedV1 (línea 137): confirmedRecord: Vida38ConfirmedBiologySource | null, speciesId: string

## Limitaciones
- No prueba por sí mismo la estabilidad de species.id (puede codificar origen espacial) ni la semántica de funciones importadas.
- No equivale a backup/restore de IndexedDB.
- Las diferencias biológicas deben verificarse mediante tests productivos con fixtures VIDA reales.

## Estado de cierre
Este análisis es estructural. No cerrar 38.4 sin pruebas de mapper ejecutado y restauración real.
