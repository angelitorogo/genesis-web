import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { PlanetType } from '../../domain/planetary/planet-type';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import { MoonFormationInventoryEngine32F1d } from './moon-formation-inventory-engine-32-f-1d';
import { MoonWaterPhaseBalanceEngine32F2a } from './moon-water-phase-balance-32-f-2a';
import { MoonInteriorStructureEngine32F2b } from './moon-interior-structure-engine-32-f-2b';
import { MoonOceanRealityEngine32F2c } from './moon-ocean-reality-engine-32-f-2c';
import { MoonGeochemicalEnergyEngine32F4 } from './moon-geochemical-energy-engine-32-f-4';

const build = (density = 1.85, temp = 235.7, flux: number | null = .001,
  mass = .00016, radius = .078) => {
  const physical = new MoonPhysicalProperties(8, 3, mass, radius, density, .05);
  const seed = new MoonSeed('00000000000000000000000000000019');
  const formation = MoonFormationInventoryEngine32F1d.fromMaterialized(physical, seed, PlanetType.GAS_GIANT);
  const phase = MoonWaterPhaseBalanceEngine32F2a.fromMaterialized(physical, formation, temp);
  const cryosphere = {
    basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
    tidalHeatFluxMinimumWattsPerSquareMeter: flux,
    tidalHeatFluxMaximumWattsPerSquareMeter: flux,
    conductiveShellThicknessMinimumKilometers: null,
    conductiveShellThicknessMaximumKilometers: null,
    iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN',
    cryovolcanism: 'NOT_EVALUABLE',
    radiogenicHeatResolved: false,
    oceanConfirmed: false,
  } as MoonInternalWaterAssessment;
  const interior = MoonInteriorStructureEngine32F2b.fromMaterialized(physical,
    formation, phase, cryosphere, temp);
  const ocean = MoonOceanRealityEngine32F2c.fromMaterialized(physical,
    seed, formation, phase, interior, cryosphere, temp);
  return { physical, formation, interior, ocean,
    result: MoonGeochemicalEnergyEngine32F4.fromMaterialized(physical, formation, interior, ocean) };
};

