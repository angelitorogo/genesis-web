# Informe GENESIS COLVIS.2 — Arquitectura y visibilidad

## Diagnóstico de la regresión COLVIS.1

El nuevo factor de escala física en `vida38-infrastructure-render-38-6.ts` convertía el radio del complejo de kilómetros a unidades de radio planetario/lunar. En una ficha encuadrada para un cuerpo completo, los edificios pueden proyectarse a fracciones de píxel. Había además una segunda reducción fija de altura mediante `/ (sourceRadiusKm*4.2)` que aplastaba innecesariamente estructuras. No existe evidencia en este entorno de que VIDA.8/9 hayan desaparecido: sus rutas de lectura no se modifican. La magnitud visual del problema es comprobable por código, aunque la reproducción concreta con la base IndexedDB del usuario requiere su navegador.

## Correcciones entregadas

- El planificador `colvis2-colonial-architecture.ts` conserva la puerta de autorización, identidad, seed, escala y población de COLVIS.1, pero asigna gramáticas independientes: tramas ortogonales e ingeniería humanoide, medias lunas/terrazas acorazadas reptilianas y crecimiento dendrítico con túneles insectoide.
- 14 nuevas geometrías compuestas en `colvis2-architecture-geometry.ts`, con cápsulas, arcologías, hangares, torreones, corazas, ciudadelas, aguijones, colmenas, vainas, células y pasajes tubulares. Curvas, lathe, tubo y segmentos suavizados. Se fusionan internamente para una instanciación por geometría/acabado/LOD; facetas de acabado con matices de vértice y materiales propios.
- Distinción `ADVANCED`/`VERY_ADVANCED` por forma, núcleo, redes secundarias y verticalidad, no solo color o escala. Facciones lunares más compactas y acceso protegido.
- Restauración del detalle vertical utilizando el máximo real de piezas y altura límite física, sin el divisor fijo 4.2 anterior.
- Anclaje diferenciado para prefabs Y=0, evitando enterramiento por el desplazamiento usado con primitivas centradas.
- Indicador de localización no físico en LOD generales para colonias autorizadas. Nunca cuenta como edificio ni genera observaciones; se oculta en la inspección de detalle.
- Selector `Inspeccionar colonia` en la ficha 3D, visible cuando el renderizador del cuerpo recibe planes coloniales verificados; zoom y límites de cámara específicos, regreso a encuadre normal y recuperación de planos al cambiar de modelo/contexto.
- Mismo planificador y mismo renderizador Three.js para laboratorio y producción. Laboratorio heredado accesible en `/laboratorio/colvis1`, actualizado a COLVIS.2, con variante semilla, modo silueta, medición de triángulos y comparación de 12 escenarios.
- Biblioteca de prefabs construida únicamente para geometrías realmente utilizadas por colonias verificadas en ese cuerpo. Sin cambios en archivos VIDA.8/9, IndexedDB, universo, Archivo GENESIS, VISCIV, LUNSURF o VISSURF.

## Esquema de escala

`visualSize = bodyRadiusScene × min(footprintKm, sourceRadiusKm × 0.0075) / (sourceRadiusKm × unitExtent)`.

`verticalSize = min(visualSize, bodyRadiusScene × min(maximumHeightKm, sourceRadiusKm × 0.0015)/(sourceRadiusKm × max(height+lift)))`.

El radio físico no cambia al inspeccionar. Cambian distancia, orientación y planos near/far de cámara. En la vista general el pequeño anillo es una **indicación de localización**, no arquitectura; se mantiene ópticamente discreto y no se amplifica con el LOD lejano.

## Validaciones efectuadas

- `node scripts/auditar-genesis-colvis2.spec.cjs`: **235 verificaciones superadas** (planificador y cámara reales compilados y ejecutados; 12 combinaciones).
- `node scripts/auditar-genesis-colvis1.spec.cjs`: **128 verificaciones superadas**, adaptando solo una aserción obsoleta que imponía COLVIS.1 como ruta de producción; no se eliminan las demás comprobaciones históricas.
- Compilación estricta aislada del planificador y sintaxis TypeScript de archivos modificados: ver registro de entrega.

## Pendiente, no certificado

- `ng build`, Angular/Vitest/E2E y WebGL reales no se ejecutan aquí por falta de dependencias locales de proyecto (`node_modules`).
- No se ha accedido a IndexedDB del usuario; su visibilidad real y anclajes en lunas irregulares siguen pendientes de confirmación.
- Draw calls reales, memoria GPU y calidad artística de las 12 variantes requieren ejecutar el laboratorio en su navegador y comprobar el resultado.

**No cerrar COLVIS.2 exclusivamente por superar auditorías.**
