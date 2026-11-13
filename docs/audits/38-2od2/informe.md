# GENESIS Web — 38.2o.d2: anclaje orgánico y corrección de encuadre

## Causa confirmada
El motor SDF define las coordenadas anatómicas localmente desde los pies (y≈0) hasta la cabeza (y≈3), pero los detalles anteriores se situaban con valores fijos heredados del maniquí (por ejemplo, y≈-1.4 en garras y perneras). `normalizeSubject()` calculaba límites incluyendo los accesorios desplazados, colocando el cuerpo demasiado alto respecto al suelo. La geometría de los adornos también podía quedar desligada del cuerpo.

## Corrección
- Preservar SDF, piel orgánica, morfología, identidad determinista.
- Sustituir todos los paneles de ropa en coordenadas absolutas por **máscaras de triángulos de la superficie SDF**, ligeramente desplazadas sobre las normales.
- Colocar ojos, pupilas, dientes, garras, crestas y cola mediante proyección sobre la superficie SDF deformada.
- Eliminar los accesorios con posiciones negativas ajenas al organismo.
- Revisar normalización: con los detalles anclados, los pies vuelven a determinar el mínimo de la figura y el cuerpo deja de flotar.
- Mantener los 3 niveles de vestimenta y los 3 perfiles deterministas.

## Límites
No se ha renderizado el visor Three.js completo en este entorno. La validación visual final sigue pendiente en el proyecto del usuario. La lectura exacta del nivel civilizatorio sigue dependiendo del contrato VIDA.38.1 disponible en su proyecto.
