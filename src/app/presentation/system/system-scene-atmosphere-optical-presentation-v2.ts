import { type AtmosphereOpticalScienceV1 } from './system-scene-atmosphere-optical-science';

/**
 * ATM-VIS.2: bounded molecular-only optical presentation.
 * The three diagnostic wavelengths are samples of the Rayleigh continuum,
 * not calibrated RGB channels or an atmospheric reflectance spectrum.
 * This adapter intentionally does NOT synthesize absorbers, yellow CO2 haze,
 * SO2 clouds, photochemical products or gas-specific pigment palettes.
 */
export interface SystemSceneMolecularAtmosphereVisualV2 {
  readonly version: 2;
  readonly source: 'RAYLEIGH_MOLECULAR_APPROXIMATION';
  readonly dayTintHex: string;
  /** Bounded adjustment only; D.4d geometry/opacity remains authoritative. */
  readonly molecularVisibility01: number;
  /** ATM-VIS.2a: bounded shell-radiance calibration, NOT surface reflectance. */
  readonly shellRadianceScale01: number;
  /** ATM-VIS.2a: molecular twilight intensity independent of specular water. */
  readonly twilightRadianceScale01: number;
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const byte = (value: number): string => Math.round(Math.max(0, Math.min(255, value)))
  .toString(16).padStart(2, '0');

export function buildSystemSceneMolecularAtmosphereVisualV2(
  science: AtmosphereOpticalScienceV1 | null | undefined,
  modeledCloudCoverage01: number | null,
): SystemSceneMolecularAtmosphereVisualV2 | null {
  if (science?.columnStatus !== 'EVALUABLE' ||
      science.estimatedRayleighOpticalDepth === null) return null;
  const band = science.estimatedRayleighOpticalDepth;
  if (!Number.isFinite(band.at450Nm) || !Number.isFinite(band.at550Nm) ||
      !Number.isFinite(band.at650Nm) || band.at550Nm < 0 ||
      band.at450Nm < 0 || band.at650Nm < 0) return null;

  // ATM-VIS.2a — Three diagnostic wavelengths are *spectral samples*, not
  // linear RGB primaries. Approximate a broadband Rayleigh color tendency,
  // preserving the spectral contrast before a bounded conversion to an sRGB
  // presentation tint. No absorption bands or chromophore colors are inferred.
  //
  // Crucially, do not compute all channels as ~190..245: that near-white
  // floor erased blue/green differences and made dense shells appear chalky.
  const taus = [band.at650Nm, band.at550Nm, band.at450Nm];
  const continuum = science.stellarContinuumRelativeTo550Nm;
  const starlight = continuum === null ? [1, 1, 1] : [
    continuum.at650Nm, continuum.at550Nm, continuum.at450Nm,
  ];
  if (starlight.some(v => !Number.isFinite(v) || v <= 0)) return null;

  // A finite path-length scattering proxy. The optional photospheric
  // blackbody continuum only introduces a *bounded relative* illuminant;
  // bolometric flux is never treated as a visible RGB spectrum.
  const scatter = taus.map((tau, i) =>
    (1 - Math.exp(-Math.min(40, tau * 0.52))) *
    Math.pow(Math.max(0.55, Math.min(1.6, starlight[i]!)), 0.32),
  );
  const brightest = Math.max(...scatter, 1e-12);
  const tau550 = band.at550Nm;
  const denseNeutralization01 = clamp01(tau550 / (tau550 + 2.8));
  const chroma01 = 0.49 * (1 - 0.83 * denseNeutralization01);
  const brightness = 196 + 13 * clamp01(tau550 / (tau550 + 0.65));
  const cloud = clamp01(modeledCloudCoverage01 ?? 0);
  // The existing cloud-coverage proxy may desaturate the air color slightly,
  // but cannot synthesize new cloud decks, aerosol absorption or white glare.
  const cloudNeutralization = 0.18 * cloud;
  const rgb = scatter.map(value => {
    const molecular = brightness * (1 - chroma01 * (1 - value / brightest));
    return molecular * (1 - cloudNeutralization) +
      brightness * 0.88 * cloudNeutralization;
  });

  const visibility = clamp01(tau550 / (tau550 + 0.35));
  // Intensity is distinct from hue. Molecular scattering has no authority to
  // brighten the planet's rock/ice/water material or its specular highlight.
  const shellRadianceScale01 = 0.93 - 0.13 * denseNeutralization01;
  const twilightRadianceScale01 = 0.90 - 0.14 * denseNeutralization01;
  const [r, g, b] = rgb;
  return Object.freeze({
    version: 2 as const,
    source: 'RAYLEIGH_MOLECULAR_APPROXIMATION' as const,
    dayTintHex: `#${byte(r!)}${byte(g!)}${byte(b!)}`.toUpperCase(),
    molecularVisibility01: visibility,
    shellRadianceScale01,
    twilightRadianceScale01,
  });
}
