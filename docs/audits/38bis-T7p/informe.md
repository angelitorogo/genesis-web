# GENESIS 38.bis-T7p — Informe de regresión geométrica

**Regresión previa:** T7o condicionaba el ajuste de altura a `part.lift <= .001`.
Las cápsulas y los `TECH_NODE` elevados, aun formando parte del mismo grupo,
no seguían el descenso de sus bases hacia la superficie lunar. El resultado
visual eran dos capas coloniales aparentemente desconectadas.

**T7p:** dos niveles de apoyo reversibles: ancla del asentamiento al cuerpo
anfitrión y corrección de cada soporte con preservación del `lift`. Se registra
el `lift` local por instancia durante la construcción, sin modificar VIDA.8/9.
Se impone LOD HIGH durante la inspección para evitar representaciones mixtas.

**Pruebas:** comprobaciones portátiles T7p, T7o, T7n; Vitest de apoyo sobre
esfera y sobre esfera escalada, restauración completa y retrocompatibilidad.
**Pendiente:** Angular completo y verificación visual de casos reales.
