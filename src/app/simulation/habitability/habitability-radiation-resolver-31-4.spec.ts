import { describe, expect, it } from 'vitest';
import type { HabitabilityScenarioAssessment } from '../../domain/habitability/habitability-scenario';
import { PlanetType } from '../../domain/planetary/planet-type';
import { PlanetMagnetosphereRegime } from '../../domain/planetary/planet-magnetosphere-regime';
import { PlanetSurfaceRadiationRegime } from '../../domain/planetary/planet-surface-radiation-regime';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import { HabitabilityEngine } from './habitability-engine';
import { HabitabilityRadiationResolver31_4, type PlanetRadiationSources31_4,
  type MoonRadiationSources31_4 } from './habitability-radiation-resolver-31-4';
import type { HabitabilityEnvironmentContext31_2 } from './habitability-environment-resolver-31-2';

const base: HabitabilityEnvironmentContext31_2 = {
  bodyKey: 'G0/S3104/O0/B2', multiplicity: 'SINGLE',
  perspective: 'SIMULATED_REALITY',
  time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 3.2 },
  observerAccessibleEvidence: [],
};
const radiation = {
  planetOrdinal: 3,
  sourcePlanetType: PlanetType.SUPER_EARTH,
  sourceRetainedSurfacePressurePascal: 89_516.64,
  sourceMagnetosphereRegime: PlanetMagnetosphereRegime.GLOBAL,
  sourceMagnetosphericProtectionIndex01: 0.6,
  atmosphericRadiationShieldingIndex01: 0.7,
  magneticRadiationShieldingIndex01: 0.6,
  surfaceParticleRadiationExposureIndex01: 0.12,
  surfaceElectromagneticRadiationExposureIndex01: 0.20,
  surfaceRadiationExposureIndex01: 0.22,
  radiationRegime: PlanetSurfaceRadiationRegime.LOW,
};
const sources: PlanetRadiationSources31_4 = {
  planetOrdinal: 3, retainedPressurePascal: 89_516.64, radiation,
  magnetosphere: { planetOrdinal: 3, magnetosphereRegime: PlanetMagnetosphereRegime.GLOBAL,
    magnetosphericProtectionIndex01: 0.6 },
};
type TestPlanetSources = Omit<PlanetRadiationSources31_4, 'planetOrdinal'> & {
  planetOrdinal?: number;
};
const measurement = { detected: true, sourceKey: 'observation.magneticSignal.22',
  accessibleToObserver: true as const };
function prior(ctx = base, kind: 'PLANET' | 'MOON' = 'PLANET') {
  return HabitabilityEngine.evaluate({ bodyKind: kind, bodyKey: ctx.bodyKey,
    multiplicity: ctx.multiplicity, perspective: ctx.perspective, time: ctx.time,
    evidence: [{ route: 'SURFACE_AQUEOUS', constraint: 'TEMPERATURE',
      verdict: 'SUPPORTS', basis: 'PHYSICAL_MODEL', sourceKey: 'climate.source',
      accessibleToObserver: ctx.observerAccessibleEvidence.some((x) =>
        x.route === 'SURFACE_AQUEOUS' && x.constraint === 'TEMPERATURE') }],
  });
}
function result(src: TestPlanetSources = sources, ctx = base,
  p: HabitabilityScenarioAssessment = prior(ctx)) {
  return HabitabilityRadiationResolver31_4.assessPlanet(ctx, p, { planetOrdinal: 3, ...src });
}
function radiationFactor(a: HabitabilityScenarioAssessment,
  route: 'SURFACE_AQUEOUS' | 'SUBSURFACE_AQUEOUS' = 'SURFACE_AQUEOUS') {
  return a.routes.find((r) => r.route === route)!.constraints
    .find((c) => c.constraint === 'RADIATION_EXPOSURE')!;
}
function moonSources(shell: MoonInternalWaterAssessment | null = null): MoonRadiationSources31_4 {
  return { moon: { hostPlanetOrdinal: 2, moonOrdinal: 1, atmosphereAssessment: null,
    internalWaterAssessment: shell } };
}
const shell: MoonInternalWaterAssessment = {
  basis: 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO',
  tidalHeatFluxMinimumWattsPerSquareMeter: 0.01,
  tidalHeatFluxMaximumWattsPerSquareMeter: 0.9,
  conductiveShellThicknessMinimumKilometers: 2,
  conductiveShellThicknessMaximumKilometers: 40,
  iceShellThermalRegime: 'CONDITIONAL_ICE_OCEAN',
  cryovolcanism: 'CONDITIONAL', radiogenicHeatResolved: false, oceanConfirmed: false,
};

