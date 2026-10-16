import { describe, expect, it } from 'vitest';
import type { HabitabilityRoute, HabitabilityScenarioAssessment } from '../../domain/habitability/habitability-scenario';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { HabitabilityEnvironmentResolver31_2, type HabitabilityEnvironmentContext31_2 } from './habitability-environment-resolver-31-2';
import { HabitabilityResourcesResolver31_3, type PlanetResourceSources31_3 } from './habitability-resources-resolver-31-3';

const context: HabitabilityEnvironmentContext31_2 = {
  bodyKey: 'G0/S-stable/O0/B2', multiplicity: 'SINGLE', perspective: 'SIMULATED_REALITY',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 2.4 },
  observerAccessibleEvidence: [],
};
const water = {
  planetOrdinal: 3,
  sourceRetainedSurfacePressurePascal: 89_516.64,
  sourceRetainedAtmosphericWaterVaporMoleFraction01: 0.148,
  sourceMeanSurfaceTemperatureKelvin: 327.48,
  sourceMinimumSurfaceTemperatureKelvin: 302.06,
  sourceMaximumSurfaceTemperatureKelvin: 352.91,
  surfaceLiquidWaterCoverageFraction01: 0.184,
  waterInventoryIndex01: 0.23404,
  hasPersistentSurfaceLiquidWater: true,
};
const gases = [
  { gas: AtmosphereGas.HYDROGEN, moleFraction01: 0.012 },
  { gas: AtmosphereGas.CARBON_DIOXIDE, moleFraction01: 0.258 },
  { gas: AtmosphereGas.WATER_VAPOR, moleFraction01: 0.148 },
  { gas: AtmosphereGas.NITROGEN, moleFraction01: 0.582 },
];
const base: PlanetResourceSources31_3 = {
  physical: { planetOrdinal: 3, surfaceGravityEarth: 1.237 },
  atmosphere: { planetOrdinal: 3, retainedSurfacePressurePascal: 89_516.64,
    retainedGasComponents: gases },
  climate: { planetOrdinal: 3, absorbedStellarFluxFactor: 0.88,
    sourceReferenceMeanInsolationEarth: 1.012 },
  variability: { planetOrdinal: 3, diurnalTemperatureRangeKelvin: 47.61 },
  geology: { planetOrdinal: 3, internalHeatRetentionIndex01: 0.824,
    tidalHeatingIndex01: 0.01 },
  composition: { planetOrdinal: 3, metallicCoreMassEarth: 0.8,
    silicateInteriorMassEarth: 1.4, condensedIceMassEarth: 0.07,
    volatileRichInteriorMassEarth: 0.045 },
};
function prior(ctx = context, w = water) {
  return HabitabilityEnvironmentResolver31_2.assessPlanet(ctx, { water: w });
}
function run(src: PlanetResourceSources31_3 = base, ctx = context,
  env = prior(ctx)) {
  return HabitabilityResourcesResolver31_3.assessPlanet(ctx, env, src);
}
function constraint(a: HabitabilityScenarioAssessment, key: string,
  route: HabitabilityRoute = 'SURFACE_AQUEOUS') {
  const f = a.routes.find((r) => r.route === route)?.constraints
    .find((c) => c.constraint === key);
  if (!f) throw new Error(`Missing ${route}/${key}`);
  return f;
}

