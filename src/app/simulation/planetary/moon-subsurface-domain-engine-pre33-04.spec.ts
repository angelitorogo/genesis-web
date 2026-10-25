import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { PlanetType } from '../../domain/planetary/planet-type';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import { MoonFormationInventoryEngine32F1d } from './moon-formation-inventory-engine-32-f-1d';
import { MoonWaterPhaseBalanceEngine32F2a } from './moon-water-phase-balance-32-f-2a';
import { MoonInteriorStructureEngine32F2b } from './moon-interior-structure-engine-32-f-2b';
import { MoonOceanRealityEngine32F2c } from './moon-ocean-reality-engine-32-f-2c';
import { MoonSubsurfaceDomainEnginePRE3304 } from './moon-subsurface-domain-engine-pre33-04';

const seed = new MoonSeed('00000000000000000000000000000019');
function sample(density: number, surfaceTemp = 235.7, mass = .003, radius = .12,
  tidalMin: number | null = .005, tidalMax: number | null = .02) {
  const physical = new MoonPhysicalProperties(8, 3, mass, radius, density, .05);
  const formation = MoonFormationInventoryEngine32F1d.fromMaterialized(physical, seed, PlanetType.GAS_GIANT);
  const tides: MoonInternalWaterAssessment = {
    basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
    tidalHeatFluxMinimumWattsPerSquareMeter: tidalMin,
    tidalHeatFluxMaximumWattsPerSquareMeter: tidalMax,
    conductiveShellThicknessMinimumKilometers: null,
    conductiveShellThicknessMaximumKilometers: null,
    iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN', cryovolcanism: 'NOT_EVALUABLE',
    radiogenicHeatResolved: false, oceanConfirmed: false,
  };
  const phases = MoonWaterPhaseBalanceEngine32F2a.fromMaterialized(physical, formation, surfaceTemp);
  const interior = MoonInteriorStructureEngine32F2b.fromMaterialized(
    physical, formation, phases, tides, surfaceTemp);
  const ocean = MoonOceanRealityEngine32F2c.fromMaterialized(
    physical, seed, formation, phases, interior, tides, surfaceTemp);
  const result = MoonSubsurfaceDomainEnginePRE3304.fromMaterialized(
    physical, formation, interior, ocean, tides);
  return {physical, formation, tides, interior, ocean, result};
}

describe('PRE-33.04 — dominio lunar subsuperficial condicionado a V3', () => {
  it('conserva inventario y procedencia desde la fuente lunar 32.F ya materializada', () => {
    const x = sample(1.32);
    expect(x.result.waterMassKilograms).toBe(x.formation.waterIceMassKilograms);
    expect(x.result.actualPhaseCertified).toBe(false);
    expect(x.result.observationalOceanConfirmed).toBe(false);
    expect(x.result.actualSalinityResolved).toBe(false);
    expect(x.result.lunarHistoryWaterBudgetResolved).toBe(false);
    for (const t of x.result.thermalScenarios) {
      expect(Math.abs(t.solidMassKilograms + t.liquidMassKilograms - x.result.waterMassKilograms) /
        Math.max(1, x.result.waterMassKilograms)).toBeLessThan(1e-9);
    }
  });
  it('repite exactamente los perfiles con una misma luna sin nuevos sorteos', () => {
    expect(sample(1.32).result).toEqual(sample(1.32).result);
  });
  it('admite presiones de más de 2 GPa hasta el dominio condicional de 10 GPa', () => {
    const x = sample(1.32);
    expect(x.result.domain).toBe('EXTENDED_2_TO_10_GPA');
    expect(x.result.basalPressurePascal).toBeGreaterThan(2e9);
    expect(x.result.depthAt2GPaKilometers).toBeGreaterThan(0);
    for (let i = 1; i < x.result.pressureProfile.length; i++) {
      expect(x.result.pressureProfile[i].pressurePascal)
        .toBeGreaterThanOrEqual(x.result.pressureProfile[i - 1].pressurePascal);
    }
  });
  it('no inventa fases en lunas sin H₂O', () => {
    const x = sample(4.8);
    expect(x.result.domain).toBe('NO_FORMATION_H2O');
    expect(x.result.thermalScenarios).toHaveLength(0);
  });
  it('sin calentamiento o confinamiento superficial no afirma océano', () => {
    expect(sample(1.32, 235.7, .003, .12, null, null).result.thermalScenarios).toHaveLength(0);
    expect(sample(1.32, 315).result.thermalScenarios).toHaveLength(0);
  });
  it('rechaza masas y referencias cruzadas', () => {
    const x = sample(1.32);
    expect(() => MoonSubsurfaceDomainEnginePRE3304.fromMaterialized(
      x.physical, {...x.formation, moonOrdinal: 4}, x.interior, x.ocean, x.tides)).toThrow();
    expect(() => MoonSubsurfaceDomainEnginePRE3304.fromMaterialized(
      x.physical, x.formation, {...x.interior, waterMassKilograms: x.result.waterMassKilograms * 2},
      x.ocean, x.tides)).toThrow();
  });
  it('no promueve la extrapolación a medición física u oceánica', () => {
    for (const density of [1.1, 1.32, 1.85, 2.4, 4.8]) {
      const x = sample(density).result;
      expect(x.actualPhaseCertified).toBe(false);
      expect(x.observationalOceanConfirmed).toBe(false);
      expect(x.scientificLimits.some(v => v.includes('NO_SALINITY'))).toBe(true);
    }
  });
});
