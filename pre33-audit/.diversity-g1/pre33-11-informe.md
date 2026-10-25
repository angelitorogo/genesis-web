# PRE-33.11 — Diversidad planetaria y lunar V3

PRE33_11_V3_DIVERSITY_AUDITED

## Muestra y cobertura
| Galaxia | Sistemas | Planetas | Lunas | Detalladas | Solo identidad | Candidatos compactos | Planetas compactos | Incidencias |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Elisoune | 40 | 231 | 549 | 414 | 135 | 3 | 2 | 0 |
| **TOTAL** | **40** | **231** | **549** | **414** | **135** | **3** | **2** | **0** |

## Familias planetarias estándar
| Familia | Casos |
|---|---:|
| ROCKY | 26 |
| SUPER_EARTH | 2 |
| DESERT | 19 |
| OCEAN | 0 |
| ICE | 62 |
| VOLCANIC | 22 |
| MINI_NEPTUNE | 92 |
| GAS_GIANT | 0 |
| ICE_GIANT | 8 |

GAS_GIANT: 0/231; ICE_GIANT: 8/231. **No ajustar cuotas** sin analizar formación y sesgo de selección.

## Restricciones para el fenotipo OCEAN
El clasificador 19.4 exige planeta dominado por sólidos, con fracción heredada de hielo ≥ 0,35, íntegramente dentro de la zona radiativa y contexto térmico no meramente de referencia. Dentro HZ: 9; formación sólida/helada: 8; cumplen simultáneamente: 0. Los tipos gigantes/minineptunos y condiciones precedentes tienen prioridad. Esto NO indica océano líquido CT-0.

## Diversidad lunar
Agua 21.5 (índices): {"SURFACE_ICE":360,"NONE":5,"ICE_AND_SUBSURFACE_OCEAN":49}. Geología 21.5 (índices): {"INERT":334,"LOW_ACTIVITY":40,"TIDALLY_ACTIVE":20,"EXTREME":16,"ACTIVE":4}. Océanos CT-0 simulados 32.F.2c: {"UNRESOLVED_IN_SIMULATED_MODEL":365,"PRESENT_IN_SIMULATED_MODEL":9,"ABSENT_IN_SIMULATED_MODEL":40}. Lunas por familia anfitriona (incluye solo identidad): {"VOLCANIC":0,"ICE":49,"DESERT":1,"ROCKY":7,"MINI_NEPTUNE":371,"ICE_GIANT":121,"SUPER_EARTH":0}.

Los diagnósticos 21.5 son índices heredados, no pruebas de agua o erupciones reales; CT-0 32.F.2c corresponde a modelo simulado, no observación.

## Arquitecturas y nichos
Arquitecturas: {"TRIPLE":2,"SINGLE":36,"BINARY":2}. Topologías: {"CIRCUMSTELLAR":228,"CIRCUMBINARY":3}. Nichos: {"SOLID_BASE":131,"DEEP_ENVELOPE":100}.

## Panel independiente: anfitriones compactos
500 locators V3 examinados; 3 anfitriones detectados; 1 con planetas; 2 planetas. Tipos: {"PULSAR":2,"STELLAR_MASS_BLACK_HOLE":1}.

**Nunca sumar estos planetas a la demografía estándar.**

## Estratos no encontrados en esta selección
- NO_SAMPLED_OCEAN
- NO_SAMPLED_GAS_GIANT

## Límites y aceptación
- OCEAN/DESERT/VOLCANIC are formation phenotypes, not proof of ocean, dryness or eruptions. NO life inference.
- A missing sampled class is not an error and cannot justify quota changes.
- The compact-host probe is conditional ascertainment, not representative prevalence; do not merge with the 60-system denominator.
- S/P orbital geometry and Roche/Hill screening do not establish long-term N-body stability.
- No planet/moon in this audit receives a habitability or life verdict; identity-only moons stay NOT_EVALUATED.
- Count ratios are descriptive ONLY; sector/system clustering and deterministic selection prevent population-level confidence inference.

El catálogo PRE-33.10 conserva la identidad y el acceso diferido de TODAS las lunas de un sistema confirmado; PRE-33.11 no cambia generación, mundos observados, historial o persistencia.

Resultado: **PRE33_11_V3_DIVERSITY_AUDITED**. La puerta de vida efectiva sigue siendo PRE-33.13; PRE-33.12 requiere auditoría integral de rutas/caché y rendimiento.
