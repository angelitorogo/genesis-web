# GENESIS Web — 38.2q1d · Auditoría de ojos oscuros y transición coxal

## Alcance
- Insectoides civilizados `INSECTOID` de nivel `VERY_ADVANCED` (renderer 38.2q).
- No se modifica el renderer de insectos normales 38.2k, ni las especies reptilianas, ni las identidades biológicas.
- Base incremental: 38.2q1c ya aplicado.

## Solución ocular
- Las dos superficies compuestas utilizan exclusivamente la paleta #050607, #0b0d10, #12161a y #191e22.
- Variación facetaria oscura por semilla de especie. Se eliminan pigmentos cian/verdes y emisión de luz ocular.
- Ocelos secundarios usan la misma familia oscura; continúan siendo ocelos anatómicos, no LEDs.

## Solución coxal
- Malla ventral continua de radios anatómicos por alturas con lóbulos laterales de transición.
- Dos coxas con tramo inicial embebido en ese volumen.
- Dos escudos quitinosos laterales conformados sobre el volumen pélvico.
- El arranque femoral comparte posición con el final coxal para evitar un intervalo vacío.
- Se respetan los diferentes arquetipos y el número previo de piernas y brazos.

## Verificaciones en esta entrega
- Compilación de sintaxis TS mediante `typescript.transpileModule`.
- Auditoría determinista portable de 4.120 identidades (24 del laboratorio + 4.096 sintéticas).
- Verificación de 8.240 raíces coxales embebidas y ausencia de `Math.random`.
- Test Vitest de paleta, dos lados, malla pélvica, ojos normales/extra y regresión de alas y brazos.

## Limitación
La auditoría Node no ejecuta Three.js real, Angular ni WebGL. La comprobación visual 360° y los tests de integración se deben ejecutar en el proyecto del usuario.
