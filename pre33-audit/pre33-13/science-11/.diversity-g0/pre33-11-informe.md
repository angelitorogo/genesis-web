# PRE-33.11 — Diversidad planetaria y lunar V3

PRE33_11_V3_DIVERSITY_AUDITED

## Muestra y cobertura
| Galaxia | Sistemas | Planetas | Lunas | Detalladas | Solo identidad | Candidatos compactos | Planetas compactos | Incidencias |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Elixisis | 20 | 144 | 516 | 294 | 222 | 3 | 5 | 0 |
| **TOTAL** | **20** | **144** | **516** | **294** | **222** | **3** | **5** | **0** |

## Familias planetarias estándar
| Familia | Casos |
|---|---:|
| ROCKY | 28 |
| SUPER_EARTH | 3 |
| DESERT | 11 |
| OCEAN | 0 |
| ICE | 22 |
| VOLCANIC | 8 |
| MINI_NEPTUNE | 63 |
| GAS_GIANT | 3 |
| ICE_GIANT | 6 |

GAS_GIANT: 3/144; ICE_GIANT: 6/144. **No ajustar cuotas** sin analizar formación y sesgo de selección.

## Restricciones para el fenotipo OCEAN
El clasificador 19.4 exige planeta dominado por sólidos, con fracción heredada de hielo ≥ 0,35, íntegramente dentro de la zona radiativa y contexto térmico no meramente de referencia. Dentro HZ: 5; formación sólida/helada: 5; cumplen simultáneamente: 0. Los tipos gigantes/minineptunos y condiciones precedentes tienen prioridad. Esto NO indica océano líquido CT-0.

## Diversidad lunar
Agua 21.5 (índices): {"SURFACE_ICE":244,"NONE":13,"ICE_AND_SUBSURFACE_OCEAN":37}. Geología 21.5 (índices): {"INERT":232,"LOW_ACTIVITY":23,"TIDALLY_ACTIVE":19,"EXTREME":15,"ACTIVE":5}. Océanos CT-0 simulados 32.F.2c: {"UNRESOLVED_IN_SIMULATED_MODEL":236,"ABSENT_IN_SIMULATED_MODEL":36,"PRESENT_IN_SIMULATED_MODEL":22}. Lunas por familia anfitriona (incluye solo identidad): {"VOLCANIC":0,"ROCKY":9,"ICE":15,"MINI_NEPTUNE":261,"DESERT":0,"ICE_GIANT":81,"SUPER_EARTH":5,"GAS_GIANT":145}.

Los diagnósticos 21.5 son índices heredados, no pruebas de agua o erupciones reales; CT-0 32.F.2c corresponde a modelo simulado, no observación.

## Arquitecturas y nichos
Arquitecturas: {"SINGLE":14,"BINARY":6}. Topologías: {"CIRCUMSTELLAR":138,"CIRCUMBINARY":6}. Nichos: {"SOLID_BASE":72,"DEEP_ENVELOPE":72}.

## Panel independiente: anfitriones compactos
500 locators V3 examinados; 3 anfitriones detectados; 3 con planetas; 5 planetas. Tipos: {"NEUTRON_STAR":1,"PULSAR":1,"STELLAR_MASS_BLACK_HOLE":1}.

**Nunca sumar estos planetas a la demografía estándar.**

## Estratos no encontrados en esta selección
- NO_SAMPLED_OCEAN
- NO_SAMPLED_TRIPLE

## Límites y aceptación
- OCEAN/DESERT/VOLCANIC are formation phenotypes, not proof of ocean, dryness or eruptions. NO life inference.
- A missing sampled class is not an error and cannot justify quota changes.
- The compact-host probe is conditional ascertainment, not representative prevalence; do not merge with the 60-system denominator.
- S/P orbital geometry and Roche/Hill screening do not establish long-term N-body stability.
- No planet/moon in this audit receives a habitability or life verdict; identity-only moons stay NOT_EVALUATED.
- Count ratios are descriptive ONLY; sector/system clustering and deterministic selection prevent population-level confidence inference.

El catálogo PRE-33.10 conserva la identidad y el acceso diferido de TODAS las lunas de un sistema confirmado; PRE-33.11 no cambia generación, mundos observados, historial o persistencia.

Resultado: **PRE33_11_V3_DIVERSITY_AUDITED**. La puerta de vida efectiva sigue siendo PRE-33.13; PRE-33.12 requiere auditoría integral de rutas/caché y rendimiento.
