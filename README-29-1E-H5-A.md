# GENESIS Web — 29.1E-H5-A: atmósfera evolutiva simulada post-AGB (primera integración)

## Alcance y decisión científica

Esta entrega añade un **estado ambiental actual SIMULADO** bajo un modelo físico V1 para planetas circumestelares (S-type) con anfitrión WHITE_DWARF y datos H1-H4d válidos. No es una medición ni un cambio de Ground Truth. El usuario ve el cierre central elegido y la sensibilidad ante cierres alternativos. Las fichas conservan las pruebas H4/H4b/H4c/H4d como diagnósticos independientes.

**No cierra H5 completo**: los SINGLE y P-type, un historial real RGB/AGB de radio/viento/XUV, una dinámica N-body y un modelo radiativo espectral/atmósfera fotoquímica calibrado requieren integración adicional. H5-A no inventa esos resultados. Cuando falten ingredientes se mantiene el estado no resuelto; no se fuerza una solución ni se aplican excepciones por semilla.

## Motor

1. `white-dwarf-post-agb-evolved-environment.ts`: proyecta el inventario gaseoso heredado por RGB, AGB y WD; aplica una pérdida energética parametrizada y Jeans por especie; añade un presupuesto **SUPUESTO y limitado** de aporte secundario; resuelve iterativamente condensación y temperatura gris actual del escenario; conserva presupuestos por molécula y presión-equivalente gravitacional. Tres cierres `LOW_ESCAPE`, `REFERENCE`, `HIGH_ESCAPE` muestran sensibilidad, NO son cuantiles estadísticos.
2. `white-dwarf-post-agb-multihost-irradiation-model.ts`: proyecta la separación A/B y, si existe, AB/C con expansión adiabática según las masas estelares iniciales y actuales; suma irradiación media bolométrica de estrellas compañeras bajo aproximación de fuente puntual. **No** demuestra estabilidad secular ni predice fases orbitales.
3. Puente read-only `stellar-multihost-scientific-target-resolver.ts`: usa el mismo agregado real, planetas y gases; NO cambia cuerpos canónicos; pasa el estado H5 a las fichas.
4. Las fichas incluyen presión, composición, evolución de inventarios, pérdida/condensación/aporte secundario, efecto invernadero, temperatura modelada, agua condicionada y distinción inequívoca entre simulación y observación.

### Hipótesis/modelo que deben permanecer visibles

- Radiación RGB/AGB **H4b hipotética**, edades heredadas del motor estelar. Órbita adiabática H3, sin resolver engullimiento/mareas/estabilidad N-body.
- Acoplamientos energía bolométrica → escape por fase para la rama de referencia: RGB `1e-10`, AGB `3e-10`, WD resuelta `2e-11`. `LOW_ESCAPE=0.02×` y `HIGH_ESCAPE=50×` para sensibilidad. **No son eficiencias XUV medidas**.
- Termosfera/temperaturas de exobase asumidas RGB `3200 K`, AGB `5000 K`, WD tardía `600 K`; exobase parcial de referencia `1e-7 Pa`, escalada con el escenario. Jeans representa diagnóstico energético, no espectro XUV ni escape hidrodinámico real.
- Secundarios potenciales limitados por presupuesto: como máximo `6% × índice de potencial de desgasificación` de inventario de referencia, con amortiguación de tiempo y factor de escenario; solo especies pesadas presentes en el inventario. No implica un reservorio observado ni permite aporte ilimitado de H₂, He o Ar.
- Pérdida y condensación de **columnas de masa equivalentes a presión**; fracciones moleculares reconstruidas después de evolución. La fase depende de las anclas simplificadas H4 y la radiación modelada. Efecto invernadero es gris, no espectral.
- La radiación de otras estrellas se incorpora SOLO si sus masas/luminosidades y geometría admiten la proyección A/B/C. En caso contrario el escenario WD-only se etiqueta explícitamente. El enfriamiento WD del historial H4b omite los primeros 20 Ma, potencialmente energéticos: el resultado no es una curva estelar empíricamente completa.
- H4d sigue indicando que **sin elegir el modelo** no hay una única inferencia observacional; H5 selecciona un cierre predictivo **SIMULADO**, y no lo eleva a dato observado. No se cambian Ground Truth, semilla V1/V2, BD, detección o progresión de conocimiento.

## Archivos

Nuevos:

- `src/app/simulation/planetary/white-dwarf-post-agb-evolved-environment.ts`
- `src/app/simulation/planetary/white-dwarf-post-agb-evolved-environment.spec.ts`
- `src/app/simulation/stellar/white-dwarf-post-agb-multihost-irradiation-model.ts`
- `src/app/simulation/stellar/white-dwarf-post-agb-multihost-irradiation-model.spec.ts`

Modificados localmente:

- `src/app/simulation/planetary/white-dwarf-post-agb-atmosphere-projection.ts` (exportar función física de presión de vapor H4, sin cambiar su cálculo)
- `src/app/simulation/planetary/planet-scientific-target-resolver.ts` (contexto tipado)
- `src/app/simulation/stellar/stellar-multihost-scientific-target-resolver.ts` (conexión de H5 sobre agregado real)
- `src/app/presentation/planet-detail/planet-scientific-sections.ts` (lectura de H5)
- `src/app/presentation/planet-detail/planet-h3-real-seed-regression.spec.ts` (guardias reales H5)

## Aplicar desde raíz de genesis-web

```powershell
Expand-Archive -Path .\genesis-29-1e-h5-a-atmosfera-evolutiva-simulada.zip -DestinationPath .\ -Force
```

## Tests orientados

```powershell
npx ng test --watch=false `
  --include="src/app/simulation/planetary/white-dwarf-post-agb-evolved-environment.spec.ts" `
  --include="src/app/simulation/stellar/white-dwarf-post-agb-multihost-irradiation-model.spec.ts" `
  --include="src/app/presentation/planet-detail/planet-h3-real-seed-regression.spec.ts" `
  --include="src/app/simulation/stellar/stellar-multihost-scientific-target-resolver.spec.ts" `
  --include="src/app/simulation/planetary/white-dwarf-post-agb-atmosphere-history.spec.ts" `
  --include="src/app/simulation/planetary/white-dwarf-post-agb-atmosphere-projection.spec.ts"
```

```powershell
npm run test:architecture
npm run test:worker
npm run build
```

## Verificación local real en esta entrega

- 10/10 tests nuevos ejecutados sobre JS compilado con harness aislado de aserciones Node (no Vitest Angular).
- `node scripts/verify-architecture.mjs`: **PASSED**.
- `tsc --strict --noEmit` ambos motores nuevos: PASSED.
- Chequeo parcial de tipos contra los componentes modificados: sin errores nuevos en ellos; el árbol completo sin `node_modules` no permite build Angular por dependencias externas ausentes.
- ZIP verificado con archivo de entrada proveniente del ZIP actual facilitado por el usuario, sin renombrar la semilla ni tocar generadores.

## Regresión real requerida

Seed V2 `7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5`.

- Musia B-2: `G0 / S206158430195 / O1 / B10`.
- Xiria B-4: `G0 / S55834574858 / O0 / B3`.

Revisar Atmosfera/Clima/Órbita: estado simulado etiquetado, masa y presión conservadas, sensibilidad, irradiación A/B/C calculada o ausente justificada, fuente de volátiles y comprobación de no mutación. No interpretar resultados H5 como atmósfera actual medida.
