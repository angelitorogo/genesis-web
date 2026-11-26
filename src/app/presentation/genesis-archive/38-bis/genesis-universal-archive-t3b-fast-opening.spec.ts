import {describe,expect,it,vi} from 'vitest';
import {createArchiveTestStore38Bis} from './genesis-universal-archive-test-db-38bis';
import type {GenesisKnowledgeCommit38BisB6} from '../../../data/local/repository/genesis-knowledge-commits-38-bis-b6';
import {TestBed} from '@angular/core/testing';
import {GENESIS_LOCAL_REPOSITORIES} from '../../runtime/genesis-local-repositories';
import {UniverseSeedFacade} from '../../universe/universe-seed.facade';
import {UniverseGenerationKey} from '../../../domain/generation/universe-generation-key';
import {UniverseSeed} from '../../../domain/universe/universe-seed';
import {GeneratorVersion} from '../../../domain/generation/generator-version';
import {GenesisUniversalArchiveFacade38Bis} from './genesis-universal-archive-38-bis.facade';
import {GenesisUniversalArchiveIndex38Bis} from './genesis-universal-archive-38-bis.index';
import {UNIVERSAL_ARCHIVE_CATEGORIES_38BIS,
  type UniversalArchiveSection38Bis} from './genesis-universal-archive-38-bis.model';
import {archiveVisibleFragmentChanged38BisT3b} from './genesis-universal-archive-t3b-update-policy';
import {archiveConfirmedStateChanged38BisT3b}
  from '../../../data/local/repository/dexie-discovery.repository';

const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const params={category:'planets',universeRef:null,galaxyIndex:null,subtype:null,
  search:null,direction:null,page:null,size:null,sort:null,min:null,max:null};

