# VIDA.9b — Lectura efectiva CT-0 y ficha planetaria compacta

## Problema reproducido

La fila del Explorador para Phiater B-2 conservaba temperatura 36,3 °C, presión 2,6932084 bar y O₂ 3,075766 % derivados de la generación planetaria anterior a VIDA.5. La ficha científica, tras el acoplamiento biogeoquímico, publicaba temperatura 300,27 K (27,12 °C), presión 182.142,65 Pa (1,8214265 bar) y O₂ ≈ 19,1 %.

## Contrato del cambio

1. **Fuente única:** los planetas confirmados V3 del catálogo usan la misma cadena de lectura VIDA.2→3→4→5a→5b→5c y `Vida5BiogenicAtmosphere.applyToTarget` que `PlanetScientificCardAssembler`. No se añade ningún motor ni tirada nueva. Los gases y la presión se derivan de `currentTarget.detail.atmosphere`; la temperatura, de `currentTarget.detail.climate`. Las columnas de filtros y de ordenación siguen tomando esos mismos campos.
2. **Caché:** el snapshot público derivado V3 añade `effectivePhysicalProjectionVIDA5:1`. Los registros antiguos carecen del marcador y se reconstruyen al leer la galaxia; después se reutilizan. No se toca el esquema IndexedDB V10, los descubrimientos ni el contenido privado de VIDA.9. V1/V2 y escenarios compactos/post-colapso conservan sus propias restricciones de evidencia.
3. **Sin física ficticia:** si un planeta V3 confirmado no puede caracterizarse con el resolver, la temperatura, la presión y la mezcla gaseosa quedan sin resolver en el catálogo, en lugar de mostrarse falsamente como efectivos valores PRE-VIDA.5.
4. **Ficha compacta:** general deja un único periodo de rotación con nota que aclara su diferencia respecto del día solar. Superficie tiene los ocho campos indicados; Geología los seis indicados. Desaparecen de esas secciones los apéndices técnicos PRE-33.07/08/09. Las tres notas atmosféricas solicitadas se ocultan; la explicación del efecto invernadero permanece. La auditoría VIDA.9a y el panel VIDA.9 no se eliminan.
5. **Lunas:** lista `<details>` semántica, inicialmente plegada, cabecera completa, badges y rejilla de datos al desplegar. El contenido físico y las rutas a la ficha lunar no cambian.

## Regresión e invariantes

- No se alteran semillas ni IDs, biodiversidad ni poblaciones/civilizaciones/colonias.
- Se preserva el estado `CONFIRMED` como única fuente de revelación total.
- Valores PRE-VIDA.5 siguen disponibles en la auditoría, pero no sustituyen las condiciones actuales de la fila del catálogo.
- Los valores de agua superficial que VIDA.5 no recalcula permanecen en el mismo modelo, sin reinterpretaciones.
- Los cálculos físicos PRE-33 no se borran: únicamente se dejan de mostrar en la ficha resumida.
- La primera construcción de un catálogo V3 puede tardar más que una restauración desde caché, ya que reconstruye la caracterización efectiva de cada planeta confirmado. Revisar rendimiento con el censo real antes de considerar la parte no bloqueante plenamente validada.

## Validación local

- Arquitectura: PASS (6 capas).
- Auditoría Node `scripts/auditar-genesis-vida9b.spec.cjs`: 4/4.
- Compilación Angular/Vitest: no ejecutada en este entorno sin dependencias instaladas; pendiente en la máquina del usuario.
