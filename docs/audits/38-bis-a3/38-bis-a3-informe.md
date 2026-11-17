# 38.bis-a3 — Informe de implementación

**Tipo:** reconciliación de lectura, no destructiva, con prueba determinista.  
**Alcance:** referencias de colonia VIDA.8 frente a fuente natal VIDA.9 previamente persistida y confirmada.  
**Evidencia original:** 17 orígenes clasificados como `SOURCE_DIGEST_MISMATCH` en una partida con 15 galaxias (valores observados, no asumidos como resultado de esta ejecución).  

El validador 38.bis-a2 identificaba el error compuesto de digest y no podía demostrar continuidad histórica. El nuevo flujo solo reevalúa la fuente de un planeta natal confirmado cuando hay *digest mismatch*. Para reconciliar exige dos digests exactos, especie + grupo, linaje + nivel, cadena VIDA.6/7, tecnología y firmas deterministas de colonia y asentamiento. La discrepancia no se perdona ni se oculta: se conserva como `historicalOriginReconciled` y se muestra como tal.

**Regla de seguridad:** sin prueba completa, no existe fundadora atribuida ni enlace al origen. La ausencia de testigo o una divergencia real siguen marcadas como pendientes; no se reescribe la historia CT-0.

**Ejecución local de desarrollo:** arquitectura PASSED (6 capas, 1219 fuentes TypeScript), compilación TS estricta de reconciliador/modelos puros PASSED utilizando declaración temporal de `@noble/hashes` porque no están las dependencias completas, 10/10 pruebas aisladas del reconciliador PASSED. TypeScript sintáctico de cinco archivos PASSED. Las pruebas completas Vitest/Angular/Dexie quedan pendientes de Windows.

**Cobertura futura:** añadir verificación end-to-end de las 17 colonias de la partida con reporte de coincidencias históricas y pendientes. No se conoce el resultado numérico real todavía.
