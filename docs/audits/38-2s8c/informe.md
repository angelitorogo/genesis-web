# GENESIS Web — 38.2s8c · Reconciliación de regresiones

## Alcance

**Solo tests, fixtures de test y herramientas de auditoría. No se modifica código de producción ni aspecto WebGL.** Basado en la batería de 55 errores de 44 archivos del 11/11/2026 y los resultados aislados posteriores (38.2s7 y 38.2s8 pasan aislados; 17 archivos del grupo assertions fallaron aisladamente).

## Reconciliaciones implementadas

| Área | Causa original | Reconciliación |
|---|---|---|
| 38.2o.e7 / e7b / e7c / e8 / e8b | Uso de `ordinal` 2, 7, 17, 18, 35 o 121 como si necesariamente pertenecieran al subconjunto de 24 | Helper de prueba capaz de reconstruir exactamente las identidades del catálogo de 360 sin alterar la galería pública |
| 38.2o.d5 / e / e2 | `FULL_360` se exigía a todas las familias; ahora solo corresponde a `TECH_SUIT` | Buscar un contrato CT-0 cuya **familia efectiva** sea `TECH_SUIT` antes de comprobar shader, cobertura, paleta y marca única |
| 38.2o.d3 | Marcador `vida38Full360Suit38OD5` exigido incluso a mantos/armaduras | Validar que el marcador coincide con `garmentFamily === 'TECH_SUIT'` |
| 38.2o.d2 | Pie en una altura absoluta anterior a la normalización; prendas antiguas exigidas para el nivel `ADVANCED` | Comprobar anclaje relativo a los límites actuales de `subject` e incluir las mallas modernas S4/S8; prueba de ajuste al SDF anterior solo para `PRIMITIVE` |
| 38.2o.e6a | Exigía adornos con prefijos `BASILICA_`/`PELAGIC_` eliminados al reemplazar los parches por tejidos orgánicos | Validar culturas distintas, identidad cultural y geometrías reales de prenda |
| 38.2o.e8 | Muestra sesgada: `i%2` y `i%6` relacionaba cada familia con solo 3 culturas | Cruzar expresamente 2 familias × 6 culturas × 16 semillas; mantener exigencia de las 4 siluetas |
| 38.2o.e9 | Exigía 5 sesgos de accesorio en 24 ejemplares seleccionados por diversidad combinada | Comprobar 3 o más en 24 y **5 o más en la población de 360**, sin alterar producción |
| 38.2q1a | Esperaba `vida38CivilInsectoidOrganicRevision38Q1A` tras evolución anatómica Q1B | Verificar marcador del renderer Q1B realmente activo |
| Preview 38.2 | Civilización reptiliana `VERY_ADVANCED` aún se esperaba cuadrúpeda y diferida | Validar especialización bípeda vigente y no diferida |

## Auditoría ejecutada en la sesión

- El contrato de 24 muestras contiene 24 identidades y seis culturas.
- La población de 360 identidades produce 360 firmas diferentes.
- Sesgos de accesorio: **3** en la selección de 24 y **5** entre 360 candidatos.
- Ordinales reproducidos y familias: **7 ceremonial, 35 blindaje segmentado, 121 equipo colonial**; 17 corresponde a `BASILICA_TECHNOCRACY` y 18 a `PELAGIC_CONCORD`.
- Un muestreo cruzado independiente de 192 planes del motor e8 proporciona las **cuatro siluetas** (`CARAPACE`, `TACTICAL_LAMELLAR`, `INDUSTRIAL_HARNESS`, `FIELD_EXPLORER`).
- 16 archivos TypeScript del paquete superan la comprobación sintáctica.

## Pendientes expresamente NO modificados

1. **CANOPY (38.2l.a):** el test original espera una rama decorativa para una especie no vegetal. Puede contradecir eliminaciones posteriores de elementos de soporte. No se modifica sin inspeccionar el test y el código actuales completos.
2. **Dentición (38.2j.b):** no aparece el objeto `VIDA38_2JB_MOUTH_SEAM`. Puede deberse a otra ruta facial o ser un fallo real. No se toca un renderer aprobado sin identificar la causa.
3. **VISCIV.2:** 12 satélites frente al máximo 9 y radio 2,539584 frente a 2,5. Está separado en el paquete de auditoría orbital independiente; **NO resuelto**.
4. **35 timeouts originales:** la batería aislada de los 44 archivos y la general deben ejecutarse en el proyecto Windows del usuario. Los dos tests específicos 38.2s7/s8 ya pasaron aislados en los resultados aportados; no extrapolar al resto.

## Contratos de seguridad

- Ningún archivo `.ts` de producción.
- No se cambia un píxel de ninguna de las tres civilizaciones muy avanzadas.
- No se añade ni elimina especie de la galería real.
- No se debilitan límites físicos para hacer pasar pruebas.
- Las pruebas que sigan fallando deberán conservar su log completo mediante el nuevo runner.
