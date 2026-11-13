# GENESIS Web — 38.2g.c: Refinamiento craneofacial y cutáneo humanoide

**Estado:** Implementación incremental para validar en Angular; **no se cierra visualmente** hasta inspeccionar especies reales.

## Diagnóstico previo

En 38.2g.b el ojo se situaba demasiado por delante del reborde orbital del SDF, de manera que parecía una esfera flotante. Se observaban también grandes regiones de pigmentación plana, escaso microdetalle apreciable en piel y superficies corporales muy suavizadas.

## 1. Anatomía y SDF

**Archivo:** `vida38-humanoid-organic-field-38-2e.ts`.

- Nuevo cálculo compartido `deriveVida38HumanoidFaceLandmarks38GC` para coordinar alturas y profundidades del globo ocular con la cavidad SDF.
- Globo reducido al 80 % del radio anatómico nominal y reubicado detrás del reborde orbital. El ojo deja de salir hacia delante respecto al borde de la cavidad.
- Cavidad orbital más profunda y párpados superior e inferior esculpidos directamente en el SDF.
- Puente nasal y transición pómulo-mejilla con unión suave.
- Hendidura bucal menos profunda, comisuras integradas.
- Continuidad cervical con trapecios y zona clavicular sobre la malla SDF única.
- Región palmar, eminencias de la mano, arco/talón/metatarsos del pie reforzados en el mismo campo.

No se añaden articulaciones mecánicas ni mallas corporales flotantes. Los globos oculares se mantienen como objetos anatómicamente independientes pero alojados en la cavidad.

## 2. Cutis y shader

**Archivo:** `vida38-humanoid-organic-material-38-2e.ts`.

- Revisión `VIDA.38.2g.c/organic-integument-facial-anatomy/v1` con nueva clave de caché del shader.
- Manchas macroscópicas con transición coloreada más extensa, no umbrales visualmente rígidos.
- `vida38CutaneousMottle` introduce microvariación cromática regional incluso en pigmentación SOLID.
- `vida38MicroscopicLod` calcula una atenuación del detalle según huella proyectada en metros usando derivadas `dFdx/dFdy`.
- El relieve de poros, escamas y fibras se atenúa cuando la escala proyectada no lo resuelve.
- Rugosidad regional y microvariación ligadas a la misma coordenada anatómica estable; brillo especular controlado.
- Se mantiene la pigmentación VIDA, sin inventar colores ni datos de especie.

## 3. Determinismo y límites

- No modifica VIDA.6/7/8/9, IndexedDB, las semillas del universo, VIDA.T1 ni el contrato 38.1.
- Conserva las reglas 38.2f de identidad morfológica independiente de pigmentos.
- No cambia otros renderizadores de especies ni los cuerpos físicos.
- La geometría sigue siendo reconstrucción científica-artística hipotética, no observación instrumental.

## 4. Auditorías realizadas

En tres identidades de prueba (`Kamera ix1`, `Sania on1`, `Fasyl a3`) se verificó:

- SDF con una sola componente, sin bordes abiertos ni aristas no manifold.
- Normales/topología válidas y longitud corporal derivada de VIDA.
- Los globos oculares situados dentro del reborde geométrico y al nivel vertical compartido.
- No cambia la anatomía al cambiar pigmentos.

**Limitación:** el entorno de entrega no dispone de dependencias npm utilizables ni de un contexto WebGL. La sintaxis TS y la auditoría geométrica se comprobaron con un compilador TypeScript global; **no se afirma haber ejecutado aquí el build Angular, las pruebas Vitest o una compilación real del shader GPU**. La comparación incluida es de geometría neutral de diagnóstico, no de piel PBR WebGL.

## 5. Aceptación visual pendiente

Confirmar sobre Zulix en7, Sania on1 y Fasyl a3 (y si está disponible Kamera ix1):

1. Frontal y tres cuartos: ojos no salientes, párpados cerrando la órbita y boca sin abertura artificial exagerada.
2. Primer plano rostro/piel: granulado biológico moderado, patrón natural y manchas no planas.
3. Zoom y rotación: patrón anclado al cuerpo, sin shimmering ni grano pixelado.
4. Vista lateral y posterior: transiciones cuello/hombro y musculatura sin separaciones.
5. Manos/pies: mejor volumen, sin perder continuidad.
6. Regeneración/cambio de página: misma especie = misma morfología y patrón.

No marcar 38.2g.c como **CERRADA** hasta que la evidencia de la aplicación demuestre la mejora perceptible.
