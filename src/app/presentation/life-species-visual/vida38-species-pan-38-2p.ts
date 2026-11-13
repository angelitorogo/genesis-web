/** GENESIS 38.2p — desplazamiento de cámara en el visor de especies. */
export const VIDA38_SPECIES_PAN_REVISION_38P = 'VIDA.38.2p/species-camera-pan/v1' as const;

export interface Vida38SpeciesPanDelta38P { readonly x: number; readonly y: number; readonly z: number; }
/**
 * Convierte desplazamiento del puntero en traslación del objetivo de cámara.
 * No mueve físicamente el espécimen ni altera su SDF: el plano de proyección
 * conserva las distancias, la escala aparente y el ángulo de visión.
 */
export function computeVida38SpeciesPanDelta38P(args: {
  readonly deltaPixelsX: number;
  readonly deltaPixelsY: number;
  readonly viewportHeightPixels: number;
  readonly distance: number;
  readonly verticalFovDegrees: number;
  readonly yaw: number;
  readonly pitch: number;
}): Vida38SpeciesPanDelta38P {
  const { deltaPixelsX, deltaPixelsY, viewportHeightPixels, distance, verticalFovDegrees, yaw, pitch } = args;
  const height = Math.max(1, viewportHeightPixels);
  const unitsPerPixel = 2 * Math.max(.001, distance) * Math.tan(verticalFovDegrees * Math.PI / 360) / height;
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const upX = -Math.sin(pitch) * Math.sin(yaw);
  const upY = Math.cos(pitch);
  const upZ = -Math.sin(pitch) * Math.cos(yaw);
  // La escena acompaña al puntero: desplazar el objetivo en sentido opuesto.
  return {
    x: (-deltaPixelsX * rightX + deltaPixelsY * upX) * unitsPerPixel,
    y: deltaPixelsY * upY * unitsPerPixel,
    z: (-deltaPixelsX * rightZ + deltaPixelsY * upZ) * unitsPerPixel,
  };
}
