# GENESIS Web · 29.1E-H5-B — V2 SINGLE y circumbinarios P-type

## Alcance del parche

Adición estrictamente de solo lectura sobre H5-A.1. No sustituye ni modifica
los cuerpos generados, sus masas, órbitas canónicas, seeds, catálogo, estados de
exploración ni el cálculo S-type ya validado de Musia y Xiria.

**SINGLE V2:** la sesión V2 reutiliza el anfitrión A previamente materializado
con sus atmósferas/lunas originales. Cuando el A es WHITE_DWARF y están
presentes masa, edad, luminosidad y cronología suficientes, se utiliza la
proyección adiabática H3 (SINGLE) y el motor atmosférico H4/H4b/H4c/H5-A.1.
No hay irradiación de acompañantes en SINGLE. Si falta un requisito, la ficha
no vuelve a presentar el clima del progenitor como clima presente. No modifica
la vía heredada V1.

**P-type (AB) V2:** para una WD en A **o** B y una segunda componente con
luminosidad conocida, sin reconfiguración explosiva canónica, proyecta el eje
baricéntrico con la **masa TOTAL actual AB**, no con la masa de una sola WD.
Reevalúa la condición empírica circumbinaria con la razón de masas tras pérdida
adiabática de masa y comprueba que la región orbital no invada la binaria.
La irradiación presente de A, B y, si existe y se puede modelar, C se aproxima
por cuadratura determinista de anomalías medias y orientaciones apsidales;
no se trata A+B como un punto luminoso en órbitas próximas. Se cuenta la
irradiación de cada estrella una sola vez: el flujo de la WD en H2, el de las
otras estrellas añadido en H5. Los historiales RGB/AGB/XUV de los acompañantes
NO se reconstruyen en esta etapa. No es una simulación N-body ni una garantía
de estabilidad orbital o supervivencia.

Los sistemas AB con ambas componentes WD, con otra estrella sin luminosidad
actual, dinámicamente reconfigurados o fuera de las condiciones de aplicabilidad
permanecen SIN atmósfera H5 resoluble, en vez de inventar una solución. Los
análisis S-type existentes siguen idénticos.

## Aplicación (ZIP en la raíz)

```powershell
Expand-Archive -Path .\genesis-29-1e-h5-b-single-ptype-post-agb.zip -DestinationPath .\ -Force
```

## Tests orientados

```powershell
npx ng test --watch=false `
  --include="src/app/simulation/stellar/white-dwarf-post-agb-circumbinary-model.spec.ts" `
  --include="src/app/simulation/stellar/white-dwarf-post-agb-h5-scientific-bridge.spec.ts" `
  --include="src/app/presentation/system/system-v2-single-scientific-session.spec.ts" `
  --include="src/app/simulation/stellar/stellar-multihost-scientific-target-resolver.spec.ts" `
  --include="src/app/presentation/planet-detail/planet-h3-real-seed-regression.spec.ts" `
  --include="src/app/simulation/planetary/white-dwarf-post-agb-evolved-environment.spec.ts" `
  --include="src/app/simulation/planetary/white-dwarf-cryo-phase-equilibrium.spec.ts"

npm run test:architecture
npm run test:worker
npm run build
```

## Validaciones realizadas en este entorno

* Verificación arquitectónica sobre la copia de proyecto integrada: PASSED.
* `tsc --noEmit -p tsconfig.spec.json`: sin errores propios de los archivos
  modificados; el proyecto completo no compila aquí porque faltan dependencias
  `@angular`, `@noble/hashes`, `tslib`, `dexie`, etc.
* 7 pruebas aisladas de los motores / adaptadores con TypeScript transpilado,
  aserciones Node y reemplazos temporales de dependencias externas: PASSED.
  **No** equivalen a Vitest Angular ni validan renderizado o sistema real.
* Pruebas de regresión S-type con la seed real en el paquete Angular: a ejecutar
  en la instalación del usuario. No se afirma haberlas ejecutado aquí.

## Verificación visual posterior

Buscar un SINGLE V2 cuya estrella A sea WD, comprobar la presencia de H5
(actual simulado), presión/composición, sin campo falso de acompañantes.
Buscar un BINARY P-type y TRIPLE P-type con WD A/B y órbitas aplicables; confirmar
que insolación modelada = contribución WD + demás fuentes estelares, clima
simulado y estabilidad NO validada. Las poblaciones inexistentes o sin WD
no deben fabricarse ni aplicarse H5; las WD dobles siguen fuera del alcance.
Comparar Musia B-2 y Xiria B-4 antes/después: su S-type H5-A.1 debe conservarse.
