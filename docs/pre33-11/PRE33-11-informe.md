# PRE-33.11 — Diversidad planetaria y lunar V3

PRE33_11_V3_DIVERSITY_AUDITED

## Muestra y cobertura
| Galaxia | Sistemas | Planetas | Lunas | Detalladas | Solo identidad | Candidatos compactos | Planetas compactos | Incidencias |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Elixisis | 20 | 144 | 516 | 294 | 222 | 3 | 5 | 0 |
| Elisoune | 20 | 106 | 201 | 170 | 31 | 3 | 2 | 0 |
| Ilyzenia | 20 | 143 | 431 | 235 | 196 | 1 | 0 | 0 |
| **TOTAL** | **60** | **393** | **1148** | **699** | **449** | **7** | **7** | **0** |

## Familias planetarias estándar
| Familia | Casos |
|---|---:|
| ROCKY | 65 |
| SUPER_EARTH | 6 |
| DESERT | 26 |
| OCEAN | 0 |
| ICE | 82 |
| VOLCANIC | 32 |
| MINI_NEPTUNE | 161 |
| GAS_GIANT | 8 |
| ICE_GIANT | 13 |

GAS_GIANT: 8/393; ICE_GIANT: 13/393. **No ajustar cuotas** sin analizar formación y sesgo de selección.

## Restricciones para el fenotipo OCEAN
El clasificador 19.4 exige planeta dominado por sólidos, con fracción heredada de hielo ≥ 0,35, íntegramente dentro de la zona radiativa y contexto térmico no meramente de referencia. Dentro HZ: 11; formación sólida/helada: 16; cumplen simultáneamente: 0. Los tipos gigantes/minineptunos y condiciones precedentes tienen prioridad. Esto NO indica océano líquido CT-0.

## Diversidad lunar
Agua 21.5 (índices): {"SURFACE_ICE":577,"NONE":40,"ICE_AND_SUBSURFACE_OCEAN":82}. Geología 21.5 (índices): {"INERT":554,"LOW_ACTIVITY":59,"TIDALLY_ACTIVE":37,"EXTREME":39,"ACTIVE":10}. Océanos CT-0 simulados 32.F.2c: {"UNRESOLVED_IN_SIMULATED_MODEL":564,"ABSENT_IN_SIMULATED_MODEL":92,"PRESENT_IN_SIMULATED_MODEL":43}. Lunas por familia anfitriona (incluye solo identidad): {"VOLCANIC":0,"ROCKY":20,"ICE":61,"MINI_NEPTUNE":588,"DESERT":0,"ICE_GIANT":138,"SUPER_EARTH":7,"GAS_GIANT":334}.

Los diagnósticos 21.5 son índices heredados, no pruebas de agua o erupciones reales; CT-0 32.F.2c corresponde a modelo simulado, no observación.

## Arquitecturas y nichos
Arquitecturas: {"SINGLE":46,"BINARY":13,"TRIPLE":1}. Topologías: {"CIRCUMSTELLAR":380,"CIRCUMBINARY":13}. Nichos: {"SOLID_BASE":211,"DEEP_ENVELOPE":182}.

## Panel independiente: anfitriones compactos
1500 locators V3 examinados; 7 anfitriones detectados; 4 con planetas; 7 planetas. Tipos: {"NEUTRON_STAR":1,"PULSAR":4,"STELLAR_MASS_BLACK_HOLE":2}.

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
