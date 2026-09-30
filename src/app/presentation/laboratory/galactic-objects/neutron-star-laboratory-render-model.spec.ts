import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';
import {
  NEUTRON_STAR_LABORATORY_TYPES,
  neutronStarLaboratoryModel,
  neutronStarLaboratorySamples,
} from './neutron-star-laboratory-render-model';

describe('28.2F.2 — neutron-star laboratory render model', () => {
  it('exposes four physical laboratory classes with eight deterministic samples each', () => {
    expect(NEUTRON_STAR_LABORATORY_TYPES).toEqual([
      ExtremeType.NEUTRON_STAR,
      ExtremeType.PULSAR,
      ExtremeType.MILLISECOND_PULSAR,
      ExtremeType.MAGNETAR,
    ]);
    for (const type of NEUTRON_STAR_LABORATORY_TYPES) {
      const first = neutronStarLaboratorySamples(type);
      const second = neutronStarLaboratorySamples(type);
      expect(first).toHaveLength(8);
      expect(first).toEqual(second);
      expect(first.map(item => item.sampleLabel)).toEqual(['A','B','C','D','E','F','G','H']);
      expect(first.every(item => Object.isFrozen(item))).toBe(true);
    }
  });

  it('keeps the compact-star mass and reference radius inside the established 27.4 envelope', () => {
    for (const type of NEUTRON_STAR_LABORATORY_TYPES) {
      for (const model of neutronStarLaboratorySamples(type)) {
        expect(model.massSolar).toBeGreaterThanOrEqual(1.1);
        expect(model.massSolar).toBeLessThanOrEqual(2.2);
        expect(model.radiusKm).toBeGreaterThanOrEqual(9);
        expect(model.radiusKm).toBeLessThanOrEqual(15.5);
      }
    }
  });

  it('keeps ordinary pulsars, millisecond pulsars and magnetars in distinct illustrative envelopes', () => {
    for (const model of neutronStarLaboratorySamples(ExtremeType.PULSAR)) {
      expect(model.spinPeriodSeconds!).toBeGreaterThanOrEqual(0.04);
      expect(model.spinPeriodSeconds!).toBeLessThanOrEqual(30);
      expect(model.magneticFieldTesla!).toBeGreaterThanOrEqual(1e7);
      expect(model.magneticFieldTesla!).toBeLessThanOrEqual(3e8);
      expect(model.showBeams).toBe(true);
    }
    for (const model of neutronStarLaboratorySamples(ExtremeType.MILLISECOND_PULSAR)) {
      expect(model.spinPeriodSeconds!).toBeGreaterThanOrEqual(0.002);
      expect(model.spinPeriodSeconds!).toBeLessThan(0.03);
      expect(model.magneticFieldTesla!).toBeGreaterThanOrEqual(1e4);
      expect(model.magneticFieldTesla!).toBeLessThanOrEqual(1e5);
      expect(model.showBeams).toBe(true);
    }
    for (const model of neutronStarLaboratorySamples(ExtremeType.MAGNETAR)) {
      expect(model.magneticFieldTesla!).toBeGreaterThanOrEqual(3e9);
      expect(model.showMagneticField).toBe(true);
      expect(model.showBeams).toBe(false);
    }
  });

  it('does not invent physical spin or field values for the generic neutron-star class', () => {
    const model = neutronStarLaboratoryModel(ExtremeType.NEUTRON_STAR, 0);
    expect(model.spinPeriodSeconds).toBeNull();
    expect(model.magneticFieldTesla).toBeNull();
    expect(model.showBeams).toBe(false);
    expect(model.showMagneticField).toBe(false);
  });

  it('provides eight deterministic blue-family procedural palettes for generic neutron stars', () => {
    const samples = neutronStarLaboratorySamples(ExtremeType.NEUTRON_STAR);
    expect(new Set(samples.map(model => model.surfaceColor)).size).toBe(8);
    for (const model of samples) {
      expect(model.deepSurfaceColor).not.toBe(model.surfaceColor);
      expect(model.hotSurfaceColor).not.toBe(model.deepSurfaceColor);
      expect(model.glowColor).not.toBe(model.deepSurfaceColor);
    }
  });

  it('28.2F.2b gives A-H materially different procedural morphology profiles', () => {
    const samples = neutronStarLaboratorySamples(ExtremeType.NEUTRON_STAR);
    expect(new Set(samples.map(model => model.surfaceNoiseScale)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.surfaceDetailScale)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.surfaceBrightness)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.coronaOpacity)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.wispCount)).size).toBeGreaterThanOrEqual(6);

    const [a, b, c, d, e, f, g, h] = samples;
    expect(a.surfaceBrightness).toBeGreaterThan(h.surfaceBrightness);
    expect(b.surfaceHotIntensity).toBeLessThan(a.surfaceHotIntensity);
    expect(c.surfaceFineScale).toBeGreaterThan(a.surfaceFineScale);
    expect(d.wispCount).toBeGreaterThan(e.wispCount);
    expect(d.wispOpacity).toBeGreaterThan(e.wispOpacity);
    expect(f.surfaceFresnelStrength).toBeGreaterThan(b.surfaceFresnelStrength);
    expect(g.activityRate).toBeGreaterThan(h.activityRate);
    expect(h.surfaceContrast).toBeGreaterThan(e.surfaceContrast);
  });


  it('28.2F.2c gives ordinary pulsars detailed blue-family surface and magnetosphere diversity', () => {
    const samples = neutronStarLaboratorySamples(ExtremeType.PULSAR);
    expect(new Set(samples.map(model => model.surfaceColor)).size).toBe(8);
    expect(new Set(samples.map(model => model.surfaceDetailScale)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.fieldLineCount)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(samples.map(model => model.fieldExtent)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.activityRate)).size).toBeGreaterThanOrEqual(6);
    expect(samples.every(model => model.showBeams && model.showMagneticField)).toBe(true);
    expect(samples.every(model => model.beamHalfOpeningAngleDegrees !== null)).toBe(true);
  });


  it('28.2F.2d gives millisecond pulsars a distinct compact high-cadence visual envelope', () => {
    const samples = neutronStarLaboratorySamples(ExtremeType.MILLISECOND_PULSAR);
    expect(new Set(samples.map(model => model.surfaceColor)).size).toBe(8);
    expect(new Set(samples.map(model => model.surfaceDetailScale)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.surfaceFineScale)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.fieldLineCount)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(samples.map(model => model.fieldExtent)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.activityRate)).size).toBeGreaterThanOrEqual(6);
    expect(samples.every(model => model.showBeams && model.showMagneticField)).toBe(true);
    expect(samples.every(model => (model.beamHalfOpeningAngleDegrees ?? 0) <= 14)).toBe(true);

    const [a, b, c, d, e, f, g, h] = samples;
    expect(d.activityRate).toBeGreaterThan(e.activityRate);
    expect(g.surfaceFineScale).toBeGreaterThan(a.surfaceFineScale);
    expect(a.surfaceBrightness).toBeGreaterThan(h.surfaceBrightness);
    expect(f.surfaceFresnelStrength).toBeGreaterThan(e.surfaceFresnelStrength);
    expect(d.coronaOpacity).toBeGreaterThan(b.coronaOpacity);
  });


  it('28.2F.2e gives magnetars a distinct extreme-magnetosphere visual envelope', () => {
    const samples = neutronStarLaboratorySamples(ExtremeType.MAGNETAR);
    expect(new Set(samples.map(model => model.surfaceColor)).size).toBe(8);
    expect(new Set(samples.map(model => model.surfaceDetailScale)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.fieldLineCount)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.fieldExtent)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.wispCount)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(samples.map(model => model.coronaOpacity)).size).toBeGreaterThanOrEqual(6);
    expect(samples.every(model => model.showMagneticField && !model.showBeams)).toBe(true);

    const [a, b, c, d, e, f, g, h] = samples;
    expect(d.wispCount).toBeGreaterThan(e.wispCount);
    expect(g.activityRate).toBeGreaterThan(h.activityRate);
    expect(f.surfaceFresnelStrength).toBeGreaterThan(e.surfaceFresnelStrength);
    expect(a.surfaceBrightness).toBeGreaterThan(h.surfaceBrightness);
    expect(c.fieldLineCount).toBeGreaterThanOrEqual(b.fieldLineCount);
  });

  it('rejects invalid sample indexes', () => {
    expect(() => neutronStarLaboratoryModel(ExtremeType.PULSAR, -1)).toThrow(RangeError);
    expect(() => neutronStarLaboratoryModel(ExtremeType.PULSAR, 8)).toThrow(RangeError);
  });
});
