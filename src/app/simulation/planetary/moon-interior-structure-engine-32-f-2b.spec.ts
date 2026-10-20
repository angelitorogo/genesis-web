import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { PlanetType } from '../../domain/planetary/planet-type';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import { MoonFormationInventoryEngine32F1d } from './moon-formation-inventory-engine-32-f-1d';
import { MoonWaterPhaseBalanceEngine32F2a } from './moon-water-phase-balance-32-f-2a';
import { MoonInteriorStructureEngine32F2b as Engine } from './moon-interior-structure-engine-32-f-2b';

const heat = (min: number | null, max: number | null): MoonInternalWaterAssessment => ({
  basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
  tidalHeatFluxMinimumWattsPerSquareMeter: min,
  tidalHeatFluxMaximumWattsPerSquareMeter: max,
  conductiveShellThicknessMinimumKilometers: null,
  conductiveShellThicknessMaximumKilometers: null,
  iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN', cryovolcanism: 'NOT_EVALUABLE',
  radiogenicHeatResolved: false, oceanConfirmed: false,
});
const build = (density = 1.85, temperature = 235.7, min: number | null = 1e-5,
  max: number | null = 1e-3, mass = .001, radius = .14) => {
  const physical = new MoonPhysicalProperties(8, 3, mass, radius, density, .05);
  const formation = MoonFormationInventoryEngine32F1d.fromMaterialized(physical,
    new MoonSeed('00000000000000000000000000000019'), PlanetType.GAS_GIANT);
  const water = MoonWaterPhaseBalanceEngine32F2a.fromMaterialized(physical, formation, temperature);
  return {physical, formation, water,
    result: Engine.fromMaterialized(physical, formation, water, heat(min, max), temperature)};
};

