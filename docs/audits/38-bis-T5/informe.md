# GENESIS 38.bis-T5 — Rotación de inspección de fichas planetarias

## Causa

El componente `ScientificBodyPreview` utiliza un reloj de simulación acelerado `spinPlaybackDaysPerRealSecond`. El proyector `systemSceneBodyDisplaySpinRadians` limita la velocidad visual a 30 segundos/vuelta **solo para planetas no sincronizados**; para los planetas `isSynchronized === true` devuelve directamente `systemSceneBodySpinRadians` según el tiempo simulado.

En un mundo como **Chakos B-2**, con periodo físico **318,913 horas**, el giro en la ficha puede alcanzar varias o decenas de vueltas por minuto cuando se acelera la simulación. La ficha visual no debe confundir esa aceleración con la velocidad de rotación observable.

## Corrección

- Proyector **exclusivo de ficha científica**, `scientificBodyPreviewPlanetSpinRadians38bisT5`.
- Los planetas sincronizados (`PLANET_19_3` / `COMPACT_31_4F`) con periodo físico conocido se animan a **una vuelta cada 240 segundos reales** (0,25 rpm), conservando la fase exacta en el instante inicial.
- Los planetas **no sincronizados** y los casos sin periodo disponible conservan el comportamiento anterior.
- Las **lunas** continúan utilizando `systemSceneMoonDisplaySpinRadiansV2`, cuyo ciclo de inspección es también de 240 segundos.
- Sin cambios en la rotación física, la clasificación de bloqueo de marea ni la función de rotación del `SystemScene` (donde la sincronización con la órbita sí tiene significado físico).
- La orientación de la esfera, las colonias, nubes y superposiciones sigue un único `spinPivot`; no se separan ni se introducen capas nuevas.
- La fórmula emplea tiempos absolutos y no integra por fotograma, por lo que los FPS y las pausas no introducen deriva.

La velocidad de la **ficha aislada** es deliberadamente de inspección y **no expresa una rotación física de 240 segundos**. El dato físico continúa mostrándose en «Periodo de rotación».

## Pruebas

- Chakos B-2: una vuelta visual/240 s y un cuarto de vuelta/60 s.
- Independencia respecto de la aceleración del reloj orbital.
- Misma fase inicial que el proyector previo.
- Sin cambios en planetas no sincronizados y mundos sin dato autoritativo.
- Sin modificaciones en la función de `SystemScene` ni en el ritmo lunar.
- Entradas temporales inválidas rechazadas.

Comprobaciones de tipo/transpilación y verificación aislada con Node ejecutadas satisfactoriamente. **Angular/Vitest y WebGL deben ejecutarse en la instalación del usuario**.

## No modifica

Persistencia, Índice GENESIS, VIDA, generación de colonias, fuentes científicas, semillas, texturas, geometría, renderizado de `SystemScene`, `package.json` ni animaciones lunares.
