# GENESIS — COLVIS.1 · Informe técnico

## Diagnóstico verificado

En VIDA.38.6 el adaptador conservaba la etiqueta `COLONIAL` y el linaje, pero no entregaba al motor 3D `colony.origin.tier`, `populationBand` con su rango, `settlement.function` ni el tipo PLANET/MOON. El complejo VIDA.38.6c usaba la misma composición de cúpulas, accesos, módulos y antenas para cualquier fundador. Su escala era proporcional al radio de escena y se exageraba mediante multiplicadores ópticos (3,55–4,35), sin conversión explícita a kilómetros físicos.

## Implementación

1. `vida38-infrastructure-plan-38-6.ts`: añade **solo al plan visual** los metadatos de VIDA.8 **ya verificados con el digest VIDA.9**: fundador, nivel ADVANCED/VERY_ADVANCED, linaje, banda y rango de población, función, tecnología de hábitat y tipo de cuerpo. Conserva id, semilla, anclaje CT-0 y `tier='COLONIAL'`. No altera las estructuras persistidas ni la obtención de conocimiento.
2. `colvis1-colonial-architecture.ts`: planificador puro y determinista con seis familias geométricas. Humanoides: módulos y arcologías. Reptilianas: plataformas facetadas, terrazas y núcleos multicapa. Insectoides: celdas, ramificaciones y redes. Diferenciación planetaria/lunar y por OUTPOST/SETTLEMENT/CITY/NETWORK, RESEARCH/EXTRACTION/HABITATION/BIOSPHERE_CONSERVATION, y los tres hábitats actuales. Climas extremos alteran materiales de protección cuando existe información térmica/atmosférica disponible; no añaden campos de fuerza ni terraforming.
3. `vida38-infrastructure-render-38-6.ts`: añade primitivas HEX/TAPER/RING y materiales minerales/cerámicos compartidos, conserva InstancedMesh y liberación explícita. Usa `radio físico × 6.371 km` como conversor a unidades de escena. Limita el radio de huella a 0,75 % del radio del mundo y la altura de presentación a 0,15 % del radio del mundo. El centro de la colonia y la malla lunar irregular no se alteran. El LOD óptico distante permanece separado de las medidas científicas; el tamaño de los edificios no se deriva de un multiplicador arbitrario.
4. `system-scene-snapshot.ts`: añade una copia **de solo lectura** del radio físico que el snapshot ya tenía en su fuente. No recalcula, edita ni revela datos privados. `SystemScene` y las fichas pasan este radio a un renderer único.
5. `colvis1-laboratory/colvis1-laboratory.ts`: un único canvas WebGL en `/laboratorio/colvis1`. Permite elegir los 12 escenarios y cambiar banda, propósito y hábitat. Usa únicamente datos **sintéticos y no observados**. Amplía la geometría solo para inspección; no modifica la escala usada en planetas/lunas reales ni el Archivo GENESIS.
6. El tráfico local de servicio es deliberadamente lento y se anima según tiempo real de presentación, no el reloj acelerado de simulación. No introduce satélites ni aeronaves orbitales.

## Contrato de tamaño

Los intervalos de VIDA.8 se conservan sin alteración: OUTPOST 12–150; SETTLEMENT 151–5.000; CITY 5.001–120.000; NETWORK 120.001–1.500.000. El planificador emplea la media geométrica del intervalo como **proxy de diseño**, no como afirmación de población real. El radio de huella, indicado en kilómetros, es una reconstrucción visual aproximada, no un área medida ni un dato científico nuevo. La arquitectura muy avanzada puede lograr densidades mayores sin ocupar más suelo.

El render muestra una colonia físicamente pequeña como físicamente pequeña; su estructura a escala arquitectónica puede no ser discernible desde vistas orbitales generales. Las técnicas de visibilidad a distancia son ópticas y no alteran el tamaño físico. El laboratorio permite la inspección detallada de las seis familias sin distorsionar el mundo de juego.

## Compatibilidad

- No se cambia `vida8-technological-colonization.ts` ni los registros VIDA.9.
- Los planes nativos VIDA.7 y fixtures VIDA.38.6 sin metadatos COLVIS.1 conservan el renderer anterior.
- No cambia la fuente de autorización CONFIRMED.
- No se construyen megaanillos, estaciones, satélites ni tecnologías orbitales nuevas.
- VISSURF.6, LUNSURF.2, el mapa de luces nocturnas, la rotación y los registros de colonias son independientes.
- Las instalaciones subsuperficiales solo muestran infraestructura externa de acceso y apoyo.
- Los recursos GPU se poseen y liberan mediante el `resources` original.

## Validación ejecutada en el entorno de entrega

- Auditoría portable que ejecuta el planificador real compilado por TypeScript: **128 verificaciones PASADAS** y **12 familias/mundos distintos**.
- Análisis sintáctico TypeScript de diez archivos nuevos/modificados: sin diagnósticos.
- Comprobación de tipos estricta aislada del planificador: sin diagnósticos.
- Referencia de coste del planificador puro, 12 composiciones × 100 muestras, Node 22 en este entorno: mediana **0,095 ms**, percentil 95 **2,012 ms**; el coste WebGL y el coste de GPU no quedan cubiertos por esta prueba.

## Validación pendiente

- `ng test` y `ng build` en instalación completa del usuario: no se ejecutaron, porque la fuente entregada carece de `node_modules`.
- Certificación visual WebGL de las 12 familias y encuadres reales: **pendiente de comprobación**. Ver `/laboratorio/colvis1`.
- Rendimiento de GPU/draw calls y colisiones en mallas irregulares de casos extremos: **pendiente de revisión real**. No afirmar que está certificada la ausencia de todas las intersecciones.

La arquitectura pretende aumentar de forma sustancial la diversidad; el resultado estético se debe evaluar en la galería WebGL y con capturas de colonias confirmadas en ficha y `SystemScene`.