describe('32.F.2b — estructura diferenciada y presión térmica CONDICIONAL', () => {
  it('conserva toda la masa, respeta radio y orden radial, y presión monotónica', () => {
    const {physical, result} = build();
    expect(result.layers.map(l => l.kind)).toEqual([
      'METALLIC_CORE', 'SILICATE_MANTLE', 'OTHER_CONDENSABLES_UNIDENTIFIED', 'H2O_OUTER_SHELL']);
    const total = result.layers.reduce((sum, layer) => sum + layer.massKilograms, 0);
    expect(Math.abs(total - result.totalMassKilograms) / result.totalMassKilograms).toBeLessThan(1e-12);
    expect(result.layers.at(-1)!.outerRadiusKilometers).toBeCloseTo(physical.radiusEarth * 6371, 8);
    for (const [i, l] of result.layers.entries()) {
      expect(l.massKilograms).toBeGreaterThanOrEqual(0);
      expect(l.thicknessKilometers).toBeGreaterThanOrEqual(0);
      expect(l.pressureAtInnerBoundaryPascal).toBeGreaterThanOrEqual(l.pressureAtOuterBoundaryPascal);
      if (i > 0) expect(l.innerRadiusKilometers).toBeCloseTo(result.layers[i-1].outerRadiusKilometers, 8);
    }
    expect(result.pressureProfile[0].pressurePascal).toBe(0);
    expect(result.centralLithostaticPressurePascal).toBeGreaterThan(0);
    for (let i = 1; i < result.pressureProfile.length; i++) {
      expect(result.pressureProfile[i].pressurePascal).toBeGreaterThanOrEqual(
        result.pressureProfile[i-1].pressurePascal);
    }
  });

  it('en frío con poco calor solo hielo; con mayor calor admite interfaz condicional si el dominio lo permite', () => {
    const cold = build(1.85, 235.7, 1e-5, 1e-3).result;
    expect(cold.thermalScenarios[0].phaseRegime).toBe('ICE_ONLY_IN_THIS_CONDITIONAL_MODEL');
    expect(cold.thermalScenarios[0].conditionalLiquidMassKilograms).toBe(0);
    expect(cold.thermalScenarios[1].phaseRegime).toBe('POTENTIAL_LIQUID_BELOW_ICE_CONDITIONAL');
    for (const scenario of cold.thermalScenarios) {
      expect(scenario.temperatureProfile).toHaveLength(5);
      if (scenario.conditionalLiquidMassKilograms !== null) {
        expect(Math.abs(scenario.conditionalIceMassKilograms! +
          scenario.conditionalLiquidMassKilograms - cold.waterMassKilograms) /
          Math.max(1, cold.waterMassKilograms)).toBeLessThan(1e-12);
      }
    }
    expect(cold.actualOceanPresence).toBe('UNKNOWN');
    expect(cold.actualInteriorLiquidMassKilograms).toBeNull();
    expect(cold.actualRadiogenicHeatFluxWattsPerSquareMeter).toBeNull();
  });

  it('luna cálida no puede asumir cubierta global de hielo', () => {
    const result = build(1.32, 301.7).result;
    expect(result.thermalScenarios.every(x =>
      x.phaseRegime === 'NO_STABLE_SURFACE_ICE_IN_ASSUMED_STRATIGRAPHY')).toBe(true);
    expect(result.actualIceShellThicknessKilometers).toBeNull();
  });

  it('composición rocosa sin H2O no fabrica ni capa acuosa ni océano', () => {
    const result = build(4.8).result;
    expect(result.waterMassKilograms).toBe(0);
    expect(result.layers[3].thicknessKilometers).toBe(0);
    expect(result.thermalScenarios.every(x => x.phaseRegime === 'NO_FORMATION_WATER')).toBe(true);
  });

  it('sin flujo mareal acotado, no genera temperaturas interiores definitivas', () => {
    const result = build(1.85, 235.7, null, null).result;
    expect(result.thermalScenarios.every(x => x.phaseRegime === 'NO_RESOLVED_TIDAL_HEAT_INPUT')).toBe(true);
    expect(result.thermalScenarios.every(x => x.assumedBasalFluxWattsPerSquareMeter === null)).toBe(true);
  });

  it('rechaza identidad desalineada o inventario hídrico inconsistente', () => {
    const {physical, formation, water} = build();
    expect(() => Engine.fromMaterialized(physical,
      {...formation, moonOrdinal: 99}, water, heat(0, 1), 250)).toThrow();
    expect(() => Engine.fromMaterialized(physical,
      formation, {...water, sourceFormationWaterKilograms: -10}, heat(0, 1), 250)).toThrow();
    expect(() => Engine.fromMaterialized(physical,
      formation, water, heat(0, 1), NaN)).toThrow();
  });

  it('separa geometría hipotética, dominio Ice Ih, salinidad y océano real', () => {
    const result = build(1.32, 235.7, .001, .1, .03, .20).result;
    expect(result.pressureDependentMeltModel).toBe('PURE_H2O_ICE_IH_ONLY_BELOW_200_MPA');
    expect(result.actualSalinity).toBeNull();
    expect(result.actualOceanPresence).toBe('UNKNOWN');
    expect(result.modelLimits).toContain('NO_CONVECTION_LATENT_HEAT_PHASE_KINETICS_VOLATILE_TRANSPORT_OR_DATED_HISTORY');
    expect(result.thermalScenarios.length).toBe(2);
  });

  it('determinismo y conservación en 84 combinaciones de masa/densidad/temperatura/flujo', () => {
    for (const density of [1.0, 1.32, 1.85, 2.4, 3.3, 4.8, 6.4]) {
      for (const mass of [0.00001, 0.001, 0.03]) {
        for (const temp of [120, 235.7, 301.7, 650]) {
          const {physical, formation, water, result} = build(density, temp, 1e-6, .01, mass);
          const again = Engine.fromMaterialized(physical, formation, water, heat(1e-6, .01), temp);
          expect(result).toEqual(again);
          expect(result.actualOceanPresence).toBe('UNKNOWN');
          expect(result.layers.every(x => Number.isFinite(x.massKilograms) &&
            x.massKilograms >= 0 && x.thicknessKilometers >= 0)).toBe(true);
          expect(Math.abs(result.layers.reduce((s, x) => s + x.massKilograms, 0) -
            result.totalMassKilograms) / result.totalMassKilograms).toBeLessThan(1e-12);
        }
      }
    }
  });
});
