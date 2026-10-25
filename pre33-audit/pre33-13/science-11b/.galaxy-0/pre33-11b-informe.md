# GENESIS Web — PRE-33.11b · Calibración estadística de oportunidades ambientales galácticas

Veredicto: **PRE33_11B_V3_GALACTIC_STATISTICAL_CALIBRATION_AUDITED** · SHA-256 JSON: `7f1df717301733a9c60fd88f5dc4f8e6219be1aada2e517294b61b28bb7d6c24` · SHA-256 CSV: `6fd455be249afdaa31ea13218b156f202064498e9dc51db840dafeaa5ff0a6af`

## Diseño probabilístico
Universo V3: 7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5; clave INDEPENDIENTE del muestreo: PRE33_11B_INDEPENDENT_AUDIT_SAMPLER_V1.
Sectores por región: 10. Primera etapa: censo exacto del marco de sectores OCUPADOS mediante localizadores V3 (no cuerpos); SRS sin reemplazo de sectores ocupados; segunda: un localizador uniforme por sector seleccionado. Las celdas vacías son ceros de contribución conocidos y no consumen muestra.
Las probabilidades de inclusión conocidas son n_h/N_h por sector ocupado y 1/M_s por localizador. La expansión usa N_h/n_h × M_s. El marco se obtiene de todos los sectores del disco geométrico V3, filtrando ocupación física procedimental exacta; no es un censo astronómico observado.

## Resultados por galaxia
| Galaxia | Sectores | Sin sistemas | Planetas estimados | Lunas estimadas | Fracción H₂O CT-0 entre detalladas | Intervalo exploratorio 95 % | Fracción mínima sobre todas |
|---|---:|---:|---:|---:|---|---|---|
| Elixisis | 40 | 0 | 31.814 | 79.682 | 2.624 % | 0.575 %–4.674 % | 1.679 % |

## Estratificación radial de oportunidades modeladas
| Galaxia | Región | Sectores ocupados | Muestra | Planetas estimados | Lunas detalladas estimadas | H₂O CT-0 estimada | Tasa H₂O CT-0 en detalladas |
|---|---|---:|---:|---:|---:|---:|---|
| Elixisis | CENTRAL | 264 | 10 | 3564 | 7049 | 317 | 4.494 % |
| Elixisis | INNER | 1005 | 10 | 9950 | 16.583 | 603 | 3.636 % |
| Elixisis | MIDDLE | 1304 | 10 | 11.606 | 16.691 | 0 | 0.000 % |
| Elixisis | OUTER | 1046 | 10 | 6694 | 10.669 | 418 | 3.922 % |

Las tasas regionales son descripciones ponderadas de los estratos seleccionados, no probabilidades de vida ni índices de habitabilidad certificados.

Los totales son EXPANSIONES estadísticas del universo V3 generado, no conteos reales. Los intervalos normales son aproximaciones exploratorias: los estratos pequeños y los eventos raros pueden carecer de cobertura adecuada. Cero en una muestra NO significa ausencia galáctica.

## Distribución modelada de familias planetarias (totales expandidos)
| Familia | Elixisis | Elisoune | Ilyzenia |
|---|---:|---:|---:|
| ROCKY | 4990 |
| SUPER_EARTH | 340 |
| DESERT | 2472 |
| OCEAN | 0 |
| ICE | 8570 |
| VOLCANIC | 2748 |
| MINI_NEPTUNE | 11.240 |
| GAS_GIANT | 238 |
| ICE_GIANT | 1216 |

Una familia no observada puede existir con frecuencia baja; sus ceros NO son ausencia física demostrada. Estas cifras estimadas no son cuotas para el generador.

## Envolvente de estados no resueltos (NO intervalo probabilístico)
- Elixisis: mínimo H₂O CT-0 1.679 %; máximo lógico 92.409 % si todos los estados desconocidos fueran positivos. No se interpreta como probabilidad de vida.

## Separación física y biológica
- Oportunidad medible: H₂O líquida lunar CT-0 modelada, nunca bioquímica demostrada.
- La fase de NH₃ y CH₄ no está resuelta; no se pueden producir frecuencias biológicas con ellas.
- Lunas solo identidad y episodios desconocidos conservan estado UNKNOWN, no 0 ni falso positivo.
- Falta bioenergética certificada, dosimetría y continuidad histórica; ninguna vida se genera ni se descarta.
- El panel de anfitriones compactos poco frecuentes no está representado adecuadamente por el tamaño actual de muestra: reportar como limitación, sin incluirlo como cuota.
- La muestra PRE-33.11a no tiene diseño probabilístico y sus 43 lunas CT-0 siguen siendo descriptivas; no reemplazarla por una cifra de frecuencia inferida.
- La varianza utiliza sectores completos como unidades primarias y mantiene variación adicional de muestreo de un sistema por sector, de forma conservadora.
- No se modifica el generador, su RNG, ninguna semilla, identidad V1/V2, persistencia ni conocimiento del jugador.

## Próximo bloque
PRE-33.11c: diversidad, frecuencia y detectabilidad de vida; vida efectiva bloqueada hasta PRE-33.13.
