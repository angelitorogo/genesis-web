# PRE-33.11 — Diversidad planetaria y lunar V3

PRE33_11_V3_DIVERSITY_AUDITED

## Muestra y cobertura
| Galaxia | Sistemas | Planetas | Lunas | Detalladas | Solo identidad | Candidatos compactos | Planetas compactos | Incidencias |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Elixisis | 40 | 260 | 683 | 437 | 246 | 3 | 5 | 0 |
| **TOTAL** | **40** | **260** | **683** | **437** | **246** | **3** | **5** | **0** |

## Familias planetarias estándar
| Familia | Casos |
|---|---:|
| ROCKY | 49 |
| SUPER_EARTH | 4 |
| DESERT | 17 |
| OCEAN | 0 |
| ICE | 60 |
| VOLCANIC | 20 |
| MINI_NEPTUNE | 100 |
| GAS_GIANT | 3 |
| ICE_GIANT | 7 |

GAS_GIANT: 3/260; ICE_GIANT: 7/260. **No ajustar cuotas** sin analizar formación y sesgo de selección.

## Restricciones para el fenotipo OCEAN
El clasificador 19.4 exige planeta dominado por sólidos, con fracción heredada de hielo ≥ 0,35, íntegramente dentro de la zona radiativa y contexto térmico no meramente de referencia. Dentro HZ: 9; formación sólida/helada: 9; cumplen simultáneamente: 0. Los tipos gigantes/minineptunos y condiciones precedentes tienen prioridad. Esto NO indica océano líquido CT-0.

## Diversidad lunar
Agua 21.5 (índices): {"SURFACE_ICE":373,"NONE":14,"ICE_AND_SUBSURFACE_OCEAN":50}. Geología 21.5 (índices): {"INERT":352,"LOW_ACTIVITY":36,"TIDALLY_ACTIVE":27,"EXTREME":17,"ACTIVE":5}. Océanos CT-0 simulados 32.F.2c: {"UNRESOLVED_IN_SIMULATED_MODEL":369,"ABSENT_IN_SIMULATED_MODEL":43,"PRESENT_IN_SIMULATED_MODEL":25}. Lunas por familia anfitriona (incluye solo identidad): {"VOLCANIC":0,"ROCKY":13,"ICE":41,"MINI_NEPTUNE":389,"DESERT":0,"ICE_GIANT":90,"SUPER_EARTH":5,"GAS_GIANT":145}.

Los diagnósticos 21.5 son índices heredados, no pruebas de agua o erupciones reales; CT-0 32.F.2c corresponde a modelo simulado, no observación.

## Arquitecturas y nichos
Arquitecturas: {"SINGLE":28,"BINARY":11,"TRIPLE":1}. Topologías: {"CIRCUMSTELLAR":251,"CIRCUMBINARY":9}. Nichos: {"SOLID_BASE":150,"DEEP_ENVELOPE":110}.

## Panel independiente: anfitriones compactos
500 locators V3 examinados; 3 anfitriones detectados; 3 con planetas; 5 planetas. Tipos: {"NEUTRON_STAR":1,"PULSAR":1,"STELLAR_MASS_BLACK_HOLE":1}.

**Nunca sumar estos planetas a la demografía estándar.**

## Estratos no encontrados en esta selección
- NO_SAMPLED_OCEAN

## Límites y aceptación
- OCEAN/DESERT/VOLCANIC are formation phenotypes, not proof of ocean, dryness or eruptions. NO life inference.
- A missing sampled class is not an error and cannot justify quota changes.
- The compact-host probe is conditional ascertainment, not representative prevalence; do not merge with the 60-system denominator.
- S/P orbital geometry and Roche/Hill screening do not establish long-term N-body stability.
- No planet/moon in this audit receives a habitability or life verdict; identity-only moons stay NOT_EVALUATED.
- Count ratios are descriptive ONLY; sector/system clustering and deterministic selection prevent population-level confidence inference.

El catálogo PRE-33.10 conserva la identidad y el acceso diferido de TODAS las lunas de un sistema confirmado; PRE-33.11 no cambia generación, mundos observados, historial o persistencia.

Resultado: **PRE33_11_V3_DIVERSITY_AUDITED**. La puerta de vida efectiva sigue siendo PRE-33.13; PRE-33.12 requiere auditoría integral de rutas/caché y rendimiento.
