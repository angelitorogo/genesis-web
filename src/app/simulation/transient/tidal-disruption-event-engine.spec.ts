import { describe, expect, it } from 'vitest';
import {
  TidalDisruptionOutcome,
  TidalFallbackResolution,
} from '../../domain/transient/tidal-disruption-event-profile';
import {
  TidalDisruptionEncounterProfile,
  TidalDisruptionVictimKind,
} from '../../domain/transient/tidal-disruption-encounter-profile';
import { TidalDisruptionEventEngine } from './tidal-disruption-event-engine';

function encounter(
  victimKind: typeof TidalDisruptionVictimKind[keyof typeof TidalDisruptionVictimKind],
  blackHoleMassSolar: number,
  stellarMassSolar: number,
  stellarRadiusSolar: number,
  beta: number,
) {
  return new TidalDisruptionEncounterProfile(
    victimKind,
    blackHoleMassSolar,
    stellarMassSolar,
    stellarRadiusSolar,
    beta,
  );
}

describe('TidalDisruptionEventEngine 29.6', () => {
  it('derives a solar-type external SMBH disruption and canonical fallback reference', () => {
    const profile = TidalDisruptionEventEngine.deriveProfile(encounter(
      TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR,
      1e6,
      1,
      1,
      1.2,
    ));

    expect(profile.outcome).toBe(TidalDisruptionOutcome.EXTERNAL_DISRUPTION_EXPECTED);
    expect(profile.fallbackResolution).toBe(TidalFallbackResolution.FROZEN_IN_REFERENCE_AVAILABLE);
    expect(profile.tidalToSchwarzschildRatio).toBeCloseTo(23.556385162653335, 10);
    expect(profile.pericenterToCaptureRatio).toBeCloseTo(9.815160484438891, 10);
    expect((profile.mostBoundFallbackTimeSeconds ?? 0) / 86_400).toBeCloseTo(40.95356886690805, 8);
    expect(profile.peakFallbackRateSolarPerYear).toBeCloseTo(2.9728788813416056, 10);
  });

  it('keeps a grazing red-giant encounter hydrodynamically unresolved instead of fabricating stripped mass', () => {
    const profile = TidalDisruptionEventEngine.deriveProfile(encounter(
      TidalDisruptionVictimKind.RED_GIANT,
      3e6,
      1.3,
      18,
      0.65,
    ));

    expect(profile.outcome).toBe(TidalDisruptionOutcome.GRAZING_PARTIAL_DISRUPTION_UNRESOLVED);
    expect(profile.fallbackResolution).toBe(TidalFallbackResolution.BOUND_MASS_FRACTION_UNRESOLVED);
    expect(profile.mostBoundFallbackTimeSeconds).toBeNull();
    expect(profile.peakFallbackRateSolarPerYear).toBeNull();
    expect(TidalDisruptionEventEngine.normalizedFallbackCurve(profile)).toBeNull();
  });

  it('allows a white-dwarf TDE around an IMBH while excluding neutron-star scale victims', () => {
    const profile = TidalDisruptionEventEngine.deriveProfile(encounter(
      TidalDisruptionVictimKind.WHITE_DWARF,
      1e4,
      0.6,
      0.012,
      1.35,
    ));

    expect(profile.outcome).toBe(TidalDisruptionOutcome.EXTERNAL_DISRUPTION_EXPECTED);
    expect(profile.pericenterToCaptureRatio).toBeCloseTo(2.674293354553599, 10);
    expect((profile.mostBoundFallbackTimeSeconds ?? 0) / 60).toBeCloseTo(12.92036744375818, 8);

    expect(() => encounter(
      TidalDisruptionVictimKind.WHITE_DWARF,
      1e4,
      1.4,
      0.00002,
      1,
    )).toThrowError(RangeError);
  });

  it('identifies direct capture under the Schwarzschild parabolic reference before inventing an external TDE', () => {
    const profile = TidalDisruptionEventEngine.deriveProfile(encounter(
      TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR,
      1e8,
      1,
      1,
      1,
    ));

    expect(profile.outcome).toBe(TidalDisruptionOutcome.DIRECT_CAPTURE_NONSPINNING_REFERENCE);
    expect(profile.pericenterToCaptureRatio).toBeLessThan(1);
    expect(profile.mostBoundFallbackTimeSeconds).toBeNull();
    expect(profile.peakFallbackRateSolarPerYear).toBeNull();
  });

  it('does not duplicate the stellar-mass NS-BH disruption channel already owned by 29.3/29.4', () => {
    expect(() => encounter(
      TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR,
      8.6,
      1,
      1,
      1,
    )).toThrowError(RangeError);
  });

  it('never invents Kerr spin, efficiency, luminosity or observer flux', () => {
    const profile = TidalDisruptionEventEngine.deriveProfile(encounter(
      TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR,
      1e6,
      1,
      1,
      1.2,
    ));

    expect(profile.blackHoleSpinDimensionless).toBeNull();
    expect(profile.radiativeEfficiency).toBeNull();
    expect(profile.intrinsicBolometricLuminosityWatts).toBeNull();
    expect(profile.observedFluxWattsPerSquareMeter).toBeNull();
    expect(profile.eddingtonLuminosityReferenceWatts / 1.26e37).toBeCloseTo(1, 12);
  });

  it('builds a deterministic normalized t^-5/3 fallback curve without presenting it as luminosity', () => {
    const profile = TidalDisruptionEventEngine.deriveProfile(encounter(
      TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR,
      1e6,
      1,
      1,
      1.2,
    ));
    const curve = TidalDisruptionEventEngine.normalizedFallbackCurve(profile, 96);
    const again = TidalDisruptionEventEngine.normalizedFallbackCurve(profile, 96);

    expect(curve).not.toBeNull();
    expect(curve).toEqual(again);
    expect(curve?.samples).toHaveLength(96);
    expect(curve?.samples[0]?.normalizedFallbackRate).toBeCloseTo(1, 12);
    expect(curve?.samples.at(-1)?.normalizedFallbackRate).toBeCloseTo(30 ** (-5 / 3), 12);
  });
});
