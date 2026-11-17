import 'fake-indexeddb/auto';
import {describe,expect,it} from 'vitest';
import {DiscoveryState} from '../../domain/discovery/discovery-state';
import {GenesisIndexedDb} from '../../data/local/indexed-db/genesis-indexed-db';
import {DexieVida9BiologyExplorationRepository} from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import {vida9DigestForRecord,type Vida9BiologyRecord} from '../../domain/life/vida9-biology-exploration';
import {vida9TestSources} from '../../simulation/life/vida9-test-fixture';
import {groupVida38SpeciesColoniesB5,readVida38SpeciesColoniesB5,
  type Vida38ColonizedDestinationB5,type Vida38SpeciesColoniesRequestB5}
  from './vida38-colonias-especie-38-bis-b5';

const founder='vida6:38-bis-b5-founder';
const sourceBody='0:1:2:3:PLANET:-';
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const sourceIdentity={universeSeed:seed,generatorVersionCode:3,kind:'PLANET' as const,
  galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'2',bodyIndex:'3',moonIndex:null};
function withDigest(content:Omit<Vida9BiologyRecord,'digest'>):Vida9BiologyRecord{
  return {...content,digest:vida9DigestForRecord(content)};
}
function native():Vida9BiologyRecord{
  const {ecosystem,intelligence,colonization}=vida9TestSources();
  const species={id:founder,proceduralName:'Especie fundadora',group:'REPTILES' as const,
    habitat:'SURFACE_WET_MARGIN' as const,nutrition:'OMNIVORE' as const,
    niche:'SURFACE_WET_MARGIN/OMNIVORE',adaptations:['MOISTURE_TOLERANCE'],
    phenotype:{bodyPlan:'TETRAPOD' as const,covering:'SCALES' as const,
      locomotion:'WALKING' as const,bodyLengthMeters:1.8,
      primaryColorHex:'#557799',secondaryColorHex:'#335577',
      pattern:'SOLID' as const,appendagePairs:2,bioluminescent:false}};
  const e={...ecosystem,identity:sourceIdentity,bodyStorageKey:sourceBody,
    species:[species],biospherePresent:true,digest:'eco-b5'};
  const intelligentSpecies={speciesId:founder,lineage:'REPTILIAN' as const,
    communication:'VISUAL_GESTURAL' as const,socialStructure:'CLAN' as const,
    cognitionTraits:['SYMBOLIC_LEARNING' as const]};
  const civilization={founderSpeciesId:founder,lineage:'REPTILIAN' as const,tier:'ADVANCED' as const,
    culture:{socialOrganization:'CLAN' as const,governingTradition:'Pactos',
      communication:'VISUAL_GESTURAL' as const,culturalFocus:'Conocimiento'},
    technology:['INDUSTRIAL_PRODUCTION','SCIENTIFIC_INSTRUMENTS'],settlementPatterns:[]};
  const i={...intelligence,identity:sourceIdentity,bodyStorageKey:sourceBody,
    ecosystemDigest:e.digest,eligibility:'ELIGIBLE' as const,intelligentSpecies,
    civilization,intelligencePresent:true,civilizationPresent:true,digest:'civ-b5'};
  const c={...colonization,identity:sourceIdentity,bodyStorageKey:sourceBody,
    ecosystemDigest:e.digest,nativeCivilizationDigest:i.digest,
    nativeCivilizationPresent:true,nativeIntelligencePresent:true,
    colonialPopulationPresent:false,outcome:'NOT_SELECTED' as const,colonies:[]};
  return withDigest({revision:'VIDA.9/biology-exploration/v1',identity:sourceIdentity,
    bodyStorageKey:sourceBody,epoch:'CT-0',epochOffsetYears:0,
    revealPolicy:'FULL_SYSTEM_REVEAL_ON_CONFIRMED',ecosystem:e,intelligence:i,
    colonization:c,nativeLifePresent:true,nativeIntelligencePresent:true,
    nativeCivilizationPresent:true,introducedLifePresent:false,
    colonialPopulationPresent:false,historicalOriginEpochYears:null});
}
function destination(source:Vida9BiologyRecord,kind:'PLANET'|'MOON',
  bodyIndex:string,moonIndex:string|null,anotherFounder=false):Vida9BiologyRecord{
  const identity={...source.identity,kind,bodyIndex,moonIndex};
  const bodyStorageKey=['0','1','2',bodyIndex,kind,moonIndex??'-'].join(':');
  const e={...source.ecosystem,identity,bodyStorageKey,species:[],biospherePresent:false,digest:'eco-target'+bodyIndex};
  const i={...source.intelligence,identity,bodyStorageKey,ecosystemDigest:e.digest,
    intelligentSpecies:null,civilization:null,intelligencePresent:false,
    civilizationPresent:false,digest:'civ-target'+bodyIndex};
  const origin={sourceBodyStorageKey:source.bodyStorageKey,sourceIdentity:source.identity,
    founderSpeciesId:anotherFounder?'otra-especie':founder,
    lineage:'REPTILIAN' as const,tier:'ADVANCED' as const,
    sourceEcosystemDigest:source.ecosystem.digest,civilizationDigest:source.intelligence.digest};
  const colony={id:'vida8-colony-'+bodyStorageKey,origin,
    settlement:{id:'vida8-settlement-'+bodyStorageKey,
      habitatTechnology:'SUBSURFACE_VAULT' as const,
      function:'RESEARCH' as const,populationBand:'OUTPOST' as const,
      colonialPopulationRange:[12,150] as const,supportSystems:[]},
    introducedOrganisms:[],terraform:null,provenance:'TECHNOLOGICAL_COLONIZATION' as const};
  const c={...source.colonization,identity,bodyStorageKey,ecosystemDigest:e.digest,
    nativeCivilizationDigest:i.digest,nativeLifePresent:false,
    nativeCivilizationPresent:false,nativeIntelligencePresent:false,
    colonialPopulationPresent:true,outcome:'COLONIZED' as const,
    colonies:[colony]};
  return withDigest({revision:'VIDA.9/biology-exploration/v1',identity,bodyStorageKey,
    epoch:'CT-0',epochOffsetYears:0,revealPolicy:'FULL_SYSTEM_REVEAL_ON_CONFIRMED',
    ecosystem:e,intelligence:i,colonization:c,nativeLifePresent:false,
    nativeIntelligencePresent:false,nativeCivilizationPresent:false,
    introducedLifePresent:false,colonialPopulationPresent:true,
    historicalOriginEpochYears:null});
}
function request(source:Vida9BiologyRecord):Vida38SpeciesColoniesRequestB5{
  return {model:{locatorKind:'system',discoveryState:DiscoveryState.CONFIRMED,
    generatorVersionCode:3,universeSeed:seed,galaxyIndex:0n,sectorKey:1n,galacticObjectIndex:2n},
    bodyIndex:3n,speciesId:founder,visibleSourceRecord:source};
}

