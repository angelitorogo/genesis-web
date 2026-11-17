import Dexie from 'dexie';
import {DiscoveryState} from '../../../domain/discovery/discovery-state';
import {GalaxyLocator, type ProceduralLocator} from '../../../domain/generation/procedural-locator';
import {GeneratorVersion} from '../../../domain/generation/generator-version';
import {UniverseGenerationKey} from '../../../domain/generation/universe-generation-key';
import {UniverseSeed} from '../../../domain/universe/universe-seed';
import {GenesisIndexedDb} from '../indexed-db/genesis-indexed-db';
import {DexieDiscoveryRepository, type ProceduralTargetSeedResolver} from './dexie-discovery.repository';
import {DexieDiscoveryPointsRepository} from './dexie-discovery-points.repository';
import {DexieExternalGalaxySearchStateRepository} from './dexie-external-galaxy-search-state.repository';
import {DexieUniverseRepository} from './dexie-universe.repository';
import {DexieGalaxyScientificKnowledgeRuntime} from '../../../presentation/runtime/galaxy-scientific-knowledge.runtime';
import {GalaxyScientificStateTransitionAction} from '../../../simulation/exploration/galaxy-scientific-state-transition-engine';
import {ProceduralTargetResolver} from '../../../simulation/regeneration/procedural-target-resolver';
import {indexedDB, IDBKeyRange} from 'fake-indexeddb';
import {
  publishGenesisKnowledgeCommit38BisB6,
  subscribeGenesisKnowledgeCommits38BisB6,
  type GenesisKnowledgeCommit38BisB6,
} from './genesis-knowledge-commits-38-bis-b6';

const deps={indexedDB,IDBKeyRange};
let dbOrdinal=0;
const event:GenesisKnowledgeCommit38BisB6={universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
  generatorVersionCode:3,galaxyIndex:'0',kind:'GALAXY'};

const waitFor=async(check:()=>boolean):Promise<void>=>{
  for(let i=0;i<60;i++){
    if(check())return;
    await new Promise<void>(resolve=>setTimeout(resolve,5));
  }
  throw new Error('No se ha publicado el aviso poscommit');
};

