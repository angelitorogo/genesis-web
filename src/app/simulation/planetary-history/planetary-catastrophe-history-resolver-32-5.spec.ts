import { describe, it, expect } from 'vitest';
import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import type { PlanetaryCatastropheHistoryInput32_5 } from '../../domain/planetary-history/planetary-catastrophe-history-32-5';
import { PlanetaryHistoryEngine } from './planetary-history-engine';
import { PlanetaryCatastropheHistoryResolver32_5 as Resolver } from './planetary-catastrophe-history-resolver-32-5';

type Input = PlanetaryCatastropheHistoryInput32_5;
const loc = { galaxyIndex: 0n, sectorKey: -25n, galacticObjectIndex: 8n, bodyIndex: 0n };
const key = 'G0/S-25/O8/B0';
const seed = { kind: 'body', normalizedValue: '3'.repeat(32) };
const time = { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: 4.3 };
function fixture(multiplicity: 'SINGLE'|'BINARY'|'TRIPLE' = 'SINGLE', deep = false): Input {
  const system = { hostStellarSystem: { multiplicity: { name: multiplicity } } };
  const planet = { hostPlanetarySystem: system, planetOrdinal: 1, locator: loc, seed,
    planetType: 'ROCKY', massEarth: 1.4, radiusEarth: 1.12, surfaceGravityEarth: 1.11,
    internalComposition: { metallicCoreMassFraction01: .32, silicateInteriorMassFraction01: .60 },
  };
  const geology = { planetOrdinal: 1, bodyLocator: loc, bodySeed: seed,
    sourcePlanetType: 'ROCKY', sourceMassEarth: 1.4, sourceRadiusEarth: 1.12,
    sourceSurfaceGravityEarth: 1.11,
    sourceMetallicCoreMassFraction01: .32, sourceSilicateInteriorMassFraction01: .60,
    sourceWaterInventoryIndex01: .4,
    sourceSurfaceLiquidWaterCoverageFraction01: deep ? null : .2,
    volcanismIndex01: deep ? null : .89,
    volatileOutgassingPotential01: deep ? null : .65,
    surfaceRenewalPotential01: deep ? null : .47,
    geologicalActivityIndex01: deep ? null : .71,
    volcanismRegime: deep ? 'DEEP_ENVELOPE' : 'EXTREME',
    geologyRegime: deep ? 'DEEP_ENVELOPE' : 'ACTIVE',
  };
  return { planet, geology, time } as unknown as Input;
}
function patch(input: Input, field: 'planet'|'geology', extra: Record<string, unknown>): Input {
  return { ...input, [field]: { ...input[field], ...extra } } as Input;
}
function prior(input: Input) {
  const episodes = [{ episodeKey: 'formation', targetBodyKind: 'PLANET' as const,
    targetBodyKey: key, kind: 'FORMATION' as const,
    time: { timeScale: 'YEARS_SINCE_SYSTEM_FORMATION' as const,
      startYear: 0, endYear: 5_000_000, resolution: 'INFERRED_INTERVAL' as const },
    source: { sourcePhase: '17.7', sourceModel: 'formation-blueprint',
      sourceRecordKey: 'precursors', evidenceKind: 'INFERRED_PHYSICAL_EPISODE' as const },
    causedByEpisodeKeys: [] }];
  const host = input.planet.hostPlanetarySystem.hostStellarSystem.multiplicity.name;
  if (host !== 'SINGLE' && host !== 'BINARY' && host !== 'TRIPLE') throw Error('fixture');
  return { bodyKey: key,
    chronology: PlanetaryHistoryEngine.build({bodyKind: 'PLANET', bodyKey: key,
      multiplicity: host, time: input.time, episodes}), sourceEpisodes: episodes,
    cryosphere: {waterInventoryIndex01: .4, liquidSurfaceCoverageFraction01: .2} };
}
function impactEvent(input: Input, id = 'A'.repeat(32), changes: Record<string,unknown> = {},
  targetKind: typeof MinorBodyApproachTargetKind.PLANET | typeof MinorBodyApproachTargetKind.MOON = MinorBodyApproachTargetKind.PLANET) {
  const eff = { impactScenarioApplicable: true, targetPlanet: input.planet, hasSolidSurface: true,
    atmosphericShockIndex01: .42, atmosphericLossPotentialIndex01: .2,
    craterDiameterKilometers: 100, hydrosphereShockIndex01: .15,
    surfaceWaterVaporizationPotentialIndex01: .16, geologicalShockIndex01: .4,
    ejectaGenerationIndex01: .3, surfaceResponseRegime: 'CRATERING',
    ...changes };
  return { eventId: id, targetPlanet: input.planet,
    targetKind,
    impactEffectsAssessment: eff, kineticEnergyJoules: 1e21,
    minorBodyProceduralId: id.slice(0,16), };
}
function withCatalog(input: Input, events: ReturnType<typeof impactEvent>[]): Input {
  return { ...input, impactHistory: {
    planetarySystem: input.planet.hostPlanetarySystem,
    historicalMinorBodyImpactEvents: events,
    minorBodyRealizations: events.map(event => ({event})),
  } as unknown as Input['impactHistory'] };
}
function run(input: Input = fixture()) {return Resolver.resolve(input);}

