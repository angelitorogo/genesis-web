# GENESIS 38.6c4 — Informe de corrección visual

**Diagnóstico:** El terminador genérico de 38.6c3 opera sobre la normal geométrica de los edificios en Three.js. Una cara lateral puede recibir reflexión aunque la colonia esté en el hemisferio oscuro. El fenómeno es especialmente evidente en Aaras A-9 IV en `SystemScene`.

**Corrección:** Aplicar a la iluminación reflejada colonial un factor radial por fragmento derivado de la posición vista del módulo y el centro de la luna. Evaluar hasta tres contribuciones estelares nativas del motor visual con sus pesos; multiplicar `outgoingLight` por dicho factor. Mantener las pequeñas lámparas autónomas sin variación y sin iluminar el suelo.

**Seguridad:** Solo materiales `InstancedMesh` con `userData.colonialVisual386c === true` reciben el filtro. No se alteran los registros de colonias ni su autorización previa. El renderer no inventa objetos nuevos.

**Determinismo:** El nuevo uniforme es una coordenada de cámara calculada en cada fotograma, no participa en identidad ni persistencia. Sin cambios a `plan.seedUint32`, anclaje o identidad CT-0.

**Validación local realizada:** arquitectura PASS; parseo TS PASS; escenarios nocturno/binario/diurno/sin fuentes PASS mediante prueba aislada; inyección de fragment shader PASS.

**Pendiente del usuario:** Vitest real, build Angular y confirmación visual del hemisferio nocturno, preferentemente Aaras A-9 IV y VI, con y sin iluminación de estrellas secundarias.
