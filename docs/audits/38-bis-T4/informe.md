# GENESIS 38.bis-T4 — Paridad de colonias planetarias

## Reproducción del defecto

El Archivo 38.bis indexa colonias desde `DexieVida9BiologyExplorationRepository.get()` (registros VIDA.9 inmutables, verificados) para sistemas `CONFIRMED`. La ficha planetaria, por el contrario, presentaba `card.confirmedBiologyVIDA9` generado en `PlanetScientificCardAssembler` y construía los planes 3D desde esa proyección diferente. El mismo problema fue resuelto anteriormente para lunas (38.bis-a4), pero no se aplicó a planetas.

Ejemplos aportados: Aetor b, Chakos B-2 y Chakos B-5 constan con colonias en Archivo, pero sus fichas muestran 0. No se trata de una contradicción física: los asentamientos de VIDA.8 pueden emplear hábitats sellados en entornos extremos. El error es de **fuente de datos de presentación**, no de VIDA.8.

## Corrección

- Nuevo lector confirmado y de solo lectura: obtiene `PLANET:-` desde la misma tabla VIDA.9 que indexa Archivo, valida identidad, revisión, digests y coherencia colonial. Falla cerrado: dato ausente/corrupto es **no evaluable**, no `0`.
- Planeta seleccionado: efecto Angular asíncrono con cancelación lógica por ruta/universo. Si el registro aún no se ha materializado y ya hay candidato confirmado, usa el mecanismo existente `ensureBiologyVIDA9` que **preserva** el registro previo y lo relee. Nunca se sobrescribe un CT-0 divergente.
- Sección Vida y vista 3D consumen el mismo registro persistido. Los planes `VIDA8_COLONIAL_SETTLEMENT` pasan al renderizador de infraestructuras 38.6 que ya soporta planetas y lunas. No se inventan coordenadas observadas: las posiciones siguen siendo visuales y deterministas.
- Continúan diferenciadas las colonias de una civilización nativa. Sin civilización nativa no se activa iluminación urbana nativa.
- Se conserva la forma, la geografía, las nubes, las órbitas, los datos físicos y las lunas de contexto.

## Exclusiones explícitas

No se tocan modelos VIDA, motores V3, estructura de IndexedDB, índices persistidos (210/210), orbitales VISCIV ni superficies VISSURF. No se cambia el propio generador de edificios. **Este paquete no demuestra todavía en navegador el tamaño aparente o visibilidad de cada instalación desde todos los ángulos.**

## Verificación

- `node scripts/auditar-genesis-38bis-t4.spec.cjs` — auditoría estructural portable.
- `npx ng test --watch=false --include=src/app/presentation/planet-detail/planet-confirmed-biology-38bis-t4.spec.ts` — tests IndexedDB real simulado, bloqueos de descubrimiento, corrupción, identidad, infraestructura y civilización.
- Validar además ficha y escena 3D con los tres casos reportados y su mismo universo; no borrar la base existente.

La ejecución Angular/Vitest/WebGL completa requiere el entorno del usuario.
