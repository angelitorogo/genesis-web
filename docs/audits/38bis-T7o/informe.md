# Informe GENESIS 38.bis-T7o — Contacto de bases COLVIS.2

### Diagnóstico

En las capturas algunas instalaciones se perciben flotantes cuando la cámara llega a una vista rasante. Las bases COLVIS.2 se ajustaban al radio nominal/una proyección esférica; el cuerpo anfitrión puede tener malla irregular y, además, mapas de relieve que alteran su apariencia sin modificar su geometría. La cámara también permitía elevarse solo 0,1 rad desde la tangente.

### Intervención

Nuevo módulo reversible `colvis3-colony-ground-contact-t7o.ts`: raycast desde cada base de pieza groundable del LOD alto hacia la malla **visible** del cuerpo. Almacena matrices originales y las restaura al salir; no toca conocimiento confirmado ni generación. Se incluye un umbral para no desplazar estructuras fuera de su huella colonial si el punto de intersección no es válido. `colvis3-colony-orbit-camera-t7n.ts` limita la elevación mínima a 0,20 radianes.

### Validación

Auditorías portátiles y prueba Vitest de contacto, escala del cuerpo, piezas elevadas y restauración. El renderizado WebGL del proyecto real y el ajuste visual concreto de Krethus h II, Aaras A-11 I y Pheleria B-8 VII quedan pendientes de validación en equipo del usuario.
