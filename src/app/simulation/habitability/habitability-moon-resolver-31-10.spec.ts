import { describe, expect, it } from 'vitest';
import type { HabitabilityScenarioAssessment, HabitabilityRoute } from '../../domain/habitability/habitability-scenario';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import type { MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { MoonAtmosphereEngine } from '../planetary/moon-atmosphere-engine';
import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { MoonTidalState, moonTidalMigrationRegimeV1, synchronousOrbitPlanetRadiiV1 } from '../../domain/planetary/moon-tidal-state';
import { MoonTidalLockingRegime } from '../../domain/planetary/moon-tidal-locking-regime';
import { MoonTidalRegime } from '../../domain/planetary/moon-tidal-regime';
import { MoonInternalWaterEngine } from '../planetary/moon-internal-water-engine';
import { HabitabilityEngine } from './habitability-engine';
import { HabitabilityEnvironmentResolver31_2, type HabitabilityEnvironmentContext31_2 } from './habitability-environment-resolver-31-2';
import { HabitabilityResourcesResolver31_3 } from './habitability-resources-resolver-31-3';
import { HabitabilityRadiationResolver31_4 } from './habitability-radiation-resolver-31-4';
import { HabitabilityStabilityResolver31_5 } from './habitability-stability-resolver-31-5';
import { HabitabilityIndicesResolver31_6 } from './habitability-indices-resolver-31-6';
import { HabitabilityMoonResolver31_10, type MoonHabitabilitySource31_10 } from './habitability-moon-resolver-31-10';

const ctx: HabitabilityEnvironmentContext31_2 = Object.freeze({
  bodyKey: 'G0/S31010/O1/B3/M2', multiplicity: 'BINARY',
  perspective: 'SIMULATED_REALITY',
  time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 3.1 },
  observerAccessibleEvidence: [],
});
const shell: MoonInternalWaterAssessment = Object.freeze({
  basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
  tidalHeatFluxMinimumWattsPerSquareMeter: 0.006,
  tidalHeatFluxMaximumWattsPerSquareMeter: 0.42,
  conductiveShellThicknessMinimumKilometers: 2,
  conductiveShellThicknessMaximumKilometers: 90,
  iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN', cryovolcanism: 'CONDITIONAL',
  radiogenicHeatResolved: false, oceanConfirmed: false,
});
const gas: MoonAtmosphereAssessment = Object.freeze({
  volatileInventoryIndex01: 0.6, thermalEscapeSupportIndex01: 0.3,
  replenishmentSupportIndex01: 0.5, condensationRemovalIndex01: 0.1,
  estimatedSurfacePressurePascal: 310,
  pressureBasis: 'CONDITIONAL_SCENARIO', species: [],
  irradiationReferenceEarth: 0.3,
  chargedParticleEnvironment: 'UNRESOLVED', hostMagnetosphereShielding: 'UNRESOLVED',
});
const moon: MoonHabitabilitySource31_10 = Object.freeze({
  hostPlanetOrdinal: 4, moonOrdinal: 2, sourceMoonRadiusEarth: 0.404,
  estimatedSurfaceTemperatureKelvin: 100,
  waterInventoryIndex01: 0.83, inferredIceRichnessIndex01: 0.75,
  sourceTidalHeatingIndex01: 0.38,
  waterRegime: MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN,
  atmosphereAssessment: gas, internalWaterAssessment: shell,
});

function previous(context = ctx, source: MoonHabitabilitySource31_10 | null = moon): HabitabilityScenarioAssessment {
  // Full 31.2 → 31.3 → 31.4 → 31.5 evidence pipeline; 31.10 must be additive.
  const source31_3 = source === null ? null : {
    ...source,
    sourceMoonSurfaceGravityEarth: 0.138,
    sourceReferenceMeanInsolationEarth: 0.23,
    internalHeatRetentionIndex01: 0.61,
  };
  const a = HabitabilityEnvironmentResolver31_2.assessMoon(context, source);
  const b = HabitabilityResourcesResolver31_3.assessMoon(context, a, source31_3);
  const c = HabitabilityRadiationResolver31_4.assessMoon(context, b.assessment,
    { moon: source === null ? null : source });
  const d = HabitabilityStabilityResolver31_5.assessMoon(context, c.assessment,
    { hostPlanetOrdinal: 4, moonOrdinal: 2 });
  return d.assessment;
}
function assess(source: MoonHabitabilitySource31_10 | null = moon,
  context = ctx, prior = previous(context, source)) {
  return HabitabilityMoonResolver31_10.assessMoon(context, prior, source);
}
function c(a: HabitabilityScenarioAssessment, name: string,
  route: HabitabilityRoute = 'SUBSURFACE_AQUEOUS') {
  return a.routes.find((r) => r.route === route)!.constraints.find((v) => v.constraint === name)!;
}

