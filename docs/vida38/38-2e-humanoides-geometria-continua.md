# GENESIS Web — Fase 38.2e, sustitución geométrica de HUMANOIDES

## Estado
Implementación experimental del nuevo generador, con validación topológica aislada.
**No se declara finalizada la subfase hasta completar la validación visual con
Kamera ix1 y otras especies reales en el navegador del proyecto.**

## Razón del reemplazo
El camino anterior `createHumanoidSpecialized` ensamblaba cápsulas y esferas con
articulaciones visibles. No podía producir las transiciones naturales exigidas.
No se le han añadido más piezas: su construcción ha sido reemplazada por un
**campo de distancia firmada (SDF) con unión suavizada**.

## Arquitectura
1. `vida38-humanoid-organic-field-38-2e.ts`: parámetros anatómicos coherentes y
   deterministas, campo SDF (cabeza, rostro, cuello, tronco, hombros, brazos,
   palmas, dedos, pelvis, piernas y pies), diferencia SDF para cavidades
   orbitarias/bucales y Marching Tetrahedra sobre grid 3D.
2. La malla se suelda por aristas compartidas, elimina islas subvoxel de LOD,
   orienta todas las caras de forma consistente y produce normales a partir del
   gradiente de la superficie implícita.
3. `vida38-humanoid-organic-material-38-2e.ts`: piel continua `MeshPhysicalMaterial`
   con colores por vértice procedentes de los pigmentos de VIDA, patrón anatómico
   3D, mapas normales y de rugosidad periódicos generados determinísticamente.
   Los únicos subobjetos relevantes son los órganos visuales en sus cavidades.
4. `vida38-species-visual-preview-scene.ts`: elimina el antiguo generador
   especializado y lo sustituye por el nuevo. No modifica las otras seis familias.
5. `life-species-visual-preview.ts`: iluminación de estudio equilibrada,
   ACES tone mapping y suavizado de sombras; el tamaño de la ventana determina
   `MEDIUM`/`HIGH` en desktop. No modifica los controles de cámara.

## Garantías de datos
- ID, semilla, pigmentos, cubierta, patrón, locomoción y longitud provienen del
  contrato VIDA.38.1 (sobre ficha VIDA.9 confirmada). La longitud permanece
  **exacta como dato físico**; el encuadre usa una escala escénica aparte.
- La geometría craneal, proporción de dedos, tamaño de ojos y demás rasgos no
  codificados científicamente son **hipótesis artísticas** y nunca se
  incorporan a VIDA, IndexedDB o conocimiento observado.
- No se inventan poblaciones. La vista se ofrece únicamente si el llamador
  ya ha resuelto el contrato de una especie en el sistema confirmado.

## Calidad geométrica
- Niveles LOW (36×70×29), MEDIUM (52×103×42) y HIGH (68×134×55) en la malla SDF.
- Un volumen anatómico *watertight*, sin huecos/manifold abiertos ni triángulos
  con índices inválidos. La auditoría comprueba componentes conexas y winding.
- La geometría no se reconstruye cada fotograma. Sí puede regenerarse al
  cambiar identidad o reconstruir la ficha.
- Los recursos GPU de material y texturas se liberan al destruir la ficha.

## Pruebas
```powershell
node scripts/auditar-genesis-38-2e-humanoides-organicos.spec.cjs
npx ng test --watch=false --include="src/app/presentation/life-species-visual/vida38-humanoid-organic-field-38-2e.spec.ts" --include="src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.spec.ts"
npx ng build
```

## Comprobación visual de aceptación (NO sustituible por tests)
1. Kamera ix1: frente, lateral, posterior, tres cuartos, rostro y manos.
2. Segunda especie humanoide de identidad distinta, misma semilla estable.
3. Transiciones suaves de hombros, codos, rodillas, cuello y mandíbula.
4. Acabado biológico, pigmentos/patrones correctos, sin ojos flotantes.
5. Población y descubrimientos sin cambios. No cerrar si parece un muñeco.

## Limitaciones explícitas
El SDF y PBR mejoran continuidad y materiales, pero no garantizan por sí solos
fotorrealismo. El aspecto final depende del render real de WebGL y de la
calibración visual de anatomía, texturas e iluminación. La prueba de
navegador debe decidir si hacen falta trabajos posteriores de escultura
anatómica y texturización de alta frecuencia.
