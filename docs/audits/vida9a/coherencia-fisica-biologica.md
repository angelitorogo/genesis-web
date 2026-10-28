# VIDA.9a — Auditoría de coherencia físico-biológica CT-0

**Estado:** implementación y validación local parcial. Pendientes los tests Angular y el build completo en el proyecto del usuario.

## Objetivo y alcance

Comparar el estado físico generado por PRE-33, la aplicación determinista de VIDA.5 y la biosfera/civilización/colonización efectiva de VIDA.6–9. La auditoría es una **proyección de solo lectura de la ficha CONFIRMED** y no modifica motores, seeds, poblaciones, índices, generaciones, snapshots CT-0, digests ni IndexedDB. No crea datos físicos nuevos ni interpreta una falta de ruta geoquímica como esterilidad.

Se activan los mismos datos ya usados por las fichas: el `target` físico original, el `currentTarget` resultante de `Vida5BiogenicAtmosphere.applyToTarget` y `confirmedBiologyVIDA9`. La sección 31.12 sigue describiendo el estado físico de referencia PRE-VIDA.5; la sección Atmósfera/Clima describe el efectivo. No se altera la política `FULL_SYSTEM_REVEAL_ON_CONFIRMED`.

### Diagnósticos implementados

- Reconciliación explícita de T y presión baseline/efectiva con `climateDeltaKelvin`, `sourcePressurePascal` y `pressurePascal` VIDA.5. Una diferencia explicada es `INFO`; una diferencia sin soporte es `ERROR`.
- Contrato atmosférico para civilizaciones nativas de VIDA.5, con cierre y O₂ parcial ≥16 kPa. Validación de superficie física, presión y dominio térmico de VIDA.5 para ecosistemas superficiales diversos.
- Detección de especie inteligente o fundadora inexistente, civilización sin inteligencia, relaciones ecológicas que apuntan fuera del ecosistema y desajuste entre colonias y presencia de población colonial.
- Geoquímica PRE-33.07: `NO_LIQUID_SOLVENT`, `UNRESOLVED` y reservas de agua cero se interpretan **solo para el nicho y ruta**. Agua superficial del planeta y solvente geoquímico no son el mismo contrato. Falta de potencia química cuantificada no equivale a ausencia de biología procedural.
- Lunas: un océano constitutivo 32.F.2c puede carecer de vida. Se impide atribuir inteligencia/civilización **nativa** a una luna; las colonias tecnológicas siguen siendo distintas de la vida nativa.

## Auditoría de fichas aportadas

Los valores se han extraído de los cinco textos compartidos por el usuario. Son datos **de esas fichas**, no resultados de reejecutar el motor sobre la base de datos del usuario. Los campos 31.12 están redondeados por presentación.

| Planeta | T física 31.12 | T efectiva Clima | ΔT mostrado | P física 31.12 | P efectiva Atmósfera | ΔP mostrado |
|---|---:|---:|---:|---:|---:|---:|
| Phiater B-2 | 309,4 K | 300,27 K | −9,13 K | 269.321 Pa | 182.142,65 Pa | −87.178,35 Pa |
| **Hiorus B-6** | **300,3 K** | **289,22 K** | **−11,08 K** | **225.787 Pa** | **151.907,46 Pa** | **−73.879,54 Pa** |
| Dialen B-5 | 296,1 K | 285,67 K | −10,43 K | 153.501 Pa | 130.022,97 Pa | −23.478,03 Pa |

**Diagnóstico de Hiorus B-6:** el ensamblador de `planet-scientific-card.ts` llama a `ObservedHabitabilityFiche31Fe.planet(target, …)` para 31.12, pero a `PlanetScientificSectionsAssembler.build(currentTarget, …)` para Atmósfera y Clima. `currentTarget` procede de `Vida5BiogenicAtmosphere.applyToTarget(target, atmosphericFeedbackVIDA5)`. La transición se explica por modelos encadenados; la nueva auditoría compara los valores reales sin alterar las fuentes. El caso numérico de Hiorus está cubierto por el test autónomo.

**Biología Hiorus:** 41 especies distintas y 42 relaciones ecológicas; la comprobación de las 42 relaciones del texto no encontró referencias a especies inexistentes. `vida6:691b8760d63a03ad6880705c` es tanto la especie inteligente como la fundadora de la civilización humanoide primitiva. O₂ publicado 22,9 % y presión efectiva 151.907,46 Pa implican unos 34,8 kPa de O₂ parcial, suficiente para la regla procedimental de VIDA.5; no es una evaluación médica de respirabilidad. Dos asentamientos pequeños, herramientas manuales, cerámica y modos de subsistencia consistentes con civilización primitiva.

**Geoquímica Hiorus:** `SOLID_SURFACE`, `NO_LIQUID_SOLVENT`, `UNKNOWN`, con agua `0E0 kg` en la sensibilidad geoquímica, frente a mares superficiales modelados de cobertura 19,6 %. No hay una prueba de ausencia de mares: la masa de ese inventario es específica de la ruta geoquímica y no la masa superficial planetaria. Se cambia solamente la etiqueta y explicación, dejando inalterado el valor físico y el resultado de PRE-33.07.

**Aaekar c I:** océano subsuperficial generado CT-0 y ausencia de vida nativa: no es incoherencia. **Aiatae A-12 I:** oceano no resuelto y ausencia de vida; no procede inferir líquido ni biología. El censo no se ha regenerado.

## Exclusiones deliberadas

- No se modifica la presión ni la temperatura para hacer coincidir ambas etapas; no se altera la física PRE-33 ni la biología VIDA.5–9.
- No se convierte la ausencia de energía química certificada en prohibición de vida: VIDA es generación procedural simplificada, no un modelo metabólico exhaustivo.
- No se reconstruyen fechas históricas sin evidencia CT-0 certificada.
- No se audita aún toda Elixisis, ya que no se dispone del IndexedDB del usuario en el entorno. El panel evalúa cada cuerpo confirmado al abrir la ficha, sin tocar los persistidos.

## Validación local

- `node --test scripts/auditar-genesis-vida9a.spec.cjs`: **4/4 PASSED**.
- `node scripts/verify-architecture.mjs`: **6 capas, PASSED**.
- Compilación TypeScript estricta del adaptador con declaraciones locales temporales de dependencias ajenas (solo en el entorno de verificación): **PASSED**.
- Sintaxis de los módulos TypeScript modificados: **PASSED**.
- Tests Angular/Vitest y build completo: **no ejecutados aquí**; se deben ejecutar en el proyecto instalado.
