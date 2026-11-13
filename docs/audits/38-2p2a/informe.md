# GENESIS 38.2p2a — Corrección de visibilidad frontal

## Diagnóstico
En 38.2p2 la esfera se situaba a partir de un impacto lateral sobre la piel, y el iris plano se colocaba a una distancia inferior al radio frontal del globo. El propio globo y, según el ángulo, la piel del cráneo, ocultaban los elementos oculares. Se reproducía la cuenca vacía al mirar de frente.

## Reparación
- Globo centrado en la **misma cavidad SDF** de 38.2j; escala según `eyeSize`, no según `headSize`, coherente con el orificio anatómico.
- Iris y pupila mediante mallas *curvadas* que siguen la superficie del globo, con desplazamiento superficial positivo.
- Orientación oblicua con componente frontal dominante y variación procedural pequeña para conservar lectura de perfil.
- Ningún disco blanco, anillo de plástico ni párpado flotante nuevo.
- Se omite el render de dientes provisionales fuera del labio cuando la geometría mandibular SDF está cerrada; la dentición de la especie permanece en el contrato morfológico.
- Controles del visor, colores corporales y reptiles civilizados sin cambios.

## Comprobaciones
- Validación geométrica de visibilidad (frente y lateral, ambos ojos) contra el campo SDF: nueve arquetipos, resultado de la muestra local: todos despejados.
- Prueba Vitest `vida38-reptile-eyes-38-2p2a.spec.ts` y regresiones heredadas actualizadas.
- No se ha podido ejecutar el build Angular ni renderizado WebGL completo en este entorno.
