# Auditoría 38.6c2 — Lunas colonizadas de radio pequeño

## Reproducción del defecto

- Aaras A-9 IV: radio relativo 0,007 R⊕, colonia VIDA.8 confirmada, sin infraestructura 3D visible.
- Aaras A-9 VI: radio relativo 0,013 R⊕, colonia VIDA.8 confirmada, sin infraestructura 3D visible.
- La política 38.6/38.6c1 ocultaba por completo cualquier `infrastructurePlans` cuando la presentación lunar era `MINOR_IRREGULAR` tanto en `scientific-body-preview.ts` como en `system-scene.ts`.
- En el clasificador actual, las lunas menores que 0,035 R⊕ se dibujan como `MINOR_IRREGULAR`; el tipo orbital «regular principal» no contradice esa presentación visual.

## Mitigación técnica

Se permite la infraestructura colonial verificada en `MINOR_IRREGULAR`, se deriva el punto de contacto de la malla lunar renderizada mediante `THREE.Raycaster` en el momento de materializar la escena, y se ajustan las posiciones de los elementos de la estación al relieve irregular, de forma determinista. La escala óptica crece para radios físicos menores con función `min(3.5,max(1,sqrt(0.07/radiusEarth)))` limitada a lunas irregulares, sin editar `VIDA.8` ni el radio científico del cuerpo.

## Salvaguardas

- El filtro solo permite planes `VIDA8_COLONIAL_SETTLEMENT` en el camino especial de luna irregular.
- Sin plan autorizado no hay nueva infraestructura; no se generan civilizaciones nativas de luna por esta vía.
- El muestreo reutiliza geometría y materiales del render, sin geometría duplicada persistente ni escritura de la colonia.
- No se alteran la latitud/longitud procedural, el número de colonias, población, los mapas de luces ni otros cuerpos.
- LOD lejano, medio y cercano se mantienen; la instalación se oculta de forma natural tras el hemisferio lunar.

## Validación

- Verificación de arquitectura: PASS (1.216 fuentes TypeScript).
- Transpilación sintáctica TS: PASS (4/4 archivos).
- Las nuevas pruebas Vitest incluyen las dos dimensiones Aaras A-9, muestreo radial en la malla irregular, paridad de escala de vista lunar, determinismo, exclusiones y LOD.
- Vitest real y Angular build: no ejecutados en este entorno por falta de dependencias npm.
