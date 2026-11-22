# GENESIS VISSURF.6 — Informe de corrección de terminadores e iluminación de fichas

## Código inspeccionado y síntomas

- `system-scene-atmosphere-material.ts`: el código GLSL de supresión nocturna, crepúsculo y apagado urbano empleaba la variable `normal`, que en `MeshStandardMaterial` pasa por `normal_fragment_maps` y puede incorporar la perturbación de normales de la superficie. Esto desestabiliza el terminador a escala del planeta (particularmente en terrenos áridos sin nubes).
- `scientific/scientific-body-preview.ts`: `civilizationStarSources` solo se creaba si `nightCivilizationTier` no era `null`. Los planetas sin civilización nativa heredaban una pareja de luces de inspección genéricas, aunque existieran estrellas reales en `SystemScene`.
- `scientific-body-preview.ts`: el `lightBinding` del material estaba condicionado a la existencia de civilización. Además, la lista de luces Three.js se inicializaba una sola vez, mientras que la ruta podía reutilizar el componente con otro modelo.

## Cambios de producción

1. **Normal geométrica en vista, independiente de los mapas normales.** El shader de vértices de `MeshStandardMaterial` transmite `transformedNormal` normalizada tras `defaultnormal_vertex`, antes de que el shader de fragmentos procese la perturbación de normales. El terminador día/noche, el apagado urbano respecto a estrellas anfitrionas y la contribución crepuscular utilizan esta normal geométrica. El sombreado difuso, especular, rugosidad y relieve siguen utilizando el flujo nativo PBR de Three.js. Se ha mantenido la compatibilidad con caras traseras en materiales `DOUBLE_SIDED`.
2. **Fuentes estelares independientes de VIDA.** Se crea `stellarLightSources` para cualquier planeta desde el snapshot de estrellas del sistema; `nightCivilizationTier` sigue afectando únicamente a efectos tecnológicos. El flujo luminoso se comprime mediante raíz cuadrada como en la asignación de pesos existente de `SystemScene`.
3. **Paridad entre luces Three y shader.** La ficha crea sus `DirectionalLight` utilizando las mismas fuentes con las que actualiza los uniformes del terminador; las direcciones se transforman de mundo a cámara usando `matrixWorldInverse`, y se preservan hasta dos estrellas anfitrionas para el control de iluminación urbana. Los objetos de tipo planeta sin civilizaciones reciben también este enlace.
4. **Cambio de ficha sin luces residuales.** Al cambiar de modelo, se retiran las luces de inspección anteriores y se instalan las correspondientes al cuerpo actual. Al destruir la ficha se liberan las referencias. Los fixtures antiguos que proporcionan `civilizationStarSources` siguen funcionando con un alias de lectura.

## Lo que NO se ha cambiado

- `system-scene.ts` y los generadores de materiales y texturas VISSURF.5a/5b/5c/5d.
- Distribución o animación de nubes; parámetros de atmósfera; seed, clasificación y coberturas físicas.
- VIDA.8/9, archivos o datos persistidos, colonias o civilizaciones.
- Animaciones orbitales, rotación de planetas y lunas, sombras de megaestructuras VISCIV.

## Validación local y pendiente

- Auditor portátil: PASS, **36 aserciones**, con ejecución aislada de funciones extraídas del código real TypeScript.
- Transpilación/sintaxis de los 7 archivos TypeScript de producción/prueba modificados: PASS.
- Las pruebas Vitest específicas, batería general Angular y el render WebGL real **no se han ejecutado aquí**, ya que la distribución de código disponible no incluye `node_modules` ni el entorno completo de ejecución. Deben ejecutarse en la instalación del usuario.
- Validación visual recomendada: rocoso colonizado (p. ej. Chakos B-2), otro planeta árido sin vida, helado y un mundo con civilización avanzada; comparar el mismo encuadre, instante, orientación y dirección estelar. Examinar particularmente el terminador con y sin mapas de normales mediante los modos de depuración ya existentes cuando apliquen.

## Nota sobre paridad de estrellas

Se utiliza el mismo tipo de normalización por raíz cuadrada de flujo luminoso de `SystemScene` sobre las estrellas luminosas del snapshot. En esta versión no se pretende sustituir reglas específicas ya existentes para componentes compactas y casos de órbitas triples dinámicas: esas reglas conservan su contrato físico propio en `SystemScene`. La validación visual de dichos casos se mantiene como criterio de aceptación.
