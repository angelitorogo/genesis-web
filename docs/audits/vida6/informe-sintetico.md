# VIDA.6 — Auditoría sintética de integridad de ecosistemas

Muestreo ejecutado **en el motor real** (TypeScript transpile + SHA-256 de `node:crypto` como sustituto equivalente de las funciones de hash) con 400 seeds por cada uno de cuatro escenarios ilustrativos. **No es un censo de Elixisis ni prueba de probabilidades poblacionales**: las condiciones de vida y calibracion favorable se inyectaron artificialmente para probar invariantes.

| Entorno simulado | Escenarios | Especies total | Regla |
|---|---:|---:|---|
| Planeta de superficie favorecida, 8 grupos establecidos | 400 | 17.541 | Aumento de diversidad |
| Luna de subsuelo aislado, vida microbiana original | 400 | 1.139 | Maximo 4 especies, microbios/hongos |
| Luna con filtracion protegida, vida microbiana original | 400 | (incluido en total de 400 casos; 1-2 por mundo) | Solo microorganismos |
| Planeta esteril | 400 | 0 | Ningun taxon creado |

- 18.151 relaciones ecologicas totales en los 1600 escenarios; todas las claves existen, ningun lazo consigo misma.
- Todas las relaciones `CONSUMES` apuntan de un nivel biologico superior a un nivel inferior.
- Determinismo: entradas iguales producen snapshots y digests identicos en repeticiones, independientemente de otras consultas.
- Serializacion JSON sin perdida de contenido.
- `intelligentSpeciesGenerated` y `civilizationGenerated` siempre `false`.
- La persistencia IndexedDB debe validarse con Vitest `dexie-vida6-ecosystems-species.repository.spec.ts` en el entorno del proyecto.

Estas cifras no reemplazan el censo VIDA.5c (no tocar IndexedDB ni seed).
