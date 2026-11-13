# GENESIS — 38.2o.e1 | Corrección de distribución y ornamentos

- Fallo 1: FNV-1a aplicado con `% 10` sin difusión final de bits. Sobre identidades secuenciales producía solo 5 de 10 arquetipos en 48 muestras.
- Corrección: avalancha final tipo Murmur3 y semillas independientes por dominio: anatomía, traje y cultura.
- Fallo 2: los rayos de anclaje de cuernos, placas y barbillas fallaban en la mayoría de mallas SDF, dejando sin geometría observable a familias que tenían parámetros de ornamentación.
- Corrección: se selecciona el vértice real más adecuado en la región craneofacial del SDF. Sin objetos sueltos a alturas arbitrarias.
- Tests: separación entre validación estadística pura (barata) y tres casos geométricos reales (caros), reduciendo significativamente el tiempo de ejecución.
- Preservados: cola SDF integrada, piel con color original, traje 360º negro-azul-verde/cian, determinismo, resto de taxones.
