import { describe, it, expect } from 'vitest';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarEvolutionEngine } from './stellar-evolution-engine';
import type { GeneratedMultipleHost } from './stellar-multihost-formation';
import {
  MULTIHOST_ACTIVATION_CONTRACT_PRE3303A2B3 as CONTRACT,
  MULTIHOST_LEGACY_BRANCH_PRE3303A2B3 as LEGACY,
  MULTIHOST_REVIEW_BRANCH_PRE3303A2B3 as PREVIEW,
} from '../../domain/stellar/stellar-multihost-activation-pre33-03a2b3';
import {
  frozenMultihostDigestPRE3303A2B3 as digest,
  StellarMultihostActivationPlannerPRE3303A2B3 as Planner,
  StellarMultihostActivationSessionPRE3303A2B3 as Session,
} from './stellar-multihost-activation-pre33-03a2b3';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
const V2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const V1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
function fixture(ages = [4, 12], n = 2, hosts: ('A' | 'B' | 'C' | 'AB')[] = ['A','AB']) {
  const entries = hosts.map((host, i) => {
    const planet = {planetOrdinal: 1, orbit: {semiMajorAxisAu: 1+i, eccentricity: .01},
      physicalProperties: {massEarth: 1+i}};
    return { host, publicLocator: {galaxyIndex: 0n, sectorKey: 12n,
      galacticObjectIndex: 2n, bodyIndex: BigInt(i)}, sourcePlanetOrdinal: 1,
      planet, atmosphere: {hostPlanet: planet}, moonSystem: {hostPlanet: planet}};
  });
  const components = Array.from({length:n}, (_, i) => ({
    label: 'ABC'[i], internalGenerationKey: V1,
    physical: {initialMassSolar: i ? .9 : 1, currentMassSolar: i ? .9 : 1,
      luminositySolar: i ? .8 : 1},
    lifetime: {ageBillionYears: ages[i], evolutionAssessment: StellarEvolutionEngine.evaluate(
      V1, new StellarEvolutionInput(i ? .9 : 1, 1, ages[i]!))},
  }));
  const mult = {parentGenerationKey: V2,
    parentLocator: {galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n},
    parentSystemSeedHex: '0123456789ABCDEF',
    components, innerOrbit: {semiMajorAxisAu: 10, eccentricity: .12},
    outerOrbit: n === 3 ? {semiMajorAxisAu: 200,eccentricity:.18} : null,
    publicPlanets: entries,
  } as unknown as GeneratedMultipleHost;
  return {mult, entries, components};
}

