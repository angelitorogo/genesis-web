import { describe, it, expect } from 'vitest';
import type { PlanetaryGlaciationHistoryInput32_4 } from '../../domain/planetary-history/planetary-glaciation-history-32-4';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import { PlanetaryGlaciationHistoryResolver32_4 as Resolver } from './planetary-glaciation-history-resolver-32-4';

type Input = PlanetaryGlaciationHistoryInput32_4;
const loc = { galaxyIndex: 0n, sectorKey: -21n, galacticObjectIndex: 2n, bodyIndex: 0n };
const seed = { kind: 'body', normalizedValue: 'A'.repeat(32) };
const key = 'G0/S-21/O2/B0';
const time = { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.5 };

function fixture(multiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE' = 'SINGLE'): Input {
  const identity = { planetOrdinal: 1, bodyLocator: loc, bodySeed: seed };
  return {
    time,
    atmosphere: {
      hostPlanet: { planetOrdinal: 1, locator: loc, seed,
        hostPlanetarySystem: { hostStellarSystem: { multiplicity: { name: multiplicity } } } },
      climateState: { ...identity, sourceReferenceMeanInsolationEarth: 1.01,
        equilibriumTemperatureKelvin: 264, meanSurfaceTemperatureKelvin: 273 },
      climateVariabilityState: { ...identity, sourceEquilibriumTemperatureKelvin: 264,
        sourceMeanSurfaceTemperatureKelvin: 273, minimumSurfaceTemperatureKelvin: 257,
        maximumSurfaceTemperatureKelvin: 287, stabilityIndex01: 0.75 },
      waterInventory: { ...identity, sourceMeanSurfaceTemperatureKelvin: 273,
        sourceMinimumSurfaceTemperatureKelvin: 257, sourceMaximumSurfaceTemperatureKelvin: 287,
        sourceClimateStabilityIndex01: 0.75, sourceRetainedSurfacePressurePascal: 88000,
        waterInventoryIndex01: 0.67, phaseRegime: 'ICE_AND_LIQUID',
        iceFraction01: 0.55, liquidFraction01: 0.4, vaporFraction01: 0.05,
        surfaceIceCoverageFraction01: 0.46, surfaceLiquidWaterCoverageFraction01: 0.2,
        hasPersistentSurfaceLiquidWater: true },
    } as unknown as Input['atmosphere'],
  };
}
function mutate(f: Input, key: keyof Input['atmosphere'], changes: Record<string, unknown>): Input {
  return { ...f, atmosphere: { ...f.atmosphere,
    [key]: { ...f.atmosphere[key], ...changes },
  } as unknown as Input['atmosphere'] };
}
function run(f: Input = fixture()) { return Resolver.resolve(f); }
function water(f: Input, changes: Record<string, unknown>) { return mutate(f, 'waterInventory', changes); }

function preceding(f: Input) {
  const episodes = [{ episodeKey: 'formation', targetBodyKind: 'PLANET' as const,
    targetBodyKey: key, kind: 'FORMATION' as const,
    time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
      startYear: 0, endYear: 8000000, resolution: 'INFERRED_INTERVAL' as const },
    source: { sourcePhase: '17.7', sourceModel: 'protoplanetary-blueprint',
      sourceRecordKey: 'precursor', evidenceKind: 'INFERRED_PHYSICAL_EPISODE' as const },
    causedByEpisodeKeys: [] }];
  const host = f.atmosphere.hostPlanet.hostPlanetarySystem.hostStellarSystem.multiplicity.name;
  if (host !== 'SINGLE' && host !== 'BINARY' && host !== 'TRIPLE') throw Error('fixture');
  const chronology = PlanetaryHistoryEngine.build({ bodyKind: 'PLANET', bodyKey: key,
    multiplicity: host, time: f.time, episodes });
  const w = f.atmosphere.waterInventory;
  return { bodyKey: key, chronology, sourceEpisodes: episodes,
    water: { inventoryIndex01: w.waterInventoryIndex01, phaseRegime: w.phaseRegime,
      sourceModel: 'PLANET_WATER_20_7' as const,
      interpretation: 'CURRENT_PHASE_PARTITION_NOT_HISTORICAL_MASS' as const,
      iceFraction01: w.iceFraction01, liquidFraction01: w.liquidFraction01,
      vaporFraction01: w.vaporFraction01,
      surfaceIceCoverageFraction01: w.surfaceIceCoverageFraction01,
      surfaceLiquidWaterCoverageFraction01: w.surfaceLiquidWaterCoverageFraction01,
      surfaceLiquidPersistenceModelled: w.hasPersistentSurfaceLiquidWater },
  };
}

