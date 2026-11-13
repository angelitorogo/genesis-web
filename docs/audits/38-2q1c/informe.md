# 38.2q1c — Auditoría de aguijón y hombros

## Causa comprobada en 38.2q1b

1. El loft del aguijón dibujaba triángulos hacia el interior, mientras los materiales usaban `THREE.FrontSide`, causando desapariciones por backface culling.
2. El cálculo del marco tubular cambiaba de orientación según la tangente, creando torsiones.
3. La unión abdominal se modelaba con varios tubos concéntricos y una raíz fijada por coordenadas arbitrarias.
4. Los brazos nacían de un eje X fijo que no seguía el diámetro del tronco en cada altura.

## Correcciones

- Winding exterior y marcos continuos `computeFrenetFrames`.
- Aguijón único, opaco, sin bocas tubulares visibles, anclado al perfil posterior de abdomen.
- Dos costillas laterales de transición quitinosa (no anillos).
- Anclajes de hombro derivados del tronco con penetración anatómica y ajuste de codos en individuos robustos.
- Sin cambios sobre cabeza, alas, manos, ropa o galería.

## Pruebas

- Auditor portable q1c: cobertura geométrica/procedural de 24+4096 identidades y todas sus raíces de hombro.
- Test Vitest q1c: normales orientadas hacia afuera y no transparentes, conservación de brazos/alas/ojos, y profundidad de implantación.
- Regresión q1b, q1.

### Limitación

Las pruebas locales no renderizan WebGL. El cierre visual depende de las vistas reales del proyecto.
