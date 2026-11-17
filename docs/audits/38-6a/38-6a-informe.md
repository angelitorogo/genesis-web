# GENESIS Web — 38.6a: correspondencia diurna de luces nocturnas

## Implementación

- Nueva capa **solo visual y no emisiva**, que consume exactamente los datos RGBA de `textureResource.nightLightsTexture` utilizados por `createSystemScenePlanetAppearanceV1` (VISCIV.1c). No modifica ni regenera luces, semillas o máscaras nocturnas.
- El planificador `vida38-day-urban-38-6a.ts` extrae máximos luminosos georreferenciados de ese atlas: **CORE / SECONDARY / LOCAL**. Los píxeles originales son inmutables; cada núcleo diurno procede de un píxel iluminado real de la textura.
- Se aplica exclusivamente cuando los planes CT-0 previamente autorizados de 38.6 contienen **asentamientos NATIVOS en un PLANETA** con tier **ADVANCED** o **VERY_ADVANCED**. No se aplica a PRIMITIVE, colonias sin civilización nativa, lunas, mundos no confirmados ni cuerpos sin atlas nocturno.
- Números máximos por cuerpo: 74 núcleos ADVANCED y 126 VERY_ADVANCED, sujetos a la geografía luminosa disponible; **no equivalen a poblaciones o coordenadas observadas**. La selección incluye separación angular, consolidación espacial y supresión de ruido.
- Geometría no emisiva con `THREE.InstancedMesh`, anclaje individual al radio esférico (incluidos edificios periféricos), materiales compartidos, cero nuevas texturas. Los corredores VERY_ADVANCED solo se dibujan cuando el atlas nocturno ya registra un trazo luminoso continuo. El LOD de 38.6 sigue decidiendo la visibilidad: <200px oculto, 200–379px simplificado, ≥380px detallado.
- Igual implementación en la ficha científica y en SystemScene; ambos reciben el atlas nocturno ya construido por `createSystemScenePlanetAppearanceV1` y comparten el planificador/renderer 38.6. Conexión a `spinPivot`: los edificios rotan con el planeta.
- No se modifican VIDA.6/7/8/9, las nueve representaciones biológicas, los satélites/anillos/estaciones, las luces nocturnas, la física del planeta ni la persistencia.

## Fuente de verdad

`confirmedBiologyVIDA9` (confirmación/autorización ajenas al renderer) → `vida38InfrastructurePlansFromConfirmed386(record)` → plans `VIDA7_NATIVE_SETTLEMENT` → colorMap VISCIV.1c **real** → selección 38.6a → mallas 3D de día.

La existencia de asentamientos procede de VIDA.7. La ubicación relativa de otros núcleos es **reconstruida** desde la distribución luminosa procedural ya existente (que no es una observación científica de coordenadas). No se introduce ninguna entidad científica nueva.

## Validación realizada en el entorno de entrega

- `node scripts/verify-architecture.mjs`: **PASS**, seis capas, 1.210 archivos TypeScript.
- TypeScript aislado estricto (`tsc --noEmit ...`): **PASS** para planificador y renderer 38.6/38.6a mediante declaraciones locales mínimas de Three.js, sin ejecutar Angular.
- Sintaxis AST TypeScript: **7/7** archivos inspeccionados, sin diagnósticos.
- Prueba de algoritmo offline (generator VISCIV.1c real + selección 38.6a compilada): PRIMITIVE 0; ADVANCED 74; VERY_ADVANCED 126; los píxeles de luz no cambian; **PASS**.
- Angular/Vitest/Playwright/build completo: **NO EJECUTADOS**. El ZIP de fuentes no incluye `node_modules`, y no se ha verificado el build de producción ni la calidad visual en navegador.

## Validación que debe realizar el usuario

```powershell
npx ng test --watch=false --include="src/app/presentation/infrastructure/vida38-day-urban-38-6a.spec.ts"
npx ng test --watch=false --include="src/app/presentation/infrastructure/vida38-infrastructure-38-6.spec.ts"
npx ng test --watch=false --include="src/app/presentation/system/system-scene-planet-night-lights-visciv1.spec.ts"
npx ng test --watch=false --include="src/app/presentation/system/system-scene-civilization-surface-parity-visciv1d.spec.ts"
npx ng build
npm run test:architecture
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npm run test:e2e
```

Comparar misma seed/sistema confirmado ADVANCED y VERY_ADVANCED: con luz estelar de frente deben verse numerosas ciudades nuevas cerca de centros luminosos que pasan al hemisferio oscuro al rotar. Las luces nocturnas deben conservar el aspecto previo. Comprobar también planeta PRIMITIVE, planeta con solo colonia, luna colonizada y sistema no confirmado.

## Restricciones conocidas

- Sin atlas nocturno válido no se dibujan asentamientos secundarios. Es preferible al riesgo de inventar una geografía independiente.
- Los nuevos volúmenes son reconstrucciones **estilizadas y pequeñas a escala orbital**, no ciudades con coordenadas, cifras de población u obras arquitectónicas observadas.
- La selección está limitada para que decenas de núcleos no provoquen cientos de draw calls: normalmente se necesitan uno o dos `InstancedMesh` en LOD alto, más un tercero para los pocos corredores permitidos.
