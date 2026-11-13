# GENESIS Web — 38.2o.e2: identidad visual y diversidad inter-especie

## Objetivo
Auditar de manera determinista si dos reptilianos de civilización **VERY_ADVANCED** pueden recibir el mismo plan visual, y localizar casos que merezcan comparación visual por proximidad. No alteramos el censo VIDA ni la asignación de civilizaciones.

## Cambios

1. Módulo puro `vida38-civilized-reptilian-identity-38-2oe2.ts`: derivación de un plan visual a partir de `speciesId`, `appearanceFingerprint`, pigmentación y talla, más los perfiles/culturas/indumentarias 38.2o.e1. Devuelve una firma de los rasgos visuales, otra aproximada, y un pequeño patrón de 1–3 marcas cortas de identidad para los trajes interestelares.
2. Modificación del renderer reptiliano: incorpora las marcas al **shader real** mediante **uniformes por material**. Corrige un detalle de 38.2o.e1: la clave de caché del programa se basaba en indumentaria y cultura a pesar de contener constantes individuales embebidas. Ahora el shader es compartido y colores/posición/número de marcas varían por material sin crear un programa GPU por especie.
3. Auditoría estadística que calcula coincidencias paramétricas exactas y proximidad según una función de distancia declarada; test de integración para verificar que el uniforme se instala en el shader y la marca figura en el material, conservando el traje 360°, la cola SDF y la paleta negro-azul-verde/cian.
4. Entrada opcional `--catalog=archivo.json`: permite auditar **especies reales exportadas**, si el usuario dispone de sus registros. La herramienta **no accede por sí sola a IndexedDB**.

## Resultado reproducible en muestra sintética

| Indicador | Resultado |
|---|---:|
| Especies simuladas con pigmentación y talla idénticas | 10.000 |
| Firmas paramétricas distintas | 10.000 |
| Parejas con firmas paramétricas exactamente iguales | 0 |
| Perfiles anatómicos / líneas de ropa / culturas | 10 / 6 / 6 |
| Parejas potencialmente parecidas (distancia < 0,14) | 36.742 |
| Comparaciones totales posibles | 49.995.000 |

La cifra de parejas potencialmente parecidas representa aproximadamente el **0,0735 %** de las combinaciones posibles. La métrica es una heurística de atributos, no una medición perceptual: no debe interpretarse como una garantía de diferencias visibles o un resultado sobre capturas de pantalla.

## Semántica de las garantías

- `exactAuditPassed`: no hay dos especies distintas con la misma **firma del plan visual auditable** dentro del conjunto proporcionado; además, `speciesId` debe ser único.
- `nearDuplicatePairs`: pares cercanos según los pesos/umbrales de la auditoría, que siguen pudiendo parecerse a simple vista.
- **No se garantiza unicidad visual universal** para todas las posibles cadenas de identidad ni en cualquier resolución de pantalla. No se ha realizado análisis pixel-a-pixel ni se han inspeccionado automáticamente todas las galaxias.
- Misma especie + mismo fingerprint + mismas condiciones del contrato visual -> mismo plan, sin depender del orden del censo ni de `Math.random()`.
- Los trajes primitivos y avanzados existentes no reciben un patrón tecnológico adicional: esta iteración prioriza la identidad de la indumentaria `VERY_ADVANCED`.

## Ejemplo de catálogo real

El JSON debe ser un array, una entrada por especie reptiliana civilizada **VERY_ADVANCED**:

```json
[
  {
    "speciesId": "identificador-estable-de-especie",
    "appearanceFingerprint": "huella-visual-de-la-especie",
    "primaryColorHex": "#6b8f97",
    "secondaryColorHex": "#8da7b2",
    "bodyLengthMeters": 2.25
  }
]
```

Uso:

```powershell
node scripts/auditar-genesis-38-2oe2-identidad-visual.spec.cjs --count=10000 --out=docs/audits/38-2oe2/resultados-locales.json
node scripts/auditar-genesis-38-2oe2-identidad-visual.spec.cjs --catalog=datos/reptilianos-muy-avanzados.json --out=docs/audits/38-2oe2/resultados-censo.json
```

Si hay colisiones exactas o entradas con identificadores duplicados, el auditor da error (código de salida distinto de cero). **El JSON de diagnóstico se conserva** cuando se solicita `--out`, incluso si hay incidencias.

## Límites de pruebas

Se ha ejecutado la auditoría de 10.000 identidades en Node y se ha verificado la compilación TypeScript estricta del módulo puro. El test Vitest del renderer y el build Angular completo deben ejecutarse sobre la copia real de GENESIS.