describe('GENESIS 31.10 — lunar ocean-under-ice scenario geometry and provenance', () => {
  it('accepts a bounded ice-covered scenario as geometric opportunity, not an ocean discovery', () => {
    const r = assess();
    expect(r.diagnostics?.iceOceanScenario).toBe('CONDITIONAL_GEOMETRY_ADMISSIBLE');
    expect(r.diagnostics?.geometry).toBe('ADMISSIBLE_WITHIN_C_BOUNDS');
    expect(c(r.assessment, 'RESERVOIR_GEOMETRY').verdict).toBe('SUPPORTS');
    expect(c(r.assessment, 'RESERVOIR_GEOMETRY').basis).toBe('INFERRED_MODEL');
    expect(c(r.assessment, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('SUPPORTS');
    expect(c(r.assessment, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    expect(r.diagnostics?.oceanConfirmed).toBe(false);
    expect(r.assessment.routes[1].status).toBe('INSUFFICIENT_EVIDENCE');
  });
  it('does not infer a biological energy gradient from a conditional tidal heat source', () => {
    const r = assess();
    expect(r.diagnostics?.conditionalTidalFluxMaximumWattsPerSquareMeter).toBe(0.42);
    expect(r.diagnostics?.biologicalEnergyResolved).toBe(false);
    expect(c(r.assessment, 'ENERGY_GRADIENT').verdict).toBe('UNRESOLVED');
    expect(c(r.assessment, 'CHEMICAL_FEASIBILITY').verdict).toBe('UNRESOLVED');
  });
  it('does not turn modeled surface ice into measured irradiation shielding', () => {
    const r = assess();
    expect(r.diagnostics?.irradiationPenetrationResolved).toBe(false);
    expect(c(r.assessment, 'RADIATION_EXPOSURE').verdict).toBe('UNRESOLVED');
  });
  it('keeps the liquid reservoir unknown despite V1 SUBSURFACE_OCEAN labels and indices', () => {
    const r = assess({ ...moon, waterRegime: MoonWaterRegime.SUBSURFACE_OCEAN });
    expect(c(r.assessment, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
  });
  it('does not turn an atmosphere estimate into a lunar pressure measurement', () => {
    const r = assess();
    expect(r.diagnostics?.estimatedSurfacePressurePascal).toBe(310);
    expect(r.diagnostics?.atmosphericPressureBasis).toBe('CONDITIONAL_SCENARIO');
    expect(r.diagnostics?.internalLiquidPressureResolved).toBe(false);
    expect(c(r.assessment, 'PRESSURE_OR_CONFINEMENT').sourceKey)
      .toBe('moon.C.conditionalConductiveIceShell.confinement');
  });
  it('32.F.1: accepts quantified lunar pressure through 31.10 without claiming ocean or life', () => {
    const physical = new MoonPhysicalProperties(4, 2, 0.0225, 0.404, 1.88, 0.138);
    const tidal = { hostPlanetOrdinal: 4, moonOrdinal: 2,
      tidalHeatingIndex01: 0.38 } as MoonTidalState;
    const atmosphere = MoonAtmosphereEngine.assess(physical, tidal, 100, 0.75, 0.3, {
      sourceKind: 'INDEPENDENT_MASS_AND_FLUXES', sourceId: 'TEST_32F1_31_10',
      durationSeconds: 86400, collisionCrossSectionSquareMeters: 1e-19,
      gasForcings: [{ gas: AtmosphereGas.NITROGEN, initialGasMassKilograms: 1e18,
        replenishmentKilogramsPerSecond: 0, thermalEscapeKilogramsPerSecond: 0,
        particleEscapeKilogramsPerSecond: 0, photolysisRatePerSecond: 0,
        photolysisEscapingFraction01: 1 }],
    });
    expect(atmosphere.pressureBasis).toBe('PHYSICAL_BALANCE');
    const source = { ...moon, atmosphereAssessment: atmosphere };
    const r = assess(source);
    expect(r.diagnostics?.atmosphericPressureBasis).toBe('PHYSICAL_BALANCE');
    expect(r.diagnostics?.estimatedSurfacePressurePascal)
      .toBe(atmosphere.physicalBalance32F1?.surfacePressurePascal);
    expect(r.diagnostics?.oceanConfirmed).toBe(false);
    expect(c(r.assessment, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    const observed = assess(source, { ...ctx, perspective: 'OBSERVED_KNOWLEDGE' });
    expect(observed.diagnostics).toBeNull();
    expect(JSON.stringify(observed)).not.toContain('TEST_32F1_31_10');
  });
  it('32.F.1: rejects a physical-balance label without a resolved pressure', () => {
    const source = { ...moon, atmosphereAssessment: {
      ...gas, pressureBasis: 'PHYSICAL_BALANCE' as const,
      estimatedSurfacePressurePascal: null,
    } };
    expect(() => assess(source)).toThrow('gas column must agree');
  });
  it('does not infer a measured hydrostatic pressure from a missing lunar gas column', () => {
    const r = assess({ ...moon, atmosphereAssessment: null });
    expect(r.diagnostics?.estimatedSurfacePressurePascal).toBe(null);
    expect(r.diagnostics?.atmosphericPressureBasis).toBe('UNRESOLVED');
  });
  it('does not claim salinity, radiogenic heat, or accessible chemistry', () => {
    const d = assess().diagnostics!;
    expect(d.salinityResolved).toBe(false);
    expect(d.radiogenicHeatResolved).toBe(false);
    expect(d.accessibleChemistryResolved).toBe(false);
    expect(d.historicalOceanContinuityResolved).toBe(false);
  });
  it('respects the geometric C ceiling of 35% of the actual lunar radius', () => {
    const r = assess();
    expect(r.diagnostics?.maximumGeometricShellKilometers)
      .toBeCloseTo(0.35 * 0.404 * 6371, 9);
    expect(r.diagnostics?.conditionalShellMinimumKilometers).toBe(2);
    expect(r.diagnostics?.conditionalShellMaximumKilometers).toBe(90);
  });
  it('does not assert an admissible shell if the thinnest reference exceeds the C bound', () => {
    const implausible = { ...shell,
      conductiveShellThicknessMinimumKilometers: 920,
      conductiveShellThicknessMaximumKilometers: 2300 };
    const r = assess({ ...moon, internalWaterAssessment: implausible });
    expect(r.diagnostics?.iceOceanScenario).toBe('OUTSIDE_CURRENT_C_GEOMETRY_BOUNDS');
    expect(r.diagnostics?.geometry).toBe('OUTSIDE_C_BOUNDS');
    expect(c(r.assessment, 'RESERVOIR_GEOMETRY').verdict).toBe('UNRESOLVED');
  });
  it('does not infer a protective shell from a zero lower-bound thickness', () => {
    const r = assess({ ...moon, internalWaterAssessment: {
      ...shell, conductiveShellThicknessMinimumKilometers: 0,
    } });
    expect(r.diagnostics?.iceOceanScenario).toBe('CONDITIONAL_GEOMETRY_UNRESOLVED');
    expect(c(r.assessment, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('UNRESOLVED');
  });
  it('does not promote a conditional C regime without shell bounds to favorable geometry', () => {
    const r = assess({ ...moon, internalWaterAssessment: {
      ...shell, conductiveShellThicknessMinimumKilometers: null,
      conductiveShellThicknessMaximumKilometers: null,
    } });
    expect(r.diagnostics?.geometry).toBe('NOT_RESOLVED');
    expect(c(r.assessment, 'RESERVOIR_GEOMETRY').verdict).toBe('UNRESOLVED');
  });
  it('does not treat a dry inventory as a candidate ocean', () => {
    const r = assess({ ...moon,
      waterInventoryIndex01: 0.02,
      waterRegime: MoonWaterRegime.NONE,
      internalWaterAssessment: { ...shell, iceShellThermalRegime: 'ICE_INVENTORY_LIMITED' },
    });
    expect(r.diagnostics?.volatileInventory).toBe('INVENTORY_LIMITED');
    expect(r.diagnostics?.iceOceanScenario).toBe('NOT_SUPPORTED_BY_CURRENT_C_SCENARIO');
    expect(c(r.assessment, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
  });
  it('keeps a tide-insufficient cold moon explicitly unsupported by the present C model', () => {
    const r = assess({ ...moon, internalWaterAssessment: {
      ...shell, iceShellThermalRegime: 'TIDAL_HEAT_INSUFFICIENT_IN_SCENARIO',
    } });
    expect(r.diagnostics?.iceOceanScenario).toBe('NOT_SUPPORTED_BY_CURRENT_C_SCENARIO');
    expect(c(r.assessment, 'RESERVOIR_GEOMETRY').verdict).toBe('UNRESOLVED');
  });
  it('does not call a very strongly heated shell a confirmed stable ocean', () => {
    const r = assess({ ...moon, internalWaterAssessment: {
      ...shell, iceShellThermalRegime: 'HIGH_TIDAL_FLUX_SCENARIO',
    } });
    expect(r.diagnostics?.iceOceanScenario).toBe('NOT_SUPPORTED_BY_CURRENT_C_SCENARIO');
    expect(r.diagnostics?.oceanConfirmed).toBe(false);
  });
  it('does not confuse a hot surface with a stable cold water-ice lid', () => {
    const r = assess({ ...moon, estimatedSurfaceTemperatureKelvin: 480,
      waterRegime: MoonWaterRegime.NONE,
      internalWaterAssessment: {
        ...shell, iceShellThermalRegime: 'NO_STABLE_SURFACE_ICE',
        conductiveShellThicknessMinimumKilometers: null,
        conductiveShellThicknessMaximumKilometers: null,
      },
    });
    expect(r.diagnostics?.iceOceanScenario).toBe('NOT_SUPPORTED_BY_CURRENT_C_SCENARIO');
    expect(c(r.assessment, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('UNRESOLVED');
  });
  it('does not apply C tides when spin is not synchronous', () => {
    const r = assess({ ...moon, internalWaterAssessment: {
      ...shell, iceShellThermalRegime: 'NOT_EVALUABLE_NON_SYNCHRONOUS',
      tidalHeatFluxMinimumWattsPerSquareMeter: null,
      tidalHeatFluxMaximumWattsPerSquareMeter: null,
      conductiveShellThicknessMinimumKilometers: null,
      conductiveShellThicknessMaximumKilometers: null,
    } });
    expect(r.diagnostics?.iceOceanScenario).toBe('NOT_EVALUABLE');
  });
  it('does not extrapolate C tides to high eccentricities', () => {
    const r = assess({ ...moon, internalWaterAssessment: {
      ...shell, iceShellThermalRegime: 'NOT_EVALUABLE_HIGH_ECCENTRICITY',
      tidalHeatFluxMinimumWattsPerSquareMeter: null,
      tidalHeatFluxMaximumWattsPerSquareMeter: null,
      conductiveShellThicknessMinimumKilometers: null,
      conductiveShellThicknessMaximumKilometers: null,
    } });
    expect(r.diagnostics?.iceOceanScenario).toBe('NOT_EVALUABLE');
  });
  it('treats C absence in old saved projections as unknown rather than a confirmed ocean', () => {
    const r = assess({ ...moon, internalWaterAssessment: null });
    expect(r.diagnostics?.iceOceanScenario).toBe('NOT_EVALUABLE');
    expect(c(r.assessment, 'RESERVOIR_GEOMETRY').verdict).toBe('UNRESOLVED');
    expect(c(r.assessment, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
  });
  it('does not invent any physics for a missing moon', () => {
    const r = assess(null);
    expect(r.diagnostics?.volatileInventory).toBe('NOT_RESOLVED');
    expect(r.diagnostics?.maximumGeometricShellKilometers).toBe(null);
    expect(r.assessment.routes[1].status).toBe('INSUFFICIENT_EVIDENCE');
  });
  it('never exposes internal cryosphere diagnostics in OBSERVED_KNOWLEDGE', () => {
    const observer = { ...ctx, perspective: 'OBSERVED_KNOWLEDGE' as const };
    const r = assess(moon, observer);
    expect(r.diagnostics).toBe(null);
    expect(c(r.assessment, 'RESERVOIR_GEOMETRY').verdict).toBe('UNRESOLVED');
    expect(c(r.assessment, 'PRESSURE_OR_CONFINEMENT').sourceKey).toBe(null);
    expect(JSON.stringify(r)).not.toContain('moon.C.conditionalConductiveIceShell');
  });
  it('an explicit discovery grant reveals only the authorized inferred constraint', () => {
    const observer = { ...ctx, perspective: 'OBSERVED_KNOWLEDGE' as const,
      observerAccessibleEvidence: [{ route: 'SUBSURFACE_AQUEOUS' as const,
        constraint: 'RESERVOIR_GEOMETRY' as const }] };
    const r = assess(moon, observer);
    expect(c(r.assessment, 'RESERVOIR_GEOMETRY').verdict).toBe('SUPPORTS');
    expect(c(r.assessment, 'PRESSURE_OR_CONFINEMENT').verdict).toBe('UNRESOLVED');
    expect(r.diagnostics).toBe(null);
  });
  it('keeps identical criteria and geometry for SINGLE, BINARY, TRIPLE and UNKNOWN', () => {
    for (const multiplicity of ['SINGLE', 'BINARY', 'TRIPLE', 'UNKNOWN'] as const) {
      const context = { ...ctx, multiplicity };
      const r = assess(moon, context);
      expect(r.diagnostics?.iceOceanScenario).toBe('CONDITIONAL_GEOMETRY_ADMISSIBLE');
      expect(c(r.assessment, 'RESERVOIR_GEOMETRY').verdict).toBe('SUPPORTS');
    }
  });
  it('is independent of scientific body key, seed and order', () => {
    const a = assess();
    const b = assess(moon, { ...ctx, bodyKey: 'G12/S-993/O2/B7/M1' });
    expect(a.assessment.routes).toEqual(b.assessment.routes);
    expect(a.diagnostics).toEqual(b.diagnostics);
    expect(assess()).toEqual(a);
  });
  it('preserves the 31.2 thermal source, the 31.4 radiation uncertainty and 31.5 dynamics', () => {
    const p = previous();
    const r = assess(moon, ctx, p);
    expect(c(r.assessment, 'TEMPERATURE')).toEqual(c(p, 'TEMPERATURE'));
    expect(c(r.assessment, 'RADIATION_EXPOSURE')).toEqual(c(p, 'RADIATION_EXPOSURE'));
    expect(c(r.assessment, 'DYNAMICAL_STABILITY')).toEqual(c(p, 'DYNAMICAL_STABILITY'));
    expect(c(r.assessment, 'LIQUID_RESERVOIR')).toEqual(c(p, 'LIQUID_RESERVOIR'));
  });
  it('feeds descriptive route coverage into 31.6 without creating life probability', () => {
    const summary = HabitabilityIndicesResolver31_6.summarize(assess().assessment);
    const route = summary.routes.find((r) => r.route === 'SUBSURFACE_AQUEOUS')!;
    expect(route.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(route.criteria.find((v) => v.constraint === 'RESERVOIR_GEOMETRY')?.verdict).toBe('SUPPORTS');
    expect(summary.interpretation).toBe('DESCRIPTIVE_CONSTRAINT_COVERAGE_NOT_LIFE_PROBABILITY');
    expect(summary.routes[2].status).toBe('MODEL_NOT_IMPLEMENTED');
  });
  it('never mutates the previously evaluated moon or other sources', () => {
    const old = previous();
    const snapshot = JSON.stringify([old, moon]);
    assess(moon, ctx, old);
    expect(JSON.stringify([old, moon])).toBe(snapshot);
  });
  it('refuses a previous assessment belonging to a planet or another CT-0 perspective', () => {
    const other = HabitabilityEngine.evaluate({ bodyKind: 'PLANET',
      bodyKey: ctx.bodyKey, multiplicity: ctx.multiplicity,
      perspective: ctx.perspective, time: ctx.time, evidence: [] });
    expect(() => assess(moon, ctx, other)).toThrow();
    expect(() => assess(moon, { ...ctx, multiplicity: 'TRIPLE' }, previous())).toThrow();
    expect(() => assess(moon, { ...ctx, time: { ...ctx.time,
      systemAgeBillionYears: 7 } }, previous())).toThrow();
  });
  it('never replaces previously established C geometry or shell-confinement evidence', () => {
    const old = HabitabilityEngine.evaluate({ bodyKind: 'MOON',
      bodyKey: ctx.bodyKey, multiplicity: ctx.multiplicity,
      perspective: ctx.perspective, time: ctx.time,
      evidence: [{ route: 'SUBSURFACE_AQUEOUS', constraint: 'RESERVOIR_GEOMETRY',
        verdict: 'SUPPORTS', basis: 'INFERRED_MODEL',
        accessibleToObserver: false, sourceKey: 'prior.31.10.other' }] });
    expect(() => assess(moon, ctx, old)).toThrow(/overwrite/);
  });
  it('rejects malformed moon identity and invalid finite model inputs', () => {
    expect(() => assess({ ...moon, moonOrdinal: 0 })).toThrow();
    expect(() => assess({ ...moon, hostPlanetOrdinal: -1 })).toThrow();
    expect(() => assess({ ...moon, sourceMoonRadiusEarth: 0 })).toThrow();
    expect(() => assess({ ...moon, estimatedSurfaceTemperatureKelvin: NaN })).toThrow();
    expect(() => assess({ ...moon, waterInventoryIndex01: 1.2 })).toThrow();
    expect(() => assess({ ...moon, sourceTidalHeatingIndex01: -0.1 })).toThrow();
  });
  it('rejects forbidden confirmed C oceans and invented radiogenic measurement', () => {
    expect(() => assess({ ...moon, internalWaterAssessment: {
      ...shell, oceanConfirmed: true as false,
    } })).toThrow();
    expect(() => assess({ ...moon, internalWaterAssessment: {
      ...shell, radiogenicHeatResolved: true as false,
    } })).toThrow();
  });
  it('rejects inverted or negative conductive shell and tidal flux bounds', () => {
    expect(() => assess({ ...moon, internalWaterAssessment: {
      ...shell, conductiveShellThicknessMinimumKilometers: 10,
      conductiveShellThicknessMaximumKilometers: 2,
    } })).toThrow();
    expect(() => assess({ ...moon, internalWaterAssessment: {
      ...shell, tidalHeatFluxMaximumWattsPerSquareMeter: -1,
    } })).toThrow();
    expect(() => assess({ ...moon, internalWaterAssessment: {
      ...shell, tidalHeatFluxMinimumWattsPerSquareMeter: null,
    } })).toThrow();
  });
  it('rejects forged C cold shell regimes on a hot surface and missing volatiles', () => {
    expect(() => assess({ ...moon, estimatedSurfaceTemperatureKelvin: 500 })).toThrow();
    expect(() => assess({ ...moon, inferredIceRichnessIndex01: 0.02 })).toThrow();
  });
  it('refuses fabricated lunar charged-particle or host magnetic shielding data', () => {
    expect(() => assess({ ...moon, atmosphereAssessment: {
      ...gas, hostMagnetosphereShielding: 'RESOLVED' as 'UNRESOLVED',
    } })).toThrow();
    expect(() => assess({ ...moon, atmosphereAssessment: {
      ...gas, pressureBasis: 'UNRESOLVED',
    } })).toThrow();
  });
  it('integrates a real phase-C eccentricity-tide calculation without inventing shell thickness', () => {
    const physical = new MoonPhysicalProperties(4, 2, 0.0225, 0.404, 1.88, 0.138);
    const hostMassEarth = 318;
    const hostRadiusEarth = 11.2;
    const axisPlanetRadii = 20;
    const axisKm = axisPlanetRadii * hostRadiusEarth * 6371;
    const periodDays = 2 * Math.PI * Math.sqrt((axisKm * 1000) ** 3 /
      (6.67430e-11 * (hostMassEarth + physical.massEarth) * 5.9722e24)) / 86400;
    const synchronousRadius = synchronousOrbitPlanetRadiiV1(hostMassEarth, hostRadiusEarth, 12);
    const tidal = new MoonTidalState(
      4, 2, hostMassEarth, hostRadiusEarth, 12, false,
      physical.massEarth, physical.radiusEarth,
      axisPlanetRadii, axisKm, 0.02, periodDays,
      synchronousRadius, 0.6, 0.4, MoonTidalRegime.MODERATE,
      0.8, MoonTidalLockingRegime.SYNCHRONIZED, periodDays * 24,
      moonTidalMigrationRegimeV1(false, axisPlanetRadii, synchronousRadius),
    );
    const actual = MoonInternalWaterEngine.assess(physical, tidal, 100, 0.75, 0.83);
    expect(actual.iceShellThermalRegime).toBe('CONDITIONAL_ICE_OCEAN');
    const r = assess({ ...moon, internalWaterAssessment: actual });
    expect(r.diagnostics?.geometry).toBe('ADMISSIBLE_WITHIN_C_BOUNDS');
    expect(r.diagnostics?.conditionalShellMinimumKilometers)
      .toBeCloseTo(actual.conductiveShellThicknessMinimumKilometers!, 9);
    expect(c(r.assessment, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    expect(r.diagnostics?.oceanConfirmed).toBe(false);
  });
  it('supports thousands of repeatable read-only projections without cache state', () => {
    const p = previous();
    for (let i = 0; i < 512; i++) {
      const r = assess(moon, ctx, p);
      expect(r.diagnostics?.oceanConfirmed).toBe(false);
      expect(c(r.assessment, 'RESERVOIR_GEOMETRY').verdict).toBe('SUPPORTS');
    }
  });
});
