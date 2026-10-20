import { describe, expect, it } from 'vitest';
import type { PlanetaryStellarHistoryInput32_7, StellarHistoryComponent32_7,
  StellarHistoryTransition32_7, StellarHistoryComponentLabel32_7 } from '../../domain/planetary-history/planetary-stellar-history-32-7';
import type { PlanetaryClimateGeochemistryHistoryResult32_6 } from '../../domain/planetary-history/planetary-climate-geochemistry-history-32-6';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import { PlanetaryStellarHistoryResolver32_7 as Resolver } from './planetary-stellar-history-resolver-32-7';

const GYR = 4.6;
const time = { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: GYR };
const locator = { galaxyIndex: 0n, sectorKey: 7n, galacticObjectIndex: 0n };
const bodyLocator = { ...locator, bodyIndex: 0n };
const key = 'G0/S7/O0/B0';
const values = {
  A: { state: 'MAIN_SEQUENCE', main: 10, terminal: 11 },
  B: { state: 'GIANT', main: 4, terminal: 5 },
  C: { state: 'WHITE_DWARF', main: 1, terminal: 1.2 },
} as const;

function host(label: StellarHistoryComponentLabel32_7): StellarHistoryComponent32_7 {
  const v = values[label];
  const assessment = { evolutionState: { name: v.state },
    input: { ageBillionYears: GYR }, mainSequenceLifetimeBillionYears: v.main };
  const lifetime = { ageBillionYears: GYR, terminalAgeBillionYears: v.terminal,
    evolutionAssessment: assessment } as unknown as StellarHistoryComponent32_7['lifetime'];
  return { label, lifetime };
}
function input(m: 'SINGLE' | 'BINARY' | 'TRIPLE' = 'SINGLE'): PlanetaryStellarHistoryInput32_7 {
  const components = (m === 'SINGLE' ? ['A'] : m === 'BINARY' ? ['A', 'B'] : ['A', 'B', 'C'])
    .map(x => host(x as StellarHistoryComponentLabel32_7));
  const by = Object.fromEntries(components.map(x => [x.label, x]));
  const system = {
    locator, multiplicity: { name: m }, primaryStar: { evolutionState: { name: 'MAIN_SEQUENCE' } },
    secondaryCompanion: by['B'] ? { componentLabel: { name: 'B' },
      currentEvolutionState: { name: 'GIANT' }, lifetimeProfile: by['B'].lifetime } : null,
    tertiaryCompanion: by['C'] ? { componentLabel: { name: 'C' },
      currentEvolutionState: { name: 'WHITE_DWARF' }, lifetimeProfile: by['C'].lifetime } : null,
  };
  const slot = { bodyLocator, planetOrdinal: 1 };
  const planet = { hostPlanetarySystem: { hostStellarSystem: system,
    architecture: { planetSlots: [slot] } }, architectureSlot: slot, planetOrdinal: 1 };
  return { planet: planet as unknown as PlanetaryStellarHistoryInput32_7['planet'],
    time, components };
}
function transition(label: 'B' | 'C', id: string, before: 'MAIN_SEQUENCE' | 'GIANT',
  after: 'GIANT' | 'WHITE_DWARF', year: number): StellarHistoryTransition32_7 {
  return { component: label, eventKey: id, sourcePhase: '15.3/29.1',
    sourceModel: 'SOURCE_BACKED_STELLAR_LINEAGE', sourceRecordKey: `${label}-${id}`,
    evidenceKind: 'INFERRED_PHYSICAL_EPISODE', before, after,
    time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION', startYear: year,
      endYear: year + 10_000_000, resolution: 'INFERRED_INTERVAL' } };
}
function build(base: PlanetaryStellarHistoryInput32_7) { return Resolver.resolve(base); }

