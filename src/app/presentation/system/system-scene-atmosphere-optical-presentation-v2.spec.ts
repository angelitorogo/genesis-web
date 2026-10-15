import { AtmosphereGas as Gas } from '../../domain/planetary/atmosphere-gas';
import { buildAtmosphereOpticalScienceV1 } from './system-scene-atmosphere-optical-science';
import { buildSystemSceneMolecularAtmosphereVisualV2 } from './system-scene-atmosphere-optical-presentation-v2';
import { buildSystemSceneAtmosphereOpticsV1 } from './system-scene-atmosphere-optics';

const composition = (gas: Gas) => [{gas, moleFraction01: 1}];
const science = (gas: Gas, pressure = 101325, g = 9.80665) =>
  buildAtmosphereOpticalScienceV1({
    columnKind: 'SOLID_SURFACE',
    retainedGasComposition: composition(gas),
    retainedSurfacePressurePascal: pressure,
    meanSurfaceTemperatureKelvin: 300,
    surfaceGravityMetersPerSecondSquared: g,
    referenceBolometricFluxEarth: 1,
    stellarEffectiveTemperatureKelvin: 5772,
  });
const visual = (opticalScience: ReturnType<typeof science> | null, clouds = 0.1) =>
  buildSystemSceneAtmosphereOpticsV1({
    baseColorHex: '#9B826A', surfaceStyle: 'rocky',
    surfaceEnvironment: {
      solidSurfaceAvailable: true,
      retainedGasComposition: composition(Gas.NITROGEN),
      retainedSurfacePressurePascal: 101325,
      retainedAtmosphericWaterVaporMoleFraction01: 0,
      presentationCloudCoverageFraction01: clouds,
      surfaceIceCoverageFraction01: 0,
    },
    giantAtmosphere: null,
    opticalScience,
  });

