# VISCIV.6j — Iluminación arquitectónica avanzada de anillos orbitales

## Base y alcance

Parche incremental **sobre VISCIV.6i.a** (y por extensión 6e, 6f, 6g, 6h, 6i). Se mantiene la orientación orbital y el catálogo VIDA/CT-0 intactos.

## Implementación

`system-scene-orbital-illumination-visciv6j.ts` añade capas arquitectónicas instanciadas:

- **HABITAT:** 224 ventanas de arcologías, con ocupación y tonalidad deterministas (blanco azulado y ámbar) y 64 tramos luminosos de avenidas.
- **INDUSTRIAL:** 80 puntos de actividad en diques secos, 32 señales de pórticos con tonos cálidos y contrastes azulados.
- **TRANSPORT:** 192 tramos en dos corredores de transporte y 24 luminarias de terminales.
- **NODOS:** 4 focos por nodo principal: 32 en hábitats, 40 en industriales, 24 en transporte.

Se usan **tres instancias GPU por anillo** (`InstancedMesh`), reutilizando 6g para el control nocturno; no se añaden luces físicas ni se crean geometrías/materiales por fotograma. Los colores de instancia cambian según iluminación estelar (también multiestrella) y el plano orbital actual, mientras las matrices de geometría permanecen constantes. La función VISCIV.6g y las balizas existentes se conservan.

## Pruebas

- Nuevo Vitest `system-scene-orbital-illumination-visciv6j.spec.ts`: diferenciación de categorías, control hemisferio diurno/nocturno y multiestrella, ventanas apagadas y encendidas, ausencia de luces físicas, recursos, determinismo y matrices inalteradas.
- Auditoría portable `scripts/auditar-genesis-visciv-6j.spec.cjs`.
- Recomendadas suites VISCIV.6g/6h/6i, arquitectura y `ng build`.

## Limitaciones de validación

En el entorno de creación se ejecutó la auditoría portátil y comprobación de sintaxis TypeScript. Los tests Angular/Vitest completos y la validación visual requieren el proyecto instalado con sus dependencias.
