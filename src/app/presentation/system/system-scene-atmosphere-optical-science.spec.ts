import { AtmosphereGas as Gas } from '../../domain/planetary/atmosphere-gas';
import {
  buildAtmosphereOpticalScienceV1,
  type AtmosphereOpticalScienceInputV1,
} from './system-scene-atmosphere-optical-science';

const earthDry = Object.freeze([
  { gas: Gas.NITROGEN, moleFraction01: 0.78084 },
  { gas: Gas.OXYGEN, moleFraction01: 0.20946 },
  { gas: Gas.ARGON, moleFraction01: 0.00934 },
  { gas: Gas.CARBON_DIOXIDE, moleFraction01: 0.00042 },
]);
const quaelaen = Object.freeze([
  { gas: Gas.CARBON_DIOXIDE, moleFraction01: 0.598 },
  { gas: Gas.NITROGEN, moleFraction01: 0.247 },
  { gas: Gas.ARGON, moleFraction01: 0.086 },
  { gas: Gas.CARBON_MONOXIDE, moleFraction01: 0.029 },
  { gas: Gas.SULFUR_DIOXIDE, moleFraction01: 0.025 },
  { gas: Gas.WATER_VAPOR, moleFraction01: 0.014 },
  { gas: Gas.OXYGEN, moleFraction01: 0.001 },
]);
const sample = (overrides: Partial<AtmosphereOpticalScienceInputV1> = {}) =>
  buildAtmosphereOpticalScienceV1({
    columnKind: 'SOLID_SURFACE',
    retainedGasComposition: earthDry,
    retainedSurfacePressurePascal: 101_325,
    meanSurfaceTemperatureKelvin: 288.15,
    surfaceGravityMetersPerSecondSquared: 9.80665,
    referenceBolometricFluxEarth: 1,
    stellarEffectiveTemperatureKelvin: 5772,
    ...overrides,
  });

