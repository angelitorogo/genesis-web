# GENESIS — Auditoría 38.2q1e: ojos compuestos tipo mosca

## Problema corregido

En 38.2q1d se oscurecieron los globos oculares existentes, pero conservaban una geometría icosaédrica con pocas caras grandes. Aunque oscura, la superficie no mostraba la estructura de un ojo de insecto real. La petición exige facetas mucho más numerosas y un patrón tipo mosca, conservando variación de negros entre especies.

## Implementación

- Nuevo módulo `vida38-civilized-insectoid-compound-eye-38-2q1e.ts`.
- Topología dual de una esfera icosaédrica: predominan celdas hexagonales, con doce celdas pentagonales necesarias para cerrar la superficie.
- Cada omatidio tiene un relieve ligero y un borde oscuro separado del vecino; una malla base continua evita huecos visibles.
- La superficie completa se representa en **un único Mesh/BufferGeometry y un único material por ojo**, sin miles de meshes ni materiales individuales.
- Tres niveles de detalle: 252 (LOW), 812 (MEDIUM) y 2.252 (HIGH) omatidios por ojo.
- Conserva las cuatro bases oscuras procedurales de 38.2q1d: negro profundo, grafito, obsidiana y antracita.
- Microsombras y variación facetaria deterministas basadas en identidad, con materiales sin emisión luminosa.
- Ojos situados ligeramente dentro del cráneo y comprimidos en profundidad para evitar el aspecto de esfera pegada.
- La regresión 38.2q1d mantiene intactos la pelvis, las inserciones coxales y la variedad entre ejemplares.

## Pruebas y limitaciones

La auditoría portable CT-0 ejecutada sobre fuentes locales del historial verifica 4.120 identidades, 8.240 coxas, cuatro tonos oculares y planes repetibles, con resultado `GENESIS_38_2Q1E_AUDIT_OK`.

Los tests Vitest/Angular comprueban además orientación de las normales, recuento de celdas, una malla por ojo, preservación de ocelos, alas y caderas, y color no emisivo. **No ha sido posible ejecutar Angular/WebGL aquí**: el usuario debe revisar el resultado visual en la galería y especies reales.
