# GENESIS 38.bis — Estadísticas de expansión colonial (CT-0)

## Fuente y semántica

- Cada colonia contabilizada proviene de un registro VIDA.9 CT-0 persistido y con digest verificado por `DexieVida9BiologyExplorationRepository.get()`, cuyo sistema de destino está `CONFIRMED`.
- Su nivel `ADVANCED` o `VERY_ADVANCED` procede de `Vida8Colony.origin.tier`; nunca se infiere del destino ni de luces nocturnas. No existen colonias `PRIMITIVE` válidas en el modelo.
- Para contar una **civilización colonizadora verificada**, se exige además leer el registro VIDA.9 del planeta natal y comparar: identidad de universo/sistema/cuerpo, confirmación persistida, digest VIDA.7 de la fundadora, digest del ecosistema, especie fundadora, nivel y linaje.
- Solo cuando ese origen está verificado se habilita **Ver mundo natal**. En otros casos se indica *Mundo natal no verificable* y la colonia no cuenta como fundadora identificada. No se crean registros para suplir ausencias.
- **Máximo de colonias por civilización**: máximo entre las fundadoras verificadas, agrupadas por cuerpo natal en cada galaxia. No significa que el total del censo esté cerrado.
- **Candidatas colonizadoras**: civilizaciones ADVANCED y VERY_ADVANCED presentes en la indexación nativa VIDA.7. Son un denominador conocido, no la estimación del universo completo.
- Los registros `colonies` son individuales, mientras `colonized-planets` y `colonized-moons` son agrupaciones por cuerpo; no se duplican sus recuentos en estas estadísticas.

## Caché, actualizaciones y privacidad

- Se guardan resúmenes pequeños por galaxia en el índice derivado `genesis-web-archive-38bis`, dentro de las secciones de `colonies` y `civilizations`. No hay migración de la BD científica ni nueva versión de Dexie.
- `sourceRevision` incluye `founder-stats-v1`/`tier-stats-v1`: solo estas dos categorías se reconstruyen cuando se valida por primera vez la nueva fase. Las otras categorías mantienen su caché.
- El dashboard NO publica resúmenes guardados antes de verificar el estado de descubrimiento vigente del universo y galaxias. El índice se revisa progresivamente; se indican los fragmentos verificados y el *censo parcial*.
- La ruta de mundo natal solo se añade a colonias cuyo planeta de origen esté confirmado y cuya identidad y digest VIDA.7 coincidan con el registro de destino. No se expone la identidad de fuentes privadas a través de las acciones de la UI.
- Las consultas de fuentes están memoizadas dentro de una indexación de galaxia; un planeta natal no se relee por cada colonia fundada.

## Interpretación esperada de la interfaz

Panel **Expansión de las civilizaciones · VIDA.8** en el Archivo GENESIS y en sus categorías de civilizaciones/colonias:

1. Civilizaciones colonizadoras verificadas (entre las candidatas indexadas).
2. Colonias fundadas por ADVANCED.
3. Colonias fundadas por VERY_ADVANCED.
4. Mayor expansión documentada, con enlace al mundo natal cuando está verificado.

Los valores se calculan **sobre los datos de la partida**, no sobre los recuentos ilustrativos 149/298/43/255 de capturas anteriores. No se asigna una misma colonia a varias fundadoras.

## Pruebas

```powershell
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis-colonization-stats.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.store.spec.ts"
npx ng test --watch=false --include="src/app/presentation/genesis-archive/38-bis/genesis-universal-archive-38-bis.model.spec.ts"
npx ng build
npm run test:architecture
```

Opcional después de la validación localizada:

```powershell
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npm run test:e2e
```

## Comprobaciones externas pendientes

No se han ejecutado Angular, Vitest ni Playwright en este entorno, ya que la copia de las fuentes no incluye `node_modules`. Validar asimismo que el enlace **Ver mundo natal** funciona en una colonia real y que los recuentos cambian correctamente con el filtro de galaxia y el universo seleccionado.
