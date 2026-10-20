import { describe, expect, it } from 'vitest';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonTidalState } from '../../domain/planetary/moon-tidal-state';
import { MoonAtmosphereFormationEvolutionEngine32F1e as Evolution } from './moon-atmosphere-formation-evolution-32-f-1e';
import { MoonAtmosphereEngine } from './moon-atmosphere-engine';

const cold = new MoonPhysicalProperties(11, 1, 0.00016, 0.078, 1.85, 0.026);
const warm = new MoonPhysicalProperties(11, 2, 0.001, 0.18, 1.32, 0.043);
const rocky = new MoonPhysicalProperties(11, 3, 0.001, 0.17, 3.9, 0.043);
const inventory = (moon: MoonPhysicalProperties, water: number): MoonFormationInventory32F1d => ({
  provenance: 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION',
  hostPlanetOrdinal: moon.hostPlanetOrdinal,
  moonOrdinal: moon.moonOrdinal,
  totalMassKilograms: moon.massEarth * 5.9722e24,
  waterIceMassKilograms: water,
  otherCondensableMassKilograms: 0,
} as MoonFormationInventory32F1d);
const tidal = (moon: MoonPhysicalProperties) => ({
  hostPlanetOrdinal: moon.hostPlanetOrdinal,
  moonOrdinal: moon.moonOrdinal,
  tidalHeatingIndex01: 0.5,
} as MoonTidalState);

describe('32.F.1e — evolución condicional de inventarios lunares V2', () => {
  it('alimenta el balance existente sin hacer pasar escenarios por fuentes independientes', () => {
    const source = inventory(warm, 2e20);
    const a = Evolution.fromMaterialized(warm, source, 301.7, 0.785);
    expect(a.conditionalInitialWaterVaporMassKilograms).toBeGreaterThan(0);
    expect(a.contractVersion).toBe('32.F.1e-water-vapor-endmember-v2');
    expect(a.conditionalBalance).toBeNull();
    expect(a.conditionalFinalWaterVaporPressurePascal).toBeNull();
    expect(a.conditionalInitialWaterVaporMassKilograms).toBeLessThanOrEqual(source.waterIceMassKilograms);
    expect(a.conditionalThermalJeansEscapeKilogramsPerSecond).toBeNull();
    expect(a.realAtmosphericPressureStatus).toBe('UNKNOWN');
    expect(a.realAtmosphericRegimeStatus).toBe('UNKNOWN');
    expect(a.missingIndependentSources).toContain('STELLAR_EUV_AND_PHOTOLYSIS');
    expect(Evolution.fromMaterialized(warm, source, 301.7, 0.785)).toEqual(a);
  });
  it('balances no negativos, conservación y sensibilidad térmica según propiedades V2', () => {
    const a = Evolution.fromMaterialized(cold, inventory(cold, 1e19), 235.7, 1.717);
    const b = Evolution.fromMaterialized(warm, inventory(warm, 1e19), 301.7, 0.785);
    expect(a.conditionalInitialWaterVaporPressurePascal).toBeGreaterThan(0);
    expect(b.conditionalInitialWaterVaporPressurePascal).toBeGreaterThan(a.conditionalInitialWaterVaporPressurePascal ?? 0);
    for (const result of [a, b]) {
      // Saturation is an *initial* endmember, not a forecast. Mass cannot
      // exceed the formation-water source, and neither Jeans flux nor a
      // future pressure exists without a characterized exobase/replenishment.
      expect(result.conditionalInitialWaterVaporMassKilograms).toBeGreaterThanOrEqual(0);
      expect(result.conditionalInitialWaterVaporMassKilograms).toBeLessThanOrEqual(result.sourceWaterIceMassKilograms);
      expect(result.conditionalThermalJeansEscapeKilogramsPerSecond).toBeNull();
      expect(result.conditionalFinalWaterVaporPressurePascal).toBeNull();
      expect(result.conditionalBalance).toBeNull();
      expect(result.realAtmosphericPressureStatus).toBe('UNKNOWN');
    }
  });
  it('una luna rocosa sin hielo NO se declara sin atmósfera', () => {
    const a = Evolution.fromMaterialized(rocky, inventory(rocky, 0), 300, 1);
    expect(a.conditionalInitialWaterVaporMassKilograms).toBe(0);
    expect(a.conditionalFinalWaterVaporPressurePascal).toBeNull();
    expect(a.conditionalBalance).toBeNull();
    expect(a.realAtmosphericPressureStatus).toBe('UNKNOWN');
    expect(a.realAtmosphericRegimeStatus).toBe('UNKNOWN');
  });
  it('fuera del dominio de saturación no fabrica presión ni flujo', () => {
    const a = Evolution.fromMaterialized(cold, inventory(cold, 1e20), 110, 1.7);
    expect(a.conditionalInitialWaterVaporMassKilograms).toBeNull();
    expect(a.conditionalFinalWaterVaporPressurePascal).toBeNull();
    expect(a.conditionalThermalJeansEscapeKilogramsPerSecond).toBeNull();
    expect(a.conditionalBalance).toBeNull();
  });
  it('rechaza identidades cruzadas e inventarios inconsistentes', () => {
    expect(() => Evolution.fromMaterialized(warm, inventory(cold, 1e20), 300, 1)).toThrow();
    expect(() => Evolution.fromMaterialized(warm, inventory(warm, -1), 300, 1)).toThrow();
    expect(() => Evolution.fromMaterialized(warm, inventory(warm, 1e20), 300, -1)).toThrow();
    expect(() => Evolution.fromMaterialized(warm, inventory(warm, 1e20), Infinity, 1)).toThrow();
  });
  it('un endmember condicional no se puede inyectar como fuente gaseosa independiente', () => {
    const forcing = {
      sourceKind: 'CONDITIONAL_FORMATION_ENDMEMBER' as const,
      sourceId: 'conditional-ONLY', durationSeconds: 86400,
      collisionCrossSectionSquareMeters: 2e-19,
      gasForcings: [],
    };
    expect(() => MoonAtmosphereEngine.assess(warm, tidal(warm), 301.7, 1, 1.873,
      forcing)).toThrow('cannot impersonate independent forcing');
  });

  it('31.12 nunca convierte la simulación de agua H₂O en presión conocida', () => {
    const a = MoonAtmosphereEngine.assess(warm, tidal(warm), 301.7, 1, 1.873,
      null, inventory(warm, 2e20), 0.785);
    const before = MoonAtmosphereEngine.assess(warm, tidal(warm), 301.7, 1, 1.873);
    expect(a.formationEvolution32F1e?.conditionalInitialWaterVaporMassKilograms).toBeGreaterThan(0);
    expect(a.physicalBalance32F1).toBeNull();
    expect(a.pressureBasis).toBe(before.pressureBasis);
    expect(a.estimatedSurfacePressurePascal).toBe(before.estimatedSurfacePressurePascal);
    expect(a.species).toEqual(before.species);
    expect(a.thermalEscapeSupportIndex01).toBe(before.thermalEscapeSupportIndex01);
  });
});
