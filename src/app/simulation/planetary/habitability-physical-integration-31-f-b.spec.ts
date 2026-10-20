import { afterEach, describe, expect, it, vi } from 'vitest';
import { BodyLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { PlanetScientificTargetResolver } from './planet-scientific-target-resolver';
import { PlanetGenerator } from './planet-generator';
import { AtmosphereGenerator } from './atmosphere-generator';
import { MoonGenerator } from './moon-generator';
import { HabitabilityPhysicalIntegration31Fb } from './habitability-physical-integration-31-f-b';
import { HabitabilityEnvironmentResolver31_2 } from '../habitability/habitability-environment-resolver-31-2';
import { HabitabilityResourcesResolver31_3 } from '../habitability/habitability-resources-resolver-31-3';
import { HabitabilityRadiationResolver31_4 } from '../habitability/habitability-radiation-resolver-31-4';
import { HabitabilityStabilityResolver31_5 } from '../habitability/habitability-stability-resolver-31-5';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1);
const locator = new BodyLocator(3n, -17n, 8n, 0n);

afterEach(() => vi.restoreAllMocks());

describe('GENESIS 31.F.b — real frozen 19/20/21 source integration', () => {
  it('calls 31.2→31.3→31.4→31.5 from the already-generated authorized scientific target without regeneration or UI leaks', () => {
    const planet = vi.spyOn(PlanetGenerator, 'generate');
    const atmosphere = vi.spyOn(AtmosphereGenerator, 'generate');
    const moons = vi.spyOn(MoonGenerator, 'generate');
    const envPlanet = vi.spyOn(HabitabilityEnvironmentResolver31_2, 'assessPlanet');
    const resPlanet = vi.spyOn(HabitabilityResourcesResolver31_3, 'assessPlanet');
    const radPlanet = vi.spyOn(HabitabilityRadiationResolver31_4, 'assessPlanet');
    const staPlanet = vi.spyOn(HabitabilityStabilityResolver31_5, 'assessPlanet');
    const envMoon = vi.spyOn(HabitabilityEnvironmentResolver31_2, 'assessMoon');
    const resMoon = vi.spyOn(HabitabilityResourcesResolver31_3, 'assessMoon');
    const radMoon = vi.spyOn(HabitabilityRadiationResolver31_4, 'assessMoon');
    const staMoon = vi.spyOn(HabitabilityStabilityResolver31_5, 'assessMoon');
    const assembler = vi.spyOn(HabitabilityPhysicalIntegration31Fb, 'assessMaterialized');

    const target = PlanetScientificTargetResolver.resolveDetailed(key, locator);
    expect(target).not.toBeNull();
    expect(planet).toHaveBeenCalledTimes(1);
    expect(atmosphere).toHaveBeenCalledTimes(1);
    expect(moons).toHaveBeenCalledTimes(1);
    expect(assembler).toHaveBeenCalledTimes(1);
    expect(assembler.mock.calls[0][0]).toBe(planet.mock.results[0].value);
    expect(assembler.mock.calls[0][1]).toBe(atmosphere.mock.results[0].value);
    expect(assembler.mock.calls[0][2]).toBe(moons.mock.results[0].value);
    for (const stage of [envPlanet, resPlanet, radPlanet, staPlanet]) {
      expect(stage).toHaveBeenCalledTimes(1);
    }
    const count = moons.mock.results[0].value.relevantMoons.length;
    for (const stage of [envMoon, resMoon, radMoon, staMoon]) {
      expect(stage).toHaveBeenCalledTimes(count);
    }

    const assembled = assembler.mock.results[0].value;
    expect(assembled.provenance).toBe('MATERIALIZED_19_20_21_CURRENT_CT0');
    expect(assembled.planet.time.systemAgeBillionYears).toBeNull();
    expect(assembled.planet.perspective).toBe('SIMULATED_REALITY');
    expect(assembled.relevantMoons).toHaveLength(count);
    expect(assembled.historicalContinuity).toBe('NOT_EVALUATED');
    expect(assembled.transientCoverage).toBe('NOT_ASSESSED');
    expect(envPlanet.mock.calls[0][0].observerAccessibleEvidence).toEqual([]);
    expect(envPlanet.mock.calls[0][1].water).toBe(atmosphere.mock.results[0].value.waterInventory);
    expect(radPlanet.mock.calls[0][2].radiation).toBe(atmosphere.mock.results[0].value.surfaceRadiationState);
    expect(staPlanet.mock.calls[0][2].orbital).toBe(planet.mock.results[0].value.hostPlanetarySystem.stabilityAssessment);
    expect(staPlanet.mock.calls[0][2].stellarHosts).toBeNull();
    expect(staPlanet.mock.calls[0][2].transients).toBeNull();

    const serialized = JSON.stringify(target!.detail);
    expect(serialized).not.toContain('MATERIALIZED_19_20_21_CURRENT_CT0');
    expect(serialized).not.toContain('SIMULATED_REALITY');
    expect(serialized).not.toContain('accessibleToObserver');
    expect(serialized).not.toContain('internalPhysical31Fb');
    expect(Object.keys(target ?? {})).toEqual(['identity', 'detail']);
  }, 60_000);

  it('preserves a 20.7 effective pressure that differs from 20.3 without mixing incompatible columns', () => {
    const env = vi.spyOn(HabitabilityEnvironmentResolver31_2, 'assessPlanet');
    const res = vi.spyOn(HabitabilityResourcesResolver31_3, 'assessPlanet');
    const computed = vi.spyOn(HabitabilityPhysicalIntegration31Fb, 'assessMaterialized');
    const target = PlanetScientificTargetResolver.resolveDetailed(key,
      new BodyLocator(3n, -17n, 8n, 1n));
    expect(target).not.toBeNull();
    expect(computed.mock.results[0].value.effectiveWaterColumnAlignment)
      .toBe('DIFFERENT_FROM_20_3');
    expect(env.mock.calls[0][1].water).not.toBeNull();
    expect(env.mock.calls[0][1].atmosphere).toBeNull();
    expect(res.mock.calls[0][2].atmosphere).toBeNull();
    expect(env.mock.calls[0][0].observerAccessibleEvidence).toEqual([]);
  }, 60_000);

  it('evaluates actual relevant moons without materializing unknown minor moons', () => {
    const physical = vi.spyOn(HabitabilityPhysicalIntegration31Fb, 'assessMaterialized');
    const environmentMoon = vi.spyOn(HabitabilityEnvironmentResolver31_2, 'assessMoon');
    const resourcesMoon = vi.spyOn(HabitabilityResourcesResolver31_3, 'assessMoon');
    const radiationMoon = vi.spyOn(HabitabilityRadiationResolver31_4, 'assessMoon');
    const stabilityMoon = vi.spyOn(HabitabilityStabilityResolver31_5, 'assessMoon');
    const target = PlanetScientificTargetResolver.resolveDetailed(key,
      new BodyLocator(3n, -17n, 8n, 6n));
    expect(target).not.toBeNull();
    const count = target!.detail.moons.relevantMoonCount;
    expect(count).toBeGreaterThan(0);
    expect(physical.mock.results[0].value.relevantMoons).toHaveLength(count);
    for (const stage of [environmentMoon, resourcesMoon, radiationMoon, stabilityMoon]) {
      expect(stage).toHaveBeenCalledTimes(count);
    }
    const snapshot = physical.mock.results[0].value;
    expect(snapshot.relevantMoons.every((moon: { assessment: { bodyKind: string; perspective: string } }) =>
      moon.assessment.bodyKind === 'MOON' && moon.assessment.perspective === 'SIMULATED_REALITY'))
      .toBe(true);
    expect(JSON.stringify(target!.detail)).not.toContain('MATERIALIZED_19_20_21_CURRENT_CT0');
  }, 60_000);

  it('is deterministic using identical REAL materialized source objects and rejects foreign sources', () => {
    const targetPlanet = vi.spyOn(PlanetGenerator, 'generate');
    const targetAtmosphere = vi.spyOn(AtmosphereGenerator, 'generate');
    const targetMoons = vi.spyOn(MoonGenerator, 'generate');
    PlanetScientificTargetResolver.resolveDetailed(key, locator);
    const p = targetPlanet.mock.results[0].value;
    const a = targetAtmosphere.mock.results[0].value;
    const m = targetMoons.mock.results[0].value;
    const first = HabitabilityPhysicalIntegration31Fb.assessMaterialized(p, a, m);
    const second = HabitabilityPhysicalIntegration31Fb.assessMaterialized(p, a, m);
    expect(second).toEqual(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.relevantMoons)).toBe(true);
    const foreign = { ...a, hostPlanet: {} } as typeof a;
    expect(() => HabitabilityPhysicalIntegration31Fb.assessMaterialized(p, foreign, m)).toThrow(/same physical planet/);
  }, 60_000);
});
