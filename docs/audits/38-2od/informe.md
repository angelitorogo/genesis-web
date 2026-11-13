# 38.2o.d — Reconstrucción reptiliana a partir del motor humanoide SDF existente

## Objetivo
Eliminar la aproximación de maniquí y reconstruir los reptilianos civilizados reutilizando el cuerpo humanoide continuo introducido en 38.2e–38.2g.e.

## Enfoque técnico
1. Se clona el contrato visual a una versión bípedo-humanoide compatible con el motor SDF.
2. Se deriva anatomía humanoide y se genera una malla continua con `buildVida38HumanoidRawMesh(...)`.
3. Se deforma la malla resultante para introducir rasgos reptilianos:
   - cráneo más alto y cuello más largo,
   - hocico moderado,
   - mandíbula más marcada,
   - piernas digitígradas,
   - manos adelantadas,
   - cola secundaria.
4. Se mantiene la piel orgánica del humanoide, aprovechando el recubrimiento `SCALES` para escamado procedimental.
5. Se añaden ojos reptilianos, dientes, crestas, garras y vestimenta alienígena por nivel civilizatorio.

## Criterios cubiertos
- nada de maniquí,
- nada de cilindros como esqueleto principal,
- silueta claramente humanoide,
- rasgos reptilianos claros,
- ropa alienígena integrada,
- variedad real de perfiles y niveles.
