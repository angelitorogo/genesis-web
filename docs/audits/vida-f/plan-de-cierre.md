# VIDA.F — Auditoría y cierre (fase de certificación)

## Alcance y seguridad

**Solo pruebas, auditorías y documentación**. Sin cambios en motores, RNG,
semillas, V3, IndexedDB, física PRE-33, probabilidades VIDA.7 ni catálogos.
La política de revelación total de sistemas CONFIRMED y los registros
inmutables VIDA.9 siguen vigentes.

## Matriz de evidencia

| Objetivo | Comprobación | Evidencia necesaria |
|---|---|---|
| Diversidad planeta/luna | recorrido V3 con VIDAF (planetas y lunas relevantes) + unidades | ambas poblaciones, vida y esterilidad contabilizadas; huecos separados |
| Jerarquía completa | prefix exacto de grupos y especies de VIDA.6 | caso completo, caso incompleto detectado |
| Oxigenación | feedback VIDA.5c, O₂ parcial/facción; vegetación estable | prueba positiva y prueba de oxigenación insuficiente |
| Colonias no habitables | VIDA.8: origen local avanzado, superficie sólida, hábitat sellado | luna no plausible con colonia; origen importado válido |
| Ausencia de vida forzada | VIDA.3 y promoción basada en evidencia VIDA.5c | luna estéril + promoción ilegal detectada |
| No regresión física | comparación literal de target físico antes/después | no alteración PRE-33/target V3 |
| Determinismo | dos cálculos, orden de orígenes invertido y digests VIDA.9 | mismos resultados sin depender del orden de evaluación |
| Arquitectura | npm run test:architecture | salida OK |
| Unidades (incl. cobertura) | npx ng test y npm run test:unit:coverage | salidas OK |
| Worker | npm run test:worker | salida OK (tipado) |
| Build | npx ng build | salida OK |
| E2E | npm run test:e2e:typecheck, npm run test:e2e | salidas OK, contexto aislado |

## Interpretación científica

- «SIN HALLAZGOS» describe **solo los cuerpos realmente evaluados**. No equivale a un censo total.
- La falta de una colonia o biosfera compleja en una muestra **no prueba que el escenario no exista**.
- `NO_ELIGIBLE_ORIGIN` y `NOT_SELECTED` no constituyen incumplimiento.
- El descubrimiento de oceános lunares no obliga a generar vida.
- Colonización en destino no plausible no convierte el destino en planeta naturalmente habitable.
- Una promoción VIDA.5c puede crear una biosfera nueva donde microbios VIDA.3 no se habían seleccionado, **si está físicamente acreditada**.
- El 65/30/5 de VIDA.7 es una distribución probabilística **sin cuota por galaxia**; no se fuerza al menos una civilización muy avanzada.
- El auditor no lee la IndexedDB privada del navegador; no sustituye la comprobación de la partida persistida.
- La auditoría VIDA.9a ya contenía una reconciliación físico-biológica por cuerpo. VIDA.F añade controles transversales y regresión de cadena.

## Criterios de cierre

1. Ejecutar todos los comandos de certificación en el proyecto V3 real.
2. Inspeccionar cualquier `HALLAZGOS_PENDIENTES`, `MUESTRA_CON_HUECOS` y los escenarios no cubiertos.
3. No certificar como «CERRADA» hasta obtener pruebas completas y revisar la cobertura.
4. No corregir datos forzando vida, oxígeno o civilizaciones; resolver discrepancias con cambios localizados y nuevas pruebas.

## Ejemplo del censo V3

```powershell
node scripts/auditar-genesis-vida-f.cjs --limit-systems=250 --max-moons-per-planet=4
```

Para recorrer todos los sistemas de Elixisis sin límite práctico de sistemas y sin acotar lunas relevantes:

```powershell
node scripts/auditar-genesis-vida-f.cjs --limit-systems=999999 --max-moons-per-planet=999999
```

La segunda ejecución puede ser costosa. **No borres IndexedDB**.
