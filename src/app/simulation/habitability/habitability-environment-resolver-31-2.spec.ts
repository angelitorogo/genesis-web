import { describe, expect, it } from 'vitest';
import type { HabitabilityRoute, HabitabilityScenarioAssessment } from '../../domain/habitability/habitability-scenario';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { auditPlanetSurfaceWaterPersistenceV3 } from '../../presentation/planet-detail/planet-surface-water-persistence-audit-v3';
import {
  HabitabilityEnvironmentResolver31_2,
  type HabitabilityEnvironmentContext31_2,
  type PlanetEnvironmentalWaterSource31_2,
  type PlanetEnvironmentalSources31_2,
  type MoonEnvironmentalSource31_2,
} from './habitability-environment-resolver-31-2';

const ctx: HabitabilityEnvironmentContext31_2 = Object.freeze({
  bodyKey: 'stable-scientific-locator',
  multiplicity: 'SINGLE',
  perspective: 'SIMULATED_REALITY',
  time: Object.freeze({ kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null }),
  observerAccessibleEvidence: Object.freeze([]),
});

// Figures from current scientific cards. These are resolved fields, not seed
// overrides or a special-case in the resolver.
const BITEN: PlanetEnvironmentalWaterSource31_2 = Object.freeze({
  planetOrdinal: 3,
  sourceRetainedSurfacePressurePascal: 89_516.64,
  sourceRetainedAtmosphericWaterVaporMoleFraction01: 0.148,
  sourceMeanSurfaceTemperatureKelvin: 327.48,
  sourceMinimumSurfaceTemperatureKelvin: 302.06,
  sourceMaximumSurfaceTemperatureKelvin: 352.91,
  surfaceLiquidWaterCoverageFraction01: 0.184,
  waterInventoryIndex01: 0.23404,
  hasPersistentSurfaceLiquidWater: true,
});
const QUAELAEN: PlanetEnvironmentalWaterSource31_2 = Object.freeze({
  planetOrdinal: 4,
  sourceRetainedSurfacePressurePascal: 938_068.03,
  sourceRetainedAtmosphericWaterVaporMoleFraction01: 0.014,
  sourceMeanSurfaceTemperatureKelvin: 410.77,
  sourceMinimumSurfaceTemperatureKelvin: 383.15,
  sourceMaximumSurfaceTemperatureKelvin: 438.60,
  surfaceLiquidWaterCoverageFraction01: 0.021,
  waterInventoryIndex01: 0.0561,
  hasPersistentSurfaceLiquidWater: true,
});

function route(
  assessment: HabitabilityScenarioAssessment,
  which: HabitabilityRoute = 'SURFACE_AQUEOUS',
) {
  const result = assessment.routes.find((entry) => entry.route === which);
  if (!result) throw new Error(`Missing route ${which}`);
  return result;
}
function verdict(assessment: HabitabilityScenarioAssessment, constraint: string,
  which: HabitabilityRoute = 'SURFACE_AQUEOUS') {
  const evidence = route(assessment, which).constraints.find((entry) => entry.constraint === constraint);
  if (!evidence) throw new Error(`Missing constraint ${which}/${constraint}`);
  return evidence;
}
function planet(
  water: PlanetEnvironmentalWaterSource31_2 | null,
  context = ctx,
  other: Partial<PlanetEnvironmentalSources31_2> = {},
) {
  return HabitabilityEnvironmentResolver31_2.assessPlanet(context, { water, ...other });
}
function moon(
  overrides: Partial<MoonEnvironmentalSource31_2> = {},
  context = ctx,
) {
  const baseline: MoonEnvironmentalSource31_2 = {
    estimatedSurfaceTemperatureKelvin: 100,
    waterRegime: MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN,
    atmosphereAssessment: null,
    internalWaterAssessment: null,
    ...overrides,
  };
  return HabitabilityEnvironmentResolver31_2.assessMoon(context, baseline);
}

