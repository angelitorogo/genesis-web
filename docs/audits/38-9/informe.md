# GENESIS 38.9 — Auditoría y consolidación de rendimiento Three.js

## Alcance y base

Base: copia del proyecto aportada en `genesis-diagnostico-progresion-conocimiento.zip` y parches incrementales posteriores LIVE-SCI.1, LIVE-SCI.2, NUCLEUS-SYNC.1, BULKCONF-ARCHPERF.1, ARCHFAST.1 y ARCHFAST.1a. Las modificaciones 38.9 se limitan a `SystemScene` y al controlador LODGRP, más tests y documentación. No se ha reconstruido ni cambiado la geometría de especies o civilizaciones.

### Estado anterior: ya implementado

- `THREE.InstancedMesh` para objetos menores y otros conjuntos repetidos; **no** sería correcto instanciar indiscriminadamente planetas con uniformes individuales de iluminación.
- LOD por tamaño proyectado con histéresis, pool de esferas reutilizables y prioridad visual de la cámara.
- LODGRP.1/2: un grupo anfitrión+lunas, Worker para atlas CPU, subida escalonada de texturas, GPU swap al quedar listo todo el conjunto, fallback de media resolución, liberación del grupo al salir y caché CPU LRU limitada.
- Texturas de planetas y lunas en cachés de recursos con límite de entradas y bytes, leases que evitan expulsar recursos todavía usados.
- Liberación en destrucción de ruta: desactivar `setAnimationLoop`, geometrías/texturas/materiales de escena, listas internas de WebGL, contexto GPU y Workers.
- Telemetría LODGRP.2 opcional (generación CPU, subidas GPU, tiempos de frame, draw calls y contadores WebGL).

### Puntos concretos corregidos

1. **GC por fotograma en iluminación:** `systemSceneLightingTargets(snapshot)` reconstruía el array de planetas/lunas/cuerpos menores en cada frame V2/V3. Se calcula una vez por nuevo snapshot y se libera al retirar la escena.
2. **Búsqueda repetida de anfitriones:** `resolveOrbitalHomeStarIdsVISCIV6d` construía `Set` y filtraba estrellas por cada planeta en cada frame. Las relaciones estelares **estáticas** se resuelven una vez por snapshot; posiciones, direcciones, pesos y flujo **dinámicos** se mantienen actualizados en cada frame.
3. **Set temporal LOD:** al comprobar qué cuerpos pertenecían al grupo cercano se reconstruía un Set por frame. El controlador conserva una tabla de pertenencia estable hasta cambiar de grupo y la invalida en `leave/reset`.
4. **Callback VISCORB:** la función adaptadora de posición se reutiliza entre frames, sin crear una closure por render.
5. **Presupuesto real del atlas activo:** LODGRP limitaba la memoria de **caché** a 144 MiB, pero no comprobaba el total de arrays preparados de un grupo a partir de `byteLength`. Ahora también impone 128 MiB reales para el grupo activo, tanto al recibir atlas como al recuperarlos desde la caché. En caso de exceso pasa a `BUDGET_LIMITED`, mantiene el detalle medio y libera las texturas GPU intermedias sin tocar el modelo científico ni la calidad de las demás escenas.

### No cambiado

Semillas, persistencia/IndexedDB, VIDA, conocimiento, niveles de confirmación, geometría, shaders, materiales, iluminación matemática, velocidades orbitales, escalas, cámaras, resoluciones de atlas, calidad visual 3D, política de LOD, número de elementos instanciados, `package.json`.

### Pruebas realizadas aquí

- `NODE_PATH=... node scripts/auditar-genesis-38-9.spec.cjs`: **21/21** comprobaciones, incluidas pruebas ejecutables sobre la clase real LODGRP, con dependencia del contador de bytes sustituida por un mock fiel que sólo suma `byteLength`.
- `node scripts/verify-architecture.mjs`: **PASSED** tras reconstruir el directorio vacío `src/app/observation` que no se transportó en el ZIP de diagnóstico (en la instalación del usuario existe).
- `tsc --strict ...` **PASSED** para controlador LODGRP real compilado en aislamiento con un stub exclusivo del contrato de atlas; esto no equivale a compilar Angular completo.
- Análisis sintáctico de tres archivos TypeScript modificados: **PASSED**.

**No ejecutados aquí:** Vitest/Angular, build, E2E, evaluación FPS/VRAM en navegador; el entorno reconstruido no contiene las dependencias `node_modules` y carece de navegador WebGL de prueba apropiado. No se hacen afirmaciones numéricas de mejora FPS o memoria GPU.

### Pruebas de usuario recomendadas

```powershell
node scripts/auditar-genesis-38-9.spec.cjs
npx ng test --watch=false --include=src/app/presentation/system/system-scene-performance-38-9.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/system-scene-planetary-lod-group-lodgrp1.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/system-scene-resource-cache.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/system-scene-lod.spec.ts
npm run test:architecture
npm run test:unit:coverage
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```

Validar visualmente en escritorio 1440×900: sistema pequeño y sistema con múltiples lunas, acercamiento/alejamiento repetido, cambio de sistema 20 veces, archivo/fichas y regreso a home. Comprobar que no cambian planetas, nubes, luces, sombras, órbitas, especies ni colonias. Si está activado el diagnóstico LODGRP.2 en entorno de pruebas, anotar `gpuTextures`, `gpuGeometries`, `drawCalls`, tiempos de preparación y estabilidad después de cambiar/abandonar sistemas. No exigir una cifra fija de FPS sin hardware de referencia.

## Limitaciones

- El presupuesto CPU del grupo controla las vistas de atlas **aceptadas**. La memoria temporal de un mensaje del Worker y las texturas GPU que administra WebGL tienen contabilidad distinta; no se promete un techo total del proceso o VRAM.
- No se incorpora un gestor gráfico global, un backend WebGPU, un límite artificial de FPS ni un cambio de LOD para móviles; 38.9 prioriza escritorio sin degradar resultados previos.
- Las mejoras reducen trabajo de CPU y eliminan una ruta de acumulación. El rendimiento medido debe contrastarse con la instalación real del usuario.

**Estado:** implementación acotada entregable en un único ZIP; cierre oficial sujeto a tests/build y validación visual/rendimiento local.
