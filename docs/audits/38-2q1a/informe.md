# GENESIS — 38.2q1a · Refinamiento anatómico de insectoides civilizados

## Alcance

Cambio **localizado** en el renderer `INSECTOID / VERY_ADVANCED` de 38.2q1. No altera organismos insectoides no civilizados, biología VIDA, CT-0, IndexedDB, la ropa aprobada o la estructura del laboratorio «Civilizaciones».

## Reemplazos geométricos

### Cabeza / cefálica

- Se sustituye la malla `IcosahedronGeometry` transformada en bola por una envolvente `SphereGeometry` *esculpida vértice a vértice*, con perfiles por arquetipo.
- Familias: mantis, himenóptera, coleóptera, cigarra, lepidóptera, odonato, fásmido.
- Variación continua de anchura, altura, profundidad, estrechamiento mandibular y frente.
- Clípeo conformado como superficie curvada sobre la envolvente, sutura frontal, genales y crestas supraoculares.
- Coloración quitinosa por vértice con mezcla determinista de tono, líneas de placa y microgranulado; no se usa una textura externa.
- Ojos compuestos más empotrados en la nueva órbita y ocelos ajustados a la superficie craneal.
- Antenas con raíz sobre la coronilla real, mandíbulas curvas y palpos según arquetipo.

### Alas

- Eliminadas las alas formadas por pocos triángulos.
- Superficies con mallado 2D, curvatura a lo largo de la envergadura y anchura orgánica.
- Familia de ala por arquetipo: lanceolada venada, doble venada, polilliforme amplia, élitro o vestigial.
- Venación real en mallas tubulares finas sobre membrana, con nervadura principal y secundarias.
- Bisagra torácica. Un par o dos pares según el plan previo.
- Mantiene variación de apertura sin montar objetos cuadrados sobre el cuerpo.

### Aguijón

- Se sustituye el simple pincho por un conjunto: bulbo abdominal → transición → lanceta → anillos de articulación.
- Formas robusta, fina, segmentada y ceremonial.
- La vaina se origina junto al abdomen; conserva la presencia de aguijón procedente de la semilla 38.2q1.

## Verificaciones

- Auditoría Node de 4.096 identidades y cobertura de la galería de 24.
- Test de geometría nuevo para cabeza, alas, nervaduras y aguijón, determinismo y preservación de extremidades y vestimenta.
- Se debe ejecutar Vitest y Angular build en el proyecto completo, y revisar en WebGL el perfil, la parte trasera y el encaje con los trajes de los ejemplares alados.

## Estado

Código implementado. La corrección visual final requiere verificar la galería en ejecución, ya que este entorno no tiene instalada la aplicación Angular/Three.js para renderizado WebGL.
