import {
  GravitationalWaveEventProfile,
  GravitationalWavePostMergerResolution,
  type NormalizedGravitationalWaveform,
} from '../../domain/transient/gravitational-wave-event-profile';
import { type CompactMergerEventProfile } from '../../domain/transient/compact-merger-event-profile';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';

const GRAVITATIONAL_CONSTANT = 6.67430e-11;
const SPEED_OF_LIGHT = 299_792_458;
const SOLAR_MASS_KG = 1.98847e30;
const ASTRONOMICAL_UNIT_METERS = 149_597_870_700;
const TWO_PI = 2 * Math.PI;
const ADAPTIVE_VISUALIZATION_MIN_SAMPLES = 512;
const ADAPTIVE_VISUALIZATION_MAX_SAMPLES = 4096;
const ADAPTIVE_VISUALIZATION_SAMPLES_PER_END_CYCLE = 12;

/** 29.5 source-frame GW observables. No detector/observer geometry is invented. */
export class GravitationalWaveEventEngine {
  private constructor() {}

  static deriveProfile(merger: CompactMergerEventProfile): GravitationalWaveEventProfile {
    const progenitor = merger.progenitor;
    const totalMassKg = merger.totalMassSolar * SOLAR_MASS_KG;
    const primaryMassKg = progenitor.primaryMassSolar * SOLAR_MASS_KG;
    const secondaryMassKg = progenitor.secondaryMassSolar * SOLAR_MASS_KG;
    const chirpMassKg = merger.chirpMassSolar * SOLAR_MASS_KG;
    const semiMajorAxisMeters = progenitor.orbitalSemiMajorAxisAu * ASTRONOMICAL_UNIT_METERS;

    const referenceOrbitalFrequencyHz = Math.sqrt(
      GRAVITATIONAL_CONSTANT * totalMassKg / semiMajorAxisMeters ** 3,
    ) / TWO_PI;
    const referenceQuadrupoleFrequencyHz = 2 * referenceOrbitalFrequencyHz;
    const referenceWavelengthMeters = SPEED_OF_LIGHT / referenceQuadrupoleFrequencyHz;

    const eccentricity = progenitor.orbitalEccentricity;
    const eccentricPowerEnhancementFactor =
      (1 + 73 / 24 * eccentricity ** 2 + 37 / 96 * eccentricity ** 4) /
      (1 - eccentricity ** 2) ** (7 / 2);

    const referenceLuminosityWatts =
      32 / 5 * GRAVITATIONAL_CONSTANT ** 4 / SPEED_OF_LIGHT ** 5 *
      (primaryMassKg * secondaryMassKg) ** 2 * totalMassKg /
      semiMajorAxisMeters ** 5 * eccentricPowerEnhancementFactor;

    // Leading-order circular-equivalent chirp rate. The reference orbit may be
    // mildly eccentric; the eccentricity is therefore reported separately and
    // used only in the orbit-averaged Peters-Mathews luminosity above.
    const circularEquivalentChirpRateHzPerSecond =
      96 / 5 * Math.PI ** (8 / 3) *
      (GRAVITATIONAL_CONSTANT * chirpMassKg / SPEED_OF_LIGHT ** 3) ** (5 / 3) *
      referenceQuadrupoleFrequencyHz ** (11 / 3);

    // Schwarzschild total-mass reference only. It is not a synthetic merger or
    // ringdown frequency and intentionally does not require a Kerr spin.
    const nonSpinningIscoFrequencyHz =
      SPEED_OF_LIGHT ** 3 /
      (6 ** (3 / 2) * Math.PI * GRAVITATIONAL_CONSTANT * totalMassKg);

    const postMergerResolution = merger.type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR
      ? GravitationalWavePostMergerResolution.NEUTRON_STAR_EOS_UNRESOLVED
      : GravitationalWavePostMergerResolution.KERR_REMNANT_UNRESOLVED;

    return new GravitationalWaveEventProfile(
      merger,
      referenceOrbitalFrequencyHz,
      referenceQuadrupoleFrequencyHz,
      referenceWavelengthMeters,
      eccentricPowerEnhancementFactor,
      referenceLuminosityWatts,
      circularEquivalentChirpRateHzPerSecond,
      nonSpinningIscoFrequencyHz,
      null,
      null,
      null,
      null,
      postMergerResolution,
    );
  }

