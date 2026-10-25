import { describe, expect, it } from 'vitest';
import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { RelevantMoon } from '../../domain/planetary/relevant-moon';
import type { MoonIdentity } from '../../domain/planetary/moon-identity';
import {
  environmentalConditionalPRE3301, environmentalModelledPRE3301,
  environmentalIsPhysicalPRE3301, validateEnvironmentalContractPRE3301,
} from '../../domain/planetary/environmental-physical-contract-pre33-01';
import { EnvironmentalPhysicalProjectionPRE3301 as projection } from './environmental-physical-projection-pre33-01';

// Minimal source projections with their REAL 19/20/21/32.F field names.
// No seed overrides or mutation of production generator classes.
function fixturePlanet(): Planet {
  return {
    planetOrdinal: 1,
    locator: { galaxyIndex: 0n, sectorKey: 7n, galacticObjectIndex: 4n, bodyIndex: 0n },
    physicalProperties: {massEarth: 1, radiusEarth: 1, surfaceGravityMetersPerSecondSquared: 9.80665},
  } as unknown as Planet;
}
function fixtureAtmosphere(planet: Planet, pressure = 100_000, waterPressure = 90_000): Atmosphere {
  return {
    hostPlanet: planet,
    climateState: {planetOrdinal: 1, equilibriumTemperatureKelvin: 250, meanSurfaceTemperatureKelvin: 280},
    retentionState: {planetOrdinal: 1, retainedSurfacePressurePascal: pressure},
    waterInventory: {planetOrdinal: 1, sourceRetainedSurfacePressurePascal: waterPressure,
      surfaceLiquidWaterCoverageFraction01: .4, waterInventoryIndex01: .9,
      hasPersistentSurfaceLiquidWater: true},
    surfaceRadiationState: {surfaceRadiationExposureIndex01: 0.1},
  } as unknown as Atmosphere;
}
function fixtureMoon(pressureBasis: 'CONDITIONAL_SCENARIO' | 'PHYSICAL_BALANCE' | 'UNRESOLVED' = 'CONDITIONAL_SCENARIO'): RelevantMoon {
  const hostPlanetLocator = fixturePlanet().locator;
  return {
    hostPlanetLocator,
    hostPlanetOrdinal: 1, moonOrdinal: 2,
    identity: { hostPlanetOrdinal: 1, moonOrdinal: 2, hostPlanetLocator },
    physicalProperties: {moonOrdinal: 2, massEarth: .01, radiusEarth: .2, surfaceGravityEarth: .25},
    environmentState: {
      hostPlanetOrdinal: 1, moonOrdinal: 2,
      equilibriumTemperatureKelvin: 180, estimatedSurfaceTemperatureKelvin: 210,
      atmosphereAssessment: {pressureBasis, estimatedSurfacePressurePascal: 47_915,
        physicalBalance32F1: pressureBasis === 'PHYSICAL_BALANCE'
          ? {sourceKind: 'INDEPENDENT_MASS_AND_FLUXES', sourceId: 'test-explicit-source',
            interpretation: 'PHYSICAL_INTERVAL_MODEL_NOT_OBSERVATION', durationSeconds: 86_400,
            remainingGasMassKilograms: 1000, surfacePressurePascal: 47_915,
            gasResults: [{gas: 'N2', gasMassKilograms: 1000, partialPressurePascal: 47_915}]}
          : null},
    },
    oceanReality32F2c: {state: 'PRESENT_IN_SIMULATED_MODEL', reason: 'SUBSURFACE_LIQUID_IN_GENERATED_MODEL',
      simulatedLiquidWaterMassKilograms: 2e20, generatedTotalSurfaceHeatFluxWattsPerSquareMeter: .12},
    geochemicalEnergy32F4: {actualChemicalPowerWatts: null, actualChemicalDisequilibriumJoulesPerMole: null},
    radiationProtection32F3: {referenceBolometricWattsPerSquareMeter: 100,
      surfaceIonisingDoseGrayPerYear: null, subsurfaceIonisingDoseGrayPerYear: null,
      referenceOneMeVGammaIceOpticalDepth: 150},
  } as unknown as RelevantMoon;
}

