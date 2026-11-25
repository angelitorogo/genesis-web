# Informe técnico — GENESIS VISCATM.1

**Fecha:** 2026-11-24  
**Alcance:** representación atmosférica VIS3D.2 / 25.4 y LOD de SystemScene y ficha.

## Diagnóstico

Antes de VISCATM.1, la envoltura profunda generaba una textura de 256 × 128. `createSystemScenePlanetTextureResourceV1` utilizaba el refinamiento genérico GAS para alcanzar 1024 × 512 en ficha y `installDetailedPlanetTexture` 512 × 256 en la escena cercana. La interpolación, la distorsión suave y la perturbación cromática de aproximadamente 2,8 unidades del refinador genérico no generaban suficiente estructura física *visual* adicional. En SystemScene el zoom utilizaba además una semilla superficial genérica en vez de reutilizar explícitamente la semilla de la envoltura profunda.

## Intervención

1. Nuevo módulo `system-scene-giant-atmosphere-multires-viscatm1.ts`, que conserva la textura 25.4 y añade campos longitudinalmente periódicos, filamentos, perturbaciones de jet, advección UV y una estructura local de remolino limitada. Los coeficientes responden al régimen atmosférico y a las variables de presentación existentes (`presentationTurbulence01`, `presentationJetSharpness01`, `presentationStormCoverage01`, `presentationBandCount`).
2. Los tres niveles 256/512/1024 se derivan de **una única semilla**. SystemScene aplica 512 para un cuerpo cercano y 1024 para un único gaseoso de zoom extremo, con histéresis 760/620 px. En 512/1024 las estructuras finas se resuelven en la misma base continua. Se conserva la costura UV y el alfa de las capas de bruma.
3. La generación base del planeta gaseoso incorpora detalle mesoscópico económico. Los tamaños personalizados no equirectangulares siguen usando el generador clásico sin nuevas restricciones.
4. `SystemScene` utiliza el módulo compartido en la ruta de ficha y en la ruta de zoom; guarda la semilla canónica en metadatos volátiles de la textura y versiona la clave de caché del gigante. Se conserva el mismo foco cercano único, la histéresis y el ciclo de liberación de texturas.

## Invariantes

- No se alteran snapshots físicos, generadores del universo, órbitas, mallas ni persistencia.
- No hay relieve/costa/hielo superficial, vida ni infraestructura inventados.
- Los cuerpos sólidos siguen utilizando el pipeline VISSURF.5d y refinamiento normal; la rama VISCATM.1 solo se evalúa si `giantAtmosphere !== null`.
- La ficha y la escena comparten base, paleta, semilla y refinador atmosférico. Las imágenes no tienen que coincidir píxel a píxel por cámara, iluminación y LOD.

## Comprobaciones

Auditoría portátil: 55 verificaciones. Regresión 38.7x: 25 verificaciones. Arquitectura: PASS. TypeScript aislado de módulos atmosféricos: PASS. Compilación y pruebas WebGL completas: no ejecutadas aquí por ausencia de la instalación Angular del usuario. Validar visualmente gigantes gaseosos, helados y mini-neptunos, además del FPS al cambiar de foco.
