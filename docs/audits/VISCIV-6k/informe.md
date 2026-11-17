# VISCIV.6k — Actividad orbital procedural en anillos VERY_ADVANCED

## Contrato
- El tráfico orbital es una capa gráfica derivada de las estructuras confirmadas de VIDA, **no** nuevas entidades descubiertas ni nuevos cuerpos físicos.
- Tres familias: `CONVOY` (circulación continua por carriles), `SHUTTLE` (lanzaderas por una trayectoria exterior elevada) y `TERMINAL` (viajes entre nodos adyacentes con retorno y frenado).
- Configuraciones por anillo: HABITAT 10/5/8, INDUSTRIAL 8/7/10, TRANSPORT 14/7/12 vehículos respectivamente.
- Cada anillo tiene sus propias trayectorias orbitales y centros de actividad, siguiendo los planos VISCIV.6h; no se modifican órbitas científicas ni planetas.
- Un único generador de tráfico compartido por `SystemScene` y la ficha 3D del planeta.
- La posición depende exclusivamente de `simulationDay` y del plan del anillo; rebobinar reconstruye exactamente el mismo estado.

## Render y rendimiento
- Tres `THREE.InstancedMesh` por anillo (uno por categoría), más un grupo.
- Reutilización de geometrías, materiales y matrices; no se crean mallas ni recursos GPU durante la animación.
- `frustumCulled = false` en los lotes móviles para impedir desapariciones por bounding spheres obsoletas; sus mallas siguen sujetas a depth test y visibilidad de la capa orbital.
- Geometrías de carga, lanzaderas cónicas y tráfico de terminales de tamaños distintos.
- Circulación situada entre niveles de las cubiertas o por encima de las superestructuras monumentales 6i.a.
- Se mantienen las balizas VISCIV.6g, iluminación VISCIV.6j, estaciones y anillos con 1–3 planos.

## Verificación local
- Auditoría portable: 12.288 configuraciones (3 tipologías × 4.096 semillas), determinismo y límites de carril correctos.
- Simulación runtime con geometría sustituta: animación absoluta y rebobinado sin deriva, matrices finitas.
- `node scripts/verify-architecture.mjs` correcto para 1.218 archivos de producción tras restaurar la carpeta obligatoria vacía `src/app/observation`, omitida en el ZIP de fuentes de referencia. Esto no requiere alterar la instalación del usuario.
- Sintaxis de los cinco archivos TS de implementación/prueba: sin errores.
- **No ejecutadas aquí las pruebas Vitest/Angular reales ni el build:** faltan dependencias de GENESIS en esta instalación de trabajo.

## Pruebas recomendadas en el proyecto del usuario
```
node scripts/auditar-genesis-visciv-6k.spec.cjs
npx ng test --watch=false --include=src/app/presentation/system/system-scene-orbital-traffic-visciv6k.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/system-scene-orbital-illumination-visciv6j.spec.ts
npx ng test --watch=false --include=src/app/presentation/system/system-scene-orbital-architecture-visciv6i.spec.ts
npm run test:architecture
npx ng build
```
