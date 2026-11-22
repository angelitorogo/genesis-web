# GENESIS LUNSURF.2 — Informe técnico

## Incidencia original y causa confirmada

La proyección lunar D.3f permite un índice de agua líquida superficial **potencial** aun sin una presión atmosférica de escenario resuelta. En `system-scene-moon-texture.ts`, el anterior efecto de cuencas de volátiles dependía de `t.liquidMask01`. La geomorfología D.3 genera esa máscara solo cuando la presentación admite líquido (`visualProfile.liquidVisual01 > 0`). Por tanto, para lunas como **Tripher i IV** (311,3 K, presión no determinada, alta riqueza en hielo), la máscara era cero y no aparecían materiales hídricos indiciarios.

## Contrato científico aplicado

* `sourceSurfaceLiquidWaterPotentialIndex01` es un **índice de plausibilidad**, no una cobertura superficial, observación ni porcentaje real de agua.
* `presentationLiquidCoverage01` es un **escenario visual condicionado** por la presión/temperatura D.3, no una observación confirmada. Sin prueba explícita de confirmación no se introduce una clase visual «agua confirmada».
* LUNSURF.2 **no genera océanos, nieve o hielo a 311,3 K** sobre la base de un potencial elevado y una presión desconocida.
* Se preservan `source*`, clase científica, semillas, relieve/geomorfología, cráteres, máscaras y coberturas. Sin IndexedDB ni cambios de motor físico.

## Implementación

1. `system-scene-moon-hydric-facies-lunsurf2.ts`: interpretación de cuatro estados exclusivamente visuales: `NONE`, `POTENTIAL_ALTERED_MINERAL`, `POTENTIAL_COLD_DEPOSITS`, `SUPPORTED_LIQUID_SCENARIO` (este último **NO** equivale a confirmado).
2. Con potencial suficientemente alto e inventario disponible, deposición mineral correlacionada con cuencas y provincias, formada por ruido cartesiano continuo sobre la esfera. Tripher-like (311,3 K) recibe tonos minerales ocres/grisáceos, rugosidad mineral heterogénea, **sin agua líquida visible**.
3. En casos fríos (≤273,15 K) y con riqueza inferida en hielo compatible, depósitos ópticos localizados principalmente en cuencas y latitudes altas. No se inventa espesor de hielo, geometría ni contenido real.
4. Modifica solo albedo y rugosidad HD; no altera normales, alturas, hielo/líquido ni nubes. El atlas es común al LOD enfocado de `SystemScene` y a la ficha científica. LOD distante conserva su presupuesto.
5. El material no se genera si el índice potencial, inventario o condiciones térmicas no lo justifican. Los escenarios de líquido previamente admitidos siguen a cargo de D.3, sin doble aplicación.

## Verificación en el entorno de construcción

* Auditoría portable LUNSURF.2: 1244 verificaciones de interpretación, costuras, semilla, nubes no modificadas indirectamente y conservación de fuente; **PASS**.
* Compilación de tipos estricta aislada: **PASS** (`tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck` sobre módulo e integración).
* Comparativa local 512×256 de atlas LUNSURF.1 vs LUNSURF.2, con fixtures sintéticos: 

| Caso | Diferencia media por canal (0–255) | Píxeles de albedo modificados | Relieve y normales | 
| --- | ---: | ---: | --- |
| Seco | 0 | 0 % | Idénticos |
| Templado con potencial, presión no resuelta | 3,40 | 63,73 % | Idénticos |
| Frío con potencial | 8,97 | 67,06 % | Idénticos |
| Escenario de líquido D.3 ya resuelto | 0 | 0 % | Idénticos |

Los números anteriores son únicamente **atlas sintéticos** y no certifican aspecto visual WebGL. No se ha ejecutado la batería Angular/Vitest ni realizado comparación WebGL del planeta real. Los tiempos locales 512×256 del caso templado fueron aproximadamente 417 ms (LUNSURF.1) y 499 ms (LUNSURF.2); dependen del equipo y son orientativos.

## Riesgos/criterios de aceptación

* La ficha y `SystemScene` deben mostrar la misma capa material con idéntica semilla/identidad a igual resolución.
* En Tripher i IV debe existir una modulación mineral perceptible, **sin hacer pasar el potencial por agua observada**.
* Lunas completamente secas y escenarios líquidos ya resueltos conservan el aspecto anterior.
* Sin modificaciones de geometría de colonias, rotación, iluminación VISSURF.6, nubes ni IndexedDB.
* Comprobar WebGL real en Aaras/Tripher y performance de zoom antes de dar la mejora por cerrada.