describe('38.bis-T3b — apertura por metadatos y actualización solo CONFIRMED',()=>{
  it('descarta todas las transiciones no confirmadas y conserva altas y bajas CONFIRMED',()=>{
    expect(archiveConfirmedStateChanged38BisT3b(undefined,1)).toBe(false);
    expect(archiveConfirmedStateChanged38BisT3b(1,2)).toBe(false);
    expect(archiveConfirmedStateChanged38BisT3b(2,3)).toBe(false);
    expect(archiveConfirmedStateChanged38BisT3b(3,4)).toBe(false);
    expect(archiveConfirmedStateChanged38BisT3b(4,undefined)).toBe(false);
    expect(archiveConfirmedStateChanged38BisT3b(undefined,undefined)).toBe(false);
    expect(archiveConfirmedStateChanged38BisT3b(4,5)).toBe(true);
    expect(archiveConfirmedStateChanged38BisT3b(undefined,5)).toBe(true);
    expect(archiveConfirmedStateChanged38BisT3b(5,5)).toBe(false);
    expect(archiveConfirmedStateChanged38BisT3b(5,4)).toBe(true);
    expect(archiveConfirmedStateChanged38BisT3b(5,undefined)).toBe(true);
  });

  it('no recalcula la página por trabajos ajenos y sí al cambiar su fragmento',()=>{
    const base:UniversalArchiveSection38Bis={scope:'s',category:'planets',galaxyIndex:'0',
      sourceRevision:'1',indexedAtEpochMs:1,count:1,knowledgeComplete:true};
    const other:UniversalArchiveSection38Bis={...base,category:'moons',galaxyIndex:'1'};
    const old=[base,other];
    const differentMoon=[base,{...other,sourceRevision:'2'}];
    const differentPlanet=[{...base,sourceRevision:'2'},other];
    expect(archiveVisibleFragmentChanged38BisT3b(old,differentMoon,'planets',null)).toBe(false);
    expect(archiveVisibleFragmentChanged38BisT3b(old,differentPlanet,'planets','1')).toBe(false);
    expect(archiveVisibleFragmentChanged38BisT3b(old,differentPlanet,'planets','0')).toBe(true);
    expect(archiveVisibleFragmentChanged38BisT3b(old,differentPlanet,'planets',null)).toBe(true);
    expect(archiveVisibleFragmentChanged38BisT3b(old,differentPlanet,'galaxies',null)).toBe(false);
    expect(archiveVisibleFragmentChanged38BisT3b(old,old,'planets',null)).toBe(false);
    expect(archiveVisibleFragmentChanged38BisT3b(old,[other],'planets','0')).toBe(true);
  });

  it('lee fragmentos e invalidaciones conjuntamente en IndexedDB, sin publicar filas a medias',async()=>{
    const store=createArchiveTestStore38Bis('archive-t3b-open-'+Date.now());
    const scope='scope-t3b';
    const section:UniversalArchiveSection38Bis={scope,category:'planets',galaxyIndex:'7',
      sourceRevision:'R1',indexedAtEpochMs:1,count:0,knowledgeComplete:true};
    const event:GenesisKnowledgeCommit38BisB6={universeSeed:seed,generatorVersionCode:3,
      galaxyIndex:'7',kind:'SYSTEM'};
    try{
      await store.publish(section,[]);
      await store.enqueueKnowledgeChange38BisB6(event,scope);
      const pending=await store.openingSnapshot38BisT3b(scope);
      expect(pending.progress.sections).toHaveLength(1);
      expect(pending.jobs.some(j=>j.category==='planets'&&j.galaxyIndex==='7')).toBe(true);
      expect(pending.progress.sections[0]?.sourceRevision).toBe('R1');
      for(let n=0;n<20;n++){
        const job=await store.claimKnowledgeChange38BisB6();
        if(!job)break;
        await store.finishKnowledgeChange38BisB6(job);
      }
      const settled=await store.openingSnapshot38BisT3b(scope);
      expect(settled.progress.sections).toHaveLength(1);
      expect(settled.jobs).toHaveLength(0);
      expect(settled.progress.sections[0]?.sourceRevision).toBe('R1');
    }finally{store.close();await store.delete();}
  });

  it('recupera los 225 fragmentos en una sola lectura y sin verificar ciencia ni ordenaciones',async()=>{
    const key=new UniverseGenerationKey(UniverseSeed.parse(seed),GeneratorVersion.V3);
    const galaxies=Array.from({length:15},(_,n)=>({index:String(n),title:'Galaxia '+n,stateCode:5}));
    const categories=UNIVERSAL_ARCHIVE_CATEGORIES_38BIS
      .filter(c=>c.id!=='galaxies'&&c.id!=='sectors').map(c=>c.id);
    expect(categories).toHaveLength(15);
    const sections=galaxies.flatMap(g=>categories.map(c=>({
      scope:'scope-test',category:c,galaxyIndex:g.index,count:0,
      sourceRevision:'revision-conservada',indexedAtEpochMs:1,knowledgeComplete:true,
    } as UniversalArchiveSection38Bis)));
    expect(sections).toHaveLength(225);
    const openingSnapshot38BisT3b=vi.fn(async()=>({
      progress:{sections,sortRevisions:[],checkpoints:[]},jobs:[],
    }));
    const progressFor=vi.fn();
    const knowledgeJobsFor38BisT3=vi.fn();
    const sectionsFor=vi.fn();
    const ensure=vi.fn();
    const store={openingSnapshot38BisT3b,progressFor,knowledgeJobsFor38BisT3,sectionsFor,
      page:vi.fn(async()=>({items:[],total:0,page:1,pageSize:25,totalPages:1}))};
    const index={knownGalaxies:vi.fn(async()=>galaxies),store,ensure,
      ensureSort38BisT3:vi.fn(),enrichVisibleBiologyB1:vi.fn(async(_key:unknown,items:readonly unknown[])=>items)};
    const repositories={universeRepository:{getAll:vi.fn(async()=>[key])}};
    TestBed.configureTestingModule({providers:[
      GenesisUniversalArchiveFacade38Bis,
      {provide:GENESIS_LOCAL_REPOSITORIES,useValue:repositories},
      {provide:UniverseSeedFacade,useValue:{resolvePersistedUniverse:()=>key}},
      {provide:GenesisUniversalArchiveIndex38Bis,useValue:index},
    ]});
    const facade=TestBed.inject(GenesisUniversalArchiveFacade38Bis);
    await facade.load(params);
    expect(facade.state()).toBe('ready');
    expect(facade.indexProgressStored()).toBe(225);
    expect(facade.page()?.total).toBe(0);
    expect(openingSnapshot38BisT3b).toHaveBeenCalledTimes(1);
    expect(progressFor).not.toHaveBeenCalled();
    expect(knowledgeJobsFor38BisT3).not.toHaveBeenCalled();
    expect(sectionsFor).not.toHaveBeenCalled();
    expect(ensure).not.toHaveBeenCalled();
    expect(index.ensureSort38BisT3).not.toHaveBeenCalled();
  });
});
