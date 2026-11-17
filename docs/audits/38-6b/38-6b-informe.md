# GENESIS Web — 38.6b: identificación de lunas colonizadas en Sección 08

## Alcance

Solo la ficha **planetaria** existente (`PlanetDetailPage`), Sección 08 — Lunas.
No se modifica VIDA.6/7/8/9, los renderers, `SystemScene`, las luces nocturnas,
los seis contadores físicos existentes ni los registros de persistencia.

## Nueva información

- **Lunas con colonias**: séptima tarjeta del resumen lunar. Cuenta **cuerpos**
  con una o más colonias VIDA.8, nunca el número total de colonias.
- **Colonización tecnológica**: nuevo indicador de cada luna con caracterización
  individual, situado después de los datos ya existentes (junto a Habitabilidad
  potencial en la disposición de tres columnas). Valores: «Sin colonias
  registradas», «1 colonia», «N colonias» o «No evaluable».
- Las fichas de lunas `IDENTITY_ONLY` no adquieren una clasificación biológica
  por tener su identidad conocida: no se añaden datos físicos o coloniales a
  esas fichas incompletas.

## Procedencia, autorización y protección

La vista lee únicamente las filas de `privateBiologicalRecordsVIDA9` cuya identidad
completa coincide con el universo V3, galaxia, sector, sistema, planeta y luna.
Solo se consulta después de la confirmación del sistema. El repositorio
`DexieVida9BiologyExplorationRepository.get` verifica revisión, época CT-0,
identidad, digest y almacenamiento inmutable. Se vuelve a contrastar la
identidad VIDA.8, los enlaces con VIDA.6/7, la semántica de colonización y los
identificadores de colonias antes de emitir **solo un número**, no el registro
privado. No hay nuevas inferencias científicas.

La ausencia de una fila, un fallo de la base de datos, un registro corrupto o
una luna identificada sin caracterización biológica **NO equivalen a cero**.
Se muestra «No evaluable» (o un recuento mínimo «N verificadas» si hay registros
parciales positivos). Esto es importante cuando el indexador de lunas aún está
materializando registros en segundo plano. La vista no ejecuta simulaciones de
VIDA en el hilo de la UI y no inventa una colonia faltante.

La carga asíncrona se cancela lógicamente al cambiar el modelo de sistema para
que un resultado anterior no pueda contaminar la pantalla actual.

## Pruebas

`src/app/presentation/planet-detail/planet-moon-colonization-38-6b.spec.ts`
contiene siete pruebas sobre conteo por luna, parcialidad, identidad, ausencia
de acceso sin confirmación, lectura Dexie, corrupción y persistencia/reapertura.
Además, `planet-detail.spec.ts` comprueba ausencia de indicadores coloniales
para un enlace directo a un sistema CATALOGUED.

## Instalación

Aplicar desde la raíz de `genesis-web` con `Expand-Archive -Force`.
Este ZIP solo contiene seis archivos nuevos/modificados y este informe.

## Validación sugerida

```powershell
npx ng test --watch=false --include="src/app/presentation/planet-detail/planet-moon-colonization-38-6b.spec.ts"
npx ng test --watch=false --include="src/app/presentation/planet-detail/planet-detail.spec.ts"
npx ng test --watch=false --include="src/app/presentation/planet-detail/planet-scientific-sections.spec.ts"
npx ng build
npm run test:architecture
```

No se ejecutó aquí un build Angular ni Vitest completo porque las fuentes no
incluyen `node_modules`; los resultados del entorno local son necesarios para
certificar la integración. La comprobación de arquitectura y las verificaciones
aisladas de proyección sí se ejecutaron durante la preparación.