describe('GENESIS 32.5 — supervolcanic/impact consequences without fabricated events', () => {
  it('reports extreme present volcanism without making a dated super-eruption', () => {
    const r=run();
    expect(r.volcanism.regime).toBe('EXTREME');
    expect(r.volcanism.volcanismIndex01).toBe(.89);
    expect(r.volcanism.supervolcanicEpisode).toBe('NOT_RESOLVED');
    expect(r.chronology.episodes).toHaveLength(0);
    expect(r.volcanism.eruptedVolumeCubicKilometers).toBeNull();
  });
  it('keeps outgassing as a relative potential, not atmospheric kilograms', () => {
    const r=run();
    expect(r.volcanism.outgassingPotential01).toBe(.65);
    expect(r.volcanism.volcanicAtmosphericMassDeltaKilograms).toBeNull();
  });
  it('does not invent volcanic radiative forcing, temperature or ash veil', () => {
    const r=run();
    expect(r.volcanism.volcanicRadiativeForcingWattsPerSquareMeter).toBeNull();
    expect(r.undatedProcesses).toHaveLength(3);
    expect(r.undatedProcesses.every(p => p.status==='EPOCH_AND_MAGNITUDE_NOT_RESOLVED')).toBe(true);
  });
  it('distinguishes missing realized history from a supplied empty catalogue', () => {
    expect(run().impactCoverage).toBe('SOURCE_NOT_SUPPLIED');
    expect(run(withCatalog(fixture(), [])).impactCoverage).toBe('SUPPLIED_EVENTS_ONLY');
    expect(run(withCatalog(fixture(), [])).realizedImpactEffects).toHaveLength(0);
  });
  it('does not turn volcanism index or missing historical records into dated episodes', () => {
    const r=run();
    expect(r.chronology.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(r.lifePresence).toBe('NOT_EVALUATED');
    expect(r.historicalCompleteness).toBe('NOT_ESTABLISHED');
  });
  it('does not claim a solid crust on a deep envelope', () => {
    const r=run(fixture('SINGLE', true));
    expect(r.volcanism.volcanismIndex01).toBeNull();
    expect(r.volcanism.regime).toBe('DEEP_ENVELOPE');
  });
  it('rejects geology from another planet or procedural seed', () => {
    const f=fixture();
    expect(() =>run(patch(f,'geology',{bodySeed:{...seed,normalizedValue:'B'.repeat(32)}}))).toThrow();
    expect(() =>run(patch(f,'geology',{planetOrdinal:2}))).toThrow();
    expect(() =>run(patch(f,'geology',{bodyLocator:{...loc,sectorKey:13n}}))).toThrow();
  });
  it('rejects mismatched interior, type, gravity or mass', () => {
    const f=fixture();
    for(const changes of [{sourceMassEarth:2},{sourceRadiusEarth:5},
      {sourceSurfaceGravityEarth:5},{sourceMetallicCoreMassFraction01:.99},
      {sourcePlanetType:'GAS'}]) {
      expect(() =>run(patch(f,'geology',changes))).toThrow();
    }
  });
  it('rejects missing hosts and invalid multiplicity', () => {
    const f=fixture();
    expect(() =>run(patch(f,'planet',{hostPlanetarySystem: {hostStellarSystem:{multiplicity:{name:'QUADRUPLE'}}}}))).toThrow();
  });
  it.each(['SINGLE','BINARY','TRIPLE'] as const)('preserves physical rules under %s', (m) => {
    const result=run(fixture(m));
    expect(result.volcanism.volcanismIndex01).toBe(.89);
    expect(result.chronology.multiplicity).toBe(m);
  });
  it('rejects invalid normalized volcanic indicators', () => {
    const f=fixture();
    for(const v of [-.1,1.1,Number.NaN,Infinity])
      expect(() =>run(patch(f,'geology',{volcanismIndex01:v}))).toThrow();
  });
  it('rejects spurious solid volcanism on deep envelopes', () => {
    const f=fixture('SINGLE',true);
    expect(() =>run(patch(f,'geology',{volcanismIndex01:.8}))).toThrow();
  });
  it('consumes actual 23.13 realized history and 23.10 effects without new physics', () => {
    const f=fixture(); const e=impactEvent(f);
    const r=run(withCatalog(f,[e]));
    expect(r.realizedImpactEffects).toHaveLength(1);
    expect(r.realizedImpactEffects[0].atmosphericLossPotentialIndex01).toBe(.2);
    expect(r.realizedImpactEffects[0].ejectaGenerationIndex01).toBe(.3);
    expect(r.realizedImpactEffects[0].kineticEnergyJoules).toBe(1e21);
    expect(r.realizedImpactEffects[0].radiativeForcingWattsPerSquareMeter).toBeNull();
    expect(r.realizedImpactEffects[0].atmosphericMassLossKilograms).toBeNull();
    expect(r.realizedImpactEffects[0].historicalDating).toBe('DEFERRED_TO_32_8');
    expect(r.chronology.episodes).toHaveLength(0);
  });
  it('does not attribute a lunar impact to planetary surface', () => {
    const f=fixture(); const e=impactEvent(f, 'A'.repeat(32), {}, MinorBodyApproachTargetKind.MOON);
    expect(run(withCatalog(f,[e])).realizedImpactEffects).toHaveLength(0);
  });
  it('does not attribute an impact to another planet', () => {
    const f=fixture(); const other=patch(f,'planet',{planetOrdinal:2}).planet;
    const e={...impactEvent(f), targetPlanet: other};
    expect(run(withCatalog(f,[e])).realizedImpactEffects).toHaveLength(0);
  });
  it('rejects claimed realized events absent from the actual realization list', () => {
    const f=fixture(); const e=impactEvent(f);
    const input=withCatalog(f,[e]);
    expect(() =>run({...input,impactHistory:{...input.impactHistory!,minorBodyRealizations:[]}})).toThrow();
  });
  it('rejects duplicates and foreign catalogues', () => {
    const f=fixture(); const e=impactEvent(f);
    expect(() =>run(withCatalog(f,[e,e]))).toThrow();
    const input=withCatalog(f,[e]);
    expect(() =>run({...input,impactHistory:{...input.impactHistory!,planetarySystem:{} as Input['planet']['hostPlanetarySystem']}})).toThrow();
  });
  it('rejects inconsistent impact response and target physics', () => {
    const f=fixture();
    for (const changes of [{ atmosphericShockIndex01:1.9 },
      { impactScenarioApplicable:false },{ targetPlanet:{} },
      { craterDiameterKilometers:null },{ hasSolidSurface:false },
      { hydrosphereShockIndex01:null }]) {
      expect(() =>run(withCatalog(f,[impactEvent(f,'B'.repeat(32),changes)]))).toThrow();
    }
  });
  it('rejects planet craters invented for a deep-envelope world', () => {
    const f=fixture('TRIPLE',true);
    expect(() =>run(withCatalog(f,[impactEvent(f)]))).toThrow();
  });
  it('requires the same body/epoch/physical water state as 32.4', () => {
    const f=fixture(); const previous=prior(f);
    const r=run({...f,precedingGlaciation:previous as unknown as Input['precedingGlaciation']});
    expect(r.sourceEpisodes).toHaveLength(1);
    expect(r.chronology.episodes[0].episodeKey).toBe('formation');
    expect(() =>run({...f,precedingGlaciation:{...previous,bodyKey:'foreign'} as unknown as Input['precedingGlaciation']})).toThrow();
    expect(() =>run({...f,precedingGlaciation:{...previous,cryosphere:{...previous.cryosphere,waterInventoryIndex01:.6}} as unknown as Input['precedingGlaciation']})).toThrow();
    expect(() =>run({...f,precedingGlaciation:{...previous,chronology:{...previous.chronology,episodes:[]}} as unknown as Input['precedingGlaciation']})).toThrow();
  });
  it('does not mutate source states or return writable result arrays', () => {
    const f=fixture(); const impact=impactEvent(f); const before=structuredClone(f.geology);
    const out=run(withCatalog(f,[impact]));
    expect(f.geology).toEqual(before);
    expect(Object.isFrozen(out.realizedImpactEffects)).toBe(true);
    expect(Object.isFrozen(out.volcanism)).toBe(true);
    expect(Object.isFrozen(out.chronology.episodes)).toBe(true);
  });
  it('is deterministic and independent of impact input order', () => {
    const f=fixture();const a=impactEvent(f,'A'.repeat(32)); const b=impactEvent(f,'B'.repeat(32));
    const ab=run(withCatalog(f,[a,b]));const ba=run(withCatalog(f,[b,a]));
    expect(ab).toEqual(ba);
    expect(ab.realizedImpactEffects.map(e=>e.sourceEventId)).toEqual([a.eventId,b.eventId]);
  });
  it('handles 512 repeated projections without stochastic side effects', () => {
    const f=fixture(); const input=withCatalog(f,[impactEvent(f)]);
    const reference=run(input);
    for(let k=0;k<512;k++) expect(run(input)).toEqual(reference);
  });
});
