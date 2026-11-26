# GENESIS MOONCAD.2 — Cadencia orbital lunar lenta y acotada (12–30 s)

Fecha: 2026-11-26. Alcance: solo presentación 3D.

## Problema confirmado

El contrato MOONCAD.1 utilizaba un reloj común: el satélite de mayor período científico completaba una vuelta visual en 90 s, pero los períodos de los demás satélites se conservaban proporcionalmente; algunas lunas completaban una órbita en menos de 2 s. El reloj común NO garantizaba un límite inferior individual.

## Contrato implantado

- La luna con menor semieje mayor físico de **cada planeta anfitrión** completa su órbita visual en **12 s**.
- La luna con mayor semieje mayor físico de ese mismo planeta la completa en **30 s**.
- Las lunas intermedias se reparten mediante **interpolación lineal por rango orbital distinto**, de forma ordenada y determinista, ignorando el tamaño comprimido de su órbita en pantalla. Ejemplos: 3 lunas → 12/21/30 s; 4 → 12/18/24/30 s; 5 → 12/16,5/21/25,5/30 s.
- **Una sola luna:** 21 s (punto medio). Ejes repetidos: misma duración; sin velocidad dependiente del orden ni del foco.
- El período orbital **científico** no cambia: la escala visual por luna es `periodDays / (duracionVisualSegundos * playbackDaysPerRealSecond)`; en la ficha es `periodDays / duracionVisualSegundos`.
- No cambia el movimiento de planetas ni estrellas, la rotación axial de las lunas, las fases iniciales, inclinaciones, excentricidades, distancias, ni la persistencia de datos científicos.

## Aplicación uniforme

1. `scientific-body-preview.ts` — ficha planetaria y ficha lunar con contexto: reloj de segundos reales y ritmo propio por luna sobre el mismo instante orbital de referencia.
2. `system-scene-snapshot.ts` — escenas normales SINGLE.
3. `system-scene-multihost-composition.ts` — escenas BINARIAS/TRIPLES en las que se componen anfitriones estelares, agrupadas por planeta.
4. `system-scene-multihost-circumbinary-projection.ts` — planetas circumbinarios y sus lunas.
5. `system-compact-host-secondary-scene.ts` — anfitriones compactos, agrupados por planeta.

El API MOONCAD.1 queda disponible para contratos históricos del laboratorio, pero no gobierna estas cinco rutas de presentación de lunas. Su antiguo auditor Node delega las verificaciones actuales a MOONCAD.2 y comprueba la conservación de su API pública.

## Verificaciones ejecutadas en esta copia

- `node scripts/auditar-genesis-mooncad2.spec.cjs` → 142/142 comprobaciones.
- `node scripts/auditar-genesis-mooncad1.spec.cjs` → correcto, delegación y API histórica.
- `tsc --strict --noEmit --target ES2022 --lib ES2022,DOM src/app/presentation/system/system-scene-secondary-motion.ts` → correcto.
- Transformación y sintaxis TS de todos los archivos modificados → correcto.
- `scripts/verify-architecture.mjs` no pudo superar su comprobación en la **copia parcial** disponible: falta la carpeta raíz `src/app/observation`; no es un fallo observado en el repositorio local del usuario.
- No se ejecutaron las pruebas Angular/Vitest ni el build del proyecto completo porque la copia disponible no incluye `node_modules`.

## Riesgos y comprobación de aceptación

Comprobar en el proyecto real fichas planetarias, Single, Binary, Triple, circumbinarios y anfitriones compactos. Una vuelta tarda entre 12 y 30 s reales **con animación activada**. La cámara de seguimiento no cambia y la luna puede salir del encuadre al acercarse si el seguimiento no está activado. En una órbita elíptica la rapidez angular instantánea varía por la segunda ley de Kepler, pero el ciclo orbital completo sigue respetando los 12–30 s.
