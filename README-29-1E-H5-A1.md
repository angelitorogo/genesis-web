# GENESIS Web — 29.1E-H5-A.1 · Hotfix físico de criocondensación y coherencia térmica

## Aplicación

ZIP incremental sobre H5-A, desde la raíz del proyecto:

```powershell
Expand-Archive -Path .\genesis-29-1e-h5-a1-criocondensacion-coherencia-termica.zip -DestinationPath .\ -Force
```

No modifica generadores, seeds, base de datos, orbita canónica, Ground Truth ni motores fuera de la caracterización WD post-AGB.

## Correcciones

1. **Sublimación sólida a baja temperatura** (`white-dwarf-cryo-phase-equilibrium.ts`): reemplaza el antiguo plateau `max(T, Tref/2)` de H4. El modelo utiliza la forma integrada de Clausius–Clapeyron con presión y temperatura **del punto triple** de cada especie y entalpías efectivas explicitadas. La presión de sublimación decrece monótonamente al bajar T. No confunde la ebullición a 1 atm con sublimación sólida y evita etiquetar helio como sólido a 33–38 K. Son estimaciones de primer orden, **no curvas tabuladas ni EOS precisas en todo el rango**.
2. **Equilibrio de mezcla mediante masa y presión parcial real**: conserva por especie la columna de masa u_i = g Σ_i (kg/m²), en unidades de Pa. La presión parcial superficial se calcula `p_i = u_total × (u_i/M_i) / Σ(u_j/M_j)`. La saturación de cada especie se impone sobre p_i, resolviendo simultáneamente de forma iterativa las columnas gaseosas que quedan. Se devuelve explícitamente la parte condensada. No se usa la masa molecular media del progenitor tras la evolución de la mezcla.
3. **H4** reutiliza el solver y calcula fracciones molares y presión total de una mezcla post-condensación realmente conservativa. H4 continúa siendo escenario WD-only, no atmósfera observada.
4. **H5** conserva las pérdidas y aportes RGB/AGB/WD existentes; cambia únicamente la iteración termodinámica final, preservando todos los presupuestos por especie. `gasPressurePascal` mantiene su contrato heredado de **columna de masa gravitacional en Pa**; `gasPartialPressurePascal` es el nuevo campo de presión parcial verificable. No se cambian modelos XUV/escape, balances térmicos fundamentales ni dinámica orbital.
5. **Textos y campos de fichas**: en *Superficie* y *Clima* se muestra `WD + acompañantes` cuando existe aporte multihost de H5, aunque pequeño, en vez de `solo WD`. Las composiciones se ordenan por fracción molar en vez de masa.

## Referencias físicas / límites

Anclas de presión del punto triple de referencia: nitrógeno 63.151 K / 12.523 kPa (NIST https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=907386), argón 83.8058 K / 68.891 kPa (NIST https://trc.nist.gov/refprop/Documents/Air.pdf), SO₂ 197.64 K / 1.67 kPa (NIST WebBook https://webbook.nist.gov/cgi/cbook.cgi?ID=C7446095&Mask=1E9). Los demás puntos triples se declaran por especie en código; las entalpías de sublimación son supuestos efectivos aproximados. Fuera del entorno del triple, el modelo integra entalpía constante y **no debe interpretarse como presión de saturación experimental de alta precisión**. No aborda adsorción en regolito, gases supercríticos, mezcla no ideal, geoquímica ni equilibrio líquido profundo.

El cálculo H5 sigue siendo **estado actual simulado bajo hipótesis declaradas**, no una observación. Se conserva la condición explícita de incertidumbre orbital, evolutiva y de irradiación multihost.

## Pruebas

```powershell
npx ng test --watch=false `
  --include="src/app/simulation/planetary/white-dwarf-cryo-phase-equilibrium.spec.ts" `
  --include="src/app/simulation/planetary/white-dwarf-post-agb-atmosphere-projection.spec.ts" `
  --include="src/app/simulation/planetary/white-dwarf-post-agb-evolved-environment.spec.ts" `
  --include="src/app/presentation/planet-detail/planet-h3-real-seed-regression.spec.ts" `
  --include="src/app/simulation/stellar/stellar-multihost-scientific-target-resolver.spec.ts"

npm run test:architecture
npm run test:worker
npm run build
```

La regresión usa la semilla V2 real `7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5` para Musia B-2 y Xiria B-4. Las presiones/composiciones H5 **cambiarán**: no se fijan snapshots ni excepciones por planeta.

### Validación local realizada

- 19/19 tests aislados de cryo/H4/H5 mediante TypeScript + runner de aserciones Node.
- Compilación TS estricta del motor de fases, H4 y H5.
- `node scripts/verify-architecture.mjs` PASSED: 6 capas, 1910 archivos TypeScript.
- `tsc --noEmit -p tsconfig.app.json` **no logra compilar el proyecto completo** porque faltan dependencias `node_modules` (Angular, tslib, @noble/hashes, etc.). No hay errores nuevos localizados en los archivos modificados.
- Vitest Angular, worker y build final: requieren ejecutar en el checkout del usuario.

### Regresión científica recomendable

- En Musia, nitrógeno y argón gaseosos a ~33 K deben disminuir notablemente respecto al antiguo plateau H4; no se debe forzar presión distinta de cero.
- En Xiria, vigilar retención de He/H₂ y recomputar presiones parciales cuando casi toda la masa de los gases pesados condensa. No confiar en composiciones anteriores.
- Verificar las etiquetas `WD + acompañantes` en ambos planetas si el aporte multihost H5 está disponible.
- Confirmar persistencia de identidad de planeta, órbita y gases anteriores sin mutación.
