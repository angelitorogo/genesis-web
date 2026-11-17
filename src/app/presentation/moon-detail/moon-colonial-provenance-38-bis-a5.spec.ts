import 'fake-indexeddb/auto';
import {describe,it,expect,vi} from 'vitest';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {GenesisIndexedDb} from '../../data/local/indexed-db/genesis-indexed-db';
import {Vida9BiologyExploration} from '../../simulation/life/vida9-biology-exploration';
import {vida9TestSources} from '../../simulation/life/vida9-test-fixture';
import {DexieVida9BiologyExplorationRepository} from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import type {Vida6Species} from '../../domain/life/vida6-ecosystems-species';
import type {Vida8Colony} from '../../domain/life/vida8-technological-colonization';
import {Vida9FullSystemBiologyPanel} from '../scientific/vida9-full-system-biology-panel';
import {verifiedMoonColonyProvenance38BisA5,
  readMoonColonialProvenances38BisA5} from './moon-colonial-provenance-38-bis-a5';
import type {PlanetMoonColonizationRequest386b} from '../planet-detail/planet-moon-colonization-data-source-38-6b';

const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const request:PlanetMoonColonizationRequest386b={confirmed:true,universeSeed:seed,
  generatorVersionCode:3,galaxyIndex:0n,sectorKey:1n,galacticObjectIndex:2n,
  bodyIndex:3n,moonIndices:[0]};
const species:Vida6Species={id:'founder-1',proceduralName:'Especie Neral',
  group:'HUMANOIDS',habitat:'SURFACE_SOIL',nutrition:'OMNIVORE',adaptations:[],
  phenotype:{bodyPlan:'BIPED',covering:'LEATHERY',locomotion:'WALKING',bodyLengthMeters:1.8,
    primaryColorHex:'#AABBCC',secondaryColorHex:'#445566',pattern:'SOLID',
    appendagePairs:2,bioluminescent:false},niche:'SOCIAL'};
function sourceRecord(){
  const {ecosystem,intelligence,colonization}=vida9TestSources();
  const identity={...ecosystem.identity,kind:'PLANET' as const,bodyIndex:'1',moonIndex:null};
  const bodyStorageKey='0:1:2:1:PLANET:-';
  const e={...ecosystem,identity,bodyStorageKey,species:[species]};
  const i={...intelligence,identity,bodyStorageKey,intelligencePresent:true,
    civilizationPresent:true,eligibility:'ELIGIBLE' as const,
    intelligentSpecies:{speciesId:species.id,lineage:'HUMANOID' as const,
      communication:'VOCAL_SYMBOLIC' as const,socialStructure:'URBAN_NETWORK' as const,
      cognitionTraits:[] as const},civilization:{founderSpeciesId:species.id,
      tier:'ADVANCED' as const,lineage:'HUMANOID' as const,
      technology:['INDUSTRIAL_PRODUCTION','SCIENTIFIC_INSTRUMENTS'],settlementPatterns:[],
      culture:{socialOrganization:'URBAN_NETWORK' as const,governingTradition:'',
        communication:'VOCAL_SYMBOLIC' as const,culturalFocus:''}}};
  const c={...colonization,identity,bodyStorageKey,nativeCivilizationPresent:true,
    nativeIntelligencePresent:true,nativeLifePresent:true,
    nativeCivilizationDigest:i.digest};
  return Vida9BiologyExploration.evaluate(e,i,c);
}
function moonRecord(){
  const {ecosystem,intelligence,colonization}=vida9TestSources();
  const source=sourceRecord();
  const colony:Vida8Colony={id:'col-1',provenance:'TECHNOLOGICAL_COLONIZATION',
    origin:{sourceIdentity:source.identity,sourceBodyStorageKey:source.bodyStorageKey,
      sourceEcosystemDigest:source.ecosystem.digest,civilizationDigest:source.intelligence.digest,
      founderSpeciesId:species.id,lineage:'HUMANOID',tier:'ADVANCED'},
    settlement:{id:'settle-1',habitatTechnology:'SUBSURFACE_VAULT',
      function:'RESEARCH',populationBand:'OUTPOST',colonialPopulationRange:[12,150],
      supportSystems:[]},introducedOrganisms:[],terraform:null};
  const c={...colonization,outcome:'COLONIZED' as const,
    colonialPopulationPresent:true,colonies:[colony]};
  return {source,moon:Vida9BiologyExploration.evaluate(ecosystem,intelligence,c),colony};
}