describe('38.bis-b6c · avisos del Archivo fuera de transacciones científicas',()=>{
  let source:Dexie;
  let archive:Dexie;
  let remove:(()=>void)|null;
  beforeEach(async()=>{
    const dbId=++dbOrdinal;
    source=new Dexie('genesis-b6c-science-'+dbId,deps);
    source.version(1).stores({states:'id'});
    archive=new Dexie('genesis-b6c-archive-'+dbId,deps);
    archive.version(1).stores({jobs:'id'});
    await Promise.all([source.open(),archive.open()]);
    remove=null;
  });
  afterEach(async()=>{
    remove?.();
    await Promise.all([source.delete(),archive.delete()]);
  });

  it('no abre la BD del Archivo hasta confirmar todos los estados y el gasto de PD',async()=>{
    const received:string[]=[];
    remove=subscribeGenesisKnowledgeCommits38BisB6(async e=>{
      received.push(e.kind);
      await archive.table('jobs').put({id:'galaxy',kind:e.kind});
    });
    await source.transaction('rw',source.table('states'),async()=>{
      await source.table('states').put({id:'galaxy',status:'CATALOGUED'});
      await publishGenesisKnowledgeCommit38BisB6(event);
      // This write used to fail with TransactionInactiveError / premature commit.
      await source.table('states').put({id:'points',balance:750});
      expect(received).toEqual([]);
    });
    expect((await source.table('states').get('points'))?.balance).toBe(750);
    await waitFor(()=>received.length===1);
    expect(await archive.table('jobs').get('galaxy')).toMatchObject({kind:'GALAXY'});
  });

  it('no anuncia una transacción abortada ni permite que el Archivo la resucite',async()=>{
    const received:string[]=[];
    remove=subscribeGenesisKnowledgeCommits38BisB6(e=>{received.push(e.kind);});
    await expect(source.transaction('rw',source.table('states'),async()=>{
      await source.table('states').put({id:'galaxy',status:'CATALOGUED'});
      await publishGenesisKnowledgeCommit38BisB6(event);
      throw new Error('rollback científico');
    })).rejects.toThrow('rollback científico');
    await new Promise<void>(resolve=>setTimeout(resolve,20));
    expect(received).toEqual([]);
    expect(await source.table('states').count()).toBe(0);
  });

  it('agrupa avisos repetidos y mantiene universos distintos',async()=>{
    const received:GenesisKnowledgeCommit38BisB6[]=[];
    remove=subscribeGenesisKnowledgeCommits38BisB6(e=>{received.push(e);});
    await source.transaction('rw',source.table('states'),async()=>{
      await source.table('states').put({id:'galaxy',status:'CONFIRMED'});
      await publishGenesisKnowledgeCommit38BisB6(event);
      await publishGenesisKnowledgeCommit38BisB6(event);
      await publishGenesisKnowledgeCommit38BisB6({...event,galaxyIndex:'1'});
      await source.table('states').put({id:'points',balance:500});
    });
    await waitFor(()=>received.length===2);
    expect(received.map(e=>e.galaxyIndex).sort()).toEqual(['0','1']);
  });

  it('permite publicar fuera de una transacción sin bloquear por errores de índice',async()=>{
    const received:string[]=[];
    remove=subscribeGenesisKnowledgeCommits38BisB6(e=>{received.push(e.kind);throw Error('índice secundario');});
    await expect(publishGenesisKnowledgeCommit38BisB6(event)).resolves.toBeUndefined();
    expect(received).toEqual(['GALAXY']);
  });

  it('mantiene atómica la catalogación real de galaxia y el cargo de 250 PD',async()=>{
    const dbId=++dbOrdinal;
    const database=new GenesisIndexedDb('genesis-b6c-galaxy-runtime-'+dbId,deps);
    const key=new UniverseGenerationKey(UniverseSeed.parse(event.universeSeed),GeneratorVersion.V3);
    const resolver:ProceduralTargetSeedResolver={
      resolveTargetSeedNormalized(generationKey:UniverseGenerationKey,locator:ProceduralLocator):string{
        return ProceduralTargetResolver.resolveTargetSeed(generationKey,locator).normalizedValue;
      },
    };
    const universes=new DexieUniverseRepository(database,()=>1000);
    const discoveries=new DexieDiscoveryRepository(database,resolver,()=>1000);
    const points=new DexieDiscoveryPointsRepository(database,()=>1000);
    const searches=new DexieExternalGalaxySearchStateRepository(database);
    const runtime=new DexieGalaxyScientificKnowledgeRuntime(database,points,discoveries,searches);
    const jobs:string[]=[];
    remove=subscribeGenesisKnowledgeCommits38BisB6(async e=>{
      jobs.push(e.galaxyIndex);
      await archive.table('jobs').put({id:'galaxy-'+e.galaxyIndex,kind:e.kind});
    });
    try {
      await universes.createIfAbsent(key);
      await discoveries.setState(key,new GalaxyLocator(0n),DiscoveryState.VISITED);
      await points.setGlobalDiscoveryPoints(key,1000n);
      const result=await runtime.commit(key,0n,GalaxyScientificStateTransitionAction.CATALOGUE);
      expect(result.globalDiscoveryPointsBefore).toBe(1000n);
      expect(result.globalDiscoveryPointsAfter).toBe(750n);
      expect(await discoveries.getState(key,new GalaxyLocator(0n))).toBe(DiscoveryState.CATALOGUED);
      expect(await points.getGlobalDiscoveryPoints(key)).toBe(750n);
      await waitFor(()=>jobs.length>=2); // VISITED outside transaction; CATALOGUED after commit.
      expect(await archive.table('jobs').get('galaxy-0')).toBeDefined();
    } finally {
      database.closeDatabase();
      await new Dexie('genesis-b6c-galaxy-runtime-'+dbId,deps).delete();
    }
  });

});
