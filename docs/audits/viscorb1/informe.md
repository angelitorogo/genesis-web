# GENESIS VISCORB.1 — Informe de integración

## Diagnóstico

1. En `ScientificBodyPreview.applyCameraDistance()` la selección de dirección estelar de T7s se restringía a `PLANET` sin contexto. `MOSTRAR LUNAS` y las fichas lunares caían en la dirección genérica `(0,0.08,1)`, incluso si el modelo ofrecía vectores estelares.
2. Las vistas `ScientificBodyPreview.buildPlanetaryContext()` y `SystemScene` empleaban escalas y cámaras distintas. `SystemScene` debía conservar sus posiciones estelares globales mientras la ficha comprimía las órbitas para la vista conjunta.
3. No se debe copiar sin más la escala local de la ficha a la simulación física. Tampoco pueden duplicarse lunas, cambiarse semiejes, excentricidades, fases ni objetos con conocimiento no confirmado.

## Implementación

- Nuevo `viscorb-preview-stellar-illumination.ts`: fuente estelar común al planeta individual, luna individual y conjunto. La luna recibe vectores estelares de su anfitrión o, sin ficha del anfitrión, de las estrellas de su snapshot; no se consultan datos VIDA para resolver la iluminación.
- El `ScientificBodyPreview` aplica `scientificPreviewDaylightCameraT7s` en las tres modalidades, incluso con `contextEnabled`. RESTABLECER VISTA vuelve a la cámara solar. No se altera el shader ni la iluminación real.
- Nuevo `viscorb-local-orbit-projection.ts`: extrae de la ficha el contrato de radios de apoapsis/periapsis, tamaños lunares y radio máximo de órbita. El motor científico sigue siendo `SystemOrbitalMotionEngine`.
- Nuevo `ViscorbSystemLocalPresentationV1`: cuando se sigue un planeta, reescala exclusivamente el desplazamiento local planeta–luna, la geometría ya existente de sus líneas orbitales y el tamaño visual relativo de las lunas. No se crean lunas ni se cambian sus snapshots. Transformaciones interpoladas y restauradas al dejar de seguir.
- En `SystemScene` la selección por instancias sigue la escala aplicada a cada luna; los marcadores de riesgo acompañan la posición presentada y la geometría de órbita conserva su foco elíptico.
- Se conserva la posición científica previa a la proyección para los cálculos de fuentes estelares de las lunas. El LOD se ajusta a su tamaño presentado.
- `SystemSceneCameraController` admite **encuadre inicial separado del límite mínimo de zoom** y dirección estelar sugerida sin bloquear el control del usuario.
- `viscorb-stellar-frame.ts`: dirección de observación ponderada según estrellas luminosas existentes, dando prioridad estable a los anfitriones. Si no existe fuente luminosa no se inventa una nueva.
- Se reutilizan líneas, materiales, lunas y modelos 3D existentes. No se modifican interfaces persistidas, generación, VISCATM ni datos V3/VIDA.

## Alcance y limitaciones

- La vista local de `SystemScene` se activa al **seguir un planeta conocido con lunas visibles**. La vista general permanece intacta. La proyección es una reconstrucción de presentación, no una afirmación de distancias físicas a escala.
- El encuadre de cámara inicial favorece la iluminación; los eclipses reales, la rotación y la configuración estelar pueden originar zonas oscuras. La cámara sigue siendo libre.
- Paridad: mismos cuerpos, movimientos canónicos, patrones de materiales y jerarquía; se admiten diferencias por cámara, exposición y LOD.
- No se han ejecutado aquí WebGL real, Angular build completo ni E2E: requieren la instalación de GENESIS.

## Validaciones realizadas

- `node scripts/auditar-genesis-viscorb1.spec.cjs`: **48 comprobaciones** de sintaxis, contrato de escala, elipse, interpolación, restauración, preservación de snapshots, host binario/triple, no invención de luz y no materialización de lunas desconocidas.
- Análisis sintáctico TypeScript: PASS en los módulos de producción incluidos.

## Validaciones obligatorias en tu proyecto

```powershell
node scripts/auditar-genesis-viscorb1.spec.cjs
npx ng test --watch=false --include=src/app/presentation/system/viscorb-local-orbit-projection.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/viscorb-system-local-presentation.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/viscorb-stellar-frame.spec.ts
npx ng test --watch=false --include=src/app/presentation/scientific-body-preview/viscorb-preview-stellar-illumination.spec.ts
npm run test:architecture
npx ng build
```

Después: batería completa de Vitest, worker y E2E habitual. Validar con Xephus B-11: planeta solo, MOSTRAR LUNAS, luna individual, seguir planeta en SystemScene, cambios de zoom/layer/foco y retorno a vista general. Contrastar simple, binario, triple, planeta sin lunas, sin cambios de datos científicos.
