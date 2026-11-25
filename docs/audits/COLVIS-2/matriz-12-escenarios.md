# COLVIS.2 — Matriz de doce escenarios sintéticos

**Verificación automatizada del planificador: realizada.** Las cifras de piezas, huellas y alturas no son medidas científicas sino parámetros representativos del render. **Inspección estética real en WebGL: pendiente en equipo usuario.**

| Morfología | Tecnología | Destino | Piezas HD | Piezas medium | Huella (radio km) | Altura máxima (km) | Revisión visual |
|---|---|---|---:|---:|---:|---:|---|
| HUMANOID | ADVANCED | PLANET | 24 | 7 | 2.342 | 0.250 | **WebGL pendiente** |
| REPTILIAN | ADVANCED | PLANET | 26 | 8 | 2.342 | 0.250 | **WebGL pendiente** |
| INSECTOID | ADVANCED | PLANET | 27 | 7 | 2.342 | 0.250 | **WebGL pendiente** |
| HUMANOID | VERY_ADVANCED | PLANET | 33 | 10 | 1.920 | 0.730 | **WebGL pendiente** |
| REPTILIAN | VERY_ADVANCED | PLANET | 39 | 11 | 1.920 | 0.730 | **WebGL pendiente** |
| INSECTOID | VERY_ADVANCED | PLANET | 39 | 10 | 1.920 | 0.730 | **WebGL pendiente** |
| HUMANOID | ADVANCED | MOON | 25 | 8 | 1.874 | 0.250 | **WebGL pendiente** |
| REPTILIAN | ADVANCED | MOON | 27 | 9 | 1.874 | 0.250 | **WebGL pendiente** |
| INSECTOID | ADVANCED | MOON | 28 | 8 | 1.874 | 0.250 | **WebGL pendiente** |
| HUMANOID | VERY_ADVANCED | MOON | 34 | 11 | 1.536 | 0.584 | **WebGL pendiente** |
| REPTILIAN | VERY_ADVANCED | MOON | 40 | 12 | 1.536 | 0.584 | **WebGL pendiente** |
| INSECTOID | VERY_ADVANCED | MOON | 40 | 11 | 1.536 | 0.584 | **WebGL pendiente** |

## Inspección visual reproducible

Abrir `http://localhost:4200/laboratorio/colvis1` (conservada para compatibilidad; contiene COLVIS.2).

1. Mantener `CITY`, `SEALED_SURFACE`, `RESEARCH` y la semilla por defecto; comparar las seis familias con la misma categoría de población.
2. Pulsar **Comparar silueta monocroma**: no deben depender del color para distinguirse.
3. Contrastar cada variante PLANET/MOON.
4. Cambiar a OUTPOST, NETWORK, SUBSURFACE_VAULT y ENVIRONMENTAL_SHIELD, observando proporción y protección.
5. Cambiar semilla; comprobar variantes sin romper la gramática de cada familia.
6. Validar en el universo real una colonia confirmada de planeta y otra de luna usando el selector **Inspeccionar colonia** de sus fichas. Comprobar terreno, cámara y regreso a vista general.
7. Revisar colonias en `SystemScene`, como mínimo con zoom próximo y lejano. Nunca confundir el anillo de localización con una estructura.

**Criterio de cierre:** aprobar visualmente los 12 escenarios y al menos una colonia planetaria/lunar persistida. No basta con los tests.
