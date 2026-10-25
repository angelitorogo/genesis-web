# GENESIS Web — PRE-33.11b · Calibración estadística de oportunidades ambientales galácticas

Veredicto: **PRE33_11B_V3_GALACTIC_STATISTICAL_CALIBRATION_AUDITED** · SHA-256 JSON: `158099a1e880c5168566dbd5b02f7bb19daeab7383249ae5f8ddfa85179c56d1` · SHA-256 CSV: `01c5a575c2d6e2e35f1263cfcc8dae1c7db8cc977ba220fbf622f261503b68fc`

## Diseño probabilístico
Universo V3: 7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5; clave INDEPENDIENTE del muestreo: PRE33_11B_INDEPENDENT_AUDIT_SAMPLER_V1.
Sectores por región: 10. Primera etapa: censo exacto del marco de sectores OCUPADOS mediante localizadores V3 (no cuerpos); SRS sin reemplazo de sectores ocupados; segunda: un localizador uniforme por sector seleccionado. Las celdas vacías son ceros de contribución conocidos y no consumen muestra.
Las probabilidades de inclusión conocidas son n_h/N_h por sector ocupado y 1/M_s por localizador. La expansión usa N_h/n_h × M_s. El marco se obtiene de todos los sectores del disco geométrico V3, filtrando ocupación física procedimental exacta; no es un censo astronómico observado.

## Resultados por galaxia
| Galaxia | Sectores | Sin sistemas | Planetas estimados | Lunas estimadas | Fracción H₂O CT-0 entre detalladas | Intervalo exploratorio 95 % | Fracción mínima sobre todas |
|---|---:|---:|---:|---:|---|---|---|
| Elisoune | 40 | 0 | 33.442 | 124.032 | 3.811 % | 0.000 %–7.721 % | 1.837 % |

## Estratificación radial de oportunidades modeladas
| Galaxia | Región | Sectores ocupados | Muestra | Planetas estimados | Lunas detalladas estimadas | H₂O CT-0 estimada | Tasa H₂O CT-0 en detalladas |
|---|---|---:|---:|---:|---:|---:|---|
| Elisoune | CENTRAL | 224 | 10 | 1613 | 1949 | 0 | 0.000 % |
| Elisoune | INNER | 910 | 10 | 9464 | 18.473 | 728 | 3.941 % |
| Elisoune | MIDDLE | 1235 | 10 | 16.426 | 31.493 | 1359 | 4.314 % |
| Elisoune | OUTER | 958 | 10 | 5940 | 7856 | 192 | 2.439 % |

Las tasas regionales son descripciones ponderadas de los estratos seleccionados, no probabilidades de vida ni índices de habitabilidad certificados.

Los totales son EXPANSIONES estadísticas del universo V3 generado, no conteos reales. Los intervalos normales son aproximaciones exploratorias: los estratos pequeños y los eventos raros pueden carecer de cobertura adecuada. Cero en una muestra NO significa ausencia galáctica.

## Distribución modelada de familias planetarias (totales expandidos)
| Familia | Elixisis | Elisoune | Ilyzenia |
|---|---:|---:|---:|
| ROCKY | 4540 |
| SUPER_EARTH | 91 |
| DESERT | 2256 |
| OCEAN | 0 |
| ICE | 7490 |
| VOLCANIC | 2259 |
| MINI_NEPTUNE | 15.108 |
| GAS_GIANT | 1073 |
| ICE_GIANT | 625 |

Una familia no observada puede existir con frecuencia baja; sus ceros NO son ausencia física demostrada. Estas cifras estimadas no son cuotas para el generador.

## Envolvente de estados no resueltos (NO intervalo probabilístico)
- Elisoune: mínimo H₂O CT-0 1.837 %; máximo lógico 93.589 % si todos los estados desconocidos fueran positivos. No se interpreta como probabilidad de vida.

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