describe('PRE-33.03a.2b.3 — versioned activation and total dependency gate', () => {
  it('keeps V2 selected by default, even in a scientific activation session', () => {
    const {mult} = fixture(); const session = new Session();
    expect(session.resolve(mult).branch).toBe(LEGACY);
    expect(session.resolve(mult).planetSnapshots).toBe('FROZEN_V2_ONLY');
  });
  it('only activates a scientific stellar preview on an explicit version request', () => {
    const {mult} = fixture(); const session = new Session(); const plan = Planner.plan(mult);
    const view = session.activateScientificPreview(mult, plan, PREVIEW);
    expect(view.branch).toBe(PREVIEW);
    expect(view.revisedStellarComponents?.map(c=>c.revisedAgeBillionYears)).toEqual([4,4]);
    expect(view.planetSnapshots).toBe('UNAVAILABLE_IN_PREVIEW');
    expect(view.phase32History).toBe('UNAVAILABLE_IN_PREVIEW');
    expect(view.persistentWrite).toBe(false);
    expect(view.ct0OceansCertified).toBe(false);
  });
  it('can revert a preview exactly, without changing an original body', () => {
    const {mult} = fixture(); const session = new Session();
    const before = digest(mult), originalAge = mult.components[1]!.lifetime.ageBillionYears;
    session.activateScientificPreview(mult, Planner.plan(mult), PREVIEW);
    expect(session.deactivate(mult).branch).toBe(LEGACY);
    expect(digest(mult)).toBe(before);
    expect(mult.components[1]!.lifetime.ageBillionYears).toBe(originalAge);
    expect(()=>session.resolve(mult, PREVIEW)).toThrow(/NOT_ACTIVE/);
  });
  it('cannot commit any revised star to legacy persistence without atomic materialization', () => {
    const {mult} = fixture(); const session = new Session(); const plan=Planner.plan(mult);
    expect(()=>session.commitCanonicalMigration(mult,plan)).toThrow(/NOT_RELEASED/);
    expect(plan.canonicalCutover).toContain('BLOCKED');
  });
  it('exposes eight physical dependency gates and does not claim a complete reconstruction', () => {
    const p=Planner.plan(fixture().mult);
    expect(p.contractVersion).toBe(CONTRACT);
    expect(p.dependencies.length).toBe(8);
    expect(p.dependencies.filter(x=>x.status==='RECOMPUTED_PREVIEW').map(x=>x.dependency))
      .toEqual(['STELLAR_14_8_15_3']);
    expect(p.dependencies.some(x=>x.dependency==='HISTORICAL_EVENTS_32_12'&&
      x.status==='NOT_REBUILT_FOR_NEW_BRANCH')).toBe(true);
    expect(p.dependencies.some(x=>x.dependency==='REMNANTS_29_31')).toBe(true);
    expect(p.certifiedCT0Oceans).toBe(false);
  });
  it('rejects a source with V1 parent identity', () => {
    const {mult}=fixture();
    expect(()=>Planner.plan({...mult,parentGenerationKey:V1})).toThrow(/CANONICAL_V2/);
  });
  it('rejects non-matching public BodyLocator or non-contiguous ordinals', () => {
    const {mult,entries}=fixture();
    const bad={...entries[0]!, publicLocator:{...entries[0]!.publicLocator,bodyIndex:88n}};
    expect(()=>Planner.plan({...mult,publicPlanets:[bad,...entries.slice(1)]} as unknown as GeneratedMultipleHost))
      .toThrow(/FOREIGN_OR_MIXED/);
  });
  it('rejects foreign atmospheric binding even when the planet name is identical', () => {
    const {mult,entries}=fixture();
    const bad={...entries[0]!,atmosphere:{hostPlanet:{...entries[0]!.planet}}};
    expect(()=>Planner.plan({...mult,publicPlanets:[bad,...entries.slice(1)]} as unknown as GeneratedMultipleHost))
      .toThrow(/FOREIGN_OR_MIXED/);
  });
  it('rejects a foreign moon system and wrong outer orbit topology', () => {
    const {mult,entries}=fixture();
    const bad={...entries[0]!,moonSystem:{hostPlanet:{...entries[0]!.planet}}};
    expect(()=>Planner.plan({...mult,publicPlanets:[bad,...entries.slice(1)]} as unknown as GeneratedMultipleHost))
      .toThrow(/FOREIGN_OR_MIXED/);
    expect(()=>Planner.plan({...mult,outerOrbit:{semiMajorAxisAu:40,eccentricity:.1}} as unknown as GeneratedMultipleHost))
      .toThrow(/INVALID_MULTIPLE_ORBIT/);
  });
  it('rejects stale activation when frozen planets change after planning', () => {
    const {mult,entries}=fixture();const plan=Planner.plan(mult);const session=new Session();
    const newer={...entries[0]!, planet:{...entries[0]!.planet,
      physicalProperties:{massEarth:99}}};
    newer.atmosphere.hostPlanet=newer.planet;
    newer.moonSystem.hostPlanet=newer.planet;
    const altered: GeneratedMultipleHost = {...mult, publicPlanets:[newer,...entries.slice(1)]} as unknown as GeneratedMultipleHost;
    expect(()=>session.activateScientificPreview(altered,plan,PREVIEW)).toThrow(/STALE/);
  });
  it('rejects a forged ready mark on an unbuilt dependency', () => {
    const {mult}=fixture();const plan=Planner.plan(mult);
    const bad={...plan,dependencies:plan.dependencies.map(x=>x.dependency==='PLANETS_18_19'?
      {...x,status:'RECOMPUTED_PREVIEW' as const}:x)};
    expect(()=>new Session().activateScientificPreview(mult,bad,PREVIEW)).toThrow(/STALE/);
  });
  it('rejects an unknown revision as a version namespace', () => {
    const {mult}=fixture();
    expect(()=>new Session().resolve(mult,'V3' as typeof PREVIEW)).toThrow(/UNKNOWN_PHYSICAL_BRANCH/);
  });
  it('rejects phase-32 history access in stellar-only preview, even if stellar phases match', () => {
    const {mult}=fixture([4,4]);const session=new Session();
    const selected=session.activateScientificPreview(mult,Planner.plan(mult),PREVIEW);
    expect(selected.phase32History).toBe('UNAVAILABLE_IN_PREVIEW');
    expect(selected.planetSnapshots).toBe('UNAVAILABLE_IN_PREVIEW');
  });
  it('supports three components but rejects P-type planet accidentally tagged S-type', () => {
    const {mult}=fixture([4,12,1],3,['A','B','AB']);
    const p=Planner.plan(mult);
    expect(p.revisedStellarComponentCount).toBe(3);
    expect(p.originalPlanetCount).toBe(3);
    expect(p.legacyBodyKeys).toEqual(['G0/S12/O2/B0','G0/S12/O2/B1','G0/S12/O2/B2']);
    expect(p.revision.components.map(c=>c.revisedAgeBillionYears)).toEqual([4,4,4]);
  });
  it('blocks a V2 double-activation after an original physical source changes', () => {
    const {mult}=fixture(); const session=new Session();const plan=Planner.plan(mult);
    session.activateScientificPreview(mult,plan,PREVIEW);
    const shifted={...mult,components:mult.components.map((c,i)=>i===1?
      {...c,physical:{...c.physical,luminositySolar:5}}:c)} as GeneratedMultipleHost;
    expect(()=>session.resolve(shifted,PREVIEW)).toThrow(/NOT_ACTIVE/);
  });
  it('is deterministic and replays with the same science digest', () => {
    const a=Planner.plan(fixture().mult),b=Planner.plan(fixture().mult);
    expect(a.originalSnapshotDigest).toBe(b.originalSnapshotDigest);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
