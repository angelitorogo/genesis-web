import { describe, expect, it } from 'vitest';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { MULTIHOST_HISTORICAL_BRIDGE_PRE3303A2B3B as TOKEN } from
  '../../domain/stellar/stellar-multihost-historical-bridge-pre33-03a2b3b';
import { StellarMultihostHistoricalBridgePRE3303A2B3B as Bridge } from
  './stellar-multihost-historical-bridge-pre33-03a2b3b';
import { StellarMultihostFormation } from './stellar-multihost-formation';
import { frozenMultihostDigestPRE3303A2B3 } from './stellar-multihost-activation-pre33-03a2b3';
const seed=UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
const key=new UniverseGenerationKey(seed,GeneratorVersion.V2);
const binary=new SystemLocator(0n,-30064771061n,0n);
const triple=new SystemLocator(1n,60129542150n,1n);
const build=(loc=binary)=>Bridge.prepareOrNull(key,loc,TOKEN)!;
describe('PRE-33.03a.2b.3b historical new-game bridge (not public V3)',()=>{
  it('requires an explicit model revision; existing V1/V2 remain untouched',()=>{
    expect(()=>Bridge.prepareOrNull(key,binary,'V2' as typeof TOKEN)).toThrow('EXPLICIT_ISOLATED');
    expect(()=>Bridge.prepareOrNull(new UniverseGenerationKey(seed,GeneratorVersion.V1),binary,TOKEN))
      .toThrow('EXPLICIT_ISOLATED');
    expect(GeneratorVersion.fromCodeOrNull(4)).toBeNull();
  });
  it('builds a genuine 32.12 source-scoped planet history without fabricated episodes',()=>{
    const v=build(), age=Math.round(v.manifest.sharedSystemAgeGyr*1e9);
    expect(v.manifest.history32_12WindowsValidated).toBe(v.manifest.planetCount);
    const history=v.readHistoryWindow(0,0,age);
    expect(history.version.physicsModelRevision).toBe(TOKEN);
    expect(history.chronology.multiplicity).toBe('BINARY');
    expect(history.chronology.bodyKey).toContain('/B0');
    expect(history.chronology.episodes.filter(e => e.kind === 'FORMATION')).toHaveLength(1);
    expect(history.chronology.episodes[0]?.source.sourcePhase).toBe('17.7');
    expect(history.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(()=>v.readHistoryWindow(v.manifest.planetCount,0,age)).toThrow('FOREIGN_PUBLIC');
    expect(()=>v.readHistoryWindow(0,age+1,age+5)).toThrow();
  });
  it('revises triple age and constructs independent public body history identities',()=>{
    const v=build(triple), age=Math.round(v.manifest.sharedSystemAgeGyr*1e9);
    expect(v.manifest.revisedComponentAgesGyr.length).toBe(3);
    expect(new Set(v.manifest.revisedComponentAgesGyr).size).toBe(1);
    expect(v.readHistoryWindow(0,0,age).chronology.multiplicity).toBe('TRIPLE');
    expect(v.readHistoryWindow(0,0,age).chronology.bodyKey)
      .not.toBe(v.readHistoryWindow(1,0,age).chronology.bodyKey);
  });
  it('reprojects physically consistent compact states, without inventing a collapse event',()=>{
    const v=build();
    expect(v.manifest.remnantProfiles.length).toBe(v.candidate.components.length);
    expect(v.manifest.remnantProfiles.every(r=>r.datedTransientReconstructed===false)).toBe(true);
    for(const r of v.manifest.remnantProfiles){
      if(r.remnantType==='NEUTRON_STAR'||r.remnantType==='STELLAR_BLACK_HOLE'){
        expect(r.status).toBe('PROJECTED_CT0_FROM_REVISED_SOURCE');
        expect(r.remnantMassSolar).toBeGreaterThan(0);
      }
    }
  });
  it('binds ONLY revision-scoped real source episodes to 32.12 interval reads',()=>{
    const bridge=build(), manifest=bridge.manifest;
    const publicKey=`${manifest.physicalNamespace}/B0`;
    const record={episodeKey:'formation-real-source-v1',targetBodyKind:'PLANET' as const,
      targetBodyKey:publicKey,kind:'FORMATION' as const,
      time:{timeScale:'YEARS_SINCE_SYSTEM_FORMATION' as const,startYear:0,endYear:0,
        resolution:'MODELLED_INSTANT' as const},
      source:{sourcePhase:'18',sourceModel:'SOURCE_BACKED_TEST_FIXTURE',
        sourceRecordKey:'physical-original-formation-record',
        evidenceKind:'RESOLVED_PHYSICAL_EVENT' as const},
      causedByEpisodeKeys:Object.freeze([])};
    const source={revision:()=>`${TOKEN}/physical-rebuild-v1`,
      readInterval:(_ctx:unknown,start:number,end:number)=>start<=0&&end>=0?[record]:[],
      readByKey:(_ctx:unknown,key:string)=>key===record.episodeKey?record:null};
    const binding={candidateDigest:bridge.manifest.legacyDigestAfter,sourceRevision:`${TOKEN}/physical-rebuild-v1`,source};
    // The correct digest binds against the fresh physical graph, NOT frozen V2.
    expect(()=>Bridge.readBoundPhysicalHistory(bridge,binding,0,0,10)).toThrow('FOREIGN_OR_STALE');
    const allowed={...binding,candidateDigest:frozenMultihostDigestPRE3303A2B3(bridge.candidate)};
    const history=Bridge.readBoundPhysicalHistory(bridge,allowed,0,0,10);
    expect(history.chronology.episodes.length).toBe(1);
    expect(history.chronology.episodes[0]!.episodeKey).toBe(record.episodeKey);
    expect(history.historicalCompleteness).toBe('NOT_ESTABLISHED');
    expect(()=>Bridge.readBoundPhysicalHistory(bridge,allowed,1,0,10))
      .toThrow();
  });
  it('preserves the existing V2 snapshot and refuses fake V3 publication',()=>{
    const old=StellarMultihostFormation.generateOrNull(key,binary)!;
    const before=frozenMultihostDigestPRE3303A2B3(old);
    const v=build();
    expect(v.manifest.legacyDigestAfter).toBe(v.manifest.legacyDigestBefore);
    expect(v.manifest.legacyDigestBefore).toBe(before);
    expect(frozenMultihostDigestPRE3303A2B3(old)).toBe(before);
    expect(v.manifest.gamePublicationAllowed).toBe(false);
    expect(v.manifest.waterCT0Certified).toBe(false);
    expect(v.manifest.dependencies.filter(d=>d.status==='UNRESOLVED_RELEASE_BLOCKER').length)
      .toBeGreaterThanOrEqual(3);
    expect(()=>Bridge.publishNewUniverse()).toThrow('PUBLIC_GENERATOR_NOT_IMPLEMENTED');
  });
});