describe('38.bis-b5 — colonias por especie, sin acceso a conocimiento privado',()=>{
  it('diferencia destinos planetarios y lunares y agrupa colonias por cuerpo',()=>{
    const row=(kind:'PLANET'|'MOON',body:string,name:string):Vida38ColonizedDestinationB5=>({
      bodyStorageKey:body,kind,title:name,colonyCount:1,
      route:['/system','0','1','2','planet','3'],historicallyReconciled:false});
    const result=groupVida38SpeciesColoniesB5([
      row('MOON','l1','Luna I'),row('MOON','l1','Luna I'),row('PLANET','p1','Planeta A')]);
    expect(result.planets).toHaveLength(1);
    expect(result.moons).toHaveLength(1);
    expect(result.moons[0]?.colonyCount).toBe(2);
    expect(result.totalColonies).toBe(3);
  });
  it('impide leer ninguna fila privada si la confirmación es insuficiente',async()=>{
    const source=native();
    const db=new GenesisIndexedDb('b5-no-read-'+Date.now(),{indexedDB,IDBKeyRange});
    expect(await readVida38SpeciesColoniesB5(db,{
      ...request(source),model:{...request(source).model,discoveryState:DiscoveryState.DISCOVERED}})).toBeNull();
    expect(await readVida38SpeciesColoniesB5(db,{...request(source),speciesId:'otra-especie'})).toBeNull();
    expect(await readVida38SpeciesColoniesB5(db,{
      ...request(source),model:{...request(source).model,galaxyIndex:5n}})).toBeNull();
    db.closeDatabase();
  });
  it('lee los dos destinos de la misma fundadora sin confundir otros taxones',async()=>{
    const db=new GenesisIndexedDb('b5-real-dexie-'+Date.now()+'-'+Math.random(),{indexedDB,IDBKeyRange});
    const repo=new DexieVida9BiologyExplorationRepository(db);
    const source=native();
    const moon=destination(source,'MOON','8','0');
    const planet=destination(source,'PLANET','9',null);
    const another=destination(source,'MOON','10','1',true);
    try{
      await repo.ensure(source);
      await repo.ensure(moon);
      await repo.ensure(planet);
      await repo.ensure(another);
      const sourceBefore=JSON.stringify(source),targetBefore=JSON.stringify(moon);
      const result=await readVida38SpeciesColoniesB5(db,request(source));
      expect(result).not.toBeNull();
      expect(result?.planets).toHaveLength(1);
      expect(result?.moons).toHaveLength(1);
      expect(result?.totalColonies).toBe(2);
      expect(result?.moons[0]?.route.slice(-2)).toEqual(['moon','0']);
      expect(JSON.stringify(source)).toBe(sourceBefore);
      expect(JSON.stringify(moon)).toBe(targetBefore);
    } finally{db.closeDatabase();await db.delete();}
  });
});
