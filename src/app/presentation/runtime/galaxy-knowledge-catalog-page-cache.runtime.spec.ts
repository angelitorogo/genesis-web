import { vi } from 'vitest';
import { DiscoveryState, type KnownDiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GalaxyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  type GalaxyKnowledgeSnapshotEntity,
} from '../../data/local/entity/galaxy-knowledge-snapshot.entity';
import {
  type GalaxyKnowledgeCatalogDataRequest,
  type GalaxyKnowledgeCatalogDataResult,
} from '../galaxy-knowledge-catalog/galaxy-knowledge-catalog.model';
import {
  appendGalaxyKnowledgeCatalogPageCAT1,
  galaxyKnowledgeCatalogPageCacheKeyCAT1,
  restoreGalaxyKnowledgeCatalogPagesCAT1,
} from './galaxy-knowledge-catalog-page-cache.model';
import { DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1, type GalaxyKnowledgeCatalogPageStoreCAT1 } from './galaxy-knowledge-catalog-page-cache.runtime';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('1234-5678-90AB-CDEF-1234-5678-90AB-CDEF'),
  GeneratorVersion.V3,
);
const otherGenerationKey = new UniverseGenerationKey(generationKey.universeSeed, GeneratorVersion.V2);
const catalogResult = (title: string, complete: boolean | undefined = undefined): GalaxyKnowledgeCatalogDataResult => ({
  kind: 'page',
  page: {
    totalItems: 1, page: 1, totalPages: 1, pageSize: 25,
    ...(complete === undefined ? {} : { knowledgeComplete: complete }),
    items: [{id:title,title,cells:{state:'Confirmado'},actions:[]}],
  },
});
function request(galaxyIndex:bigint, category:'systems'|'planets'|'civilizations'='systems',
  key = generationKey, search: string | null = null): GalaxyKnowledgeCatalogDataRequest {
  return {
    generationKey:key, galaxyIndex, galaxyState:DiscoveryState.CONFIRMED, scientificOnly:true,
    query:{category,subtype:null,sortKey:'designation',direction:'asc',page:1,pageSize:25,
      ...(search===null?{}:{search})},
  };
}

function setup() {
  const rows = new Map<string, KnownDiscovery[]>();
  const saved = new Map<string, GalaxyKnowledgeSnapshotEntity>();
  const id = (key:UniverseGenerationKey, galaxyIndex:bigint) =>
    `${key.universeSeed.serialize()}/${key.generatorVersionCode}/${galaxyIndex}`;
  const discoveries = {
    getKnownDiscoveries: vi.fn(async (key:UniverseGenerationKey) => [...rows.entries()]
      .filter(([prefix])=>prefix.startsWith(`${key.universeSeed.serialize()}/${key.generatorVersionCode}/`))
      .flatMap(([,value])=>value)),
    getKnownDiscoveriesInGalaxy: vi.fn(async (key:UniverseGenerationKey, galaxyIndex:bigint) =>
      Object.freeze([...(rows.get(id(key,galaxyIndex))??[])])),
  };
  const repository: GalaxyKnowledgeCatalogPageStoreCAT1 = {
    get: vi.fn(async (key, galaxyIndex) => saved.get(id(key,galaxyIndex))),
    updateCatalogPageIfRevisionMatches: vi.fn(async (key,galaxyIndex,modelVersion,revision,pageKey,result) => {
      const identifier = id(key,galaxyIndex);
      const existing = saved.get(identifier);
      if (existing && existing.knowledgeRevision !== revision) return false;
      const json = appendGalaxyKnowledgeCatalogPageCAT1(existing?.catalogPagesJson,pageKey,result);
      if (!json) return false;
      saved.set(identifier,{
        ...(existing??{}), universeSeed:key.universeSeed.serialize(),
        generatorVersionCode:key.generatorVersionCode, galaxyIndex:String(galaxyIndex),
        scientificModelVersion:modelVersion,knowledgeRevision:revision,
        updatedAtEpochMs:1,catalogPagesJson:json,
      });
      return true;
    }),
  };
  function setRows(key:UniverseGenerationKey,galaxyIndex:bigint, state: KnownDiscoveryState = DiscoveryState.CONFIRMED) {
    rows.set(id(key,galaxyIndex),[
      new KnownDiscovery(key,new GalaxyLocator(galaxyIndex),DiscoveryState.CONFIRMED),
      new KnownDiscovery(key,new SystemLocator(galaxyIndex,1n,1n),state),
    ]);
  }
  return { discoveries, repository, saved, rows, setRows };
}

