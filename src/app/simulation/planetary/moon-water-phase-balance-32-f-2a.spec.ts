import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { PlanetType } from '../../domain/planetary/planet-type';
import { MoonFormationInventoryEngine32F1d } from './moon-formation-inventory-engine-32-f-1d';
import { MoonWaterPhaseBalanceEngine32F2a as Engine } from './moon-water-phase-balance-32-f-2a';

const physical = (density: number, mass = 0.001) =>
  new MoonPhysicalProperties(8, 3, mass, 0.14, density, 0.05);
const assess = (density: number, temperature: number, mass = 0.001) => {
  const moon = physical(density, mass);
  const formation = MoonFormationInventoryEngine32F1d.fromMaterialized(
    moon, new MoonSeed('00000000000000000000000000000019'), PlanetType.GAS_GIANT);
  return Engine.fromMaterialized(moon, formation, temperature);
};

describe('32.F.2a — balances condicionales de agua conservando masa', () => {
  it('modela hielo-vapor frío e interior no identificado sin inventar océano', () => {
    const result = assess(1.85, 235.7);
    expect(result.sourceFormationWaterKilograms).toBeGreaterThan(0);
    expect(result.waterSaturationPressurePascal).toBeGreaterThan(0);
    expect(result.possibleEndmembers.map(item => item.scenario)).toEqual([
      'ALL_H2O_SEQUESTERED_INTERIOR_PHASE_UNRESOLVED',
      'ALL_H2O_EXPOSED_COLD_EQUILIBRIUM',
    ]);
    const cold = result.possibleEndmembers[1];
    expect(cold.surfaceLiquidMassKilograms).toBe(0);
    expect(cold.surfaceIceMassKilograms).toBeGreaterThan(0);
    expect(cold.surfaceVaporMassKilograms).toBeGreaterThan(0);
    expect(cold.assumedConfiningPressurePascal).toBeNull();
    expect(result.actualSurfaceIceMassKilograms).toBeNull();
    expect(result.actualInteriorLiquidMassKilograms).toBeNull();
    expect(result.surfaceLiquidRequiresPressureAtLeastPascal).toBeNull();
  });

  it('modela líquido-vapor templado SOLO con confinamiento supuesto', () => {
    const result = assess(1.32, 301.7);
    const warm = result.possibleEndmembers.find(e =>
      e.scenario === 'ALL_H2O_EXPOSED_WARM_CONFINED_EQUILIBRIUM');
    expect(warm).toBeDefined();
    expect(warm!.surfaceLiquidMassKilograms).toBeGreaterThan(0);
    expect(warm!.surfaceIceMassKilograms).toBe(0);
    expect(warm!.surfaceVaporMassKilograms).toBeGreaterThan(0);
    expect(warm!.assumedConfiningPressurePascal).toBeGreaterThan(result.waterSaturationPressurePascal!);
    expect(result.surfaceLiquidRequiresPressureAtLeastPascal).toBeGreaterThan(611);
    expect(result.actualSurfaceLiquidMassKilograms).toBeNull();
    expect(result.actualSurfaceVaporMassKilograms).toBeNull();
  });

  it('sin agua en composición rocosa NO se generan reservas ficticias', () => {
    const result = assess(4.8, 300);
    expect(result.sourceFormationWaterKilograms).toBe(0);
    for (const endpoint of result.possibleEndmembers) {
      expect(endpoint.totalMassKilograms).toBe(0);
      expect(endpoint.surfaceLiquidMassKilograms).toBe(0);
      expect(endpoint.surfaceVaporMassKilograms).toBe(0);
      expect(endpoint.surfaceIceMassKilograms).toBe(0);
      expect(endpoint.interiorPhaseUnresolvedMassKilograms).toBe(0);
    }
    expect(result.actualInteriorLiquidMassKilograms).toBeNull();
  });

  it('no infiere fases superficiales donde saturación está fuera de dominio', () => {
    for (const t of [100, 647.2, 1000]) {
      const result = assess(1.32, t);
      expect(result.waterSaturationPressurePascal).toBeNull();
      expect(result.possibleEndmembers).toHaveLength(1);
      expect(result.possibleEndmembers[0].scenario).toBe(
        'ALL_H2O_SEQUESTERED_INTERIOR_PHASE_UNRESOLVED');
      expect(result.actualSurfaceLiquidMassKilograms).toBeNull();
    }
  });

  it('conservación estricta sin masas negativas y determinismo, diferentes temperaturas', () => {
    for (const density of [1.0, 1.32, 1.85, 2.4, 3.3, 3.9, 4.8, 6.4]) {
      for (const mass of [0.00001, 0.001, 0.03]) {
        for (const t of [120, 160, 235.7, 273.16, 301.7, 500, 650]) {
          const result = assess(density, t, mass);
          expect(assess(density, t, mass)).toEqual(result);
          expect(Object.isFrozen(result)).toBe(true);
          expect(Object.isFrozen(result.possibleEndmembers)).toBe(true);
          for (const endpoint of result.possibleEndmembers) {
            const components = [endpoint.surfaceIceMassKilograms,
              endpoint.surfaceLiquidMassKilograms, endpoint.surfaceVaporMassKilograms,
              endpoint.interiorPhaseUnresolvedMassKilograms];
            expect(components.every(n => Number.isFinite(n) && n >= 0)).toBe(true);
            const total = components.reduce((sum, n) => sum + n, 0);
            expect(Math.abs(total - result.sourceFormationWaterKilograms) /
              Math.max(1, result.sourceFormationWaterKilograms)).toBeLessThanOrEqual(1e-12);
          }
        }
      }
    }
  });

  it('rechaza masas y ordinales desalineados', () => {
    const source = physical(1.85);
    const formation = MoonFormationInventoryEngine32F1d.fromMaterialized(
      source, new MoonSeed('00000000000000000000000000000019'), PlanetType.GAS_GIANT);
    expect(() => Engine.fromMaterialized(source, {...formation, moonOrdinal: 99}, 250)).toThrow();
    expect(() => Engine.fromMaterialized(source, {...formation, waterIceMassKilograms: -1}, 250)).toThrow();
    expect(() => Engine.fromMaterialized(source, {...formation, waterIceMassKilograms: formation.totalMassKilograms * 2}, 250)).toThrow();
    expect(() => Engine.fromMaterialized(source, formation, Number.NaN)).toThrow();
  });
});
