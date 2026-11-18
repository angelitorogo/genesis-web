# Auditoría VISSURF.5a — Eliminación de patrones concéntricos de normales

## Diagnóstico reproducido
VISSURF.5 utilizaba aislíneas de dos campos procedurales (`abs(regional−0.5)` y `abs(structural−0.22)`) para simular crestas y valles. Las isolíneas cerradas generaban múltiples bandas concéntricas de normales, percibidas como cráteres o anillos oscuros artificiales.

## Corrección
- Sustituir curvas de nivel por provincias de esfuerzo tectónico anchas, moduladas con múltiples escalas de ruido, y valles amplios en lugar de bandas estrechas.
- Sustituir las fracturas glaciares basadas en un nivel fijo por tensiones irregulares entre octavas.
- Ajuste contenido de la amplitud rocosa para conservar el relieve de VISSURF.5, sin subir globalmente la normal o la altura.
- Conservar la generación D.4d/VISSURF.2 de geografía/coberturas, costa, océano, nubes, LOD, máscaras, iluminación y persistencia.

## Validación
- 3 pruebas de regresión nuevas, más las 4 pruebas preexistentes de VISSURF.5: 7/7 ejecutadas en aislamiento.
- Auditoría portable sobre tres semillas y atlas sintético: porcentaje de gradientes extremos bajo umbral y relieve medio no nulo.
- Comparación aislada de normal rocosa con la versión anterior: la fracción de gradientes de contraste >80 pasó de ~4,9 % a <1 % para una muestra; variará según semilla y mundo.
- Vitest Angular/WebGL final: pendiente en el entorno original de GENESIS.