describe('GENESIS CACHE-CAT.1 · páginas públicas persistidas', () => {
  it('reutiliza la misma consulta y la restaura tras crear una instancia nueva',async()=>{
    const {discoveries,repository,setRows}=setup(); setRows(generationKey,0n);
    const first = new DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1(repository,discoveries);
    const loader = vi.fn(async()=>catalogResult('Sistema A'));
    expect((await first.resolve(request(0n),loader)).kind).toBe('page');
    expect((await first.resolve(request(0n),loader)).kind).toBe('page');
    const fresh = new DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1(repository,discoveries);
    expect((await fresh.resolve(request(0n),loader)).kind).toBe('page');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('mantiene páginas de categorías y galaxias distintas en el mismo registro',async()=>{
    const {discoveries,repository,setRows}=setup();
    for(let i=0;i<19;i++)setRows(generationKey,BigInt(i));
    const runtime = new DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1(repository,discoveries);
    const loader=vi.fn(async()=>catalogResult('publico'));
    for(let i=0;i<19;i++) {
      await runtime.resolve(request(BigInt(i),'systems'),loader);
      await runtime.resolve(request(BigInt(i),'planets'),loader);
    }
    const fresh = new DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1(repository,discoveries);
    await fresh.resolve(request(0n,'systems'),loader);
    await fresh.resolve(request(0n,'planets'),loader);
    expect(loader).toHaveBeenCalledTimes(38);
  });

  it('invalida tras un cambio persistido en un sistema sin confiar en la página antigua',async()=>{
    const {discoveries,repository,setRows}=setup();setRows(generationKey,3n);
    const runtime = new DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1(repository,discoveries);
    let serial=0;
    const loader=vi.fn(async()=>catalogResult(`snapshot-${++serial}`));
    await runtime.resolve(request(3n),loader);
    setRows(generationKey,3n,DiscoveryState.CATALOGUED);
    await runtime.resolve(request(3n),loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('no mezcla universo/versiones y búsquedas de texto',async()=>{
    const {discoveries,repository,setRows}=setup();
    setRows(generationKey,2n);setRows(otherGenerationKey,2n);
    const runtime=new DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1(repository,discoveries);
    const loader=vi.fn(async()=>catalogResult('publico'));
    await runtime.resolve(request(2n,'systems',generationKey),loader);
    await runtime.resolve(request(2n,'systems',otherGenerationKey),loader);
    await runtime.resolve(request(2n,'systems',generationKey,'agua'),loader);
    await runtime.resolve(request(2n,'systems',generationKey),loader);
    expect(loader).toHaveBeenCalledTimes(3);
  });

  it('no persiste ni reutiliza civilizaciones de cobertura parcial',async()=>{
    const {discoveries,repository,setRows}=setup();setRows(generationKey,0n);
    const runtime=new DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1(repository,discoveries);
    const loader=vi.fn(async()=>catalogResult('provisional',false));
    await runtime.resolve(request(0n,'civilizations'),loader);
    await runtime.resolve(request(0n,'civilizations'),loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('no consulta caché en modo no científico, y no bloquea la UI si falla su escritura',async()=>{
    const {discoveries,repository,setRows}=setup();setRows(generationKey,0n);
    const loader=vi.fn(async()=>catalogResult('publico'));
    const runtime=new DexieGalaxyKnowledgeCatalogPageCacheRuntimeCAT1({
      ...repository,updateCatalogPageIfRevisionMatches:async()=>{throw Error('quota');},
    },discoveries);
    await runtime.resolve({...request(0n),scientificOnly:false},loader);
    await runtime.resolve(request(0n),loader);
    await runtime.resolve(request(0n),loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('limita el almacenamiento por galaxia y rechaza fragmentos inválidos',()=>{
    const key=galaxyKnowledgeCatalogPageCacheKeyCAT1(request(0n));
    let json: string | undefined;
    for(let i=0;i<31;i++) json=appendGalaxyKnowledgeCatalogPageCAT1(json,`${key}:${i}`,catalogResult(`pagina${i}`))!;
    expect(restoreGalaxyKnowledgeCatalogPagesCAT1(json).entries).toHaveLength(24);
    expect(restoreGalaxyKnowledgeCatalogPagesCAT1('{bad').entries).toHaveLength(0);
    expect(restoreGalaxyKnowledgeCatalogPagesCAT1(JSON.stringify({version:1,entries:[{
      key:'x',result:catalogResult('partial',false),
    }]})).entries).toHaveLength(0);
  });
});