describe('GENESIS 31.4 — comparative radiation, exposure, shielding and evidence basis', () => {
  it('recognizes a model-derived magnetic field only as INFERRED, never MEASURED', () => {
    const r = result();
    expect(r.diagnostics?.magnetosphereKnowledge).toBe('INFERRED');
    expect(r.diagnostics?.magnetosphereBasis).toBe('INFERRED_MODEL');
    expect(r.diagnostics?.magnetosphereRegime).toBe(PlanetMagnetosphereRegime.GLOBAL);
    expect(r.observedMagnetosphere).toBe(null);
  });

  it('labels explicitly instrumented magnetic fields as MEASURED', () => {
    const r = result({ ...sources, measurement });
    expect(r.diagnostics?.magnetosphereKnowledge).toBe('MEASURED');
    expect(r.diagnostics?.magnetosphereBasis).toBe('DIRECT_OBSERVATION');
  });

  it('keeps an absent modeled magnetosphere separate from missing data', () => {
    const absent: TestPlanetSources = {
      radiation: { ...radiation, sourceMagnetosphereRegime: PlanetMagnetosphereRegime.NONE,
        sourceMagnetosphericProtectionIndex01: 0, magneticRadiationShieldingIndex01: 0 },
    };
    expect(result(absent).diagnostics?.magnetosphereKnowledge).toBe('ABSENT');
    expect(result({}).diagnostics?.magnetosphereKnowledge).toBe('NOT_EVALUABLE');
  });

  it('allows measured absence without pretending there is a magnetic measurement in 20.9', () => {
    const r = result({ measurement: { ...measurement, detected: false } });
    expect(r.diagnostics?.magnetosphereKnowledge).toBe('ABSENT');
    expect(r.diagnostics?.magnetosphereBasis).toBe('DIRECT_OBSERVATION');
    expect(radiationFactor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('supports a relatively low modeled surface load only as INFERRED, not safe dose', () => {
    const r = result();
    expect(radiationFactor(r.assessment).verdict).toBe('SUPPORTS');
    expect(radiationFactor(r.assessment).basis).toBe('INFERRED_MODEL');
    expect(r.diagnostics?.biologicalDoseResolved).toBe(false);
    expect(r.assessment.routes.find((route) => route.route === 'SURFACE_AQUEOUS')!.status)
      .toBe('INSUFFICIENT_EVIDENCE');
  });

  it('distinguishes particle and electromagnetic exposure without mixing them', () => {
    const r = result();
    expect(r.diagnostics?.particleExposureIndex01).toBe(0.12);
    expect(r.diagnostics?.electromagneticExposureIndex01).toBe(0.20);
    expect(r.diagnostics?.magneticShieldingIndex01).toBe(0.6);
    expect(r.diagnostics?.atmosphericShieldingIndex01).toBe(0.7);
  });

  it('does not treat strong comparative radiation as an absolute biological exclusion', () => {
    const r = result({ radiation: { ...radiation,
      surfaceRadiationExposureIndex01: 0.9, radiationRegime: PlanetSurfaceRadiationRegime.EXTREME } });
    expect(radiationFactor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('does not use a magnetosphere alone to declare radiation tolerable', () => {
    expect(radiationFactor(result({ magnetosphere: sources.magnetosphere }).assessment).verdict)
      .toBe('UNRESOLVED');
  });

  it('does not require a magnetosphere when the modeled atmosphere dominates shielding', () => {
    const src: TestPlanetSources = {
      radiation: { ...radiation, sourceMagnetosphereRegime: PlanetMagnetosphereRegime.NONE,
        sourceMagnetosphericProtectionIndex01: 0, magneticRadiationShieldingIndex01: 0 },
    };
    const r = result(src);
    expect(r.diagnostics?.magnetosphereKnowledge).toBe('ABSENT');
    expect(radiationFactor(r.assessment).verdict).toBe('SUPPORTS');
  });

  it('does not create solid-surface exposure beneath a giant deep envelope', () => {
    const src: TestPlanetSources = { radiation: {
      ...radiation, sourcePlanetType: PlanetType.GAS_GIANT,
      sourceRetainedSurfacePressurePascal: null,
      atmosphericRadiationShieldingIndex01: null,
      magneticRadiationShieldingIndex01: null,
      surfaceParticleRadiationExposureIndex01: null,
      surfaceElectromagneticRadiationExposureIndex01: null,
      surfaceRadiationExposureIndex01: null,
      radiationRegime: PlanetSurfaceRadiationRegime.DEEP_ENVELOPE,
    } };
    expect(radiationFactor(result(src).assessment).verdict).toBe('UNRESOLVED');
    expect(result(src).diagnostics?.surfaceExposureIndex01).toBe(null);
  });

  it('requires radiation and magnetic data to belong to the same planet', () => {
    expect(() => result({ ...sources,
      magnetosphere: { ...sources.magnetosphere!, planetOrdinal: 4 } })).toThrow();
    expect(() => result({ ...sources, planetOrdinal: 1 })).toThrow();
  });

  it('refuses inconsistent magnetic models instead of silently preferring one', () => {
    expect(() => result({ ...sources,
      magnetosphere: { ...sources.magnetosphere!, magnetosphereRegime: PlanetMagnetosphereRegime.INDUCED } }))
      .toThrow();
    expect(() => result({ ...sources,
      magnetosphere: { ...sources.magnetosphere!, magnetosphericProtectionIndex01: 0.1 } }))
      .toThrow();
  });

  it('rejects discordant atmospheric pressure from 31.2/31.3', () => {
    expect(() => result({ ...sources, retainedPressurePascal: 150_000 })).toThrow();
  });

  it('rejects missing or forged radiation indices and inconsistent regime classes', () => {
    expect(() => result({ radiation: { ...radiation, surfaceRadiationExposureIndex01: 1.4 } }))
      .toThrow();
    expect(() => result({ radiation: { ...radiation, surfaceParticleRadiationExposureIndex01: null } }))
      .toThrow();
    expect(() => result({ radiation: { ...radiation, radiationRegime: PlanetSurfaceRadiationRegime.HIGH } }))
      .toThrow();
  });

  it('rejects fake magnetic protection when the magnetosphere is absent', () => {
    expect(() => result({ radiation: { ...radiation,
      sourceMagnetosphereRegime: PlanetMagnetosphereRegime.NONE } })).toThrow();
  });

  it('rejects contradictory measurement and physical magnetic-model sources', () => {
    expect(() => result({ ...sources, measurement: { ...measurement, detected: false } })).toThrow();
  });

  it('does not accept observational measurement without explicit provenance and authorization', () => {
    expect(() => result({ measurement: {
      detected: true, sourceKey: '', accessibleToObserver: true } })).toThrow();
    expect(() => result({ measurement: {
      detected: true, sourceKey: 'not.granted', accessibleToObserver: false as true } })).toThrow();
  });

  it('preserves earlier source evidence and prevents a repeated radiation overwrite', () => {
    const r = result();
    expect(r.assessment.routes[0].constraints.find((c) => c.constraint === 'TEMPERATURE')?.sourceKey)
      .toBe('climate.source');
    expect(() => result(sources, base, r.assessment)).toThrow();
  });

  it('checks CT-0, body, multiplicity and perspective consistency', () => {
    expect(() => result(sources, { ...base, bodyKey: 'other' }, prior(base))).toThrow();
    expect(() => result(sources, { ...base, multiplicity: 'TRIPLE' }, prior(base))).toThrow();
    expect(() => result(sources, { ...base, time: { ...base.time, systemAgeBillionYears: 5 } }, prior(base)))
      .toThrow();
  });

  it('does not promote hidden model outputs into OBSERVED_KNOWLEDGE', () => {
    const ctx: HabitabilityEnvironmentContext31_2 = { ...base,
      perspective: 'OBSERVED_KNOWLEDGE' };
    const r = result(sources, ctx, prior(ctx));
    expect(r.diagnostics).toBe(null);
    expect(radiationFactor(r.assessment).verdict).toBe('UNRESOLVED');
    expect(r.observedMagnetosphere).toBe(null);
  });

  it('allows observer-approved radiation evidence without disclosing raw indices or magnetic regime', () => {
    const ctx: HabitabilityEnvironmentContext31_2 = { ...base,
      perspective: 'OBSERVED_KNOWLEDGE',
      observerAccessibleEvidence: [{ route: 'SURFACE_AQUEOUS', constraint: 'RADIATION_EXPOSURE' }],
    };
    const r = result(sources, ctx, prior(ctx));
    expect(radiationFactor(r.assessment).verdict).toBe('SUPPORTS');
    expect(r.diagnostics).toBe(null);
    expect(r.observedMagnetosphere).toBe(null);
  });

  it('reveals only explicit instrumented magnetosphere status to the observer', () => {
    const ctx: HabitabilityEnvironmentContext31_2 = { ...base, perspective: 'OBSERVED_KNOWLEDGE' };
    const r = result({ ...sources, measurement }, ctx, prior(ctx));
    expect(r.observedMagnetosphere).toEqual({ knowledge: 'MEASURED', sourceKey: measurement.sourceKey });
    expect(radiationFactor(r.assessment).verdict).toBe('UNRESOLVED');
    expect(r.diagnostics).toBe(null);
  });

  it('keeps ocean-under-ice lunar radiation unresolved even with conditional ice-shell geometry', () => {
    const ctx: HabitabilityEnvironmentContext31_2 = { ...base, bodyKey: 'moon' };
    const r = HabitabilityRadiationResolver31_4.assessMoon(ctx, prior(ctx, 'MOON'), moonSources(shell));
    expect(radiationFactor(r.assessment, 'SUBSURFACE_AQUEOUS').verdict).toBe('UNRESOLVED');
    expect(radiationFactor(r.assessment).verdict).toBe('UNRESOLVED');
    expect(r.diagnostics?.subsurfaceShielding).toBe('CONDITIONAL_ICE_SHELL');
    expect(r.diagnostics?.magnetosphereKnowledge).toBe('NOT_EVALUABLE');
  });

  it('does not turn a lunar atmosphere estimate into a radiation measurement', () => {
    const ctx: HabitabilityEnvironmentContext31_2 = { ...base, bodyKey: 'moon' };
    const moon = moonSources(shell).moon!;
    const r = HabitabilityRadiationResolver31_4.assessMoon(ctx, prior(ctx, 'MOON'), {
      moon: { ...moon, atmosphereAssessment: {
        volatileInventoryIndex01: 0.5, thermalEscapeSupportIndex01: 0.5,
        replenishmentSupportIndex01: 0.5, condensationRemovalIndex01: 0.5,
        estimatedSurfacePressurePascal: 25_000, pressureBasis: 'CONDITIONAL_SCENARIO',
        species: [], irradiationReferenceEarth: 0.5,
        chargedParticleEnvironment: 'UNRESOLVED', hostMagnetosphereShielding: 'UNRESOLVED',
      } },
    });
    expect(r.diagnostics?.atmosphericShieldingIndex01).toBe(null);
    expect(radiationFactor(r.assessment).verdict).toBe('UNRESOLVED');
  });

  it('supports an explicit direct lunar magnetic observation but never invents radiation protection', () => {
    const ctx: HabitabilityEnvironmentContext31_2 = { ...base, bodyKey: 'moon' };
    const r = HabitabilityRadiationResolver31_4.assessMoon(ctx, prior(ctx, 'MOON'), {
      measurement, ...moonSources(shell),
    });
    expect(r.diagnostics?.magnetosphereKnowledge).toBe('MEASURED');
    expect(radiationFactor(r.assessment, 'SUBSURFACE_AQUEOUS').verdict).toBe('UNRESOLVED');
  });

  it('rejects invalid conditional lunar ice geometry', () => {
    const ctx: HabitabilityEnvironmentContext31_2 = { ...base, bodyKey: 'moon' };
    expect(() => HabitabilityRadiationResolver31_4.assessMoon(ctx, prior(ctx, 'MOON'),
      moonSources({ ...shell, conductiveShellThicknessMinimumKilometers: 100,
        conductiveShellThicknessMaximumKilometers: 1 }))).toThrow();
  });

  it('is deterministic, independent of identifiers and compatible with SINGLE/BINARY/TRIPLE', () => {
    for (const multiplicity of ['SINGLE', 'BINARY', 'TRIPLE'] as const) {
      const ctx: HabitabilityEnvironmentContext31_2 = { ...base, multiplicity };
      const a = result(sources, ctx, prior(ctx));
      const b = result(sources, ctx, prior(ctx));
      expect(a).toEqual(b);
      const other = { ...ctx, bodyKey: 'unrelated-other-seed' };
      const c = result(sources, other, prior(other));
      expect(radiationFactor(a.assessment)).toEqual(radiationFactor(c.assessment));
      expect(a.diagnostics).toEqual(c.diagnostics);
    }
  });
});
