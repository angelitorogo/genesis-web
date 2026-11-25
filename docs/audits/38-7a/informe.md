# GENESIS 38.7a — Informe de corrección puntual

## Incidencias

- `TS2345` en `system-scene-civilization-visuals.data-source.ts`: el productor puede devolver `tier: null` con un perfil vegetal. La interfaz de 38.7 restringía erróneamente `tier` a civilizaciones no nulas. **Se modifica solo el contrato consumidor**, sin cambiar datos ni el data source.
- `TS2339` en `system.html`: el parche 38.7 había sustituido `SystemPage` sin su propiedad de diagnóstico VISCIV.6e. **Se restaura el getter** con valor desactivado por defecto y activación explícita `debugOrbital=1`.

## Invariantes

- Sin civilización VIDA.7: `visualCivilizationTier === null`.
- Biosfera confirmada con vegetación: `visualVegetationProfile` preservado cuando procede.
- Sistemas no confirmados: ninguna de las anteriores observaciones se muestra, aunque la caché conserve registros previos.
- Sin cambios en renderizadores y datos científicos.

## Pruebas

`node scripts/auditar-genesis-38-7a.spec.cjs` cubre sintaxis, interfaz, binding de plantilla y proyección confirmada/no confirmada; Angular/Vitest completos requieren la raíz original del proyecto.
