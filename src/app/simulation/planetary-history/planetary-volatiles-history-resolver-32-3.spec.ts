import { describe, it, expect } from 'vitest';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import type { PlanetaryVolatilesHistoryInput32_3 } from '../../domain/planetary-history/planetary-volatiles-history-32-3';
import { PlanetaryVolatilesHistoryResolver32_3 as Resolver } from './planetary-volatiles-history-resolver-32-3';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

type Input = PlanetaryVolatilesHistoryInput32_3;
const loc = { galaxyIndex: 0n, sectorKey: -21n, galacticObjectIndex: 2n, bodyIndex: 0n };
const seed = { kind: 'body', normalizedValue: 'A'.repeat(32) };
function fixture(multiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE' = 'SINGLE'): Input {
  const identity = { bodyLocator: loc, bodySeed: seed, planetOrdinal: 1 };
  const a = {
    hostPlanet: { locator: loc, seed, planetOrdinal: 1,
      hostPlanetarySystem: { hostStellarSystem: { multiplicity: { name: multiplicity } } } },
    bulkProperties: { ...identity, sourcePlanetType: 'ROCKY', surfacePressurePascal: 100000 },
    retentionState: { ...identity, sourceSurfacePressurePascal: 100000,
      retainedSurfacePressurePascal: 75000,
      retainedMoleInventoryFraction01: 0.75, lostMoleInventoryFraction01: 0.25,
      gasRetentions: [
        { gas: AtmosphereGas.NITROGEN, sourceMoleFraction01: 0.8,
          retentionFraction01: 0.875, lossFraction01: 0.125,
          retainedMoleFraction01: 0.7 / 0.75 },
        { gas: AtmosphereGas.WATER_VAPOR, sourceMoleFraction01: 0.2,
          retentionFraction01: 0.25, lossFraction01: 0.75,
          retainedMoleFraction01: 0.05 / 0.75 },
      ],
    },
    greenhouseEffect: { ...identity, condensableEquilibriumState: null,
      waterVaporEquilibriumState: {
        sourceSurfacePressurePascal: 75000,
        effectiveSurfacePressurePascal: 72500,
        sourceWaterVaporPartialPressurePascal: 5000,
        effectiveWaterVaporPartialPressurePascal: 2500,
        condensedWaterPartialPressurePascal: 2500,
      },
    },
    climateState: { ...identity, meanSurfaceTemperatureKelvin: 288 },
    waterInventory: { ...identity, sourcePlanetType: 'ROCKY',
      sourceRetainedSurfacePressurePascal: 72500, sourceMeanSurfaceTemperatureKelvin: 288,
      waterInventoryIndex01: 0.65, iceFraction01: 0.2, liquidFraction01: 0.6,
      vaporFraction01: 0.2, surfaceIceCoverageFraction01: 0.1,
      surfaceLiquidWaterCoverageFraction01: 0.35, phaseRegime: 'MIXED',
      hasPersistentSurfaceLiquidWater: true,
    },
  };
  return { atmosphere: a as unknown as Input['atmosphere'],
    time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.5 } };
}
function run(f = fixture()) { return Resolver.resolve(f); }
function change(f: Input, overrides: Record<string, Record<string, unknown>>): Input {
  const a = f.atmosphere;
  return { ...f, atmosphere: Object.fromEntries(
    ['hostPlanet', 'bulkProperties', 'retentionState', 'greenhouseEffect',
      'waterInventory', 'climateState'].map(k => [k,
        { ...a[k as keyof typeof a], ...(overrides[k] ?? {}) }]),
  ) as unknown as Input['atmosphere'] };
}
describe('GENESIS 32.3 — atmospheric and water balances from physical models', () => {
  it('returns source-weighted retained and lost inventories closing on 1', () => {
    const r = run();
    expect(r.atmosphere.retainedSourceInventoryFraction01).toBe(0.75);
    expect(r.atmosphere.lostSourceInventoryFraction01).toBe(0.25);
    expect(r.atmosphere.species.map(x => x.gas)).toEqual([
      AtmosphereGas.NITROGEN, AtmosphereGas.WATER_VAPOR,
    ]);
    expect(r.atmosphere.species[0].retainedSourceEquivalentFraction01).toBeCloseTo(0.7);
    expect(r.atmosphere.species[1].lostSourceEquivalentFraction01).toBeCloseTo(0.15);
  });
  it('distinguishes source fractions from current normalized composition', () => {
    const r = run();
    expect(r.atmosphere.species[0].sourceEquivalentFraction01).toBe(0.8);
    expect(r.atmosphere.species[0].retainedAtmosphereMoleFraction01).toBeCloseTo(0.9333333333);
    expect(r.atmosphere.interpretation).toBe('INTEGRATED_MODEL_BALANCE_NOT_DATED');
  });
  it('partitions gas and condensed vapor as a pressure equivalent, not water mass', () => {
    const r = run();
    expect(r.condensates).toHaveLength(1);
    expect(r.condensates[0].gas).toBe(AtmosphereGas.WATER_VAPOR);
    expect(r.condensates[0].sourcePartialPressurePascal).toBe(5000);
    expect(r.condensates[0].condensedEquivalentPressurePascal).toBe(2500);
  });
  it('uses effective condensed gas pressure for the 20.4 -> 20.7 water handoff', () => {
    const f = fixture();
    expect(f.atmosphere.retentionState.retainedSurfacePressurePascal).toBe(75000);
    expect(f.atmosphere.waterInventory.sourceRetainedSurfacePressurePascal).toBe(72500);
    expect(run(f).condensates[0].condensedEquivalentPressurePascal).toBe(2500);
    expect(() => run(change(f, { waterInventory: { sourceRetainedSurfacePressurePascal: 75000 } })))
      .toThrow();
  });
  it('keeps water index, phase fractions and surface coverage separate', () => {
    const r = run();
    expect(r.water.inventoryIndex01).toBe(0.65);
    expect(r.water.liquidFraction01).toBe(0.6);
    expect(r.water.surfaceLiquidWaterCoverageFraction01).toBe(0.35);
    expect(r.water.interpretation).toBe('CURRENT_PHASE_PARTITION_NOT_HISTORICAL_MASS');
  });
  it('does not create dated atmospheric transitions or ocean-formation episodes', () => {
    const r = run();
    expect(r.sourceEpisodes).toHaveLength(0);
    expect(r.chronology.episodes).toHaveLength(0);
    expect(r.processes).toHaveLength(5);
    expect(r.processes.every(p => p.temporalStatus === 'EPOCH_NOT_RESOLVED')).toBe(true);
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(r.lifePresence).toBe('NOT_EVALUATED');
  });
  it('does not confuse atmosphere formation with the 20.2 pressure prior', () => {
    expect(run().processes.find(p => p.process === 'ATMOSPHERE_FORMATION')?.evidence)
      .toBe('NOT_RESOLVED');
  });
  it('cannot promote expected minor-body delivery to historical water delivery', () => {
    expect(run().processes.find(p => p.process === 'WATER_DELIVERY_OR_LOSS')?.evidence)
      .toBe('NOT_RESOLVED');
  });
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    'does not alter atmospheric physics for a %s host', multiplicity => {
      const r = run(fixture(multiplicity));
      expect(r.chronology.multiplicity).toBe(multiplicity);
      expect(r.atmosphere.lostSourceInventoryFraction01).toBe(0.25);
    });
  it('is independent of CT-0 age for contemporary balances', () => {
    const f = fixture();
    const r = run({ ...f, time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null } });
    expect(r.chronology.presentYearAfterFormation).toBe(null);
    expect(r.atmosphere.species).toEqual(run(f).atmosphere.species);
  });
  it('preserves earlier 32.2 dated episodes when sources are supplied', () => {
    const f = fixture();
    const bodyKey = 'G0/S-21/O2/B0';
    const episodes = [{ episodeKey: 'formation', targetBodyKind: 'PLANET' as const,
      targetBodyKey: bodyKey, kind: 'FORMATION' as const,
      time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
        startYear: 0, endYear: 7000000, resolution: 'INFERRED_INTERVAL' as const },
      source: { sourcePhase: '17.7', sourceModel: 'blueprint',
        sourceRecordKey: 'precursor', evidenceKind: 'INFERRED_PHYSICAL_EPISODE' as const },
      causedByEpisodeKeys: [] }];
    const chronology = PlanetaryHistoryEngine.build({ bodyKind: 'PLANET', bodyKey,
      multiplicity: 'SINGLE', time: f.time, episodes });
    const r = run({ ...f, precedingFormation: { bodyKey, sourceEpisodes: episodes, chronology } });
    expect(r.chronology.episodes).toEqual(chronology.episodes);
    expect(r.chronology.episodes).toHaveLength(1);
    expect(r.atmosphere.retainedSourceInventoryFraction01).toBe(0.75);
  });
  it('rejects an inherited chronology belonging to a different planet', () => {
    const f = fixture(), bodyKey = 'G0/S-21/O2/B1';
    const chronology = PlanetaryHistoryEngine.build({ bodyKind: 'PLANET', bodyKey,
      multiplicity: 'SINGLE', time: f.time, episodes: [] });
    expect(() => run({ ...f, precedingFormation: { bodyKey,
      sourceEpisodes: [], chronology } })).toThrow();
  });
  it('rejects CT-0 mismatch when merging history', () => {
    const f = fixture(), bodyKey = 'G0/S-21/O2/B0';
    const chronology = PlanetaryHistoryEngine.build({ bodyKind: 'PLANET', bodyKey,
      multiplicity: 'SINGLE', time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 5 },
      episodes: [] });
    expect(() => run({ ...f, precedingFormation: { bodyKey,
      sourceEpisodes: [], chronology } })).toThrow();
  });
  it('rejects retention and source pressure handoff mismatch', () => {
    expect(() => run(change(fixture(), { retentionState: {
      sourceSurfacePressurePascal: 200000,
    } }))).toThrow();
  });
  it('rejects cross-body water state', () => {
    expect(() => run(change(fixture(), { waterInventory: { bodyLocator: {
      ...loc, sectorKey: -22n,
    } } }))).toThrow();
  });
  it('rejects cross-seed gas data', () => {
    expect(() => run(change(fixture(), { retentionState: {
      bodySeed: { kind: 'body', normalizedValue: 'B'.repeat(32) },
    } }))).toThrow();
  });
  it('rejects a mismatched water-source pressure or temperature', () => {
    expect(() => run(change(fixture(), { waterInventory: {
      sourceRetainedSurfacePressurePascal: 50000,
    } }))).toThrow();
    expect(() => run(change(fixture(), { waterInventory: {
      sourceMeanSurfaceTemperatureKelvin: 278,
    } }))).toThrow();
  });
  it('rejects a gas source + lost + retained fraction that does not close', () => {
    expect(() => run(change(fixture(), { retentionState: {
      retainedMoleInventoryFraction01: 0.8,
    } }))).toThrow();
  });
  it('rejects unphysical water partition and inventory', () => {
    expect(() => run(change(fixture(), { waterInventory: {
      liquidFraction01: 0.8,
    } }))).toThrow();
    expect(() => run(change(fixture(), { waterInventory: {
      waterInventoryIndex01: 1.4,
    } }))).toThrow();
  });
  it('rejects an unbalanced vapor/condensate partition', () => {
    const f = fixture();
    const s = f.atmosphere.greenhouseEffect.waterVaporEquilibriumState!;
    expect(() => run(change(f, { greenhouseEffect: {
      waterVaporEquilibriumState: { ...s, condensedWaterPartialPressurePascal: 2300 },
    } }))).toThrow();
  });
  it('rejects null phase inconsistencies', () => {
    expect(() => run(change(fixture(), { waterInventory: {
      iceFraction01: null,
    } }))).toThrow();
  });
  it('supports an empty physical vacuum without inventing an escape episode', () => {
    const f = fixture();
    const r = run(change(f, {
      bulkProperties: { surfacePressurePascal: 0 },
      retentionState: { sourceSurfacePressurePascal: 0,
        retainedSurfacePressurePascal: 0, retainedMoleInventoryFraction01: 0,
        lostMoleInventoryFraction01: 0, gasRetentions: [] },
      greenhouseEffect: { condensableEquilibriumState: null, waterVaporEquilibriumState: null },
      waterInventory: { sourceRetainedSurfacePressurePascal: 0 },
    }));
    expect(r.atmosphere.species).toHaveLength(0);
    expect(r.processes[1].evidence).toBe('NOT_RESOLVED');
    expect(r.chronology.episodes).toHaveLength(0);
  });
  it('does not invent solid-surface pressure for deep-envelope giants', () => {
    const f = fixture();
    const r = run(change(f, {
      bulkProperties: { surfacePressurePascal: null },
      retentionState: { sourceSurfacePressurePascal: null, retainedSurfacePressurePascal: null },
      greenhouseEffect: { condensableEquilibriumState: null, waterVaporEquilibriumState: null },
      waterInventory: {
        sourceRetainedSurfacePressurePascal: null,
        iceFraction01: null, liquidFraction01: null, vaporFraction01: null,
        surfaceIceCoverageFraction01: null, surfaceLiquidWaterCoverageFraction01: null,
        phaseRegime: 'DEEP_ENVELOPE',
      },
    }));
    expect(r.atmosphere.sourceSurfacePressurePascal).toBe(null);
    expect(r.water.liquidFraction01).toBe(null);
    expect(r.sourceEpisodes).toHaveLength(0);
  });
  it('uses multispecies equilibrium when supplied without double counting H2O', () => {
    const f = fixture();
    const r = run(change(f, { greenhouseEffect: {
      condensableEquilibriumState: { sourceSurfacePressurePascal: 75000,
        effectiveSurfacePressurePascal: 72500,
        speciesEquilibria: [{ gas: AtmosphereGas.WATER_VAPOR,
          sourcePartialPressurePascal: 5000,
          effectivePartialPressurePascal: 2500,
          condensedPartialPressurePascal: 2500 }] },
    } }));
    expect(r.condensates).toHaveLength(1);
  });
  it('does not mutate upstream frozen planet data', () => {
    const f = fixture();
    const a = run(f), b = run(f);
    expect(a).toEqual(b);
    expect(Object.isFrozen(a.atmosphere)).toBe(true);
    expect(Object.isFrozen(a.water)).toBe(true);
    expect(Object.isFrozen(a.processes)).toBe(true);
  });
  it('generates a constant result for repeated 512 reads without PRNG', () => {
    const f = fixture();
    const first = JSON.stringify(run(f));
    for (let i = 0; i < 512; i++) expect(JSON.stringify(run(f))).toBe(first);
  });
});
