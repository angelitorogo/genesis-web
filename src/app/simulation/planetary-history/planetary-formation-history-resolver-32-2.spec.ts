import { describe, expect, it } from 'vitest';
import type { Planet } from '../../domain/planetary/planet';
import type { PlanetaryFormationHistoryInput32_2 } from '../../domain/planetary-history/planetary-formation-history-32-2';
import { PlanetaryFormationHistoryResolver32_2 as Resolver } from './planetary-formation-history-resolver-32-2';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

type Subject = PlanetaryFormationHistoryInput32_2;
function fixture(multiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE' = 'SINGLE'): Subject {
  const locator = { galaxyIndex: 0n, sectorKey: -12n,
    galacticObjectIndex: 3n, bodyIndex: 1n };
  const anchor = { anchorOrdinal: 2, sourceFormationOrdinals: [4, 5] };
  const blueprint = { formationCompletionAgeMillionYears: 6.5,
    sourceDiskDispersalAgeMillionYears: 4.2, formationAnchors: [anchor] };
  const slot = { planetOrdinal: 2, bodyLocator: locator,
    sourceAnchorOrdinals: [2], sourceFormationOrdinals: [4, 5] };
  const interior = { planetOrdinal: 2, bodyLocator: { ...locator },
    metallicCoreMassEarth: 0.25, silicateInteriorMassEarth: 0.6 };
  const hostPlanetarySystem = {
    formationBlueprint: blueprint, architecture: { planetSlots: [null, slot] },
    hostStellarSystem: { multiplicity: { name: multiplicity } },
  };
  return { planet: { hostPlanetarySystem, architectureSlot: slot,
      internalComposition: interior, planetOrdinal: 2 } as unknown as Subject['planet'],
    time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 4.6 },
  };
}
function run(input = fixture()) { return Resolver.resolve(input); }
function change(input: Subject, delta: {
  readonly blueprint?: Record<string, unknown>;
  readonly slot?: Record<string, unknown>;
  readonly interior?: Record<string, unknown>;
  readonly host?: Record<string, unknown>;
}): Subject {
  const p = input.planet;
  const bp = { ...p.hostPlanetarySystem.formationBlueprint, ...delta.blueprint };
  const slot = { ...p.architectureSlot, ...delta.slot };
  const interior = { ...p.internalComposition, ...delta.interior };
  const system = { ...p.hostPlanetarySystem,
    formationBlueprint: bp, architecture: { planetSlots: [null, slot] },
    ...delta.host,
  };
  return { ...input, planet: { ...p, hostPlanetarySystem: system,
    architectureSlot: slot, internalComposition: interior } as unknown as Subject['planet'] };
}