describe('ATM-VIS.2 — physically constrained procedural atmospheric presentation', () => {
  it('supports all 11 species with bounded deterministic optical color', () => {
    for (const gas of Object.values(Gas)) {
      const diagnostic = science(gas);
      const a = buildSystemSceneMolecularAtmosphereVisualV2(diagnostic, 0.2);
      const b = buildSystemSceneMolecularAtmosphereVisualV2(diagnostic, 0.2);
      expect(a).toEqual(b);
      expect(a?.dayTintHex).toMatch(/^#[0-9A-F]{6}$/);
      expect(a!.molecularVisibility01).toBeGreaterThanOrEqual(0);
      expect(a!.molecularVisibility01).toBeLessThanOrEqual(1);
      expect(Object.isFrozen(a)).toBe(true);
    }
  });

  it('does not invent orange CO2 haze or purple SO2 haze', () => {
    const co2 = visual(science(Gas.CARBON_DIOXIDE, 938068, 7.55));
    const n2 = visual(science(Gas.NITROGEN, 938068, 7.55));
    const so2 = visual(science(Gas.SULFUR_DIOXIDE, 938068, 7.55));
    for (const planet of [co2, n2, so2]) {
      const color = planet.presentationDayTintHex;
      const r = parseInt(color.slice(1,3),16);
      const g = parseInt(color.slice(3,5),16);
      const b = parseInt(color.slice(5,7),16);
      expect(r).toBeLessThanOrEqual(g);
      expect(g).toBeLessThanOrEqual(b);
      expect(planet.presentationShellScale).toBeGreaterThan(1);
    }
    expect(co2.presentationDayTintHex).not.toBe(n2.presentationDayTintHex);
  });

  it('handles the Quaelaen e final gas mixture without an invented aerosol color', () => {
    const quaelaen = buildAtmosphereOpticalScienceV1({
      columnKind: 'SOLID_SURFACE',
      retainedGasComposition: [
        {gas: Gas.CARBON_DIOXIDE, moleFraction01: 0.598},
        {gas: Gas.NITROGEN, moleFraction01: 0.247},
        {gas: Gas.ARGON, moleFraction01: 0.086},
        {gas: Gas.CARBON_MONOXIDE, moleFraction01: 0.029},
        {gas: Gas.SULFUR_DIOXIDE, moleFraction01: 0.025},
        {gas: Gas.WATER_VAPOR, moleFraction01: 0.014},
        {gas: Gas.OXYGEN, moleFraction01: 0.001},
      ],
      retainedSurfacePressurePascal: 938068,
      meanSurfaceTemperatureKelvin: 410.77,
      surfaceGravityMetersPerSecondSquared: 7.55,
      referenceBolometricFluxEarth: 1.478,
      stellarEffectiveTemperatureKelvin: null,
    });
    expect(quaelaen.columnStatus).toBe('EVALUABLE');
    const optical = visual(quaelaen);
    const rgb = optical.presentationDayTintHex;
    const red = parseInt(rgb.slice(1,3),16);
    const blue = parseInt(rgb.slice(5,7),16);
    expect(blue).toBeGreaterThanOrEqual(red);
    expect(optical.presentationShellScale).toBeGreaterThan(1);
    expect(buildSystemSceneMolecularAtmosphereVisualV2(quaelaen, 0)).toEqual(
      buildSystemSceneMolecularAtmosphereVisualV2(quaelaen, 0));
  });

  it('saturates high columns rather than an unlimited Rayleigh-blue extrapolation', () => {
    const low = buildSystemSceneMolecularAtmosphereVisualV2(science(Gas.NITROGEN, 500), 0)!;
    const high = buildSystemSceneMolecularAtmosphereVisualV2(science(Gas.NITROGEN, 3_000_000), 0)!;
    expect(high.molecularVisibility01).toBeGreaterThan(low.molecularVisibility01);
    const blueBias = (hex: string) => parseInt(hex.slice(5,7),16)-parseInt(hex.slice(1,3),16);
    expect(blueBias(high.dayTintHex)).toBeLessThanOrEqual(blueBias(low.dayTintHex));
  });

  it('uses only existing cloud-coverage information for a gentle neutral veil', () => {
    const gas = science(Gas.NITROGEN);
    const dry = buildSystemSceneMolecularAtmosphereVisualV2(gas, 0)!;
    const cloudy = buildSystemSceneMolecularAtmosphereVisualV2(gas, 0.9)!;
    expect(dry.dayTintHex).not.toBe(cloudy.dayTintHex);
    expect(dry.molecularVisibility01).toBe(cloudy.molecularVisibility01);
  });

  it('does not turn unknown compositions or a vacuum into a modeled atmosphere', () => {
    const vacuum = buildAtmosphereOpticalScienceV1({
      columnKind: 'SOLID_SURFACE', retainedGasComposition: composition(Gas.NITROGEN),
      retainedSurfacePressurePascal: 0, meanSurfaceTemperatureKelvin: 300,
      surfaceGravityMetersPerSecondSquared: 9.8,
      referenceBolometricFluxEarth: null, stellarEffectiveTemperatureKelvin: null,
    });
    const unknown = buildAtmosphereOpticalScienceV1({
      columnKind: 'SOLID_SURFACE', retainedGasComposition: null,
      retainedSurfacePressurePascal: 101325, meanSurfaceTemperatureKelvin: 300,
      surfaceGravityMetersPerSecondSquared: 9.8,
      referenceBolometricFluxEarth: null, stellarEffectiveTemperatureKelvin: null,
    });
    expect(buildSystemSceneMolecularAtmosphereVisualV2(vacuum, null)).toBeNull();
    expect(buildSystemSceneMolecularAtmosphereVisualV2(unknown, null)).toBeNull();
    expect(visual(unknown).atmospherePresent).toBe(true);
    expect(visual(unknown).presentationDayTintHex).not.toBe(visual(null).presentationDayTintHex);
  });

  it('preserves D.4d shell geometry, terminator and all old callers', () => {
    const baseline = visual(null);
    const withScience = visual(science(Gas.NITROGEN));
    expect(withScience.presentationShellScale).toBe(baseline.presentationShellScale);
    // A small, bounded response to the modeled molecular column is allowed;
    // no wholesale changes to D.4d's pressure hierarchy or shell dimensions.
    expect(Math.abs(withScience.presentationRimStrength01 - baseline.presentationRimStrength01)).toBeLessThan(0.12);
    expect(Math.abs(withScience.presentationFrontHaze01 - baseline.presentationFrontHaze01)).toBeLessThan(0.12);
    expect(Math.abs(withScience.presentationTerminatorSoftness01 - baseline.presentationTerminatorSoftness01)).toBeLessThan(0.05);
    expect(withScience.presentationDayTintHex).not.toBe(baseline.presentationDayTintHex);
  });
});
