# PRE-33.10 — Lunas de solo identidad y caracterización bajo demanda V3

PRE33_10_V3_DEFERRED_MOON_COVERAGE_AUDITED

| Galaxia | Sistemas | Planetas | Lunas | Detalladas | Solo identidad | Errores |
|---|---:|---:|---:|---:|---:|---:|
| Elixisis | 20 | 144 | 516 | 294 | 222 | 0 |
| Elisoune | 20 | 106 | 201 | 170 | 31 | 0 |
| Ilyzenia | 20 | 143 | 431 | 235 | 196 | 0 |

**Contrato de evidencia:** una luna de solo identidad es una luna conocida al confirmar el sistema, pero la composición, el solvente, la dosis, la habitabilidad y la vida no están resueltas. El generador de minor moons solo calcula cotas dinámicas condicionales al solicitar la ficha; no materializa en bloque las 342 minor moons del muestreo inicial de 2026-10-20.

**Persistencia:** el catálogo es un read-model derivado, versionado por conocimiento+contrato; las fichas diferidas se recalculan del MoonSeed canónico y la época sin mutar V1/V2 ni escribir físicas inventadas en IndexedDB. La caché de memoria es LRU de 96 entradas, liberable.

**Criterio biológico:** vida = NOT_EVALUATED para minor moons sin fuentes; no excluir permanentemente por ordinal o masa.

**Límite:** el diagnóstico de dominio orbital no es una órbita ni un interior individual resuelto; PRE-33.12 comprobará la propagación integral por UI/cachés y rendimiento final.
