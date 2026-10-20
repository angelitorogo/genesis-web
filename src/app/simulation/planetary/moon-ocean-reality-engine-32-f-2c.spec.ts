import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { PlanetType } from '../../domain/planetary/planet-type';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import { MoonFormationInventoryEngine32F1d } from './moon-formation-inventory-engine-32-f-1d';
import { MoonWaterPhaseBalanceEngine32F2a } from './moon-water-phase-balance-32-f-2a';
import { MoonInteriorStructureEngine32F2b } from './moon-interior-structure-engine-32-f-2b';
import { MoonOceanRealityEngine32F2c } from './moon-ocean-reality-engine-32-f-2c';

const tidal = (min: number | null, max: number | null): MoonInternalWaterAssessment => ({
  basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
  tidalHeatFluxMinimumWattsPerSquareMeter: min,
  tidalHeatFluxMaximumWattsPerSquareMeter: max,
  conductiveShellThicknessMinimumKilometers: null,
  conductiveShellThicknessMaximumKilometers: null,
  iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN', cryovolcanism: 'NOT_EVALUABLE',
  radiogenicHeatResolved: false, oceanConfirmed: false,
});
const source = (density = 1.85, temp = 235.7, min: number | null = .000293,
  max: number | null = .293, mass = .00016, radius = .078,
  seed = new MoonSeed('00000000000000000000000000000019')) => {
  const physical = new MoonPhysicalProperties(8, 3, mass, radius, density, .05);
  const formation = MoonFormationInventoryEngine32F1d.fromMaterialized(
    physical, seed, PlanetType.GAS_GIANT);
  const water = MoonWaterPhaseBalanceEngine32F2a.fromMaterialized(
    physical, formation, temp);
  const cryosphere = tidal(min, max);
  const interior = MoonInteriorStructureEngine32F2b.fromMaterialized(
    physical, formation, water, cryosphere, temp);
  return { physical, seed, formation, water, cryosphere, interior,
    result: MoonOceanRealityEngine32F2c.fromMaterialized(
      physical, seed, formation, water, interior, cryosphere, temp) };
};

