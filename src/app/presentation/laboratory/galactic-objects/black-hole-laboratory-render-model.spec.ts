import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';
import { BLACK_HOLE_LABORATORY_TYPES, blackHoleLaboratoryModel, blackHoleLaboratorySamples } from './black-hole-laboratory-render-model';

describe('28.2F.3 — black-hole laboratory render model', () => {
  it('exposes stellar, intermediate and supermassive classes with eight deterministic samples', () => {
    expect(BLACK_HOLE_LABORATORY_TYPES).toEqual([
      ExtremeType.STELLAR_MASS_BLACK_HOLE,
      ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
      ExtremeType.SMBH,
    ]);
    for (const type of BLACK_HOLE_LABORATORY_TYPES) {
      const a = blackHoleLaboratorySamples(type);
      const b = blackHoleLaboratorySamples(type);
      expect(a).toHaveLength(8);
      expect(a).toEqual(b);
      expect(a.map(x => x.sampleLabel)).toEqual(['A','B','C','D','E','F','G','H']);
      expect(a.every(Object.isFrozen)).toBe(true);
    }
  });

  it('keeps the three mass regimes disjoint and physically ordered', () => {
    const stellar = blackHoleLaboratorySamples(ExtremeType.STELLAR_MASS_BLACK_HOLE);
    const imbh = blackHoleLaboratorySamples(ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE);
    const smbh = blackHoleLaboratorySamples(ExtremeType.SMBH);
    expect(Math.max(...stellar.map(x => x.massSolar))).toBeLessThan(Math.min(...imbh.map(x => x.massSolar)));
    expect(Math.max(...imbh.map(x => x.massSolar))).toBeLessThan(Math.min(...smbh.map(x => x.massSolar)));
    expect(stellar.every(x => x.massSolar >= 5 && x.massSolar < 100)).toBe(true);
    expect(imbh.every(x => x.massSolar >= 1e3 && x.massSolar < 1e6)).toBe(true);
    expect(smbh.every(x => x.massSolar >= 1e6)).toBe(true);
  });

  it('derives Schwarzschild radius from mass and exposes bounded spin/accretion/lensing', () => {
    for (const type of BLACK_HOLE_LABORATORY_TYPES) {
      for (const model of blackHoleLaboratorySamples(type)) {
        expect(model.schwarzschildRadiusKm / model.massSolar).toBeCloseTo(2.95325, 3);
        expect(model.spinDimensionless).toBeGreaterThanOrEqual(0);
        expect(model.spinDimensionless).toBeLessThan(1);
        expect(model.accretionRateEddington).toBeGreaterThan(0);
        expect(model.accretionRateEddington).toBeLessThan(1);
        expect(model.lensingStrength).toBeGreaterThan(0);
      }
    }
  });

  it('gives A-H visual diversity without changing class identity', () => {
    for (const type of BLACK_HOLE_LABORATORY_TYPES) {
      const samples = blackHoleLaboratorySamples(type);
      expect(new Set(samples.map(x => x.spinDimensionless)).size).toBeGreaterThanOrEqual(6);
      expect(new Set(samples.map(x => x.inclinationDegrees)).size).toBeGreaterThanOrEqual(6);
      expect(new Set(samples.map(x => x.diskBrightness)).size).toBeGreaterThanOrEqual(6);
      expect(new Set(samples.map(x => x.turbulenceScale)).size).toBe(8);
    }
  });

  it('rejects invalid indexes', () => {
    expect(() => blackHoleLaboratoryModel(ExtremeType.SMBH, -1)).toThrow(RangeError);
    expect(() => blackHoleLaboratoryModel(ExtremeType.SMBH, 8)).toThrow(RangeError);
  });
});
