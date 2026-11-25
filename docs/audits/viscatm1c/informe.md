# GENESIS VISCATM.1c — Informe técnico de implementación

## Base

Se ha reconstruido el proyecto de referencia desde el ZIP de diagnóstico de 24-11-2026, aplicando sucesivamente 38.7x, VISCATM.1, VISCATM.1a y VISCATM.1b. Se han cambiado exclusivamente rutas de atmósferas gaseosas y los tests afectados por el incremento de versión de caché.

## Diagnóstico

- Los atlas 256→512→1024 ya admitían detalle procedural, pero parte del contraste visible de los filamentos permanecía insuficiente.
- Las esferas de las capas de bruma y dispersión se construían con `systemSceneSphereSegments('planet')`: **40 × 28 segmentos** incluso para discos de 300–600 px, provocando facetas en la silueta. Las texturas de 1024 px no solucionan geometría de 40 segmentos.
- La capa superior gaseosa tenía `alphaTest=0.012`, que podía introducir bordes duros en regiones transparentes.
- El cuerpo base también utilizaba LOD de 40 × 28 segmentos al acercarse, de modo que no bastaba con arreglar solo la bruma.

## Corrección

1. **Estructuras atmosféricas**: se conservan el atlas base 25.4 y las bandas y tormentas de VISCATM.1b; se añaden filamentos advectados a lo largo de jets y pequeños remolinos de circulación, deterministas y localizados. Intensidad y frecuencia dependen del régimen y de los parámetros atmosféricos; se evita añadir datos sobre superficie o vida.
2. **Borde sin facetas**: una geometría esférica fina `144 × 104` se comparte entre el cuerpo base, su envoltura nubosa y la capa óptica del único gigante observado de cerca. Se activa a partir de 220 px con histéresis a 160 px. Los demás cuerpos mantienen las mallas ligeras existentes.
3. **Liberación de recursos**: al cambiar de foco se restauran geometrías y escalas originales; al cerrar la escena se libera la malla compartida. No se asignan nuevos buffers en cada frame.
4. **Fichas individuales**: la misma geometría fina se usa para el gigante en su ficha, con el mismo atlas y semillas. Los demás tipos de cuerpo mantienen su geometría vigente.
5. **Transparencia**: la bruma gaseosa usa transición alfa continua en vez de descartar fragmentos con umbral.
6. **Caché**: `GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1 = 3` invalida exclusivamente la variante visual de texturas gigantes antiguas. No se modifica IndexedDB ni la generación científica.

## Verificaciones realmente ejecutadas

- Auditoría VISCATM.1: 55 OK.
- Auditoría VISCATM.1a: 7 OK.
- Auditoría VISCATM.1b adaptada: 26 OK.
- Auditoría VISCATM.1c: 27 OK, incluye generación real de tres atlas de 1024 × 512, paridad ficha/escena a nivel de atlas, determinismo, costuras UV, alpha, elección y restauración de geometría.
- Auditoría 38.7x: 25 OK.
- `node scripts/verify-architecture.mjs`: PASS, tras crear en el entorno de pruebas la carpeta vacía `src/app/observation`, omitida por la compresión de diagnóstico. No se entrega ni modifica esa carpeta.
- `tsc --strict --noEmit` en generador, atlas, proyección y cálculo de geometría: PASS.
- Comprobación de sintaxis TypeScript de `SystemScene`, ficha, tests y módulos modificados: PASS.
- Tiempos aislados orientativos de un atlas 1024×512: 1,2–1,3 s en este entorno; no equivalen a un perfil de la aplicación.

## Pendiente y limitaciones

- Compilación completa Angular (`npx ng build`) y Vitest en el repositorio del usuario; no se dispone de `node_modules` del proyecto en este entorno.
- Renderizado WebGL real en fichas y `SystemScene`, inspección visual de Droveria h/i/m, contornos bajo distintas posiciones de cámara y LOD. Los cálculos analíticos y la inspección de código no sustituyen una captura Three.js.
- Confirmar rendimiento en escenas con múltiples gigantes y ausencia de saltos visibles al cambiar de foco.

## Alcance negativo

Sin cambios en VISSURF, sistemas lunares, VIDA, COLVIS, arquitectura de conocimiento, generación de cuerpos, persistencia, CACHE-GAL/CAT, escenas de criaturas ni la futura fase 39.