describe('PRE-33.01 — contrato universal de planeta/luna CT-0, SOLO INTERNO', () => {
  it('20.3/20.7 conservan columnas separadas, sin certificar presión atmosférica independiente', () => {
    const planet = fixturePlanet();
    const dto = projection.planet(planet, fixtureAtmosphere(planet));
    expect(dto.bodyKind).toBe('PLANET');
    expect(dto.atmosphere.columnRelation).toBe('DIVERGENT');
    expect(dto.atmosphere.retainedSurfacePressurePascal.value).toBe(100_000);
    expect(dto.atmosphere.waterAssessmentPressurePascal.value).toBe(90_000);
    expect(dto.atmosphere.retainedSurfacePressurePascal.state).toBe('CONDITIONAL_SCENARIO');
    expect(dto.atmosphere.physicallySupportedSurfacePressurePascal.state).toBe('UNRESOLVED');
    expect(dto.water.surfaceLiquidCoverage01.state).toBe('CONDITIONAL_SCENARIO');
    expect(dto.water.subsurfaceOceanState.state).toBe('UNRESOLVED');
    expect(dto.energy.extractableChemicalPowerWatts.value).toBeNull();
    expect(dto.radiation.surfaceIonizingDoseGrayPerYear.value).toBeNull();
    expect(dto.history.continuousCompatibleYears.value).toBeNull();
    expect(dto.lifeEvaluated).toBe(false);
    expect(validateEnvironmentalContractPRE3301(dto)).toEqual([]);
  });

  it('no crea presión ni agua superficial de sólido bajo un planeta de envoltura profunda', () => {
    const p = fixturePlanet();
    const a = fixtureAtmosphere(p) as unknown as {climateState: {meanSurfaceTemperatureKelvin: number | null},
      retentionState: {retainedSurfacePressurePascal: number | null},
      waterInventory: {sourceRetainedSurfacePressurePascal: number | null,
        surfaceLiquidWaterCoverageFraction01: number | null}};
    a.climateState.meanSurfaceTemperatureKelvin = null;
    a.retentionState.retainedSurfacePressurePascal = null;
    a.waterInventory.sourceRetainedSurfacePressurePascal = null;
    a.waterInventory.surfaceLiquidWaterCoverageFraction01 = null;
    const dto = projection.planet(p, a as unknown as Atmosphere);
    expect(dto.water.surfaceLiquidCoverage01.state).toBe('NOT_APPLICABLE');
    expect(dto.atmosphere.columnRelation).toBe('NOT_COMPARABLE');
    expect(dto.atmosphere.physicallySupportedSurfacePressurePascal.state).toBe('UNRESOLVED');
  });

  it('Kophara: presión 47.915 Pa condicional no se convierte en evidencia física', () => {
    const dto = projection.moon(fixtureMoon(), fixturePlanet());
    expect(dto.atmosphere.retainedSurfacePressurePascal.value).toBe(47_915);
    expect(dto.atmosphere.retainedSurfacePressurePascal.state).toBe('CONDITIONAL_SCENARIO');
    expect(dto.atmosphere.physicallySupportedSurfacePressurePascal.state).toBe('UNRESOLVED');
    expect(dto.water.subsurfaceOceanState.value).toBe('PRESENT');
    expect(dto.energy.interiorHeatFluxWattsPerSquareMeter.value).toBe(.12);
    expect(dto.energy.extractableChemicalPowerWatts.state).toBe('UNRESOLVED');
    expect(dto.radiation.surfaceIonizingDoseGrayPerYear.state).toBe('UNRESOLVED');
    expect(dto.history.continuousCompatibleYears.state).toBe('UNRESOLVED');
  });

  it('balance 32.F.1 independiente permite presión CT-0, no observación de vida', () => {
    const dto = projection.moon(fixtureMoon('PHYSICAL_BALANCE'), fixturePlanet());
    expect(dto.atmosphere.physicallySupportedSurfacePressurePascal.state).toBe('MODELLED_CT0');
    expect(dto.atmosphere.physicallySupportedSurfacePressurePascal.value).toBe(47_915);
    expect(dto.lifeEvaluated).toBe(false);
  });

  it('un balance con fuente o masa incorrecta no da evidencia favorable', () => {
    const moon = fixtureMoon('PHYSICAL_BALANCE') as unknown as {
      environmentState: {atmosphereAssessment: {physicalBalance32F1: {sourceKind: string}}}};
    moon.environmentState.atmosphereAssessment.physicalBalance32F1.sourceKind = 'CONDITIONAL_FORMATION_ENDMEMBER';
    expect(projection.moon(moon as unknown as RelevantMoon, fixturePlanet())
      .atmosphere.physicallySupportedSurfacePressurePascal.state).toBe('UNRESOLVED');
  });

  it('océano ausente no se interpreta como no resuelto ni como masa líquida cero medida', () => {
    const moon = fixtureMoon() as unknown as {oceanReality32F2c: {state: string,
      simulatedLiquidWaterMassKilograms: number | null}};
    moon.oceanReality32F2c.state = 'ABSENT_IN_SIMULATED_MODEL';
    moon.oceanReality32F2c.simulatedLiquidWaterMassKilograms = null;
    const dto = projection.moon(moon as unknown as RelevantMoon, fixturePlanet());
    expect(dto.water.subsurfaceOceanState.value).toBe('ABSENT');
    expect(dto.water.liquidOceanMassKilograms.state).toBe('UNRESOLVED');
  });

  it('océano fuera de dominio NO equivale a ausente, aunque V1 fuese 1', () => {
    const moon = fixtureMoon() as unknown as {oceanReality32F2c: {state: string, reason: string}};
    moon.oceanReality32F2c.state = 'UNRESOLVED_IN_SIMULATED_MODEL';
    moon.oceanReality32F2c.reason = 'THERMAL_TRANSPORT_OUTSIDE_DOMAIN';
    const dto = projection.moon(moon as unknown as RelevantMoon, fixturePlanet());
    expect(dto.water.subsurfaceOceanState.state).toBe('UNRESOLVED');
  });

  it('identidad lunar 21.8 sin materialización nunca inventa física', () => {
    const p = fixturePlanet();
    const identity = {hostPlanetLocator: p.locator, moonOrdinal: 3} as unknown as MoonIdentity;
    const dto = projection.moonIdentityOnly(identity);
    expect(dto.materialization).toBe('IDENTITY_ONLY');
    expect(dto.bodyKey).toBe(`${projection.planet(p, fixtureAtmosphere(p)).bodyKey}/M2`);
    expect(dto.bulk.massEarth.state).toBe('UNRESOLVED');
    expect(dto.water.subsurfaceOceanState.state).toBe('UNRESOLVED');
    expect(dto.lifeEvaluated).toBe(false);
    expect(validateEnvironmentalContractPRE3301(dto)).toEqual([]);
  });

  it('rechaza un locator lunar de otra galaxia aunque conserve el ordinal', () => {
    const moon = fixtureMoon() as unknown as {hostPlanetLocator: {galaxyIndex: bigint}};
    moon.hostPlanetLocator.galaxyIndex = 2n;
    expect(() => projection.moon(moon as unknown as RelevantMoon, fixturePlanet())).toThrow(/host\/ordinal/);
  });

  it('desvincula anfitriones cruzados antes de proyectar', () => {
    const moon = fixtureMoon() as unknown as {hostPlanetOrdinal: number};
    moon.hostPlanetOrdinal = 2;
    expect(() => projection.moon(moon as unknown as RelevantMoon, fixturePlanet())).toThrow(/host\/ordinal/);
  });

  it('rechaza NaN y permite distinguir simulación constitutiva de hipótesis', () => {
    expect(() => environmentalModelledPRE3301(Number.NaN, 'BULK_19_21', 'BULK_PHYSICAL', 'valid'))
      .toThrow(/finite/);
    const scenario = environmentalConditionalPRE3301(5, 'WATER_20_7', 'LEGACY_ESTIMATE',
      'hypothetical');
    const physical = environmentalModelledPRE3301(5, 'BULK_19_21', 'BULK_PHYSICAL', 'model');
    expect(environmentalIsPhysicalPRE3301(scenario)).toBe(false);
    expect(environmentalIsPhysicalPRE3301(physical)).toBe(true);
  });
});
