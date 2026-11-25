# GENESIS 38.bis-T7s-R1 — informe de regresión

## Causa raíz
El T7s original fue construido desde una copia obsoleta de `scientific-body-preview.ts` y reemplazó el componente entero, eliminando los métodos requeridos por el HTML moderno. El error se manifiesta como TS2339 de la plantilla Angular.

## Remediación
- Recuperación del componente completo anterior a T7s (3118 líneas, incluyendo COLVIS.2 y VISCIV.6).
- Cambios mínimos en su `applyCameraDistance()` y una importación: usar una orientación diurna de cámara exclusiva de la ficha aislada de planeta.
- La orientación es de **cámara**, no de la esfera; el renderizado de un cuerpo esférico no cambia de hemisferio iluminado al girar el cuerpo bajo luces fijas.
- El modal, lunas, SystemScene, LOD colonial, fichas de otros cuerpos y datos científicos quedan fuera del alcance.
- Restauración de la especificación del componente y nuevo spec independiente del cálculo diurno.

## Pruebas disponibles
Auditoría portable de recuperación, sintaxis y cálculos. Build Angular completo y validación visual en navegador pendientes.