  /**
   * Deterministic, distance-free visualization of the final leading-order
   * inspiral. The trace spans f_ISCO/4 -> f_ISCO, normalizes amplitude to one,
   * and must never be interpreted as observed strain.
   */
  static normalizedFinalInspiral(
    profile: GravitationalWaveEventProfile,
    sampleCount?: number,
  ): NormalizedGravitationalWaveform {
    if (sampleCount !== undefined &&
        (!Number.isInteger(sampleCount) || sampleCount < 32 || sampleCount > ADAPTIVE_VISUALIZATION_MAX_SAMPLES)) {
      throw new RangeError('normalizedFinalInspiral sampleCount must be an integer in [32, 4096].');
    }

    const chirpMassKg = profile.chirpMassSolar * SOLAR_MASS_KG;
    const endFrequencyHz = profile.nonSpinningIscoFrequencyHz;
    const startFrequencyHz = endFrequencyHz / 4;
    const coefficient = 5 / 256 *
      (GRAVITATIONAL_CONSTANT * chirpMassKg / SPEED_OF_LIGHT ** 3) ** (-5 / 3);
    const tauForFrequency = (frequencyHz: number): number =>
      coefficient * (Math.PI * frequencyHz) ** (-8 / 3);
    const frequencyForTau = (tauSeconds: number): number =>
      (coefficient / tauSeconds) ** (3 / 8) / Math.PI;

    const tauStart = tauForFrequency(startFrequencyHz);
    const tauEnd = tauForFrequency(endFrequencyHz);
    const durationSeconds = tauStart - tauEnd;
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new RangeError('Normalized final inspiral requires a positive source-frame duration.');
    }

    // 29.5a: adapt only the visualization sampling density. The physical
    // waveform model, phase evolution and amplitude law remain unchanged.
    // Sampling against the highest displayed frequency prevents the final
    // chirp from producing a false beat/alias pattern in the SVG trace.
    const adaptiveSampleCount = Math.min(
      ADAPTIVE_VISUALIZATION_MAX_SAMPLES,
      Math.max(
        ADAPTIVE_VISUALIZATION_MIN_SAMPLES,
        Math.ceil(
          durationSeconds * endFrequencyHz * ADAPTIVE_VISUALIZATION_SAMPLES_PER_END_CYCLE,
        ) + 1,
      ),
    );
    const resolvedSampleCount = sampleCount ?? adaptiveSampleCount;

    const samples: Array<{ timeSeconds: number; frequencyHz: number; normalizedStrain: number }> = [];
    let phase = 0;
    let previousFrequency = startFrequencyHz;
    let previousTime = -durationSeconds;

    for (let index = 0; index < resolvedSampleCount; index += 1) {
      const progress = index / (resolvedSampleCount - 1);
      const timeSeconds = -durationSeconds * (1 - progress);
      const tau = tauStart - (timeSeconds + durationSeconds);
      const frequencyHz = index === resolvedSampleCount - 1
        ? endFrequencyHz
        : Math.min(endFrequencyHz, frequencyForTau(tau));
      if (index > 0) {
        const deltaTime = timeSeconds - previousTime;
        phase += TWO_PI * 0.5 * (previousFrequency + frequencyHz) * deltaTime;
      }
      const normalizedAmplitude = (frequencyHz / endFrequencyHz) ** (2 / 3);
      samples.push(Object.freeze({
        timeSeconds,
        frequencyHz,
        normalizedStrain: normalizedAmplitude * Math.sin(phase),
      }));
      previousFrequency = frequencyHz;
      previousTime = timeSeconds;
    }

    return Object.freeze({
      startFrequencyHz,
      endFrequencyHz,
      durationSeconds,
      samples: Object.freeze(samples),
    });
  }
}