describe('GENESIS 31.3 — gravity, chemistry, energy and resource gradients', () => {
  it('uses retained gas and physical gravity without an Earth-gravity preference', () => {
    for (const g of [0.03, 0.15, 1.237, 4.5, 16]) {
      const result = run({ ...base, physical: { planetOrdinal: 3, surfaceGravityEarth: g } });
      expect(constraint(result.assessment, 'GRAVITY_AND_RETENTION').verdict).toBe('SUPPORTS');
      expect(constraint(result.assessment, 'GRAVITY_AND_RETENTION').basis).toBe('PHYSICAL_MODEL');
      expect(result.diagnostics?.gravityEarth).toBe(g);
    }
  });

  it('does not equate gravitational acceleration alone with atmospheric retention', () => {
    const a = run({ physical: base.physical });
    expect(constraint(a.assessment, 'GRAVITY_AND_RETENTION').verdict).toBe('UNRESOLVED');
    expect(a.diagnostics?.retention).toBe('NOT_RESOLVED');
    const b = run({ ...base, atmosphere: { ...base.atmosphere!, retainedSurfacePressurePascal: 0 } });
    expect(constraint(b.assessment, 'GRAVITY_AND_RETENTION').verdict).toBe('UNRESOLVED');
    expect(b.diagnostics?.retention).toBe('NO_RETAINED_GAS_MODELED');
  });

  it('supports only an INFERRED redox candidate, not a completed biochemistry', () => {
    const r = run();
    expect(constraint(r.assessment, 'CHEMICAL_FEASIBILITY').verdict).toBe('SUPPORTS');
    expect(constraint(r.assessment, 'CHEMICAL_FEASIBILITY').basis).toBe('INFERRED_MODEL');
    expect(r.diagnostics?.candidateGasRedoxPair).toBe('HYDROGEN+CARBON_DIOXIDE');
    expect(r.diagnostics?.chemicalAccessibilityResolved).toBe(false);
    expect(r.diagnostics?.metabolismResolved).toBe(false);
    expect(r.assessment.routes.find((x) => x.route === 'SURFACE_AQUEOUS')?.status)
      .toBe('INSUFFICIENT_EVIDENCE');
  });

  it('does not infer redox chemistry from bulk interior materials alone', () => {
    const r = run({ composition: base.composition, physical: base.physical });
    expect(constraint(r.assessment, 'CHEMICAL_FEASIBILITY').verdict).toBe('UNRESOLVED');
    expect(r.diagnostics?.candidateGasRedoxPair).toBeNull();
  });

  it('does not infer reactants from N2/Ar/CO2 or missing species', () => {
    const r = run({ ...base, atmosphere: { ...base.atmosphere!, retainedGasComponents: [
      { gas: AtmosphereGas.NITROGEN, moleFraction01: 0.5 },
      { gas: AtmosphereGas.CARBON_DIOXIDE, moleFraction01: 0.3 },
      { gas: AtmosphereGas.ARGON, moleFraction01: 0.2 },
    ] } });
    expect(constraint(r.assessment, 'CHEMICAL_FEASIBILITY').verdict).toBe('UNRESOLVED');
  });

  it('does not establish surface chemical availability when liquid reservoir remains uncertain', () => {
    const quaelaen = { ...water, sourceRetainedSurfacePressurePascal: 938_068.03,
      sourceRetainedAtmosphericWaterVaporMoleFraction01: 0.014,
      sourceMeanSurfaceTemperatureKelvin: 410.77,
      sourceMinimumSurfaceTemperatureKelvin: 383.15,
      sourceMaximumSurfaceTemperatureKelvin: 438.6,
      surfaceLiquidWaterCoverageFraction01: 0.021,
      waterInventoryIndex01: 0.0561,
    };
    const ctx = { ...context, bodyKey: 'G0/S-Quaelaen/O0/B3' };
    const env = prior(ctx, quaelaen);
    const r = run({ ...base, atmosphere: { ...base.atmosphere!,
      retainedSurfacePressurePascal: quaelaen.sourceRetainedSurfacePressurePascal } }, ctx, env);
    expect(constraint(r.assessment, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
    expect(constraint(r.assessment, 'CHEMICAL_FEASIBILITY').verdict).toBe('UNRESOLVED');
  });

  it('interprets modeled irradiation plus day-night contrast as an inferred thermal gradient only', () => {
    const r = run();
    expect(constraint(r.assessment, 'ENERGY_GRADIENT').verdict).toBe('SUPPORTS');
    expect(constraint(r.assessment, 'ENERGY_GRADIENT').basis).toBe('INFERRED_MODEL');
    expect(r.diagnostics?.thermalContrastKelvin).toBe(47.61);
  });

  it('does not invent gradients from irradiation alone', () => {
    const r = run({ ...base, variability: null });
    expect(constraint(r.assessment, 'ENERGY_GRADIENT').verdict).toBe('UNRESOLVED');
    expect(r.diagnostics?.radiativeSourceResolved).toBe(true);
  });

  it('a zero day-night contrast or zero absorbed flux is not a proof of absent energy', () => {
    for (const src of [
      { ...base, variability: { planetOrdinal: 3, diurnalTemperatureRangeKelvin: 0 } },
      { ...base, climate: { planetOrdinal: 3, absorbedStellarFluxFactor: 0,
        sourceReferenceMeanInsolationEarth: 1 } },
    ]) {
      expect(constraint(run(src).assessment, 'ENERGY_GRADIENT').verdict).toBe('UNRESOLVED');
    }
  });

  it('tidal/geothermal proxy scores never masquerade as resolved energy flux', () => {
    const r = run({ geology: { planetOrdinal: 3, internalHeatRetentionIndex01: 1,
      tidalHeatingIndex01: 1 } });
    expect(constraint(r.assessment, 'ENERGY_GRADIENT').verdict).toBe('UNRESOLVED');
    expect(r.diagnostics?.internalEnergy).toBe('INDEX_ONLY');
  });

  it('retains all resolved 31.2 factors verbatim', () => {
    const r = run();
    const a = prior();
    for (const key of ['TEMPERATURE', 'LIQUID_RESERVOIR', 'PRESSURE_OR_CONFINEMENT']) {
      expect(constraint(r.assessment, key)).toEqual(constraint(a, key));
    }
  });

  it('does not make an alternative-solvent life claim', () => {
    const r = run();
    expect(r.assessment.routes.find((x) => x.route === 'ALTERNATIVE_CHEMISTRY')?.status)
      .toBe('MODEL_NOT_IMPLEMENTED');
    expect(JSON.stringify(r)).not.toMatch(/lifePresent|abiogenesisProbability|speciesCount|bioSignature/);
  });

  it('is deterministic, pure, does not depend on random seeds or architecture', () => {
    const stable = JSON.stringify(run());
    expect(JSON.stringify(run())).toBe(stable);
    for (const multiplicity of ['SINGLE', 'BINARY', 'TRIPLE'] as const) {
      const c = { ...context, multiplicity };
      const a = run(base, c, prior(c));
      expect(constraint(a.assessment, 'CHEMICAL_FEASIBILITY').verdict).toBe('SUPPORTS');
      expect(constraint(a.assessment, 'ENERGY_GRADIENT').verdict).toBe('SUPPORTS');
    }
  });

  it('is invariant to gas component order', () => {
    const reversed = run({ ...base, atmosphere: { ...base.atmosphere!,
      retainedGasComponents: [...gases].reverse() } });
    expect(reversed.assessment).toEqual(run().assessment);
  });

  it('never leaks ground-truth diagnostics into observed knowledge', () => {
    const observer = { ...context, perspective: 'OBSERVED_KNOWLEDGE' as const };
    const out = run(base, observer, prior(observer));
    expect(out.diagnostics).toBeNull();
    expect(constraint(out.assessment, 'GRAVITY_AND_RETENTION').verdict).toBe('UNRESOLVED');
    expect(constraint(out.assessment, 'CHEMICAL_FEASIBILITY').verdict).toBe('UNRESOLVED');
    expect(constraint(out.assessment, 'ENERGY_GRADIENT').verdict).toBe('UNRESOLVED');
    expect(constraint(out.assessment, 'LIQUID_RESERVOIR').verdict).toBe('UNRESOLVED');
  });

  it('exposes only individually authorized observational constraints', () => {
    const observer: HabitabilityEnvironmentContext31_2 = { ...context,
      perspective: 'OBSERVED_KNOWLEDGE',
      observerAccessibleEvidence: [
        { route: 'SURFACE_AQUEOUS', constraint: 'LIQUID_RESERVOIR' },
        { route: 'SURFACE_AQUEOUS', constraint: 'CHEMICAL_FEASIBILITY' },
        { route: 'SURFACE_AQUEOUS', constraint: 'GRAVITY_AND_RETENTION' },
      ],
    };
    const r = run(base, observer, prior(observer));
    expect(r.diagnostics).toBeNull();
    expect(constraint(r.assessment, 'LIQUID_RESERVOIR').verdict).toBe('SUPPORTS');
    expect(constraint(r.assessment, 'CHEMICAL_FEASIBILITY').verdict).toBe('SUPPORTS');
    expect(constraint(r.assessment, 'GRAVITY_AND_RETENTION').verdict).toBe('SUPPORTS');
    expect(constraint(r.assessment, 'ENERGY_GRADIENT').verdict).toBe('UNRESOLVED');
  });

  it('rejects mismatched planet ordinal sources instead of combining different worlds', () => {
    expect(() => run({ ...base, geology: { ...base.geology!, planetOrdinal: 4 } })).toThrow(RangeError);
  });

  it('rejects mismatched CT0 age, perspective and body', () => {
    expect(() => run(base, { ...context, bodyKey: 'another-world' }, prior())).toThrow(RangeError);
    expect(() => run(base, { ...context, perspective: 'OBSERVED_KNOWLEDGE' }, prior()))
      .toThrow(RangeError);
    expect(() => run(base, { ...context, time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 5 } },
      prior())).toThrow(RangeError);
  });

  it('rejects malformed physical inputs and duplicated retained species', () => {
    expect(() => run({ ...base, physical: { planetOrdinal: 3, surfaceGravityEarth: NaN } }))
      .toThrow(RangeError);
    expect(() => run({ ...base, atmosphere: { ...base.atmosphere!,
      retainedGasComponents: [...gases, gases[0]!] } })).toThrow(RangeError);
    expect(() => run({ ...base, geology: { ...base.geology!, tidalHeatingIndex01: 2 } }))
      .toThrow(RangeError);
  });

  it('does not promote unresolved lunar chemistry, gravity or tidal flux to facts', () => {
    const m = { ...context, bodyKey: 'G0/Moon-candidate', multiplicity: 'TRIPLE' as const };
    const moonSource = { estimatedSurfaceTemperatureKelvin: 110,
      waterRegime: MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN,
      atmosphereAssessment: null, internalWaterAssessment: {
        basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO' as const,
        tidalHeatFluxMinimumWattsPerSquareMeter: 0.02,
        tidalHeatFluxMaximumWattsPerSquareMeter: 0.6,
        conductiveShellThicknessMinimumKilometers: 4,
        conductiveShellThicknessMaximumKilometers: 90,
        iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN' as const,
        cryovolcanism: 'CONDITIONAL' as const,
        radiogenicHeatResolved: false as const, oceanConfirmed: false as const,
      } };
    const env = HabitabilityEnvironmentResolver31_2.assessMoon(m, moonSource);
    const r = HabitabilityResourcesResolver31_3.assessMoon(m, env, {
      ...moonSource, sourceMoonSurfaceGravityEarth: 0.1,
      sourceReferenceMeanInsolationEarth: 0.02,
      sourceTidalHeatingIndex01: 0.8,
      internalHeatRetentionIndex01: 0.9,
    });
    expect(r.diagnostics?.internalEnergy).toBe('BOUNDED_CONDITIONAL_TIDES');
    expect(constraint(r.assessment, 'ENERGY_GRADIENT', 'SUBSURFACE_AQUEOUS').verdict)
      .toBe('UNRESOLVED');
    expect(constraint(r.assessment, 'CHEMICAL_FEASIBILITY', 'SUBSURFACE_AQUEOUS').verdict)
      .toBe('UNRESOLVED');
    expect(constraint(r.assessment, 'GRAVITY_AND_RETENTION').verdict).toBe('UNRESOLVED');
    expect(constraint(r.assessment, 'TEMPERATURE', 'SUBSURFACE_AQUEOUS').verdict)
      .toBe('SUPPORTS');
  });

  it('integrates 31.2 and 31.3 safely using one planet-source bundle', () => {
    const r = HabitabilityResourcesResolver31_3.assessPlanetFromSources(
      context, { water }, base);
    expect(r.assessment).toEqual(run().assessment);
  });

  it('rejects a mixed planet ordinal across environmental and resource sources', () => {
    expect(() => HabitabilityResourcesResolver31_3.assessPlanetFromSources(
      context, { water: { ...water, planetOrdinal: 4 } }, base)).toThrow(RangeError);
  });

  it('rejects inconsistent 31.2/31.3 pressure rather than fabricating retention', () => {
    expect(() => HabitabilityResourcesResolver31_3.assessPlanetFromSources(
      context, { water }, { ...base, atmosphere: { ...base.atmosphere!,
        retainedSurfacePressurePascal: 900 } })).toThrow(RangeError);
  });

  it('shares an identical lunar source between phases with no new seed draw', () => {
    const a = HabitabilityResourcesResolver31_3.assessMoonFromSources(context, null);
    const b = HabitabilityResourcesResolver31_3.assessMoon(context,
      HabitabilityEnvironmentResolver31_2.assessMoon(context, null), null);
    expect(a).toEqual(b);
  });

  it('does not fabricate lunar evidence when the source is unavailable', () => {
    const env = HabitabilityEnvironmentResolver31_2.assessMoon(context, null);
    const r = HabitabilityResourcesResolver31_3.assessMoon(context, env, null);
    expect(r.diagnostics?.gravityEarth).toBeNull();
    expect(constraint(r.assessment, 'ENERGY_GRADIENT').verdict).toBe('UNRESOLVED');
  });
});
