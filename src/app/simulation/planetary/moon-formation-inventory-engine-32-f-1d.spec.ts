import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { PlanetType } from '../../domain/planetary/planet-type';
import { MoonFormationInventoryEngine32F1d as Engine } from './moon-formation-inventory-engine-32-f-1d';

const seed = (n: number): MoonSeed => new MoonSeed(n.toString(16).padStart(32, '0'));
const moon = (density: number, mass = 0.001, ordinal = 1): MoonPhysicalProperties =>
  new MoonPhysicalProperties(11, ordinal, mass, 0.1, density, 0.1);

const verify = (a: ReturnType<typeof Engine.fromMaterialized>, source: MoonPhysicalProperties): void => {
  const total = a.metallicMassKilograms + a.silicateMassKilograms +
    a.waterIceMassKilograms + a.otherCondensableMassKilograms;
  expect(Math.abs(total - a.totalMassKilograms) / a.totalMassKilograms).toBeLessThan(1e-12);
  expect(Math.abs(a.modelBulkDensityGramsPerCubicCentimeter - source.meanDensityGramsPerCubicCentimeter) /
    source.meanDensityGramsPerCubicCentimeter).toBeLessThan(1e-10);
  expect(Math.abs(a.rockMassKilograms - a.metallicMassKilograms - a.silicateMassKilograms) /
    a.totalMassKilograms).toBeLessThan(1e-12);
  expect(a.totalCondensableMassKilograms).toBeGreaterThanOrEqual(0);
  expect(a.maximumPotentialVolatileSupplyKilograms).toBe(a.totalCondensableMassKilograms);
  expect(a.initialAtmosphericGasMassKilograms).toBeNull();
  expect(a.atmosphericLossAndReplenishmentRates).toBeNull();
  expect(a.provenance).toContain('CONDITIONAL');
  expect(Object.isFrozen(a)).toBe(true);
  expect(Object.isFrozen(a.formationCandidates)).toBe(true);
};

describe('32.F.1d — inventarios lunares de formación no observados', () => {
  it('conserva masa y densidad en familias rocosas, mixtas y heladas', () => {
    for (const [i, rho] of [1.0, 1.32, 1.85, 2.4, 3.3, 3.9, 4.8].entries()) {
      const source = moon(rho, 1e-5 + i * 0.003);
      verify(Engine.fromMaterialized(source, seed(i + 1), PlanetType.GAS_GIANT), source);
    }
  });
  it('no genera masa condensable negativa por cancelación flotante en lunas rocosas densas', () => {
    for (const density of [3.3, 3.9, 4.8, 6.4]) {
      for (const massEarth of [1e-5, 0.001, 0.02]) {
        const source = moon(density, massEarth);
        const inventory = Engine.fromMaterialized(source, seed(51), PlanetType.ROCKY);
        verify(inventory, source);
        expect(inventory.totalCondensableMassKilograms).toBe(0);
        expect(inventory.waterIceMassKilograms).toBe(0);
        expect(inventory.otherCondensableMassKilograms).toBe(0);
        expect(inventory.metallicMassKilograms).toBeGreaterThanOrEqual(0);
        expect(inventory.silicateMassKilograms).toBeGreaterThanOrEqual(0);
      }
    }
  });
  it('el mismo MoonSeed produce idéntico escenario y diferentes MoonSeeds varían la composición', () => {
    const physical = moon(1.85);
    const a = Engine.fromMaterialized(physical, seed(23), PlanetType.GAS_GIANT);
    expect(Engine.fromMaterialized(physical, seed(23), PlanetType.GAS_GIANT)).toEqual(a);
    expect(Engine.fromMaterialized(physical, seed(24), PlanetType.GAS_GIANT).waterIceMassKilograms)
      .not.toEqual(a.waterIceMassKilograms);
  });
  it('no afirma captura ni choque sin información de formación independiente', () => {
    const regular = Engine.fromMaterialized(moon(1.85), seed(7), PlanetType.ICE_GIANT);
    expect(regular.formationCandidates).toContain('CIRCUMPLANETARY_ACCRETION_CANDIDATE');
    expect(regular.formationCandidates).toContain('DYNAMICAL_CAPTURE_CANDIDATE');
    const terrestrial = Engine.fromMaterialized(moon(3.25), seed(8), PlanetType.ROCKY);
    expect(terrestrial.selectedFormationPathway).toBe('UNRESOLVED');
    expect(terrestrial.formationCandidates).toContain('IMPACT_DEBRIS_CANDIDATE');
    expect(terrestrial.formationCandidates).toContain('DYNAMICAL_CAPTURE_CANDIDATE');
  });
  it('nunca convierte hielos iniciales en gas, océano líquido ni flujos atmosféricos', () => {
    const result = Engine.fromMaterialized(moon(1.32), seed(19), PlanetType.GAS_GIANT);
    expect(result.waterIceMassKilograms).toBeGreaterThan(0);
    expect(result.otherVolatileSpeciation).toBe('UNRESOLVED');
    expect(result.initialAtmosphericGasMassKilograms).toBeNull();
    expect(result.historyResolution).toBe('INITIAL_SCENARIO_ONLY_NO_DATED_EVOLUTION');
  });
  it('rechaza densidades fuera del modelo sin forzar masa/composición ficticia', () => {
    expect(() => Engine.fromMaterialized(moon(0.4), seed(1), PlanetType.GAS_GIANT)).toThrow();
    expect(() => Engine.fromMaterialized(moon(8.3), seed(1), PlanetType.GAS_GIANT)).toThrow();
  });
});
