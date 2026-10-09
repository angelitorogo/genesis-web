import { describe, expect, it } from 'vitest';
import {
  GravitationalWavePostMergerResolution,
} from '../../domain/transient/gravitational-wave-event-profile';
import { CompactMergerProgenitorProfile } from '../../domain/transient/compact-merger-progenitor';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { CompactMergerEventEngine } from './compact-merger-event-engine';
import { GravitationalWaveEventEngine } from './gravitational-wave-event-engine';

function merger(type: typeof CompactMergerType[keyof typeof CompactMergerType]) {
  const progenitor = type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR
    ? new CompactMergerProgenitorProfile(type, 1.38, 1.27, 12.1, 0.006778517936238559, 0.08, 1.4e8)
    : type === CompactMergerType.NEUTRON_STAR_BLACK_HOLE
      ? new CompactMergerProgenitorProfile(type, 1.42, 8.6, 12.2, 0.0082, 0.05, 4.2e7)
      : new CompactMergerProgenitorProfile(type, 32, 27, null, 0.014, 0.03, 6.8e8);
  return CompactMergerEventEngine.deriveProfile(progenitor);
}

describe('GravitationalWaveEventEngine 29.5', () => {
  it('derives source-frame NS-NS quadrupole observables without inventing observer strain', () => {
    const profile = GravitationalWaveEventEngine.deriveProfile(
      merger(CompactMergerType.NEUTRON_STAR_NEUTRON_STAR),
    );

    expect(profile.referenceOrbitalFrequencyHz).toBeCloseTo(9.243048026880595e-5, 12);
    expect(profile.referenceQuadrupoleFrequencyHz).toBeCloseTo(1.848609605376119e-4, 12);
    expect(profile.nonSpinningIscoFrequencyHz).toBeCloseTo(1659.2610545520508, 8);
    expect(profile.referenceLuminosityWatts / 1.2904597582257291e25).toBeCloseTo(1, 12);
    expect(profile.eccentricPowerEnhancementFactor).toBeCloseTo(1.042651603503985, 12);
    expect(profile.circularEquivalentChirpRateHzPerSecond / 1.5048917272939577e-20).toBeCloseTo(1, 12);
    expect(profile.observedStrain).toBeNull();
    expect(profile.observerFrameFrequencyHz).toBeNull();
    expect(profile.luminosityDistanceParsec).toBeNull();
    expect(profile.sourceRedshift).toBeNull();
    expect(profile.postMergerResolution).toBe(
      GravitationalWavePostMergerResolution.NEUTRON_STAR_EOS_UNRESOLVED,
    );
  });

  it.each([
    CompactMergerType.NEUTRON_STAR_BLACK_HOLE,
    CompactMergerType.BLACK_HOLE_BLACK_HOLE,
  ])('keeps %s inspiral intrinsic even when 29.4 Kerr mass budget is unresolved', type => {
    const source = merger(type);
    expect(source.remnantMassSolar).toBeNull();

    const profile = GravitationalWaveEventEngine.deriveProfile(source);
    expect(profile.referenceQuadrupoleFrequencyHz).toBeGreaterThan(0);
    expect(profile.referenceLuminosityWatts).toBeGreaterThan(0);
    expect(profile.nonSpinningIscoFrequencyHz).toBeGreaterThan(profile.referenceQuadrupoleFrequencyHz);
    expect(profile.postMergerResolution).toBe(
      GravitationalWavePostMergerResolution.KERR_REMNANT_UNRESOLVED,
    );
    expect(profile.observedStrain).toBeNull();
  });

  it('builds a deterministic normalized final-inspiral chirp without disguising it as physical strain', () => {
    const profile = GravitationalWaveEventEngine.deriveProfile(
      merger(CompactMergerType.BLACK_HOLE_BLACK_HOLE),
    );
    const waveform = GravitationalWaveEventEngine.normalizedFinalInspiral(profile, 128);
    const again = GravitationalWaveEventEngine.normalizedFinalInspiral(profile, 128);

    expect(waveform).toEqual(again);
    expect(waveform.samples).toHaveLength(128);
    expect(waveform.startFrequencyHz).toBeCloseTo(profile.nonSpinningIscoFrequencyHz / 4, 12);
    expect(waveform.endFrequencyHz).toBeCloseTo(profile.nonSpinningIscoFrequencyHz, 12);
    expect(waveform.durationSeconds).toBeGreaterThan(1);
    expect(waveform.samples[0]?.timeSeconds).toBeCloseTo(-waveform.durationSeconds, 12);
    expect(waveform.samples.at(-1)?.timeSeconds).toBeCloseTo(0, 12);
    expect(waveform.samples.at(-1)?.frequencyHz).toBeCloseTo(waveform.endFrequencyHz, 12);
    expect(waveform.samples.every(sample => Math.abs(sample.normalizedStrain) <= 1 + 1e-12)).toBe(true);
  });

  it.each([
    CompactMergerType.NEUTRON_STAR_NEUTRON_STAR,
    CompactMergerType.NEUTRON_STAR_BLACK_HOLE,
    CompactMergerType.BLACK_HOLE_BLACK_HOLE,
  ])('adapts the default %s visualization sampling to the final chirp frequency', type => {
    const profile = GravitationalWaveEventEngine.deriveProfile(merger(type));
    const waveform = GravitationalWaveEventEngine.normalizedFinalInspiral(profile);
    const sampleIntervalSeconds = waveform.durationSeconds / (waveform.samples.length - 1);
    const samplesPerEndFrequencyCycle = 1 / (sampleIntervalSeconds * waveform.endFrequencyHz);

    expect(waveform.samples.length).toBeGreaterThanOrEqual(512);
    expect(waveform.samples.length).toBeLessThanOrEqual(4096);
    expect(samplesPerEndFrequencyCycle).toBeGreaterThanOrEqual(12);
  });

  it('rejects visualization sampling outside the bounded deterministic contract', () => {
    const profile = GravitationalWaveEventEngine.deriveProfile(
      merger(CompactMergerType.NEUTRON_STAR_BLACK_HOLE),
    );
    expect(() => GravitationalWaveEventEngine.normalizedFinalInspiral(profile, 31)).toThrowError(RangeError);
    expect(() => GravitationalWaveEventEngine.normalizedFinalInspiral(profile, 4097)).toThrowError(RangeError);
  });
});
