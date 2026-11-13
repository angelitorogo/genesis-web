# GENESIS — Auditoría 38.2s3 · Rendimiento de galería reptiliana avanzada

## Causa demostrada por inspección

El componente `vida38-advanced-reptilian-gallery-38-2s.component.ts` construía sus miniaturas sin opciones de calidad, de modo que `createVida38SpeciesPreviewModelV1` seleccionaba `HIGH` en `BIPED_BODY`. En el motor SDF humanoide del proyecto, las rejillas son LOW=38×72×30=82.080, HIGH=84×142×64=763.392; HIGH supone aproximadamente 9,3 veces más muestras del campo.

La galería reptiliana MUY_AVANZADA preexistente ya empleaba `LOW` en miniaturas, al igual que la humanoide.

## Corrección

1. Se pasa `{ humanoidQuality: 'LOW' }` mediante una constante exclusiva del laboratorio.
2. Se cachean solo las tres imágenes completas por identidad CT-0, semilla y huella visual.
3. Se reutilizan las imágenes al volver a la sección `Reptilianos · Avanzados`.
4. El caché almacena únicamente cadenas de imagen, no mallas, texturas, materiales ni contextos WebGL, y se limita a 48 identidades.
5. La calidad de visor principal y el renderer `ADVANCED` no cambian.

## Alcance protegido

**No se modifica** ningún renderer de reptilianos, insectoides o humanoides `VERY_ADVANCED`, ni el integrador 38.2s2, ni los contratos, la vestimenta ni la persistencia.

## Validaciones

- Auditor estructural Node: `GENESIS_38_2S3_AUDIT_OK`.
- Tests Vitest `vida38-advanced-reptilian-38-2s3.spec.ts` sobre calidad, caché, identidad y límites.
- Build Angular y captura WebGL en el repositorio del usuario.