describe('GENESIS 32.7 — host-lineage stellar history and CT-0', () => {
  it('a SINGLE main-sequence host has no fabricated historical flare or phase event', () => {
    const r = build(input());
    expect(r.chronology.episodes).toEqual([]);
    expect(r.hosts[0].state).toBe('MAIN_SEQUENCE');
    expect(r.hosts[0].mainSequenceReferenceEndBillionYears).toBe(10);
    expect(r.hosts[0].currentActivityIsHistoricalFlareEvent).toBe(false);
    expect(r.planetaryHostCoupling).toBe('NOT_RESOLVED_FROM_LINEAGE_ALONE');
  });
  it('preserves source identity and component A/B in BINARY', () => {
    const r = build(input('BINARY'));
    expect(r.hosts.map(x => x.component)).toEqual(['A', 'B']);
    expect(r.hosts[1].state).toBe('GIANT');
    expect(r.transitions).toEqual([]);
  });
  it('keeps all A/B/C lineages separate in TRIPLE', () => {
    const r = build(input('TRIPLE'));
    expect(r.hosts.map(x => x.component)).toEqual(['A', 'B', 'C']);
    expect(r.hosts[2].state).toBe('WHITE_DWARF');
    expect(r.transientEffects).toBe('DEFERRED_TO_32_9');
  });
  it('incorporates a dated source transition into the canonical chronology', () => {
    const r = build({ ...input('BINARY'), transitions: [transition('B', 'ms-exit', 'MAIN_SEQUENCE', 'GIANT', 4_000_000_000)] });
    expect(r.chronology.episodes).toHaveLength(1);
    expect(r.chronology.episodes[0].kind).toBe('STELLAR_ENVIRONMENT_CHANGE');
    expect(r.chronology.episodes[0].time.startYear).toBe(4_000_000_000);
    expect(r.chronology.episodes[0].source.sourceRecordKey).toBe('B:B-ms-exit');
    expect(r.transitions[0].planetaryIrradiationChange).toBe('NOT_QUANTIFIED');
  });
  it('does not fabricate a supernova from an old white dwarf', () => {
    const r = build(input('TRIPLE'));
    expect(r.sourceEpisodes).toEqual([]);
    expect(r.lifePresence).toBe('NOT_EVALUATED');
  });
  it('accepts a consistent evolution lineage into a compact remnant', () => {
    const r = build({ ...input('TRIPLE'), transitions: [
      transition('C', 'ms-exit', 'MAIN_SEQUENCE', 'GIANT', 1_000_000_000),
      transition('C', 'wd-onset', 'GIANT', 'WHITE_DWARF', 1_200_000_000),
    ] });
    expect(r.chronology.episodes).toHaveLength(2);
    expect(r.transitions.map(x => x.after)).toEqual(['GIANT', 'WHITE_DWARF']);
  });
  it('does not depend on source event insertion order', () => {
    const first = transition('B', 'm', 'MAIN_SEQUENCE', 'GIANT', 4_000_000_000);
    const other = transition('C', 'x', 'MAIN_SEQUENCE', 'GIANT', 1_000_000_000);
    const last = transition('C', 'y', 'GIANT', 'WHITE_DWARF', 1_200_000_000);
    const a = build({ ...input('TRIPLE'), transitions: [first, other, last] });
    const b = build({ ...input('TRIPLE'), transitions: [last, first, other] });
    expect(a).toEqual(b);
  });
  it('leaves current flare statistics as present-day proxies', () => {
    const base = input();
    const a: StellarHistoryComponent32_7 = { ...base.components[0],
      activity: { ordinaryFlareModelApplicable: true, flareRatePerDay: 0.4,
        magneticActivityIndex: 0.8 } as StellarHistoryComponent32_7['activity'],
      rotation: { ordinaryRotationModelApplicable: true, stabilityIndex: 0.6 } as StellarHistoryComponent32_7['rotation'] };
    const r = build({ ...base, components: [a] });
    expect(r.hosts[0].flareRatePerDay).toBe(0.4);
    expect(r.hosts[0].rotationStabilityIndex01).toBe(0.6);
    expect(r.chronology.episodes).toHaveLength(0);
  });
  it('rejects unsupported ordinary flare interpretations for compact remnants', () => {
    const base = input('TRIPLE');
    const components = [...base.components];
    components[2] = { ...components[2], activity: { ordinaryFlareModelApplicable: true,
      magneticActivityIndex: 0.4 } as StellarHistoryComponent32_7['activity'] };
    expect(() => build({ ...base, components })).toThrow();
  });
  it('rejects compact remnant ordinary rotation proxies', () => {
    const base = input('TRIPLE');
    const components = [...base.components];
    components[2] = { ...components[2], rotation: { ordinaryRotationModelApplicable: true,
      stabilityIndex: 0.5 } as StellarHistoryComponent32_7['rotation'] };
    expect(() => build({ ...base, components })).toThrow();
  });
  it('rejects one missing component in TRIPLE', () => {
    const b = input('TRIPLE');
    expect(() => build({ ...b, components: b.components.slice(0, 2) })).toThrow();
  });
  it('rejects duplicated component instead of substituting another host', () => {
    const b = input('BINARY');
    expect(() => build({ ...b, components: [b.components[0], b.components[0]] })).toThrow();
  });
  it('rejects a companion lifetime belonging to another star', () => {
    const b = input('BINARY');
    expect(() => build({ ...b, components: [b.components[0], host('B')] })).toThrow();
  });
  it('rejects a planet from a different stellar system', () => {
    const b = input();
    const slot = { bodyLocator: { ...bodyLocator, sectorKey: 9n }, planetOrdinal: 1 };
    const p = { ...b.planet, architectureSlot: slot,
      hostPlanetarySystem: { ...b.planet.hostPlanetarySystem,
        architecture: { planetSlots: [slot] } } } as unknown as PlanetaryStellarHistoryInput32_7['planet'];
    expect(() => build({ ...b, planet: p })).toThrow();
  });
  it('rejects an ordinal that points to a different slot', () => {
    const b = input();
    expect(() => build({ ...b, planet: { ...b.planet, planetOrdinal: 2 } })).toThrow();
  });
  it('rejects an age inconsistent with the CT-0 epoch', () => {
    const b = input();
    expect(() => build({ ...b, time: { ...time, systemAgeBillionYears: 3 } })).toThrow();
  });
  it('rejects an unresolved CT-0 epoch before assigning stellar ages', () => {
    const b = input();
    expect(() => build({ ...b, time: { ...time, systemAgeBillionYears: null } })).toThrow();
  });
  it('rejects invented flare event before a main sequence host changes phase', () => {
    const b = input();
    expect(() => build({ ...b, transitions: [{ ...transition('B', 'x', 'MAIN_SEQUENCE', 'GIANT', 100), component: 'A' }] })).toThrow();
  });
  it('rejects a future historical stellar transition', () => {
    const b = input('BINARY');
    expect(() => build({ ...b, transitions: [transition('B', 'x', 'MAIN_SEQUENCE', 'GIANT', 5_000_000_000)] })).toThrow();
  });
  it('rejects a transition without source identity', () => {
    const b = input('BINARY');
    expect(() => build({ ...b, transitions: [{ ...transition('B', 'x', 'MAIN_SEQUENCE', 'GIANT', 4_000_000_000), sourceRecordKey: '' }] })).toThrow();
  });
  it('rejects source-reused transitions under distinct event keys', () => {
    const b = input('BINARY');
    const x = transition('B', 'x', 'MAIN_SEQUENCE', 'GIANT', 4_000_000_000);
    expect(() => build({ ...b, transitions: [x, { ...x, eventKey: 'y' }] })).toThrow();
  });
  it('rejects duplicated event identities', () => {
    const b = input('BINARY');
    const x = transition('B', 'x', 'MAIN_SEQUENCE', 'GIANT', 4_000_000_000);
    expect(() => build({ ...b, transitions: [x, x] })).toThrow();
  });
  it('rejects a chronological stellar regression', () => {
    const b = input('TRIPLE');
    expect(() => build({ ...b, transitions: [transition('C', 'bad', 'GIANT', 'GIANT', 1_500_000_000)] })).toThrow();
  });
  it('rejects an overlapping phase sequence', () => {
    const b = input('TRIPLE');
    const early = { ...transition('C', 'a', 'MAIN_SEQUENCE', 'GIANT', 1_000_000_000),
      time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const, startYear: 1_000_000_000,
        endYear: 1_400_000_000, resolution: 'INFERRED_INTERVAL' as const } };
    expect(() => build({ ...b, transitions: [early,
      transition('C', 'b', 'GIANT', 'WHITE_DWARF', 1_200_000_000)] })).toThrow();
  });
  it('rejects a claimed compact remnant phase in a still-giant star', () => {
    const b = input('BINARY');
    expect(() => build({ ...b, transitions: [transition('B', 'a', 'GIANT', 'WHITE_DWARF', 4_300_000_000)] })).toThrow();
  });
  it('rejects a time reference in lookback rather than CT-0 coordinates', () => {
    const b = input('BINARY');
    const a = transition('B', 'a', 'MAIN_SEQUENCE', 'GIANT', 4_000_000_000);
    expect(() => build({ ...b, transitions: [{ ...a, time: { ...a.time,
      timeScale: 'YEARS_BEFORE_PRESENT' as typeof a.time.timeScale } }] })).toThrow();
  });
  it('requires a model-inferred resolution for an inferred transition', () => {
    const b = input('BINARY');
    const a = transition('B', 'a', 'MAIN_SEQUENCE', 'GIANT', 4_000_000_000);
    expect(() => build({ ...b, transitions: [{ ...a,
      time: { ...a.time, resolution: 'MODELLED_INSTANT' } }] })).toThrow();
  });
  it('preserves 32.6 chronology and rejects an incompatible preceding body', () => {
    const b = input('BINARY');
    const chronology = PlanetaryHistoryEngine.build({ bodyKind: 'PLANET', bodyKey: key,
      multiplicity: 'BINARY', time, episodes: [] });
    const precedingClimate = { bodyKey: key, chronology, sourceEpisodes: [] } as unknown as PlanetaryStellarHistoryInput32_7['precedingClimate'];
    expect(build({ ...b, precedingClimate }).chronology.episodes).toEqual([]);
    expect(() => build({ ...b, precedingClimate: { ...precedingClimate!, bodyKey: 'G0/S8/O0/B0' } })).toThrow();
  });
  it('preserves an inherited early-formation causal episode', () => {
    const b = input('BINARY');
    const event = { episodeKey: 'early', targetBodyKind: 'PLANET' as const, targetBodyKey: key,
      kind: 'FORMATION' as const, time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
        startYear: 0, endYear: 10_000_000, resolution: 'INFERRED_INTERVAL' as const },
      source: { sourcePhase: '32.2', sourceModel: '17.7', sourceRecordKey: 'precursor',
        evidenceKind: 'INFERRED_PHYSICAL_EPISODE' as const }, causedByEpisodeKeys: [] };
    const chronology = PlanetaryHistoryEngine.build({ bodyKind: 'PLANET', bodyKey: key,
      multiplicity: 'BINARY', time, episodes: [event] });
    const precedingClimate = { bodyKey: key, chronology, sourceEpisodes: [event] } as unknown as PlanetaryStellarHistoryInput32_7['precedingClimate'];
    const r = build({ ...b, precedingClimate, transitions: [transition('B', 'ms', 'MAIN_SEQUENCE', 'GIANT', 4_000_000_000)] });
    expect(r.chronology.episodes.map(x => x.kind)).toEqual(['FORMATION', 'STELLAR_ENVIRONMENT_CHANGE']);
  });
  it('does not mutate source arrays', () => {
    const b = input('TRIPLE');
    const events = [transition('C', 'c', 'MAIN_SEQUENCE', 'GIANT', 1_000_000_000),
      transition('C', 'd', 'GIANT', 'WHITE_DWARF', 1_200_000_000)];
    const copy = events.map(x => x.eventKey).join(':');
    build({ ...b, transitions: events });
    expect(events.map(x => x.eventKey).join(':')).toBe(copy);
  });
  it('records a resolved flare as a stellar event with no invented planetary irradiation', () => {
    const b = input('SINGLE');
    const r = build({ ...b, resolvedActivityEvents: [{ component: 'A', eventKey: 'f1',
      kind: 'RESOLVED_STELLAR_FLARE', sourcePhase: '29.9', sourceModel: 'FLARE_EVENT_29_9',
      sourceRecordKey: 'confirmed-flare-1', time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
        startYear: 4_500_000_000, endYear: 4_500_000_000, resolution: 'MODELLED_INSTANT' } }] });
    expect(r.resolvedActivityEvents).toHaveLength(1);
    expect(r.resolvedActivityEvents[0].planetaryEnergyDeposition).toBe('NOT_RESOLVED');
    expect(r.chronology.episodes[0].source.sourceRecordKey).toBe('A:confirmed-flare-1');
  });
  it('does not turn flare statistics into a resolved event', () => {
    const b = input();
    const r = build({ ...b, resolvedActivityEvents: [] });
    expect(r.resolvedActivityEvents).toEqual([]);
  });
  it('rejects an inferred rather than resolved flare event', () => {
    const b = input();
    expect(() => build({ ...b, resolvedActivityEvents: [{ component: 'A', eventKey: 'f1',
      kind: 'RESOLVED_STELLAR_FLARE', sourcePhase: '29.9', sourceModel: 'X',
      sourceRecordKey: 'x', time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
        startYear: 4_000_000_000, endYear: 4_010_000_000, resolution: 'INFERRED_INTERVAL' } }] })).toThrow();
  });
  it('rejects a flare assigned to a missing component', () => {
    const b = input();
    expect(() => build({ ...b, resolvedActivityEvents: [{ component: 'B', eventKey: 'f1',
      kind: 'RESOLVED_STELLAR_FLARE', sourcePhase: '29.9', sourceModel: 'X',
      sourceRecordKey: 'x', time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
        startYear: 4_000_000_000, endYear: 4_000_000_000, resolution: 'MODELLED_INSTANT' } }] })).toThrow();
  });
  it('rejects a duplicated resolved flare record even if its name changes', () => {
    const b = input();
    const f = { component: 'A' as const, eventKey: 'f1', kind: 'RESOLVED_STELLAR_FLARE' as const,
      sourcePhase: '29.9', sourceModel: 'FLARES', sourceRecordKey: 'phys1',
      time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
        startYear: 4_500_000_000, endYear: 4_500_000_000, resolution: 'MODELLED_INSTANT' as const } };
    expect(() => build({ ...b, resolvedActivityEvents: [f, { ...f, eventKey: 'f2' }] })).toThrow();
  });
  it('causally links successive physical stellar phase changes', () => {
    const r = build({ ...input('TRIPLE'), transitions: [
      transition('C', 'c2', 'GIANT', 'WHITE_DWARF', 1_200_000_000),
      transition('C', 'c1', 'MAIN_SEQUENCE', 'GIANT', 1_000_000_000),
    ] });
    expect(r.chronology.episodes[1].causedByEpisodeIds).toEqual([r.chronology.episodes[0].episodeId]);
  });
  it('rejects overlapping source flare and transition event identifiers', () => {
    const b = input('BINARY');
    const e = transition('B', 'duplicate', 'MAIN_SEQUENCE', 'GIANT', 4_000_000_000);
    const a = { component: 'B' as const, eventKey: 'duplicate',
      kind: 'RESOLVED_STELLAR_FLARE' as const, sourcePhase: '29.9', sourceModel: 'FLARES',
      sourceRecordKey: 'flare', time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
        startYear: 4_500_000_000, endYear: 4_500_000_000, resolution: 'MODELLED_INSTANT' as const } };
    expect(() => build({ ...b, transitions: [e], resolvedActivityEvents: [a] })).toThrow();
  });
  it('is repeatable for 512 identically configured queries', () => {
    const b = input('TRIPLE');
    const reference = JSON.stringify(build(b));
    for (let i = 0; i < 512; i++) expect(JSON.stringify(build(b))).toBe(reference);
  });
});
