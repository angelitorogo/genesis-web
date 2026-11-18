# GENESIS VISSURF.5d — Informe técnico

## Base

Aplicar **sobre VISSURF.5c**, con las correcciones de relieve de VISSURF.5a y el pulido VISSURF.5b presentes. Se compararon los archivos principales de esta reconstrucción con sus ZIP originales para asegurar que la base es la misma.

## Causas verificadas

1. **Materiales recortados en albedo:** el generador VISSURF.5 conservaba correctamente las máscaras científicas, pero, al suavizar las fronteras, muestreaba únicamente píxeles de la **misma clase**. Esto conserva las cuotas, pero no genera una transición óptica entre desierto, roca y vegetación. Por eso el modo de diagnóstico `albedo` seguía mostrando placas marrones.
2. **Vegetación con poca estructura aparente:** gran parte de su variedad procede de la modulación cromática de campos de ruido, sin una segunda etapa de densidad espacial ajustada a relieve y entorno. VISSURF.5d introduce regiones coherentes de masa vegetal/claros sin alterar los pigmentos exóticos ni inventar especies.
3. **Relieve y normales:** VISSURF.5a eliminó correctamente las isolíneas cerradas responsables de las formas concéntricas. VISSURF.5d **no cambia las alturas** ni sustituye esas macroformas: solo refuerza muy moderadamente normales de pendientes suaves-medias, con reducción automática del refuerzo en pendientes fuertes.
4. **Agua y reflejo blanco:** el material estándar Three.js combina `roughnessMap` (canal verde), normales, reflejo especular y luces. VISSURF.5c ya calibra la rugosidad oceánica. Las capturas en `surface`/`albedo` no permiten atribuir con certeza la mancha blanca exclusivamente al agua, pues el modo `surface` oculta nubes y atmósfera. Por seguridad, VISSURF.5d evita cambios generales de iluminación, nubes y atmósfera. Añade variaciones de plataforma continental y pequeñas correcciones de rugosidad en aguas costeras, respetando el control anterior.
5. **Composición óptica:** la ruta nativa `MeshStandardMaterial` con su calibración de normales y color, las cadenas de shader multiestralla/día-noche, los efectos atmosféricos y las sombras orbitales permanecen intactas. No se introducen trucos de desenfoque o luz falsa para ocultar defectos.

## Diseño implementado

- Nuevo módulo `system-scene-planet-material-composition-vissurf5d.ts` aplicado **después** de VISSURF.5b y **antes** de la calibración de rugosidad de VISSURF.5c.
- Mezcla estrecha y controlada de **pigmentos** entre materiales terrestres compatibles, con un límite de ~39 %; nunca se mezclan valores de clase ni se altera la línea costera.
- Dos niveles de variación espacial regional para dosel vegetal, claros y regiones secas, usando la **semilla existente** y coordenadas UV planetarias periódicas.
- Tratamiento suave de sedimentos y afloramientos en desiertos, roca, hielo y terrenos volcánicos; sin nuevos campos de alturas ni isolíneas repetitivas.
- Diferenciación costera en el agua (aguas someras/profundas), sin cambiar la máscara ni producir manchas blancas de luminancia aditiva.
- Ajuste moderado de normales en pendientes suaves y medias; ningún refuerzo intenso en gradientes abruptos.
- Misma función integrada en la generación inicial de la ficha 3D y en el LOD de acercamiento de `SystemScene`.
- Planetas lejanos y gigantes gaseosos conservan la ruta anterior, sin HD adicional.
- **Nubes, IndexedDB, persistencia, identidad científica, sombras orbitales y fuentes de luz: inalterados**.

## Validación efectuada en este entorno

- 5 pruebas funcionales de `system-scene-planet-material-composition-vissurf5d.spec.ts` ejecutadas con un transpilador TypeScript y harness aislado: **5/5 PASS**.
- Auditoría portable `node scripts/auditar-genesis-vissurf5d.spec.cjs`: **PASS** sobre tres semillas.
- En la muestra de 1024 × 512: la discontinuidad media de color en fronteras terrestres compatibles disminuyó aproximadamente un **56,5 %** sin modificar las clases.
- En la auditoría portable de 512 × 256: la disminución de saltos en tres semillas fue del **67,5 % al 75,5 %**.
- Conservación exacta de la máscara de clases, del mapa de alturas heredado, del atlas de origen y de la costura longitudinal.
- Coherencia de máscaras entre LOD 1024 × 512 y 2048 × 1024: prueba funcional superada (>94 % en muestreo deliberadamente próximo a transiciones).
- Arquitectura: `node scripts/verify-architecture.mjs`: **PASS**, 6 capas, 1.250 archivos de producción.
- Síntaxis TypeScript de los archivos modificados y prueba de auditoría: correcta.
- Coste aislado aproximado a 2048 × 1024: **0,86 s adicionales** para la composición, después de unos 2,42 s de generación geográfica, en este contenedor. No constituye una garantía de rendimiento de navegador.

## Validación pendiente

No se ha ejecutado aquí la compilación Angular/Vitest oficial ni una escena WebGL real. Por tanto, **la calidad visual final no está certificada**. En particular, si persiste una mancha blanca en la imagen completa pero desaparece en `surface`, debe contrastarse con `clouds` y `atmosphere` para localizar su fuente sin modificar las nubes ya aprobadas.

## Cierre y aceptación visual

Comparar el mismo mundo/semilla, cámara e instante simulado, con modos normal, `surface`, `albedo`, `normals` y `roughness`. Verificar transiciones terrestres no recortadas, vegetación con regiones coherentes, relieve sin anillos falsos, océano legible y ausencia de artefactos nuevos.
