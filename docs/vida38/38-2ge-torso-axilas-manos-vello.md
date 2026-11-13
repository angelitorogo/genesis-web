# GENESIS 38.2g.e — Diversidad del torso, axilas anatómicas, manos y vello

## Alcance y motivación
Después de validar visualmente 38.2g.d en cabeza/cara, se interviene únicamente el cuerpo humanoide. No se altera el contrato visual 38.1, el generador VIDA ni la calibración VIDA.T1.

### 1. Perfil morfológico 38.2g.e (puro y determinista)
Nuevo módulo `vida38-humanoid-torso-38-2ge.ts`, con cinco arquetipos continuos: `WIRY`, `LEAN`, `ATHLETIC`, `STOCKY`, `HEAVY`.
- Volumen torácico, cintura, abdomen y pectorales varían mediante coeficientes independientes.
- La variación procede de ID, longitud, hábitat, nutrición, nicho, locomoción, cubierta y adaptaciones.
- Los arquetipos son reconstrucciones visuales hipotéticas, no observaciones ni taxones introducidos en VIDA.
- La pigmentación y `appearanceFingerprint` no participan en la semilla de anatomía.

### 2. Brazos separados del costado desde el hombro
Cambios directos en la SDF de `vida38-humanoid-organic-field-38-2e.ts`:
- Se mantiene la fusión del deltoides con el hombro y el pecho.
- Se desplazan lateralmente codos y muñecas, sin separar articulaciones.
- Se estrecha y traslada el volumen accesorio del bíceps que antes se fundía con el costado por debajo de la axila.
- Se corrige la masa del antebrazo para evitar la impresión de que el brazo llega pegado al abdomen.
- La unión corporal principal continúa siendo **una sola malla estanca y conectada**.

### 3. Manos y dedos definidos
- Palma más ancha, con transición SDF desde la muñeca.
- Raíces de los dedos juntas en el borde palmar y puntas abiertas en abanico.
- Proximales y distales con diámetros decrecientes, sin cilindros externos.
- Pulgar oponible separado.
- Mayor resolución del campo implícito, especialmente HIGH, para resolver mejor la separación interdigital.

### 4. Vello torácico
Nuevo módulo `vida38-humanoid-chest-hair-38-2ge.ts`.
- Patrones `BARE`, `SPARSE`, `CENTER`, `PECTORAL`, `DENSE`.
- Densidad y longitud de fibras deterministas e independientes de pelo craneal.
- Cubierta escamosa/quitinosa: sin vello torácico; cobertura pilosa: probabilidad alta; coriácea: probabilidad variable.
- Raíces encontradas mediante evaluación/búsqueda sobre la superficie SDF real (no sobre un tórax imaginario).
- Un solo `BufferGeometry` con fibras agrupadas; material mate opaco y LOD para evitar shimmer y coste excesivo.
- Color derivado de la paleta real de VIDA, pero patrón anatómico invariable ante recoloración.

### 5. Tests y compatibilidad
- El antiguo test de la escena esperaba `normalMap/roughnessMap` no nulos; desde 38.2g el relieve y rugosidad se calculan en shader. Ahora valida `onBeforeCompile` y el PBR real.
- Se corrige el conteo de ojos antiguo (`VIDA38_2E_EYE`, 6) al contrato orbital actual 38.2g.c (2 ojos integrados).
- La auditoría antigua 38.2g ahora admite también la revisión 38.2g.e.
- Auditoría 38.2g.e prueba diversidad de 160 perfiles, determinismo de recoloración, diez mallas SDF cerradas, separación axilar y longitud VIDA.

## Validación visual pendiente
En las fichas reales, comparar al menos tres especies:
1. Siluetas delgadas y robustas con materiales idénticos.
2. Vello torácico ausente/escaso/abundante.
3. Brazos separados de los costados incluso en reposo, con fusión natural al hombro.
4. Dedos distinguibles mediante zoom (revisar vistas frontal, dorsal y lateral).
5. Ausencia de parpadeos en fibra y continuidad en sombras.

No dar 38.2g.e por cerrada hasta la aceptación visual en el navegador.