describe('GENESIS 32.4 — frozen cryosphere and undated glaciation/thaw diagnostics', () => {
  it('uses physical 20.5/20.6/20.7 current states without dating glaciations', () => {
    const r = run();
    expect(r.cryosphere.currentRegime).toBe('ICE_DOMINATED_INVENTORY');
    expect(r.cryosphere.freezeThawWindow).toBe('REFERENCE_FREEZING_CROSSING_POSSIBLE');
    expect(r.cryosphere.transitionDirection).toBe('NOT_RESOLVED');
    expect(r.chronology.episodes).toHaveLength(0);
    expect(r.sourceEpisodes).toHaveLength(0);
    expect(r.processes).toHaveLength(2);
    expect(r.processes.every(p => p.temporalStatus === 'EPOCH_NOT_RESOLVED')).toBe(true);
  });
  it('never conflates water phase inventory and surface area coverage', () => {
    const s = run().cryosphere;
    expect(s.iceInventoryFraction01).toBe(0.55);
    expect(s.iceSurfaceCoverageFraction01).toBe(0.46);
    expect(s.liquidInventoryFraction01).toBe(0.4);
    expect(s.liquidSurfaceCoverageFraction01).toBe(0.2);
  });
  it('retains current insolation but does not assign historical stellar luminosity', () => {
    expect(run().cryosphere.currentMeanReferenceInsolationEarth).toBe(1.01);
    expect(run().chronology.coverage).toBe('SUPPLIED_EPISODES_ONLY');
  });
  it('allows an ice-dominated frozen present, not an inferred ice-age onset', () => {
    const f = water(fixture(), { iceFraction01: 0.94, liquidFraction01: 0,
      vaporFraction01: 0.06, surfaceIceCoverageFraction01: 0.86,
      surfaceLiquidWaterCoverageFraction01: 0, phaseRegime: 'ICE' });
    const r = run(f);
    expect(r.cryosphere.currentRegime).toBe('ICE_DOMINATED_INVENTORY');
    expect(r.cryosphere.freezeThawWindow).toBe('NOT_EVALUABLE');
    expect(r.chronology.episodes).toHaveLength(0);
  });
  it('does not invent a thaw from a predominantly liquid current world', () => {
    const f = water(fixture(), { iceFraction01: 0.1, liquidFraction01: 0.85,
      vaporFraction01: 0.05, surfaceIceCoverageFraction01: 0.03,
      surfaceLiquidWaterCoverageFraction01: 0.6 });
    expect(run(f).cryosphere.currentRegime).toBe('LIQUID_DOMINATED_INVENTORY');
    expect(run(f).cryosphere.transitionDirection).toBe('NOT_RESOLVED');
  });
  it('does not promote a warm world without ice to a thaw event', () => {
    const f = water(fixture(), { iceFraction01: 0, liquidFraction01: 0.9,
      vaporFraction01: 0.1, surfaceIceCoverageFraction01: 0 });
    expect(run(f).cryosphere.freezeThawWindow).toBe('NOT_EVALUABLE');
  });
  it('returns no water for a dry world, not a historical deglaciation', () => {
    const f = water(fixture(), { waterInventoryIndex01: 0, iceFraction01: 0,
      liquidFraction01: 0, vaporFraction01: 0,
      surfaceIceCoverageFraction01: 0, surfaceLiquidWaterCoverageFraction01: 0, phaseRegime: 'NONE',
      hasPersistentSurfaceLiquidWater: false });
    expect(run(f).cryosphere.currentRegime).toBe('NO_MODELED_ACCESSIBLE_WATER');
    expect(run(f).chronology.episodes).toHaveLength(0);
  });
  it('preserves deep-envelope semantics without inventing solid ice or local climate', () => {
    let f = fixture();
    f = mutate(f, 'climateState', { meanSurfaceTemperatureKelvin: null });
    f = mutate(f, 'climateVariabilityState', { sourceMeanSurfaceTemperatureKelvin: null,
      minimumSurfaceTemperatureKelvin: null, maximumSurfaceTemperatureKelvin: null,
      stabilityIndex01: null });
    f = water(f, { sourceMeanSurfaceTemperatureKelvin: null,
      sourceMinimumSurfaceTemperatureKelvin: null, sourceMaximumSurfaceTemperatureKelvin: null,
      sourceClimateStabilityIndex01: null, sourceRetainedSurfacePressurePascal: null,
      iceFraction01: null, liquidFraction01: null, vaporFraction01: null,
      surfaceIceCoverageFraction01: null, surfaceLiquidWaterCoverageFraction01: null,
      hasPersistentSurfaceLiquidWater: false });
    const r = run(f);
    expect(r.cryosphere.currentRegime).toBe('DEEP_ENVELOPE_NO_SOLID_SURFACE');
    expect(r.cryosphere.freezeThawWindow).toBe('NOT_EVALUABLE');
  });
  it('does not mistake extrema crossing the reference freezing point for glaciation under near-vacuum', () => {
    const f = water(fixture(), { sourceRetainedSurfacePressurePascal: 300 });
    expect(run(f).cryosphere.freezeThawWindow).toBe('NOT_EVALUABLE');
  });
  it('does not claim a freezing-point crossing when the modelled extrema do not cross', () => {
    let f = fixture();
    f = mutate(f, 'climateState', { meanSurfaceTemperatureKelvin: 300 });
    f = mutate(f, 'climateVariabilityState', { sourceMeanSurfaceTemperatureKelvin: 300,
      minimumSurfaceTemperatureKelvin: 289, maximumSurfaceTemperatureKelvin: 312 });
    f = water(f, { sourceMeanSurfaceTemperatureKelvin: 300,
      sourceMinimumSurfaceTemperatureKelvin: 289,
      sourceMaximumSurfaceTemperatureKelvin: 312 });
    expect(run(f).cryosphere.freezeThawWindow).toBe('NO_REFERENCE_CROSSING_IN_ENVELOPE');
  });
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)('has identical physical rules for %s', host => {
    const r = run(fixture(host));
    expect(r.chronology.multiplicity).toBe(host);
    expect(r.cryosphere.freezeThawWindow).toBe('REFERENCE_FREEZING_CROSSING_POSSIBLE');
  });
  it('rejects unresolved host geometry rather than fabricating irradiation', () => {
    const f = fixture();
    const a = { ...f.atmosphere.hostPlanet, hostPlanetarySystem: {
      hostStellarSystem: { multiplicity: { name: 'UNKNOWN' } } } };
    expect(() => run(mutate(f, 'hostPlanet', a))).toThrow();
  });
  it('rejects climate-to-water provenance mismatch', () => {
    expect(() => run(water(fixture(), { sourceMeanSurfaceTemperatureKelvin: 278 }))).toThrow();
    expect(() => run(water(fixture(), { sourceMinimumSurfaceTemperatureKelvin: 220 }))).toThrow();
    expect(() => run(water(fixture(), { sourceClimateStabilityIndex01: 0.45 }))).toThrow();
  });
  it('rejects unrelated body ordinal, locator and seed', () => {
    const f = fixture();
    expect(() => run(water(f, { planetOrdinal: 2 }))).toThrow();
    expect(() => run(water(f, { bodyLocator: { ...loc, sectorKey: 200n } }))).toThrow();
    expect(() => run(water(f, { bodySeed: { ...seed, normalizedValue: 'B'.repeat(32) } }))).toThrow();
  });
  it('rejects invalid phase shares and bounds', () => {
    expect(() => run(water(fixture(), { iceFraction01: 1.2 }))).toThrow();
    expect(() => run(water(fixture(), { iceFraction01: 0.8 }))).toThrow();
    expect(() => run(mutate(fixture(), 'climateState', { sourceReferenceMeanInsolationEarth: -1 }))).toThrow();
  });
  it('preserves the prior 32.3 historical episode set without adding new glaciations', () => {
    const f = fixture();
    const prior = preceding(f);
    const r = run({ ...f, precedingVolatiles: prior });
    expect(r.sourceEpisodes).toEqual(prior.sourceEpisodes);
    expect(r.chronology.episodes).toEqual(prior.chronology.episodes);
    expect(r.chronology.episodes).toHaveLength(1);
    expect(r.chronology.episodes[0].kind).toBe('FORMATION');
  });
  it('rejects a previous 32.3 water partition from a different physical state', () => {
    const f = fixture(); const prior = preceding(f);
    expect(() => run({ ...f, precedingVolatiles: {
      ...prior, water: { ...prior.water, iceFraction01: 0.8 } } })).toThrow();
  });
  it('rejects previous chronology belonging to another system age or architecture', () => {
    const f = fixture(); const prior = preceding(f);
    expect(() => run({ ...f, time: { ...time, systemAgeBillionYears: 3 },
      precedingVolatiles: prior })).toThrow();
    expect(() => run({ ...fixture('BINARY'), precedingVolatiles: prior })).toThrow();
  });
  it('permits unresolved CT-0 age without fabricating episodes', () => {
    const r = run({ ...fixture(), time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null } });
    expect(r.chronology.presentYearAfterFormation).toBe(null);
    expect(r.cryosphere.currentRegime).toBe('ICE_DOMINATED_INVENTORY');
  });
  it('is deterministic, read-only and returns immutable nested outputs', () => {
    const f = fixture();
    const before = f.atmosphere.waterInventory.iceFraction01;
    const a = run(f), b = run(f);
    expect(a).toEqual(b);
    expect(f.atmosphere.waterInventory.iceFraction01).toBe(before);
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a.cryosphere)).toBe(true);
    expect(Object.isFrozen(a.cryosphere.sourceModels)).toBe(true);
    expect(Object.isFrozen(a.processes)).toBe(true);
  });
  it('produces reproducible results for 512 consecutive projections without storing history', () => {
    const f = fixture(); const a = run(f);
    for (let i = 0; i < 512; ++i) {
      const next = run(f);
      expect(next.cryosphere).toEqual(a.cryosphere);
      expect(next.chronology.episodes).toHaveLength(0);
    }
  });
  it('remains a simulated-reality diagnostic, not an observed-history or life claim', () => {
    const r = run();
    expect(r.layer).toBe('SIMULATED_REALITY');
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(r.lifePresence).toBe('NOT_EVALUATED');
  });
});
