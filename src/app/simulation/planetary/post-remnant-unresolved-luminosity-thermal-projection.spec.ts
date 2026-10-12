import {
  projectPostRemnantUnresolvedLuminosityThermalState,
} from './post-remnant-unresolved-luminosity-thermal-projection';

describe('29.1E hotfix - compact luminosity unknown: intrinsic-only energy', () => {
  it('preserves a nonzero geothermal contribution without inventing stellar radiation', () => {
    const snapshot = Object.freeze({
      massEarth: 0.749,
      radiusEarth: 0.948,
      referenceBondAlbedo01: 0.138,
      internalHeatRetentionIndex01: 0.653,
      tidalHeatingIndex01: 0,
    });
    const before = JSON.stringify(snapshot);
    const a = projectPostRemnantUnresolvedLuminosityThermalState(snapshot);
    const b = projectPostRemnantUnresolvedLuminosityThermalState(snapshot);
    expect(a).toEqual(b);
    expect(JSON.stringify(snapshot)).toBe(before);
    expect(a?.geothermalFluxWattsPerSquareMeter).toBeGreaterThan(0);
    expect(a?.tidalFluxWattsPerSquareMeter).toBe(0);
    expect(a?.intrinsicBlackbodyEquivalentKelvin).toBeGreaterThan(0);
    expect(a?.intrinsicBlackbodyEquivalentKelvin).toBeLessThan(100);
    expect(Object.isFrozen(a)).toBe(true);
  });

  it('preserves independent tidal heating without assigning a WD luminosity', () => {
    const projected = projectPostRemnantUnresolvedLuminosityThermalState({
      massEarth: 1.876,
      radiusEarth: 1.273,
      referenceBondAlbedo01: 0.207,
      internalHeatRetentionIndex01: 0.792,
      tidalHeatingIndex01: 0.6,
    });
    expect(projected?.tidalFluxWattsPerSquareMeter).toBeGreaterThan(0);
    expect(projected?.totalIntrinsicFluxWattsPerSquareMeter).toBeCloseTo(
      projected!.geothermalFluxWattsPerSquareMeter + projected!.tidalFluxWattsPerSquareMeter,
      12,
    );
  });

  it('does not substitute zeros for missing intrinsic proxies', () => {
    expect(projectPostRemnantUnresolvedLuminosityThermalState({
      massEarth: 1,
      radiusEarth: 1,
      referenceBondAlbedo01: 0.3,
      internalHeatRetentionIndex01: null,
      tidalHeatingIndex01: null,
    })).toBeNull();
  });

  it('rejects physically invalid input instead of silently generating energy', () => {
    expect(() => projectPostRemnantUnresolvedLuminosityThermalState({
      massEarth: -1,
      radiusEarth: 1,
      referenceBondAlbedo01: 0.1,
      internalHeatRetentionIndex01: 0.5,
      tidalHeatingIndex01: 0,
    })).toThrow(RangeError);
  });
});
