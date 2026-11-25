# GENESIS 38.bis-T7a — Reparación integral de regresiones T3/T7

## Incidencia

Tras aplicar T7, Angular reporta TS2339 por desaparición de `ensureSort38BisT3` en `GenesisUniversalArchiveIndex38Bis`, consumido en la fachada (dos llamadas) y en el indexador automático B6 (una llamada). La comparación de artefactos T3 (2026-11-20), T3a (2026-11-20) y T7 (2026-11-22) confirma la sustitución por archivos anteriores a T3, no una falta de importación.

## Reparación combinada, sin rollback de T7

1. Restaurar la **implementación completa y efectiva**, deduplicada por ámbito/galaxia/categoría/campo, de `ensureSort38BisT3`, incluyendo su proyección `galaxy` y enriquecimiento biológico previo al índice de ordenación.
2. Restaurar `life`, `colonies`, `civilization` de planetas y `life`, `colonies` de lunas, junto con `galaxy` en ambas categorías, manteniendo el orden numérico antes de paginar.
3. Recuperar la validación de civilización nativa en la proyección de detalle y la huella/revisión VIDA.9 **solo de sistemas confirmados** para las ordenaciones biológicas planetarias y lunares. Registros privados no confirmados no participan en dicha revisión pública.
4. Recuperar las tarjetas planetarias con «Civilización» y el valor «Sin determinar» cuando no hay evidencia evaluable.
5. Recuperar en el HTML el seguimiento del índice de ordenaciones vigentes, obsoletas y actualizaciones pendientes, y las etiquetas de dirección binarias de T3a.
6. Mantener **las tres ordenaciones T7 por población**, calculadas mediante punto medio de intervalos de colonias VIDA.8, con visualización del intervalo total/individual y «No evaluable» si no es válido. Se mantiene la cache por galaxia/revisión, el aislamiento de `population-t7-v1` en categorías coloniales, y la política `CONFIRMED`.
7. Actualizar la auditoría portátil T7: esta esperaba erróneamente que la fachada invocase `store.ensureSortField()` directamente, pero desde T3 utiliza `index.ensureSort38BisT3()`. La auditoría ahora valida ambos extremos reales del flujo.

## Archivos de producción

- `genesis-universal-archive-38-bis.index.ts`
- `genesis-universal-archive-sort-38-bis-b3.ts`
- `genesis-universal-archive-list-layout-38-bis-b1.ts`
- `genesis-archive.html`

## Pruebas incluidas

- Auditoría portátil original T7 **actualizada**, 69 comprobaciones: **PASS** en entorno de reconstrucción de las versiones T3/T3a/T3b + T7 + T7a.
- Auditoría específica T7a, 55 comprobaciones: **PASS**. Transpila el método real extraído del AST y comprueba deduplicación, emisión del índice ordenado, población sin parseos ficticios, biología y galaxia. Comprueba restauraciones en HTML, opciones de ordenación y límites de la huella confirmada.
- Nuevo Vitest `genesis-universal-archive-regressions-38bis-t7a.spec.ts` con 5 pruebas para ejecutar sobre el proyecto real.

**Limitaciones del entorno de preparación:** no contiene el árbol completo de `genesis-web`, las dependencias Angular ni su IndexedDB de ejecución. Por ello, `ng build`, Vitest con la configuración real y E2E siguen pendientes de ejecutarse en el equipo de desarrollo. La auditoría portátil no sustituye esos pasos.

## Alcance excluido

- No se edita `package.json` ni se añaden scripts PowerShell.
- No se modifican VIDA.8, VIDA.9, la generación, las colonias o sus datos de origen.
- No hay cambios de esquema en IndexedDB ni se solicita borrar el conocimiento guardado.
- No modifica categorías ajenas al Archivo GENESIS ni los laboratorios COLVIS.
