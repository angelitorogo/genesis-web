# GENESIS Web · 38.2o.e8b — Coherencia de selección de indumentaria y validación por familia

## Diagnóstico
Las armaduras e8a solamente se construyen para `SEGMENTED_ARMOR` y `COLONIAL_RIG`; las túnicas acampanadas que se observaron en algunas capturas eran generadas por el motor blando e7c. Por tanto, modificar e8a no podía afectar a ese ejemplar.

## Implementación
- Selector determinista compartido entre producción y laboratorio (`vida38-reptilian-wardrobe-coherence-38-2oe8b.ts`).
- La **línea funcional** limita las familias admisibles y la **cultura** modifica su distribución:
  - militar → armadura, equipo técnico o traje integral;
  - explorador → equipo técnico/colonial o traje integral;
  - colonizador industrial → equipo colonial o traje integral;
  - científico → traje integral, ceremonial científico o velo pelágico;
  - tecnosacerdotal → túnica, manto u armadura ceremonial;
  - noble → manto, túnica, velo pelágico o blindaje ceremonial.
- El visor sigue utilizando exactamente los motores d5 (traje integral), e7c (prendas blandas) y e8a (armadura), sin retocar sus geometrías.
- La galería muestra **familia prevista**, **motor**, **coincidencia con metadatos del cuerpo renderizado** y, para e7c, **silueta, relación de anchura del bajo/cintura y aviso de faldón amplio**.
- Se conservan las 24 identidades preexistentes de la galería; cambia la prenda seleccionada para identidades cuya función no era coherente con la familia anterior.

## Casos de regresión conocidos
- Ejemplar 7: tecnosacerdotal, `CEREMONIAL_ROBES`, motor e7c.
- Ejemplar 121: colonizador industrial, `COLONIAL_RIG`, motor e8a (antes tenía prenda blanda).
- Ejemplar 18: científico pelágico, `PELAGIC_DRAPE`, motor e7c.
- Ejemplares 35 y 54: militares, armadura e8a.

## Validación local
- Auditoría Node: 4096 identidades, 6 familias, 3 motores y coherencia funcional.
- Transpilación TypeScript: sin errores de sintaxis.
- Tests Vitest y build Angular/WebGL no disponibles en el entorno de empaquetado.

## Compatibilidad
Sin cambios en cuerpo SDF, ojos, cola, accesorios, motor geométrico de túnicas e7c, motor geométrico de armaduras e8a, shaders técnicos ni persistencia IndexedDB.