describe('GENESIS 31.2 — resolved planetary/lunar environmental evidence', () => {
  it('Biten: pressure, temperature and modeled water support an aqueous surface scenario but do not finish habitability', () => {
    const result = planet(BITEN);
    expect(verdict(result, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('SUPPORTS');
    expect(verdict(result, 'TEMPERATURE').verdict).toBe('SUPPORTS');
    expect(verdict(result, 'LIQUID_RESERVOIR').verdict).toBe('SUPPORTS');
    expect(verdict(result, 'LIQUID_RESERVOIR').basis).toBe('INFERRED_MODEL');
    expect(route(result).status).toBe('INSUFFICIENT_EVIDENCE');
    expect(route(result).missingConstraints).toContain('CHEMICAL_FEASIBILITY');
    expect(route(result, 'ALTERNATIVE_CHEMISTRY').status).toBe('MODEL_NOT_IMPLEMENTED');
    expect(JSON.stringify(result)).not.toMatch(/lifePresent|abiogenesis|probability|score01/i);
  });

  it('Quaelaen: thermal liquid is possible but ~4% vapor saturation does not establish surface persistence', () => {
    const result = planet(QUAELAEN);
    expect(verdict(result, 'TEMPERATURE').verdict).toBe('SUPPORTS');
    expect(verdict(result, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('SUPPORTS');
    expect(verdict(result, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    expect(route(result).status).toBe('INSUFFICIENT_EVIDENCE');
    expect(verdict(result, 'LIQUID_RESERVOIR').basis).toBe('UNRESOLVED');
  });

  it('does not disagree with the existing ATM-VIS.3 vapor-persistence audit', () => {
    const check = (water: PlanetEnvironmentalWaterSource31_2) =>
      auditPlanetSurfaceWaterPersistenceV3({
        hasDefinedSolidSurfaceBase: true,
        hasPersistentSurfaceLiquidWater: water.hasPersistentSurfaceLiquidWater,
        retainedSurfacePressurePascal: water.sourceRetainedSurfacePressurePascal,
        meanSurfaceTemperatureKelvin: water.sourceMeanSurfaceTemperatureKelvin,
        retainedGasComposition: [
          { gas: AtmosphereGas.WATER_VAPOR,
            moleFraction01: water.sourceRetainedAtmosphericWaterVaporMoleFraction01 },
          { gas: AtmosphereGas.NITROGEN,
            moleFraction01: 1 - water.sourceRetainedAtmosphericWaterVaporMoleFraction01 },
        ],
      });
    expect(check(QUAELAEN).status).toBe('EVAPORATION_REPLENISHMENT_UNRESOLVED');
    expect(verdict(planet(QUAELAEN), 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    expect(check(BITEN).status).toBe('THERMALLY_ADMISSIBLE_UNCONFIRMED');
    expect(verdict(planet(BITEN), 'LIQUID_RESERVOIR').verdict).toBe('SUPPORTS');
  });

  it('Vrusar: insufficient atmospheric pressure blocks exposed pure liquid water despite arbitrary percentages', () => {
    const result = planet({ ...BITEN, sourceRetainedSurfacePressurePascal: 385 });
    expect(verdict(result, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('CONTRADICTS');
    expect(route(result).status).toBe('CONSTRAINTS_INCOMPATIBLE');
  });

  it('Krarum: entirely frozen thermal envelope excludes a current surface aqueous liquid scenario', () => {
    const result = planet({ ...BITEN, sourceRetainedSurfacePressurePascal: 208_064,
      sourceMinimumSurfaceTemperatureKelvin: 76, sourceMeanSurfaceTemperatureKelvin: 92.76,
      sourceMaximumSurfaceTemperatureKelvin: 112, surfaceLiquidWaterCoverageFraction01: 0,
      hasPersistentSurfaceLiquidWater: false });
    expect(verdict(result, 'TEMPERATURE').verdict).toBe('CONTRADICTS');
    expect(verdict(result, 'LIQUID_RESERVOIR').verdict).toBe('CONTRADICTS');
  });

  it('high temperature without any liquid-phase window is incompatible, without altering a planet generator', () => {
    const result = planet({ ...BITEN, sourceMeanSurfaceTemperatureKelvin: 700,
      sourceMinimumSurfaceTemperatureKelvin: 660,
      sourceMaximumSurfaceTemperatureKelvin: 780,
      hasPersistentSurfaceLiquidWater: false,
      surfaceLiquidWaterCoverageFraction01: 0 });
    expect(verdict(result, 'TEMPERATURE').verdict).toBe('CONTRADICTS');
  });

  it('possible local thermal overlap does not let mean temperature assert compatibility', () => {
    const result = planet({ ...BITEN, sourceMeanSurfaceTemperatureKelvin: 260,
      sourceMinimumSurfaceTemperatureKelvin: 230, sourceMaximumSurfaceTemperatureKelvin: 300,
      hasPersistentSurfaceLiquidWater: false });
    expect(verdict(result, 'TEMPERATURE').verdict).toBe('UNRESOLVED');
  });

  it('gas giants have no solid-surface liquid reservoir; subsurface route stays unevaluated', () => {
    const result = planet({ ...BITEN, sourceRetainedSurfacePressurePascal: null,
      sourceMeanSurfaceTemperatureKelvin: null, sourceMinimumSurfaceTemperatureKelvin: null,
      sourceMaximumSurfaceTemperatureKelvin: null, surfaceLiquidWaterCoverageFraction01: null,
      hasPersistentSurfaceLiquidWater: false });
    expect(verdict(result, 'LIQUID_RESERVOIR').verdict).toBe('CONTRADICTS');
    expect(verdict(result, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('UNRESOLVED');
    expect(verdict(result, 'TEMPERATURE').verdict).toBe('UNRESOLVED');
    expect(route(result, 'SUBSURFACE_AQUEOUS').status).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('unknown physical inputs remain unresolved, not evidence against life', () => {
    const result = planet(null);
    expect(route(result).status).toBe('INSUFFICIENT_EVIDENCE');
    expect(route(result).constraints.every((item) => item.verdict === 'UNRESOLVED')).toBe(true);
  });

  it('resolves measured pressure and mean climate independently when no water inventory exists', () => {
    const result = planet(null, ctx, { atmosphere: {
      planetOrdinal: 3, retainedSurfacePressurePascal: 101_325, retainedGasComponents: [],
    }, climate: { planetOrdinal: 3, meanSurfaceTemperatureKelvin: 288 } });
    expect(verdict(result, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('SUPPORTS');
    expect(verdict(result, 'TEMPERATURE').verdict).toBe('SUPPORTS');
    expect(verdict(result, 'TEMPERATURE').basis).toBe('INFERRED_MODEL');
    expect(verdict(result, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    expect(() => planet(null, ctx, { atmosphere: {
      planetOrdinal: 4, retainedSurfacePressurePascal: 101_325,
      retainedGasComponents: [],
    }, climate: { planetOrdinal: 3, meanSurfaceTemperatureKelvin: 288 } })).toThrow(/different planets/);
  });

  it('nonpersistent water morphology cannot assert a stable reservoir', () => {
    const result = planet({ ...BITEN, hasPersistentSurfaceLiquidWater: false });
    expect(verdict(result, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
  });

  it('checks actual atmosphere and climate snapshots rather than mixing different planet states', () => {
    expect(() => planet(BITEN, ctx, { atmosphere: {
      planetOrdinal: 4,
      retainedSurfacePressurePascal: 89_516.64,
      retainedGasComponents: [],
    } })).toThrow(/atmosphere and water/);
    expect(() => planet(BITEN, ctx, { climate: {
      planetOrdinal: 3, meanSurfaceTemperatureKelvin: 300,
    } })).toThrow(/climate and water/);
    expect(() => planet(BITEN, ctx, { atmosphere: {
      planetOrdinal: 3, retainedSurfacePressurePascal: 89_516.64,
      retainedGasComponents: [
        { gas: AtmosphereGas.NITROGEN, moleFraction01: 0.5 },
        { gas: AtmosphereGas.WATER_VAPOR, moleFraction01: 0.5 },
      ],
    } })).toThrow(/water vapor differs/);
  });

  it('valid cross-model composition, pressure and climate preserve the original determination', () => {
    const result = planet(BITEN, ctx, { atmosphere: {
      planetOrdinal: 3, retainedSurfacePressurePascal: 89_516.64,
      retainedGasComponents: [
        { gas: AtmosphereGas.NITROGEN, moleFraction01: 0.852 },
        { gas: AtmosphereGas.WATER_VAPOR, moleFraction01: 0.148 },
      ],
    }, climate: { planetOrdinal: 3, meanSurfaceTemperatureKelvin: 327.48 } });
    expect(verdict(result, 'LIQUID_RESERVOIR').verdict).toBe('SUPPORTS');
  });

  it('ice-moon C assessment may support conditional internal thermal feasibility, never assert an actual ocean', () => {
    const conditional = moon({
      internalWaterAssessment: {
        basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
        tidalHeatFluxMinimumWattsPerSquareMeter: 0.01,
        tidalHeatFluxMaximumWattsPerSquareMeter: 0.1,
        conductiveShellThicknessMinimumKilometers: 5,
        conductiveShellThicknessMaximumKilometers: 90,
        iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN',
        cryovolcanism: 'CONDITIONAL',
        radiogenicHeatResolved: false,
        oceanConfirmed: false,
      },
    });
    expect(verdict(conditional, 'TEMPERATURE', 'SUBSURFACE_AQUEOUS').verdict).toBe('SUPPORTS');
    expect(verdict(conditional, 'TEMPERATURE', 'SUBSURFACE_AQUEOUS').basis).toBe('INFERRED_MODEL');
    expect(verdict(conditional, 'LIQUID_RESERVOIR', 'SUBSURFACE_AQUEOUS').verdict).toBe('UNRESOLVED');
    expect(verdict(conditional, 'RESERVOIR_GEOMETRY', 'SUBSURFACE_AQUEOUS').verdict).toBe('UNRESOLVED');
    expect(route(conditional, 'SUBSURFACE_AQUEOUS').status).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('moon legacy subsurface/surface water labels alone are not detection or resolved reservoirs', () => {
    for (const regime of [MoonWaterRegime.SURFACE_LIQUID, MoonWaterRegime.MIXED,
      MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN]) {
      const result = moon({ waterRegime: regime });
      expect(verdict(result, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
      expect(verdict(result, 'LIQUID_RESERVOIR', 'SUBSURFACE_AQUEOUS').verdict).toBe('UNRESOLVED');
    }
  });

  it('moon B atmosphere offers conditional pressure, not observed pressure or automatic surface habitability', () => {
    const base = {
      volatileInventoryIndex01: 0.5, thermalEscapeSupportIndex01: 0.5,
      replenishmentSupportIndex01: 0.5, condensationRemovalIndex01: 0.5,
      pressureBasis: 'CONDITIONAL_SCENARIO' as const,
      species: [], irradiationReferenceEarth: 1,
      chargedParticleEnvironment: 'UNRESOLVED' as const,
      hostMagnetosphereShielding: 'UNRESOLVED' as const,
    };
    const result = moon({ estimatedSurfaceTemperatureKelvin: 295,
      atmosphereAssessment: { ...base, estimatedSurfacePressurePascal: 101_325 } });
    expect(verdict(result, 'PRESSURE_OR_CONFINEMENT').basis).toBe('INFERRED_MODEL');
    expect(verdict(result, 'TEMPERATURE').verdict).toBe('SUPPORTS');
    expect(verdict(result, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    const unknown = moon({ estimatedSurfaceTemperatureKelvin: 295,
      atmosphereAssessment: { ...base, pressureBasis: 'UNRESOLVED',
        estimatedSurfacePressurePascal: null } });
    expect(verdict(unknown, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('UNRESOLVED');
  });

  it('hides all unapproved source keys from observed knowledge while the reality scenario remains intact', () => {
    const observed = planet(BITEN, { ...ctx, perspective: 'OBSERVED_KNOWLEDGE' });
    expect(route(observed).status).toBe('INSUFFICIENT_EVIDENCE');
    expect(route(observed).constraints.every((item) => item.sourceKey === null)).toBe(true);
    const partial = planet(BITEN, { ...ctx, perspective: 'OBSERVED_KNOWLEDGE',
      observerAccessibleEvidence: [{ route: 'SURFACE_AQUEOUS', constraint: 'TEMPERATURE' }] });
    expect(verdict(partial, 'TEMPERATURE').verdict).toBe('SUPPORTS');
    expect(verdict(partial, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    expect(verdict(partial, 'LIQUID_RESERVOIR').sourceKey).toBe(null);
  });

  it('does not leak a hidden incompatible atmosphere or the reason for its contradiction', () => {
    const simulated = planet({ ...BITEN, sourceRetainedSurfacePressurePascal: 100 });
    expect(route(simulated).status).toBe('CONSTRAINTS_INCOMPATIBLE');
    const hidden = planet({ ...BITEN, sourceRetainedSurfacePressurePascal: 100 },
      { ...ctx, perspective: 'OBSERVED_KNOWLEDGE' });
    expect(route(hidden).status).toBe('INSUFFICIENT_EVIDENCE');
    expect(verdict(hidden, 'PRESSURE_OR_CONFINEMENT').sourceKey).toBe(null);
  });

  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    '%s uses the same physical criteria independently of seed/locator',
    (multiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE') => {
      const a = planet(BITEN, { ...ctx, multiplicity, bodyKey: 'seed-A' });
      const b = planet(BITEN, { ...ctx, multiplicity, bodyKey: 'seed-B' });
      expect(a.routes).toEqual(b.routes);
    },
  );

  it('is read-only and deterministic on frozen resolved fields, with no RNG or generated life', () => {
    const a = planet(BITEN);
    const b = planet(BITEN);
    expect(a).toEqual(b);
    expect(Object.isFrozen(a.routes)).toBe(true);
    expect(BITEN.sourceMeanSurfaceTemperatureKelvin).toBe(327.48);
    expect(JSON.stringify(a)).not.toMatch(/lifePresent|biologicalSpecies|probability/i);
  });
});
