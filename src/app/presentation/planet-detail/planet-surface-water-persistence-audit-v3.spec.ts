import { auditPlanetSurfaceWaterPersistenceV3 } from './planet-surface-water-persistence-audit-v3';
import { AtmosphereGas as Gas } from '../../domain/planetary/atmosphere-gas';
import { buildAtmosphereOpticalScienceV1 } from '../system/system-scene-atmosphere-optical-science';
import { buildSystemSceneMolecularAtmosphereVisualV2 } from '../system/system-scene-atmosphere-optical-presentation-v2';

const source = (
  pressure: number | null,
  temperature: number | null,
  gases: readonly {gas: string; moleFraction01: number}[] | null,
  persistent = true,
  solid = true,
) => ({
  hasDefinedSolidSurfaceBase: solid,
  hasPersistentSurfaceLiquidWater: persistent,
  retainedSurfacePressurePascal: pressure,
  meanSurfaceTemperatureKelvin: temperature,
  retainedGasComposition: gases,
});

const quaelaen = [
  { gas: Gas.CARBON_DIOXIDE, moleFraction01: .598 },
  { gas: Gas.NITROGEN, moleFraction01: .247 },
  { gas: Gas.ARGON, moleFraction01: .086 },
  { gas: Gas.CARBON_MONOXIDE, moleFraction01: .029 },
  { gas: Gas.SULFUR_DIOXIDE, moleFraction01: .025 },
  { gas: Gas.WATER_VAPOR, moleFraction01: .014 },
  { gas: Gas.OXYGEN, moleFraction01: .001 },
];
const biten = [
  { gas: Gas.NITROGEN, moleFraction01: .512 },
  { gas: Gas.CARBON_DIOXIDE, moleFraction01: .258 },
  { gas: Gas.ARGON, moleFraction01: .059 },
  { gas: Gas.HYDROGEN, moleFraction01: .012 },
  { gas: Gas.HELIUM, moleFraction01: .011 },
  { gas: Gas.WATER_VAPOR, moleFraction01: .148 },
];

describe('ATM-VIS.3 — scientific atmospheric and surface-water consistency', () => {
  it('flags the unverified evaporation/replenishment balance of hot Quaelaen e without declaring liquid impossible', () => {
    const input = source(938_068.03, 410.77, quaelaen);
    const result = auditPlanetSurfaceWaterPersistenceV3(input);
    expect(result.status).toBe('EVAPORATION_REPLENISHMENT_UNRESOLVED');
    expect(result.waterVaporPartialPressurePascal).toBeCloseTo(938_068.03 * .014, 2);
    expect(result.waterSaturationPressurePascal!).toBeGreaterThan(result.waterVaporPartialPressurePascal! * 4);
    expect(result.boilingTemperatureKelvin!).toBeGreaterThan(410.77);
    expect(result.relativeSaturation01).toBeLessThan(.25);
    expect(input.hasPersistentSurfaceLiquidWater).toBe(true); // read-only audit
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('does not misdiagnose Biten B-3 (0.895 bar, 14.8% water vapor) as severe evaporative deficit', () => {
    const result = auditPlanetSurfaceWaterPersistenceV3(source(89_516.64, 327.48, biten));
    expect(result.status).toBe('THERMALLY_ADMISSIBLE_UNCONFIRMED');
    expect(result.relativeSaturation01!).toBeGreaterThan(.25);
    expect(result.relativeSaturation01!).toBeLessThanOrEqual(1);
  });

  it('does not invent liquid surfaces for Krarum e, Vrusar A-5 or deep envelopes', () => {
    expect(auditPlanetSurfaceWaterPersistenceV3(source(208_063.94, 92.76, [
      {gas: Gas.NITROGEN, moleFraction01: .871},
      {gas: Gas.ARGON, moleFraction01: .103},
      {gas: Gas.CARBON_MONOXIDE, moleFraction01: .025},
      {gas: Gas.OXYGEN, moleFraction01: .001},
    ], false)).status).toBe('NOT_APPLICABLE');
    expect(auditPlanetSurfaceWaterPersistenceV3(source(385.42, 150.07, [
      {gas: Gas.NITROGEN, moleFraction01: 1},
    ], false)).status).toBe('NOT_APPLICABLE');
    expect(auditPlanetSurfaceWaterPersistenceV3(source(null, null, null, false, false)).status)
      .toBe('NOT_APPLICABLE');
  });

  it('does not treat an incomplete gas summary or unknown pressure as zero atmospheric H2O', () => {
    expect(auditPlanetSurfaceWaterPersistenceV3(source(938_068, 410.77, [
      {gas: Gas.CARBON_DIOXIDE, moleFraction01: .598},
      {gas: Gas.NITROGEN, moleFraction01: .247},
    ])).status).toBe('NOT_EVALUABLE');
    expect(auditPlanetSurfaceWaterPersistenceV3(source(null, 410.77, quaelaen)).status)
      .toBe('NOT_EVALUABLE');
    expect(auditPlanetSurfaceWaterPersistenceV3(source(938_068, null, quaelaen)).status)
      .toBe('NOT_EVALUABLE');
  });

  it('identifies an inconsistent legacy persistence flag without changing the original input', () => {
    const sourceState = source(500, 300, [{gas: Gas.NITROGEN, moleFraction01: 1}]);
    const original = structuredClone(sourceState);
    expect(auditPlanetSurfaceWaterPersistenceV3(sourceState).status).toBe('THERMAL_INCONSISTENCY');
    expect(sourceState).toEqual(original);
  });

  it('does not change the optical response of the same final composition, pressure and temperature', () => {
    const optical = buildAtmosphereOpticalScienceV1({
      columnKind: 'SOLID_SURFACE',
      retainedSurfacePressurePascal: 938_068.03,
      meanSurfaceTemperatureKelvin: 410.77,
      surfaceGravityMetersPerSecondSquared: 7.55,
      retainedGasComposition: quaelaen,
      referenceBolometricFluxEarth: 1.478,
      stellarEffectiveTemperatureKelvin: null,
    });
    const before = buildSystemSceneMolecularAtmosphereVisualV2(optical, 0.15);
    auditPlanetSurfaceWaterPersistenceV3(source(938_068.03, 410.77, quaelaen));
    expect(buildSystemSceneMolecularAtmosphereVisualV2(optical, 0.15)).toEqual(before);
    expect(optical.columnStatus).toBe('EVALUABLE');
  });
});
