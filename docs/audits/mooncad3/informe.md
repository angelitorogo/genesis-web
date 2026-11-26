# GENESIS MOONCAD.3 — Auditoría y contrato visual de velocidades lunares

## Diagnóstico

MOONCAD.2 normalizaba el tiempo de revolución a 12–30 segundos reales por rango orbital, sin considerar el recorrido. Una luna exterior proyectada sobre una órbita grande podía desplazarse demasiado deprisa, y una órbita excéntrica aceleraba aún más cerca del periapsis.

## Contrato

Solo afecta al tiempo de presentación de las contribuciones lunares de cada planeta, no al Ground Truth ni a los tiempos de planetas, estrellas, cuerpos menores o rotaciones propias.

* Luna interior circular: no menos de 30 s por vuelta.
* Luna exterior (al menos dos semiejes diferentes): no menos de 120 s por vuelta, sin máximo fijo.
* Una sola luna (o todas con idéntico semieje): no menos de 60 s.
* Intermedias: base 30 + 90 * rango / (n - 1), con rango ordenado por semieje mayor físico (no la cámara).
* Protección de velocidad tangencial (incluido periapsis) por comparación con la órbita interior circular de 30 s:

  `T >= 30 * (a / a_min) * sqrt((1 + e) / (1 - e))`.

**T** es el tiempo de una revolución en segundos reales; **a** es el semieje mayor físico, **a_min** el mínimo dentro del mismo anfitrión y **e** su excentricidad. `T = max(T_base, T_por_velocidad)`.

Ejemplos de radios 1/2/3 con e=0: 30/75/120 s. Radios 1/5/20 con e=0: 30/150/600 s. Las órbitas pueden durar bastante más si la separación física entre lunas es enorme. Esto es intencionado para limitar el desplazamiento, aunque no garantiza una velocidad máxima en píxeles con zoom arbitrario: eso requeriría seguimiento de cámara.

El cálculo usa proporciones adimensionales de semiejes reales, por lo que es coherente entre km, UA y radios planetarios, y las fases Keplerianas permanecen sincronizadas entre ficha y escena.

## Integración

* `system-scene-secondary-motion.ts`: API visual V3 y conservación de V1/V2 para contratos históricos.
* `scientific-body-preview.ts`: reloj de presentación individual V3 en fichas planetarias/lunares.
* `system-scene-snapshot.ts`: sistemas SINGLE.
* `system-scene-multihost-composition.ts`: sistemas binarios/triples.
* `system-scene-multihost-circumbinary-projection.ts`: planetas circumbinarios.
* `system-compact-host-secondary-scene.ts`: anfitriones compactos.
* `system-scene-moon-cadence-3.spec.ts`: límite radial, periapsis, variantes de reloj y paridad de posiciones.
* Auditores MOONCAD.1/.2 adaptados solo para no exigir que V2 siga siendo el contrato de producción; sus cálculos históricos permanecen intactos.

No modifica IndexedDB, semilla, fases orbitales científicas, LOD, texturas, cámaras ni animaciones de giro.

## Verificación en entorno de preparación

* `node scripts/auditar-genesis-mooncad3.spec.cjs`: **506 comprobaciones correctas**.
* `node scripts/auditar-genesis-mooncad2.spec.cjs`: **142 comprobaciones correctas** (compatibilidad de funciones V2).
* `node scripts/auditar-genesis-mooncad1.spec.cjs`: correcto (delegación de auditor V2).
* TypeScript `--strict --noEmit` del contrato de cadencia: correcto.
* Fuentes y test nuevos: sintaxis TS correcta.
* Pruebas Angular/Vitest y build completo: **pendientes de ejecutar en repositorio local con dependencias**.