describe('GENESIS 32.2 — physical formation lineage -> 32.1 CT-0 chronology', () => {
  it('emits only two inferred early precursor intervals and no dated cooling or differentiation', () => {
    const r = run();
    expect(r.chronology.episodes.map(e => e.kind)).toEqual(['ACCRETION', 'FORMATION']);
    expect(r.chronology.episodes.map(e => e.time)).toEqual([
      { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: 0,
        endYear: 6_500_000, resolution: 'INFERRED_INTERVAL' },
      { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: 0,
        endYear: 6_500_000, resolution: 'INFERRED_INTERVAL' },
    ]);
    expect(r.stages.map(s => s.process)).toEqual([
      'PRECURSOR_ACCRETION', 'PRECURSOR_ASSEMBLY',
      'INTERIOR_COOLING', 'INTERIOR_DIFFERENTIATION',
    ]);
    expect(r.stages.slice(2).every(s => s.startYear === null && s.endYear === null)).toBe(true);
    expect(r.stages[3].resolution).toBe('CURRENT_INTERIOR_BUDGET_ONLY');
  });
  it('preserves inferred provenance, one fixed precursor body and causal order', () => {
    const r = run();
    expect(r.bodyKey).toBe('G0/S-12/O3/B1');
    expect(r.chronology.bodyKey).toBe(r.bodyKey);
    expect(r.chronology.episodes.every(e => e.source.evidenceKind === 'INFERRED_PHYSICAL_EPISODE'))
      .toBe(true);
    expect(r.chronology.episodes[1].causedByEpisodeIds).toEqual([
      r.chronology.episodes[0].episodeId,
    ]);
    expect(r.chronology.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(r.chronology.lifePresence).toBe('NOT_EVALUATED');
    expect(r.layer).toBe('SIMULATED_REALITY');
  });
  it('does not create a resolved event, actual impact, water reservoir or life', () => {
    const r = run();
    expect(r.sourceEpisodes.every(e => ['ACCRETION', 'FORMATION'].includes(e.kind))).toBe(true);
    expect(r.sourceEpisodes.every(e => e.time.resolution === 'INFERRED_INTERVAL')).toBe(true);
    expect(r.lifePresence).toBe('NOT_EVALUATED');
  });
  it.each(['SINGLE', 'BINARY', 'TRIPLE'] as const)(
    'uses identical physics for %s without requiring a single-star special case', (multiplicity) => {
      const r = run(fixture(multiplicity));
      expect(r.chronology.multiplicity).toBe(multiplicity);
      expect(r.sourceEpisodes.length).toBe(2);
      expect(r.sourceEpisodes[0].time.endYear).toBe(6_500_000);
    });
  it('returns no dated events when CT-0 system age is unknown', () => {
    const r = run({ ...fixture(), time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null } });
    expect(r.sourceEpisodes).toHaveLength(0);
    expect(r.stages[0].resolution).toBe('TIME_NOT_RESOLVED');
    expect(r.chronology.presentYearAfterFormation).toBe(null);
  });
  it('does not place source-completion epochs in the future or clamp them to present', () => {
    const r = run({ ...fixture(), time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: 0.003 } });
    expect(r.sourceEpisodes).toHaveLength(0);
    expect(r.stages[1].startYear).toBeNull();
  });
  it('rejects ill-formed or unsafe system ages', () => {
    for (const age of [-1, Infinity, Number.NaN, 1e30]) {
      expect(() => run({ ...fixture(), time: {
        kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: age } })).toThrow();
    }
  });
  it('rejects a mismatching mature planet ordinal', () => {
    const f = fixture();
    expect(() => run({ ...f, planet: { ...f.planet, planetOrdinal: 1 } })).toThrow();
    expect(() => run(change(f, { slot: { planetOrdinal: 1 } }))).toThrow();
    expect(() => run(change(f, { interior: { planetOrdinal: 3 } }))).toThrow();
  });
  it('rejects locator crossover between internal composition and slot', () => {
    expect(() => run(change(fixture(), { interior: { bodyLocator: {
      galaxyIndex: 0n, sectorKey: -12n, galacticObjectIndex: 3n, bodyIndex: 2n,
    } } }))).toThrow();
  });
  it('rejects formation lineages that reference a nonexistent anchor', () => {
    expect(() => run(change(fixture(), { slot: { sourceAnchorOrdinals: [8] } }))).toThrow();
  });
  it('rejects formation source ordinals that differ between 17.7 and 18.2', () => {
    expect(() => run(change(fixture(), { slot: { sourceFormationOrdinals: [4, 6] } }))).toThrow();
  });
  it('rejects duplicated source ordinals across anchors instead of double-counting accretion', () => {
    const f = fixture();
    const anchors = [...f.planet.hostPlanetarySystem.formationBlueprint.formationAnchors,
      { anchorOrdinal: 3, sourceFormationOrdinals: [5, 8] }];
    expect(() => run(change(f, { blueprint: { formationAnchors: anchors },
      slot: { sourceAnchorOrdinals: [2, 3], sourceFormationOrdinals: [4, 5, 8] } }))).toThrow();
  });
  it('rejects inverted disk completion/dispersal ages', () => {
    expect(() => run(change(fixture(), {
      blueprint: { sourceDiskDispersalAgeMillionYears: 7 },
    }))).toThrow();
  });
  it('rejects unknown multiplicity rather than using an unrelated host', () => {
    expect(() => run(change(fixture(), {
      host: { hostStellarSystem: { multiplicity: { name: 'QUADRUPLE' } } },
    }))).toThrow();
  });
  it('does not date differentiation from an interior core alone', () => {
    const r = run(change(fixture(), { interior: {
      metallicCoreMassEarth: 0.8, silicateInteriorMassEarth: 0.05,
    } }));
    expect(r.stages[3].resolution).toBe('CURRENT_INTERIOR_BUDGET_ONLY');
    expect(r.chronology.episodes.find(x => x.kind === 'DIFFERENTIATION')).toBeUndefined();
  });
  it('does not infer differentiation without sufficient present-day structure', () => {
    const r = run(change(fixture(), { interior: { metallicCoreMassEarth: 0 } }));
    expect(r.stages[3].resolution).toBe('TIME_NOT_RESOLVED');
  });
  it('does not equate formation-completion time with disk-dispersal time', () => {
    const f = change(fixture(), { blueprint: { sourceDiskDispersalAgeMillionYears: 3 } });
    expect(run(f).sourceEpisodes[0].time.endYear).toBe(6_500_000);
  });
  it('stable output does not mutate formation anchors and is deterministic', () => {
    const f = fixture();
    const before = JSON.stringify(f, (_key, v) => typeof v === 'bigint' ? v.toString() : v);
    const a = run(f), b = run(f);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(f, (_key, v) => typeof v === 'bigint' ? v.toString() : v))
      .toBe(before);
    expect(Object.isFrozen(a.sourceEpisodes)).toBe(true);
    expect(Object.isFrozen(a.chronology.episodes)).toBe(true);
  });
  it('identity separates planets from different galaxy/sector and source ordinals', () => {
    const a = run();
    const b = run(change(fixture(), { slot: { bodyLocator: {
      galaxyIndex: 0n, sectorKey: -13n, galacticObjectIndex: 3n, bodyIndex: 1n,
    } }, interior: { bodyLocator: {
      galaxyIndex: 0n, sectorKey: -13n, galacticObjectIndex: 3n, bodyIndex: 1n,
    } } }));
    expect(a.chronology.episodes[0].episodeId).not.toBe(b.chronology.episodes[0].episodeId);
  });
  it('exposes episodes suitable for 32.1 independently of the specialised result', () => {
    const r = run(), f = fixture();
    expect(PlanetaryHistoryEngine.build({
      bodyKind: 'PLANET', bodyKey: r.bodyKey, multiplicity: 'SINGLE',
      time: f.time, episodes: [...r.sourceEpisodes],
    }).episodes).toEqual(r.chronology.episodes);
  });
  it('does not create the entire universe timeline, only the supplied lineage', () => {
    const r = run();
    expect(r.chronology.coverage).toBe('SUPPLIED_EPISODES_ONLY');
    expect(r.chronology.episodes).toHaveLength(2);
  });
  it('works on repeated resolved seeds without a new random source', () => {
    const f = fixture();
    const ids = Array.from({ length: 512 }, () => run(f).chronology.episodes[0].episodeId);
    expect(new Set(ids).size).toBe(1);
  });
});