describe('38.bis-a5 — procedencia nominal segura de colonias en la ficha lunar',()=>{
  it('muestra nombres auténticos solo para especie fundadora y planeta verificados',()=>{
    const {source,moon,colony}=moonRecord();
    const result=verifiedMoonColonyProvenance38BisA5(colony,moon,source,
      new Set(['0/1/2']),'Aaras A-3');
    expect(result).toEqual({speciesName:'Especie Neral',planetName:'Aaras A-3',
      planetRoute:['/system','0','1','2','planet','1'],historical:false});
  });
  it('no confunde el nombre del fundador con el linaje ni lo infiere del destino',()=>{
    const {source,moon,colony}=moonRecord();
    expect(verifiedMoonColonyProvenance38BisA5(colony,moon,source,
      new Set(['0/1/2']),null)).toBeNull();
    expect(verifiedMoonColonyProvenance38BisA5({...colony,origin:{...colony.origin,
      founderSpeciesId:'otra-especie'}},moon,source,new Set(['0/1/2']),'Aaras')).toBeNull();
  });
  it('deniega un sistema no confirmado y un origen con digest no reproducible',()=>{
    const {source,moon,colony}=moonRecord();
    expect(verifiedMoonColonyProvenance38BisA5(colony,moon,source,new Set(),
      'Aaras A-3')).toBeNull();
    expect(verifiedMoonColonyProvenance38BisA5({...colony,origin:{...colony.origin,
      civilizationDigest:'alterado'}},moon,source,new Set(['0/1/2']),
      'Aaras A-3')).toBeNull();
  });
  it('no consulta el origen desde IndexedDB sin confirmación de la luna',async()=>{
    const db=new GenesisIndexedDb('38bis-a5-no-read-'+Math.random(),{indexedDB,IDBKeyRange});
    const spy=vi.spyOn(db,'openDatabase');
    try{
      const {moon}=moonRecord();
      expect(await readMoonColonialProvenances38BisA5(db,moon,{...request,confirmed:false},0))
        .toEqual({});
      expect(spy).not.toHaveBeenCalled();
    }finally{db.closeDatabase();}
  });
  it('rechaza origen ausente en IndexedDB sin mostrar nombres ni rutas',async()=>{
    const db=new GenesisIndexedDb('38bis-a5-missing-'+Math.random(),{indexedDB,IDBKeyRange});
    try{
      const {moon}=moonRecord();
      await new DexieVida9BiologyExplorationRepository(db).ensure(moon);
      expect(await readMoonColonialProvenances38BisA5(db,moon,request,0)).toEqual({});
    }finally{db.closeDatabase();}
  });
  it('la interfaz conserva la procedencia antigua y muestra los nombres solo con autorización',async()=>{
    const {moon}=moonRecord();
    await TestBed.configureTestingModule({imports:[Vida9FullSystemBiologyPanel],
      providers:[provideRouter([])]}).compileComponents();
    const fixture=TestBed.createComponent(Vida9FullSystemBiologyPanel);
    fixture.componentRef.setInput('record',moon);
    fixture.componentRef.setInput('mostrarOrigenColonial38BisA5',true);
    fixture.componentRef.setInput('origenesColoniales38BisA5',{'col-1':{
      speciesName:'Especie Neral',planetName:'Aaras A-3',
      planetRoute:['/system','0','1','2','planet','1'],historical:false}});
    fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Humanoide');
    expect(root.textContent).toContain('Especie Neral');
    expect(root.textContent).toContain('Aaras A-3');
    const link=root.querySelector('[data-testid="vida9-colonias"] a');
    expect(link?.getAttribute('href')).toContain('/system/0/1/2/planet/1');
  });
});
