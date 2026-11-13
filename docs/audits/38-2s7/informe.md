# GENESIS Web — 38.2s7: reconstrucción del vestuario visible (reptilianos ADVANCED)

## Incidencia reproducida en las capturas

La galería 38.2s6 muestra `ERROR: vestuario no aplicado` en los 24 contratos y el visor conserva la camiseta ajustada y la banda diagonal del renderer heredado 38.2o. Se habían construido planes de ropa, pero la integración no garantizaba una malla 3D visible.

## Diagnóstico de código

1. El renderer 38.2s2 construía primero el reptiliano del renderer 38.2o completo y vestido.
2. Intentaba retirar únicamente ciertas etiquetas de ropa antigua y añadía mallas 38.2s4, cuya cobertura geométrica dependía del modelo anterior.
3. El verificador 38.2s6 rechazaba la salida si faltaban ciertas etiquetas o piezas, dejando todas las miniaturas sin representar.
4. La fábrica de escena se había parcheado mediante varios scripts sucesivos. La selección para ADVANCED podía no quedar aplicada de forma idéntica en todas las instalaciones.

## Corrección

- Se entrega **la fábrica de escena** con la rama `REPTILIAN/ADVANCED` ya conectada, sin necesidad de más scripts de integración.
- `vida38-advanced-reptilian-preview-38-2s2.ts` utiliza el cuerpo SDF reptiliano pero elimina expresamente los restos del vestuario 38.2o antes de dibujar nuevas prendas.
- Nuevo módulo `vida38-advanced-reptilian-visible-wear-38-2s7.ts`: chaqueta exterior 360°, mangas, pantalones, botas, cinturón y detalles macroscópicos; variaciones de científico, técnico, astronauta, diplomático, explorador y seguridad.
- El verificador 38.2s6 reconoce ahora la geometría exterior 38.2s7 y sólo reconstruye si es antigua.
- La caché de miniaturas se invalida mediante revisión 38.2s7.
- La galería presenta el **mensaje de error concreto** de la excepción si algún ejemplar falla, no una afirmación genérica sobre el vestuario.

## Restricciones

- El nuevo código se activa exclusivamente con `contract.morphology.group === 'REPTILES'`, `intelligence.lineage === 'REPTILIAN'` y `intelligence.civilizationTier === 'ADVANCED'`.
- Se conservan los renderers aprobados `VERY_ADVANCED`: reptilianos 38.2o, insectoides 38.2q y humanoides 38.2r.
- Ni generador del universo ni persistencia se modifican.

## Verificación en entorno de construcción

- Auditoría estructural Node: aprobada.
- Transpilación sintáctica TypeScript: aprobada en los archivos modificados.
- **Pendiente**: typecheck real Angular, tests Vitest y validación WebGL en el proyecto completo de Windows.