describe('32.F.4 — solventes y gradientes sin bioquímica impuesta', () => {
  it('identifica H₂O líquido en CT-0 pero no inventa reactivos, pH o potencia química', () => {
    const x = build();
    expect(x.ocean.state).toBe('PRESENT_IN_SIMULATED_MODEL');
    expect(x.result.solventState).toBe('MODELLED_LIQUID_H2O_CT0');
    expect(x.result.modeledLiquidH2OMassKilograms).toBeCloseTo(x.ocean.simulatedLiquidWaterMassKilograms!, -10);
    expect(x.result.reactions).toHaveLength(5);
    expect(x.result.reactions.every(r => r.actualReactionGibbsJoulesPerMole === null &&
      r.actualReactionRateMolesPerSecond === null && r.extractableChemicalPowerWatts === null)).toBe(true);
    expect(x.result.actualChemicalPowerWatts).toBeNull();
    expect(x.result.redoxReactantActivities).toBeNull();
    expect(x.result.salinity).toBeNull();
    expect(x.result.pH).toBeNull();
    expect(x.result.otherSolventSpeciation).toBe('UNRESOLVED');
  });
  it('conserva fuente y áreas físicas en vez de transformar calor en energía metabólica', () => {
    const x = build();
    expect(x.result.generatedHeatFluxWattsPerSquareMeter)
      .toBeCloseTo(x.ocean.generatedTotalSurfaceHeatFluxWattsPerSquareMeter!, 12);
    const area = 4 * Math.PI * (x.physical.radiusEarth * 6371000) ** 2;
    expect(x.result.generatedGlobalHeatPowerWatts).toBeCloseTo(area *
      x.ocean.generatedTotalSurfaceHeatFluxWattsPerSquareMeter!, 2);
    expect(x.result.iceConductiveGradientKelvinPerKilometer).toBeCloseTo(
      x.ocean.generatedTotalSurfaceHeatFluxWattsPerSquareMeter! / 2.5 * 1000, 8);
    expect(x.result.idealThermalWorkUpperBoundWatts).toBeGreaterThanOrEqual(0);
    expect(x.result.idealThermalWorkUpperBoundWatts).toBeLessThanOrEqual(x.result.generatedGlobalHeatPowerWatts!);
    expect(x.result.actualChemicalDisequilibriumJoulesPerMole).toBeNull();
  });
  it('no presume contacto agua-silicatos si hay hielo profundo o condensables entre ambos', () => {
    const x = build(1.32, 235.7, .02, .003, .14);
    expect(x.ocean.state).toBe('PRESENT_IN_SIMULATED_MODEL');
    expect(x.ocean.highPressureIceThicknessKilometers).toBeGreaterThan(0);
    expect(x.result.modeledWaterRockContact).toBe('LIQUID_ISOLATED_BY_HIGH_PRESSURE_ICE');
    expect(x.result.directSilicateWaterInterfaceAreaSquareMeters).toBeNull();
    expect(x.result.reactions.find(r => r.pathway === 'WATER_SILICATE_ALTERATION_H2_CANDIDATE')?.applicability)
      .toBe('NOT_ESTABLISHED_WITH_CURRENT_COMPOSITION_OR_ENERGY');
  });
  it('el hielo sin océano no se convierte en solvente líquido ni ruta química activa', () => {
    const x = build(1.85, 235.7, 0);
    expect(x.ocean.state).toBe('ABSENT_IN_SIMULATED_MODEL');
    expect(x.result.solventState).toBe('H2O_SOLID_IN_CT0_MODEL');
    expect(x.result.modeledWaterRockContact).toBe('NO_MODELLED_LIQUID_WATER');
    expect(x.result.modeledLiquidH2OMassKilograms).toBe(0);
    expect(x.result.reactions.every(r => r.applicability ===
      'NOT_ESTABLISHED_WITH_CURRENT_COMPOSITION_OR_ENERGY')).toBe(true);
  });
  it('sin inventario H₂O diferencia ausencia de solvente y agua congelada', () => {
    const x = build(4.8, 235.7);
    expect(x.ocean.reason).toBe('NO_FORMATION_H2O');
    expect(x.result.solventState).toBe('NO_FORMATION_H2O');
    expect(x.result.otherSolventSpeciation).toBe('UNRESOLVED');
  });
  it('no finge un océano ni química cuando falta presión de confinamiento', () => {
    const x = build(1.32, 301.7);
    expect(x.ocean.state).toBe('UNRESOLVED_IN_SIMULATED_MODEL');
    expect(x.result.solventState).toBe('UNRESOLVED_H2O_STATE');
    expect(x.result.modeledLiquidH2OMassKilograms).toBeNull();
    expect(x.result.modeledWaterRockContact).toBe('UNRESOLVED');
    expect(x.result.idealThermalWorkUpperBoundWatts).toBeNull();
  });
  it('sin fuente térmica evita sustituir índices de mareas por vatios', () => {
    const x = build(1.85, 235.7, null);
    expect(x.ocean.generatedTotalSurfaceHeatFluxWattsPerSquareMeter).toBeNull();
    expect(x.result.generatedGlobalHeatPowerWatts).toBeNull();
    expect(x.result.iceConductiveGradientKelvinPerKilometer).toBeNull();
    expect(x.result.actualChemicalPowerWatts).toBeNull();
  });
  it('rechaza identidad desalineada, flujo negativo e inventario hídrico alterado', () => {
    const x = build();
    const run = MoonGeochemicalEnergyEngine32F4.fromMaterialized;
    expect(() => run(x.physical, { ...x.formation, moonOrdinal: 50 }, x.interior, x.ocean)).toThrow();
    expect(() => run(x.physical, x.formation, x.interior, { ...x.ocean,
      generatedTotalSurfaceHeatFluxWattsPerSquareMeter: -1 })).toThrow();
    expect(() => run(x.physical, x.formation, x.interior, { ...x.ocean,
      waterInventoryKilograms: 1 })).toThrow();
  });
  it('es determinista a través de una matriz de composición, temperatura y flujo', () => {
    for (const density of [1.32, 1.85, 4.8]) for (const temp of [200, 235.7, 301.7]) {
      for (const heat of [0, .001, .05]) {
        const a = build(density, temp, heat);
        const b = build(density, temp, heat);
        expect(a.result).toEqual(b.result);
        expect(a.result.actualChemicalPowerWatts).toBeNull();
        expect(a.result.reactions.every(r => r.extractableChemicalPowerWatts === null)).toBe(true);
      }
    }
  });
});
