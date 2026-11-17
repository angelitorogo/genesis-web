# 38.6c — Informe de implementación y validación

## Alcance

| Área | Cambio | Archivos |
|---|---|---|
| Diseño visual de colonias | Plan puramente visual, 3–5 accesos, módulos de servicio, cúpulas y mástiles, en una región | `vida38-colonial-complex-38-6c.ts` |
| Rendering LOD | InstancedMesh, materiales no emisivos, proyección individual de apoyos; conservando pivote original | `vida38-infrastructure-render-38-6.ts` |
| Regresión | Layout, escala, ausencia de falsos positivos, roundtrip, anclajes, LOD, liberación GPU y preservación nativa | `vida38-colonial-complex-38-6c.spec.ts` |

## Contratos congelados

- **VIDA.8/9**: ninguna escritura, ningún digest nuevo, ninguna modificación de habitantes, categoría, función ni población.
- **Identidad geométrica**: `plan.id`, `seedUint32`, `latitudeRadians`, `longitudeRadians` y el centro de su `siteMedium/siteHigh` sin cambios.
- **Luces**: ninguna fuente de luz/emissive; 38.6a lee el mismo atlas inmutable.
- **Colonias**: 1 plan colonial produce **1** cluster; múltiples accesos no crean colonias adicionales.
- **Civilizaciones nativas**: ramas PRIMITIVE/ADVANCED/VERY_ADVANCED inalteradas funcionalmente.
- **Orbital**: nada relativo a estaciones, anillos, satélites u órbitas.
- **Descubrimiento**: el planificador previo `vida38InfrastructurePlansFromConfirmed386` mantiene todas sus verificaciones de CT-0. El renderer acepta únicamente sus planes autorizados.

## LOD y legibilidad

- Lejano `<200 px`: oculto, como en 38.6.
- Medio `200–379 px`: forma resumida con varios volúmenes y bases.
- Cercano `>=380 px`: 3–5 accesos reales en la geometría, varios módulos y conexión/sensores.
- Escala aparente acotada por categoría para que un pequeño puesto avanzado pueda verse cuando la luna ocupa la pantalla. **No es una escala física/científica ni un dato observed knowledge**.

## Resultados que sí se ejecutaron

- Arquitectura: `npm run test:architecture` → PASS; capas verificadas 6, TS productivos 1.216.
- TypeScript puro: compilación aislada del planificador 38.6c → PASS.
- Ejecución del layout puro: 30 aserciones → PASS.

## Lo que debe ejecutarse en Windows

Las pruebas Three/Vitest, la compilación Angular y la inspección de la colonia real **no** se ejecutaron en el contenedor (no hay dependencias `node_modules` ni la base de datos de la partida); su resultado es **pendiente**, no PASS. Ver LEEME para comandos.

## Riesgos controlados

- El anclaje se calcula sobre la esfera geométrica; si una luna usa un desplazamiento topográfico especial extremo, se debe comprobar visualmente que no interseca el terreno. Se mantiene la exclusión anterior de lunas MINOR_IRREGULAR.
- Se exageran únicamente **dimensiones aparentes de objetos visuales**, no su población ni extensión física certificada. La vista ya advierte que las coordenadas son reconstrucciones no observadas.
