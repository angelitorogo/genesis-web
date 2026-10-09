import { type CompactMergerEventProfile } from './compact-merger-event-profile';
import { CompactMergerType, type CompactMergerType as CompactMergerTypeValue } from './compact-merger-type';

export const GravitationalWaveModelKind = Object.freeze({
  LEADING_ORDER_QUADRUPOLE_INSPIRAL: 'LEADING_ORDER_QUADRUPOLE_INSPIRAL',
} as const);
export type GravitationalWaveModelKind = typeof GravitationalWaveModelKind[keyof typeof GravitationalWaveModelKind];

export const GravitationalWavePostMergerResolution = Object.freeze({
  NEUTRON_STAR_EOS_UNRESOLVED: 'NEUTRON_STAR_EOS_UNRESOLVED',
  KERR_REMNANT_UNRESOLVED: 'KERR_REMNANT_UNRESOLVED',
} as const);
export type GravitationalWavePostMergerResolution = typeof GravitationalWavePostMergerResolution[keyof typeof GravitationalWavePostMergerResolution];

/**
 * 29.5 intrinsic gravitational-wave characterization derived from one 29.4
 * compact-merger profile.
 *
 * The source-frame inspiral quantities below need only masses and the existing
 * reference orbit. GENESIS deliberately keeps observer-frame frequency and
 * measured strain unresolved while luminosity distance, redshift, inclination
 * and polarization are not part of the Ground Truth.
 */
export class GravitationalWaveEventProfile {
  readonly modelKind = GravitationalWaveModelKind.LEADING_ORDER_QUADRUPOLE_INSPIRAL;

  constructor(
    readonly sourceMerger: CompactMergerEventProfile,
    readonly referenceOrbitalFrequencyHz: number,
    readonly referenceQuadrupoleFrequencyHz: number,
    readonly referenceWavelengthMeters: number,
    readonly eccentricPowerEnhancementFactor: number,
    readonly referenceLuminosityWatts: number,
    readonly circularEquivalentChirpRateHzPerSecond: number,
    readonly nonSpinningIscoFrequencyHz: number,
    readonly observerFrameFrequencyHz: null,
    readonly observedStrain: null,
    readonly luminosityDistanceParsec: null,
    readonly sourceRedshift: null,
    readonly postMergerResolution: GravitationalWavePostMergerResolution,
  ) {
    for (const [name, value] of Object.entries({
      referenceOrbitalFrequencyHz,
      referenceQuadrupoleFrequencyHz,
      referenceWavelengthMeters,
      eccentricPowerEnhancementFactor,
      referenceLuminosityWatts,
      circularEquivalentChirpRateHzPerSecond,
      nonSpinningIscoFrequencyHz,
    })) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new RangeError(`${name} must be finite and > 0.`);
      }
    }

    if (Math.abs(referenceQuadrupoleFrequencyHz - 2 * referenceOrbitalFrequencyHz) >
        Math.max(1e-18, referenceQuadrupoleFrequencyHz * 1e-12)) {
      throw new RangeError('29.5 quadrupole reference frequency must preserve the quadrupole f_GW = 2 f_orb relation.');
    }
    if (eccentricPowerEnhancementFactor < 1) {
      throw new RangeError('Eccentric quadrupole power enhancement cannot be below the circular limit.');
    }

    const expectedPostMerger = sourceMerger.type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR
      ? GravitationalWavePostMergerResolution.NEUTRON_STAR_EOS_UNRESOLVED
      : GravitationalWavePostMergerResolution.KERR_REMNANT_UNRESOLVED;
    if (postMergerResolution !== expectedPostMerger) {
      throw new RangeError('29.5 post-merger resolution must follow the physical compact-merger family.');
    }
    if (observerFrameFrequencyHz !== null || observedStrain !== null ||
        luminosityDistanceParsec !== null || sourceRedshift !== null) {
      throw new RangeError('29.5 cannot synthesize observer-frame gravitational-wave quantities.');
    }
  }

  get mergerType(): CompactMergerTypeValue { return this.sourceMerger.type; }
  get totalMassSolar(): number { return this.sourceMerger.totalMassSolar; }
  get chirpMassSolar(): number { return this.sourceMerger.chirpMassSolar; }
  get referenceEccentricity(): number { return this.sourceMerger.progenitor.orbitalEccentricity; }
  get referenceSemiMajorAxisAu(): number { return this.sourceMerger.progenitor.orbitalSemiMajorAxisAu; }
}

export interface NormalizedGravitationalWaveSample {
  readonly timeSeconds: number;
  readonly frequencyHz: number;
  readonly normalizedStrain: number;
}

export interface NormalizedGravitationalWaveform {
  readonly startFrequencyHz: number;
  readonly endFrequencyHz: number;
  readonly durationSeconds: number;
  readonly samples: readonly NormalizedGravitationalWaveSample[];
}