describe('32.F.2c — océanos CT-0 generados, estados físicos y acceso de sistema completo', () => {
  it('produce el mismo mundo simulado con las mismas entradas, sin depender de V2 PRNG', () => {
    const a = source();
    const b = source();
    expect(a.result).toEqual(b.result);
    expect(a.result.provenance).toBe('SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION');
    expect(a.result.hostPlanetOrdinal).toBe(8);
    expect(a.result.moonOrdinal).toBe(3);
    expect(a.result.scientificLimits).toContain('NO_SALINITY_VOLATILE_TRANSPORT_PHASE_KINETICS_OR_HISTORICAL_PERSISTENCE');
  });
  it('resuelve océano bajo hielo en un caso físicamente delimitado y conserva H2O', () => {
    const x = source(1.85, 235.7, .001, .001);
    expect(x.result.state).toBe('PRESENT_IN_SIMULATED_MODEL');
    expect(x.result.iceCoverThicknessKilometers).toBeGreaterThan(0);
    expect(x.result.liquidLayerThicknessKilometers).toBeGreaterThan(0);
    expect(x.result.generatedTidalFluxWattsPerSquareMeter).toBe(.001);
    expect(x.result.radialLayers.some(l => l.phase === 'LIQUID_H2O')).toBe(true);
    expect(x.result.simulatedLiquidWaterMassKilograms).toBeGreaterThan(0);
    expect(Math.abs(x.result.simulatedSolidWaterMassKilograms! +
      x.result.simulatedLiquidWaterMassKilograms! - x.result.waterInventoryKilograms) /
      x.result.waterInventoryKilograms).toBeLessThan(1e-12);
    for (const l of x.result.radialLayers) {
      expect(l.pressureBottomPascal).toBeGreaterThanOrEqual(l.pressureTopPascal);
      expect(l.massKilograms).toBeGreaterThanOrEqual(0);
    }
  });
  it('puede generar hielo sin océano bajo un flujo pequeño, no fuerza resultados positivos', () => {
    const x = source(1.85, 235.7, 0, 0);
    expect(x.result.state).toBe('ABSENT_IN_SIMULATED_MODEL');
    expect(x.result.reason).toBe('ICE_STABLE_IN_GENERATED_MODEL');
    expect(x.result.simulatedLiquidWaterMassKilograms).toBe(0);
    expect(x.result.simulatedSolidWaterMassKilograms).toBe(x.result.waterInventoryKilograms);
  });
  it('mundos rocosos sin inventario H2O nunca generan un océano de agua', () => {
    const x = source(4.8, 235.7, .001, .1);
    expect(x.formation.waterIceMassKilograms).toBe(0);
    expect(x.result.state).toBe('ABSENT_IN_SIMULATED_MODEL');
    expect(x.result.reason).toBe('NO_FORMATION_H2O');
    expect(x.result.simulatedLiquidWaterMassKilograms).toBe(0);
    expect(x.result.radialLayers).toHaveLength(0);
  });
  it('hielo de alta presión bajo océano: separa masa, y limita presiones fuera del diagrama', () => {
    const layered = source(1.32, 235.7, .02, .02, .003, .14).result;
    expect(layered.state).toBe('PRESENT_IN_SIMULATED_MODEL');
    expect(layered.radialLayers.map(x => x.phase)).toEqual([
      'ICE_IH', 'LIQUID_H2O', 'HIGH_PRESSURE_ICE_APPROX',
    ]);
    expect(layered.highPressureIceThicknessKilometers).toBeGreaterThan(0);
    const unsupported = source(1.32, 235.7, .02, .02, .003, .12).result;
    expect(unsupported.state).toBe('UNRESOLVED_IN_SIMULATED_MODEL');
    expect(unsupported.reason).toBe('HIGH_PRESSURE_PHASE_OUTSIDE_DOMAIN');
    expect(unsupported.simulatedLiquidWaterMassKilograms).toBeNull();
  });
  it('superficie templada sin confinamiento no inventa corteza de hielo ni océano interior', () => {
    const x = source(1.32, 301.7);
    expect(x.result.state).toBe('UNRESOLVED_IN_SIMULATED_MODEL');
    expect(x.result.reason).toBe('TEMPERATE_SURFACE_WITH_UNRESOLVED_CONFINEMENT');
    expect(x.result.liquidLayerThicknessKilometers).toBeNull();
  });
  it('sin fuente mareal suficiente el estado continúa desconocido', () => {
    const x = source(1.85, 235.7, null, null);
    expect(x.result.state).toBe('UNRESOLVED_IN_SIMULATED_MODEL');
    expect(x.result.reason).toBe('MISSING_TIDAL_HEAT');
    expect(x.result.generatedTotalSurfaceHeatFluxWattsPerSquareMeter).toBeNull();
  });
  it('rechaza inventarios, luna y parámetros físicos desalineados', () => {
    const x = source();
    const r = MoonOceanRealityEngine32F2c.fromMaterialized;
    expect(() => r(x.physical, x.seed, {...x.formation, moonOrdinal: 88},
      x.water, x.interior, x.cryosphere, 235.7)).toThrow();
    expect(() => r(x.physical, x.seed, x.formation, x.water,
      {...x.interior, waterMassKilograms: -1}, x.cryosphere, 235.7)).toThrow();
    expect(() => r(x.physical, x.seed, x.formation, x.water,
      x.interior, x.cryosphere, Infinity)).toThrow();
    expect(() => r(x.physical, x.seed, x.formation, x.water,
      x.interior, tidal(2, 1), 235.7)).toThrow();
  });
  it('conserva masa y orden radial en una matriz de escenarios sin excepciones por semilla', () => {
    for (const density of [1.1, 1.32, 1.85, 2.4, 4.8]) {
      for (const temp of [125, 200, 235.7, 301.7]) {
        for (const flux of [0, .00001, .001, .1]) {
          const x = source(density, temp, flux, flux);
          const o = x.result;
          if (o.simulatedLiquidWaterMassKilograms !== null) {
            expect(Math.abs(o.simulatedLiquidWaterMassKilograms +
              o.simulatedSolidWaterMassKilograms! - o.waterInventoryKilograms) /
              Math.max(1, o.waterInventoryKilograms)).toBeLessThan(1e-11);
          }
          if (o.state === 'PRESENT_IN_SIMULATED_MODEL') {
            expect(o.liquidLayerThicknessKilometers).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
