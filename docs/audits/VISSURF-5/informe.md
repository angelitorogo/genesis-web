# Informe de ingeniería — VISSURF.5

## Estado

Integración procedural preparada sobre el código de VISSURF.4. **No certificada todavía con la compilación completa de Angular ni con capturas WebGL reales del usuario.**

## Resultados medidos en ejecución aislada (entorno de esta entrega)

Muestra sintética determinista con agua, hielo, rocas, desiertos, vegetación y material volcánico, semilla 872311.

| Métrica rocas | VISSURF.3 | VISSURF.4 | VISSURF.5 |
|---|---:|---:|---:|
| Desviación media de normales (dos canales) | ~54,2 | ~10,0 | ~29,2 |
| Delta local de relieve (texeles contiguos) | ~2,92 | ~0,61 | ~1,00 |

La amplitud de normales de VISSURF.5 recupera profundidad respecto a VISSURF.4 sin llegar a los saltos de VISSURF.3. Son métricas de **una muestra de prueba**, no afirmaciones sobre todos los planetas.

- **Coherencia de clases 1024 vs. 2048:** 99,6 % en la muestra puntual comparada.
- **Exactitud de cobertura:** máscara visual VISSURF.5 idéntica a la generada por VISSURF.2 con la misma semilla.
- **Determinismo:** igual albedo, normales y máscara a igualdad de entrada y semilla.
- **Costura:** RGBA, rugosidad, relieve y normales coinciden exactamente entre meridianos duplicados.
- **Tiempos aislados aproximados:** ~0,6 s para 1024×512 y ~2,0 s para 2048×1024 en este entorno. Dependientes de CPU, semilla, contenido y aplicación.
- **Pruebas funcionales:** las cuatro comprobaciones VISSURF.5 se ejecutaron con un arnés Node equivalente de aserciones; no equivalen a haber ejecutado la batería Angular/Vitest oficial.

## Resguardos

- Fuente, clases y coberturas físicas inmutables.
- No se modifica el generador D.4d, VIDA, IndexedDB ni su persistencia.
- No se modifica el archivo de nubes o su ruta de generación.
- El visor de ficha utiliza `createSystemScenePlanetAppearanceV1` del módulo compartido.
- El LOD lejano conserva sus mapas de bajo coste.

## Riesgos pendientes

Revisión WebGL de bordes de materiales, cordilleras, lagos y reflejos oceánicos bajo luces mono/multiestrella; tests Angular/Vitest y build del proyecto del usuario. La mejora visual debe verificarse comparando la misma región, no inferirse solo de los mapas generados.
