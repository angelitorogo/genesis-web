# PRE-33.11 — Diversidad planetaria y lunar V3

PRE33_11_V3_DIVERSITY_AUDITED

## Muestra y cobertura
| Galaxia | Sistemas | Planetas | Lunas | Detalladas | Solo identidad | Candidatos compactos | Planetas compactos | Incidencias |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ilyzenia | 20 | 143 | 431 | 235 | 196 | 1 | 0 | 0 |
| **TOTAL** | **20** | **143** | **431** | **235** | **196** | **1** | **0** | **0** |

## Familias planetarias estándar
| Familia | Casos |
|---|---:|
| ROCKY | 22 |
| SUPER_EARTH | 2 |
| DESERT | 9 |
| OCEAN | 0 |
| ICE | 29 |
| VOLCANIC | 12 |
| MINI_NEPTUNE | 59 |
| GAS_GIANT | 5 |
| ICE_GIANT | 5 |

GAS_GIANT: 5/143; ICE_GIANT: 5/143. **No ajustar cuotas** sin analizar formación y sesgo de selección.

## Restricciones para el fenotipo OCEAN
El clasificador 19.4 exige planeta dominado por sólidos, con fracción heredada de hielo ≥ 0,35, íntegramente dentro de la zona radiativa y contexto térmico no meramente de referencia. Dentro HZ: 3; formación sólida/helada: 4; cumplen simultáneamente: 0. Los tipos gigantes/minineptunos y condiciones precedentes tienen prioridad. Esto NO indica océano líquido CT-0.

## Diversidad lunar
Agua 21.5 (índices): {"SURFACE_ICE":185,"ICE_AND_SUBSURFACE_OCEAN":27,"NONE":23}. Geología 21.5 (índices): {"INERT":182,"TIDALLY_ACTIVE":10,"LOW_ACTIVITY":22,"ACTIVE":4,"EXTREME":17}. Océanos CT-0 simulados 32.F.2c: {"PRESENT_IN_SIMULATED_MODEL":13,"UNRESOLVED_IN_SIMULATED_MODEL":189,"ABSENT_IN_SIMULATED_MODEL":33}. Lunas por familia anfitriona (incluye solo identidad): {"DESERT":0,"ROCKY":5,"ICE":22,"MINI_NEPTUNE":172,"VOLCANIC":0,"ICE_GIANT":41,"GAS_GIANT":189,"SUPER_EARTH":2}.

Los diagnósticos 21.5 son índices heredados, no pruebas de agua o erupciones reales; CT-0 32.F.2c corresponde a modelo simulado, no observación.

## Arquitecturas y nichos
Arquitecturas: {"BINARY":5,"SINGLE":15}. Topologías: {"CIRCUMSTELLAR":139,"CIRCUMBINARY":4}. Nichos: {"SOLID_BASE":74,"DEEP_ENVELOPE":69}.

## Panel independiente: anfitriones compactos
500 locators V3 examinados; 1 anfitriones detectados; 0 con planetas; 0 planetas. Tipos: {"PULSAR":1}.

**Nunca sumar estos planetas a la demografía estándar.**

## Estratos no encontrados en esta selección
- NO_SAMPLED_OCEAN
- NO_SAMPLED_TRIPLE
- NO_TARGETED_COMPACT_PLANET

## Límites y aceptación
- OCEAN/DESERT/VOLCANIC are formation phenotypes, not proof of ocean, dryness or eruptions. NO life inference.
- A missing sampled class is not an error and cannot justify quota changes.
- The compact-host probe is conditional ascertainment, not representative prevalence; do not merge with the 60-system denominator.
- S/P orbital geometry and Roche/Hill screening do not establish long-term N-body stability.
- No planet/moon in this audit receives a habitability or life verdict; identity-only moons stay NOT_EVALUATED.
- Count ratios are descriptive ONLY; sector/system clustering and deterministic selection prevent population-level confidence inference.

El catálogo PRE-33.10 conserva la identidad y el acceso diferido de TODAS las lunas de un sistema confirmado; PRE-33.11 no cambia generación, mundos observados, historial o persistencia.

Resultado: **PRE33_11_V3_DIVERSITY_AUDITED**. La puerta de vida efectiva sigue siendo PRE-33.13; PRE-33.12 requiere auditoría integral de rutas/caché y rendimiento.
