/**
 * ATM-VIS.4 — Shared SystemScene/fiche photospheric optical reference.
 *
 * Only a SINGLE resolved luminous conventional stellar host can provide a
 * meaningful blackbody proxy to the current molecular optical model. In
 * BINARY/TRIPLE architectures the renderer has no planet-specific combined
 * stellar SED; choosing the first star would invent a spectrum. Compact hosts
 * and conditional inspection illumination are not stellar photospheres.
 *
 * Read-only, O(1), independent of seeds, route ordinals and rendering state.
 */
export interface SystemSceneOpticalHostV4 {
  readonly kind: 'star' | 'planet';
  readonly compactHostKind?: string;
  readonly sourceLuminositySolar: number | null;
  readonly sourceEffectiveTemperatureKelvin?: number;
}

export function resolveSystemSceneAtmospherePhotosphereKelvinV4(
  stars: readonly SystemSceneOpticalHostV4[],
): number | null {
  if (stars.length !== 1) return null;
  const host = stars[0];
  if (host?.kind !== 'star' || host.compactHostKind !== undefined) return null;
  const luminosity = host.sourceLuminositySolar;
  const temperature = host.sourceEffectiveTemperatureKelvin;
  if (luminosity === null || !Number.isFinite(luminosity) || luminosity <= 0 ||
      temperature === undefined || !Number.isFinite(temperature) || temperature <= 0) {
    return null;
  }
  return temperature;
}
