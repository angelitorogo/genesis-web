# VIDA.3 — Auditoría determinista de plausibilidad y microbios
Semilla: 7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5. Muestra sectorial determinista, **no censo** de toda la galaxia.
Solo lectura; no modifica las partidas ni la IndexedDB. No valida detección de vida.

| Galaxia | Sistemas | Planetas plausibles / total | Lunas plausibles / total | Planetas microbianos | Lunas microbianas | Huecos físicos | Errores |
|---|---:|---:|---:|---:|---:|---:|---:|
| Elixisis | 20 | 12/145 | 31/262 | 1 | 7 | 1 | 0 |
| Elisoune | 20 | 23/140 | 39/231 | 4 | 8 | 0 | 0 |
| Ilyzenia | 20 | 11/98 | 39/198 | 1 | 7 | 0 | 0 |

Los huecos físicos quedan excluidos, no etiquetados como mundos estériles. La incidencia esperada es 20% de los mundos plausibles a gran escala, sin forzar vida en ningún sistema.

## Límites de la ejecución de referencia

- 60 sistemas completos muestreados, **no** todos los sistemas de las tres galaxias. Solo lunas relevantes caracterizadas, no lunas menores solo-identidad.
- Un sector adicional en Elixisis produjo `NON_CONVERGED_PHASE_MODEL`; sus cuerpos se excluyen del denominador, sin considerarlos estériles. La incidencia debe revisarse si aumenta el número de huecos.
- Para reproducir los SHA-256 en este entorno aislado se utilizaron las operaciones SHA-256 estándar de Node `crypto` como adaptador temporal de la API de noble. No se empaqueta ningún adaptador: en el proyecto el motor usa `@noble/hashes` del `package.json`.
- Es necesaria una validación adicional con el npm real, Vitest/Angular, y el almacenamiento IndexedDB del usuario para certificar la funcionalidad end-to-end.
