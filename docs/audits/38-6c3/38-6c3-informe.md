# 38.6c3 — Auditoría de iluminación colonial nocturna

**Motivo:** al quedar un puesto colonial en la cara oscura de una luna del sistema triple Aaras, su geometría desaparece en penumbra a pesar de estar correctamente anclada. Se demanda reconocimiento artificial del puesto **sin añadir iluminación estelar espuria**.

**Fuentes reutilizadas:** 

- `system-scene.ts` calcula por cuerpo direcciones de hasta tres estrellas y pesos de flujo en `updateBodyLightDirections` (para TRIPLE V2/V3 utiliza `v2TripleBodyLightFluxes` en AU reales).
- `system-scene-atmosphere-material.ts` ya incorpora shader día/noche con esas mismas direcciones.
- `vida38-infrastructure-plan-38-6.ts` autoriza sitios solo desde biología VIDA.9 confirmada y valida procedencia VIDA.8.
- `vida38-infrastructure-render-38-6.ts` conserva los tres LOD de 38.6c1 y el anclaje irregular de 38.6c2.

**Intervención:** solo la escena científica activa luces autoemisivas `MeshBasicMaterial` con `depthTest` en los módulos del sitio VIDA.8. Se limita a 1–5 instancias luminosas según LOD (y disposición de componentes, no población científica). No se usan `PointLight` ni `DirectionalLight` adicionales. El material no emisivo colonial usa el mismo terminador multistar que la luna. Se actualiza opacidad por sitio con incidencia de todas las estrellas relevantes; no se oculta artificialmente el relieve iluminado por una estrella secundaria.

**Preservación:** el plan CT-0 y los datos VIDA.8/9 son de solo lectura; latitud, longitud, índice lunar y órbitas son inmutables; no toca el mapa de luces nativas ni 38.6a, 38.6b, 38.bis, especies 3D, satélites o nuevas estaciones orbitales. La escena de ficha mantiene el indicador apagado por defecto para no alterar su aspecto aprobado.

**Límites de certificación:** no hubo dependencias npm locales, por lo que Vitest y Angular no se ejecutaron. Los tests funcionales incluidos se deben ejecutar en el proyecto local. Es necesaria validación visual en Aaras A-9 IV/VI con región en cara iluminada y oscura, y con luz secundaria de B/C si la geometría orbital hace que alcance el cuerpo.
