/**
 * STARVIS.1 — Contrato de presentación, nunca de física.
 * El estado evolutivo procede del dominio; temperatura/color no se reescriben.
 * Los límites de tamaño se aplican posteriormente en la proyección orbital.
 */
export type StarvisEvolutionState =
  | 'BROWN_DWARF' | 'MAIN_SEQUENCE' | 'GIANT' | 'SUPERGIANT'
  | 'WHITE_DWARF' | 'NEUTRON_STAR' | 'STELLAR_BLACK_HOLE';
export type StarvisGiantStage =
  | 'RED_GIANT_BRANCH' | 'ASYMPTOTIC_GIANT_BRANCH' | 'SUPERGIANT';
export type StarvisSpectralFamily =
  | 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'L' | 'T' | 'Y';
export type StarvisFamily = 'WHITE_DWARF' | 'BROWN_DWARF' | 'M' | 'K' |
  'G' | 'F' | 'A' | 'B' | 'O' | 'RGB' | 'AGB' | 'SUPERGIANT';

export interface StarvisProfileV1 {
  readonly family: StarvisFamily;
  readonly requestedRadiusScene: number;
  /** Multiplicador de tamaños de sprites, relativo a los efectos previos. */
  readonly opticalScale: number;
  /** Atenuación selectiva de destello para remanentes y estrellas frías. */
  readonly glareScale: number;
  /** Solo presentación: el color definitivo sigue siendo el del dominio. */
  readonly surfaceEnergy: number;
}

const SOLAR_REFERENCE_SCENE = 0.28;
const SIZE_FACTOR: Readonly<Record<StarvisFamily, number>> = Object.freeze({
  WHITE_DWARF: 0.24, BROWN_DWARF: 0.38, M: 0.59, K: 0.82,
  G: 1.0, F: 1.22, A: 1.43, B: 1.79, O: 2.12,
  RGB: 3.25, AGB: 4.25, SUPERGIANT: 5.2,
});
const OPTICAL_SCALE: Readonly<Record<StarvisFamily, number>> = Object.freeze({
  WHITE_DWARF: 0.19, BROWN_DWARF: 0.11, M: 0.43, K: 0.62,
  G: 0.78, F: 0.89, A: 1.0, B: 1.05, O: 1.10,
  RGB: 0.68, AGB: 0.66, SUPERGIANT: 0.80,
});

export function systemSceneStarvis1Profile(input: {
  readonly evolutionState: StarvisEvolutionState;
  readonly spectralFamily: StarvisSpectralFamily;
  readonly giantStage?: StarvisGiantStage | null;
  readonly radiusSolar: number;
  readonly effectiveTemperatureKelvin: number;
}): StarvisProfileV1 | null {
  const state = input.evolutionState;
  // Compact hosts keep their established laboratory graphs (not a photosphere).
  if (state === 'NEUTRON_STAR' || state === 'STELLAR_BLACK_HOLE') return null;
  let family: StarvisFamily;
  switch (state) {
    case 'WHITE_DWARF': family = 'WHITE_DWARF'; break;
    case 'BROWN_DWARF': family = 'BROWN_DWARF'; break;
    case 'GIANT': family = input.giantStage === 'ASYMPTOTIC_GIANT_BRANCH' ? 'AGB' : 'RGB'; break;
    case 'SUPERGIANT': family = 'SUPERGIANT'; break;
    default: {
      const spectral = input.spectralFamily;
      family = (spectral === 'L' || spectral === 'T' || spectral === 'Y')
        ? 'BROWN_DWARF' : spectral;
      break;
    }
  }
  const radius = Number.isFinite(input.radiusSolar) && input.radiusSolar > 0
    ? input.radiusSolar : 1;
  // Small bounded modulation preserves some physical diversity without
  // making every red giant appear the same size or dwarf sizes converge.
  const modulation = Math.min(1.13, Math.max(0.90,
    1 + 0.045 * Math.log2(Math.max(0.01, radius))));
  const requestedRadiusScene = SOLAR_REFERENCE_SCENE * SIZE_FACTOR[family] * modulation;
  const opticalScale = OPTICAL_SCALE[family];
  const glareScale = family === 'WHITE_DWARF' ? 0.18
    : family === 'BROWN_DWARF' ? 0.04
    : family === 'M' ? 0.35 : family === 'RGB' || family === 'AGB' ? 0.43 : 1;
  return Object.freeze({ family, requestedRadiusScene, opticalScale,
    glareScale, surfaceEnergy: Math.min(1, Math.max(0,
      (input.effectiveTemperatureKelvin - 1700) / 23000)),
  });
}

/**
 * Exact scene-space radial safety for a barycentric planet corridor.
 * A negative/zero clearance cannot be repaired by assigning a minimum positive
 * photosphere: the conservative policy suppresses the visible disc instead.
 */
export function systemSceneStarvis1SafeRadius(input: {
  readonly requestedRadiusScene: number;
  readonly planetPeriapsisScene: number | null;
  readonly maxRelativeCenterExcursionScene: number;
  readonly planetRadiusScene: number;
  readonly fraction?: number;
}): number {
  const desired = Math.max(0, Number.isFinite(input.requestedRadiusScene)
    ? input.requestedRadiusScene : 0);
  const peri = input.planetPeriapsisScene;
  if (peri === null || !Number.isFinite(peri)) return desired;
  const gap = Math.max(0, peri - Math.max(0, input.maxRelativeCenterExcursionScene)
    - Math.max(0, input.planetRadiusScene));
  return Math.min(desired, Math.max(0, gap * (input.fraction ?? 0.80)));
}