describe('ATM-VIS.1 — scientific audit and non-rendering optical handoff', () => {
  it('uses a calibrated, wavelength-dependent molecular scattering reference', () => {
    const earth = sample();
    expect(earth.columnStatus).toBe('EVALUABLE');
    expect(earth.estimatedRayleighOpticalDepth?.at550Nm).toBeCloseTo(0.0987, 5);
    expect(earth.estimatedRayleighOpticalDepth!.at450Nm)
      .toBeGreaterThan(earth.estimatedRayleighOpticalDepth!.at550Nm);
    expect(earth.estimatedRayleighOpticalDepth!.at550Nm)
      .toBeGreaterThan(earth.estimatedRayleighOpticalDepth!.at650Nm);
    expect(earth.displayColorResolved).toBe(false);
    expect(earth.visibleAbsorptionResolved).toBe(false);
  });

  it('models a CO2-rich, dense Quaelaen-like gas column without inventing orange pigments', () => {
    const rich = sample({
      retainedGasComposition: quaelaen,
      retainedSurfacePressurePascal: 938_068,
      meanSurfaceTemperatureKelvin: 410.77,
      surfaceGravityMetersPerSecondSquared: 7.55,
      referenceBolometricFluxEarth: 1.478,
    });
    expect(rich.columnStatus).toBe('EVALUABLE');
    expect(rich.estimatedRayleighOpticalDepth!.at550Nm).toBeGreaterThan(
      sample().estimatedRayleighOpticalDepth!.at550Nm * 3,
    );
    expect(rich.approximateScaleHeightKilometers).toBeGreaterThan(0);
    expect(rich.cloudAndAerosolOpacityResolved).toBe(false);
    expect(rich.displayColorResolved).toBe(false);
  });

  it('does not confuse zero pressure, unknown pressure, missing gas and incomplete fractions', () => {
    expect(sample({retainedSurfacePressurePascal: 0}).columnStatus).toBe('VACUUM');
    expect(sample({retainedSurfacePressurePascal: 0}).estimatedRayleighOpticalDepth).toBeNull();
    expect(sample({retainedSurfacePressurePascal: null}).columnStatus).toBe('PRESSURE_UNRESOLVED');
    expect(sample({retainedGasComposition: null}).columnStatus).toBe('COMPOSITION_UNRESOLVED');
    expect(sample({retainedGasComposition: [{gas: Gas.NITROGEN, moleFraction01: 0.8}]}).columnStatus)
      .toBe('COMPOSITION_INCOMPLETE');
    expect(sample({surfaceGravityMetersPerSecondSquared: null}).columnStatus)
      .toBe('GRAVITY_UNRESOLVED');
    expect(sample({columnKind: 'DEEP_ENVELOPE'}).columnStatus)
      .toBe('DEEP_ENVELOPE_NO_REFERENCE_COLUMN');
  });

  it('does not use temperature or stellar irradiance as a fabricated gas color', () => {
    const cold = sample({meanSurfaceTemperatureKelvin: 210, referenceBolometricFluxEarth: 0.2});
    const hot = sample({meanSurfaceTemperatureKelvin: 420, referenceBolometricFluxEarth: 3});
    expect(cold.estimatedRayleighOpticalDepth).toEqual(hot.estimatedRayleighOpticalDepth);
    expect(hot.approximateScaleHeightKilometers).toBeCloseTo(
      2 * cold.approximateScaleHeightKilometers!, 10,
    );
    expect(cold.displayColorResolved).toBe(false);
    expect(sample({referenceBolometricFluxEarth: 0}).stellarContinuumRelativeTo550Nm).toBeNull();
    expect(hot.displayColorResolved).toBe(false);
  });

  it('treats effective stellar temperature as a blackbody continuum proxy, not a detected spectrum', () => {
    const cool = sample({stellarEffectiveTemperatureKelvin: 3200});
    const hot = sample({stellarEffectiveTemperatureKelvin: 10_000});
    const coolBands = cool.stellarContinuumRelativeTo550Nm!;
    const hotBands = hot.stellarContinuumRelativeTo550Nm!;
    expect(hotBands.at450Nm).toBeGreaterThan(coolBands.at450Nm);
    expect(coolBands.at650Nm).toBeGreaterThan(hotBands.at650Nm);
    expect(sample({stellarEffectiveTemperatureKelvin: null}).stellarContinuumRelativeTo550Nm)
      .toBeNull();
    expect(sample({referenceBolometricFluxEarth: 0}).stellarContinuumRelativeTo550Nm).toBeNull();
    expect(hot.displayColorResolved).toBe(false);
  });

  it('requires final, complete, valid and unique chemical components', () => {
    expect(() => sample({retainedGasComposition: [{gas: Gas.NITROGEN, moleFraction01: 1.1}]}))
      .toThrow(RangeError);
    expect(() => sample({retainedGasComposition: [
      {gas: Gas.NITROGEN, moleFraction01: 0.5},
      {gas: Gas.NITROGEN, moleFraction01: 0.5},
    ]})).toThrow(RangeError);
    expect(() => sample({retainedGasComposition: [
      {gas: Gas.NITROGEN, moleFraction01: 0.8},
      {gas: Gas.OXYGEN, moleFraction01: 0.3},
    ]})).toThrow(RangeError);
    expect(() => sample({retainedSurfacePressurePascal: -1})).toThrow(RangeError);
    expect(() => sample({surfaceGravityMetersPerSecondSquared: 0})).toThrow(RangeError);
  });

  it('keeps deterministic, frozen, pure output across all supported gas species', () => {
    const species = Object.values(Gas);
    for (const gas of species) {
      const a = sample({retainedGasComposition: [{gas, moleFraction01: 1}]});
      const b = sample({retainedGasComposition: [{gas, moleFraction01: 1}]});
      expect(a).toEqual(b);
      expect(Object.isFrozen(a)).toBe(true);
      expect(Object.isFrozen(a.estimatedRayleighOpticalDepth)).toBe(true);
    }
    expect(species).toHaveLength(11);
  });
});
