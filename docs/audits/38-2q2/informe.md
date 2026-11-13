# GENESIS Web · Auditoría 38.2q2

## Diagnóstico de partida

Las capturas de las civilizaciones insectoides muestran armaduras y superficies rígidas muy parecidas aunque el motor declare seis familias de ropa. El renderer anterior generaba una base torácica repetida (peto, placas abdominales y paneles estrechos), lo que uniformaba todos los atuendos.

## Intervención

Se sustituye **solo** el renderer de vestimenta `addWardrobe` por `buildVida38InsectoidWardrobe38Q2`:

- **EXO_SUIT**: traje técnico ceñido, sin placas horizontales generalizadas.
- **SEGMENTED_BIO_ARMOR**: coraza biológica segmentada genuina.
- **SCIENTIFIC_HARNESS**: bata científica continua, con abertura frontal y solapas.
- **ROYAL_MANTLE**: túnica interior, manto dorsal amplio y dos caídas frontales.
- **CEREMONIAL_VESTMENTS**: hábito largo 360°, tejido superpuesto y ribetes.
- **EXPLORER_KIT**: poncho asimétrico y faldón de campo.

Las prendas blandas usan superficies radiales continuas con caída, variación de pliegues y ribetes curvos. Las sisas están abiertas por altura y azimut en los dos costados, dejando libres los pares de brazos; el sector dorsal se rebaja si el ejemplar tiene alas.

## Variación por cultura y rol

La cultura determina una paleta y una lectura material estable. La especie varía longitud, amplitud inferior, número de pliegues y detalles mediante su firma. El rol participa en las proporciones sin borrar la selección de familia. No se usa `Math.random`.

## Auditoría ejecutada aquí

- 24 muestras de laboratorio.
- 6 familias de indumentaria.
- 6 culturas.
- 5 familias textiles.
- 4.096 identidades adicionales: 4.093 firmas de vestuario distintas y resultados reproducibles.
- Análisis sintáctico TypeScript sin diagnósticos.

**Limitación:** no se ha ejecutado el build Angular ni la representación WebGL final, porque el entorno de auditoría no tiene los módulos del proyecto (`three`, Angular y Vitest). La calidad visual debe revisarse en el laboratorio del usuario en las tres vistas.
