# Auditoría VISCIV.6h — Planos orbitales desacoplados

- **Base:** VISCIV.6g, verificado por hash antes de editar.
- **Ámbito:** solo `buildSystemSceneOrbitalRingPlansV1` y 3 pruebas de regresión (VISCIV.4, 6g, 6h).
- **Identidad:** mismo seed/saltes canonizados. Sin cambios en radio, módulos, acabados, tier, estación, satélites, timing, materiales, iluminación o IndexedDB.
- **Anillo único:** valores de VISCIV.6g intactos (fixtures semillas 0 y 7919).
- **Múltiples:** anillo principal estable; secundarios con nodos e inclinaciones únicos reproducibles; diferencias efectivas entre planos.
- **Seguridad geométrica:** separación garantizada por envolventes radiales (cascarones concéntricos disjuntos), incluso con planos inclinados. Los anillos pueden parecer cruzarse en proyección, pero no intersecan sus estructuras.

### Comprobaciones realizadas

- Auditoría portable Node + transpilation TS: **4096 semillas correctas**.
- Configuraciones 1/2/3; ángulo entre planos **7.0°–28.1°** en el muestreo.
- Margen mínimo de envolvente radial **0.122 radios planetarios** en el muestreo, incluyendo un margen conservador de 0.12 por cada anillo más media banda.
- ADVANCED sigue sin anillos; VERY_ADVANCED mantiene estaciones y satélites; determinismo probado.
- Auditoría precedente VISCIV.6g: **2048 semillas correctas**.
- Arquitectura GENESIS: `verify-architecture.mjs` **PASSED** (1216 TS producción).
- Parseo de sintaxis de los cuatro `.ts` afectados o añadidos: **PASSED**.
- **Pendiente en entorno usuario**: Angular/Vitest/Playwright y comprobación visual real de dos y tres anillos. No se afirma haberlos ejecutado.
