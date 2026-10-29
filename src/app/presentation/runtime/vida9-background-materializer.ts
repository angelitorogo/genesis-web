/** Shared browser-worker materialization for known, CONFIRMED V3 systems.
 * Never regenerate existing VIDA.9 rows on the UI thread. A worker calculates
 * immutable records; the catalogue/planet fiche remains responsive.
 */
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import type { GalaxyKnowledgePlanetMoonCatalogSnapshot } from './galaxy-planet-moon-catalog-snapshot.runtime';

export interface Vida9PlanetBackfillResult {
  readonly indexed: number;
  readonly expected: number;
  readonly missingPhysical: number;
  readonly candidates: readonly string[];
  /** Gaps in a partially materialized galaxy, never classified as sterile. */
  readonly problems?: readonly Readonly<{system:string;message:string}>[];
}
type WorkerResult = Readonly<{ requestId:number; kind:'done'|'error'; value?:Vida9PlanetBackfillResult; error?:string }>;
type Payload = Readonly<{requestId:number;kind:'planets'|'moons';seed:string;version:number;
  galaxyIndex:string;systems?:readonly string[];moons?:readonly string[]}>;

let worker:Worker|null=null;
let nextId=0;
const inFlight=new Map<number,{resolve:(value:Vida9PlanetBackfillResult)=>void;reject:(error:Error)=>void}>();
const started=new Map<string,Promise<Vida9PlanetBackfillResult>>();

function browserWorker():Worker|null{
  if(typeof Worker!=='function' || typeof indexedDB==='undefined')return null;
  if(worker)return worker;
  // Angular bundles this standalone worker; no generator code runs on the UI thread.
  const instance=new Worker(new URL('./vida9-background-materializer.worker',import.meta.url),
    {name:'genesis-vida9-background'});
  instance.addEventListener('message',(event:MessageEvent<WorkerResult>)=>{
    const result=event.data;
    const waiting=inFlight.get(result.requestId);
    if(!waiting)return;
    inFlight.delete(result.requestId);
    if(result.kind==='error')waiting.reject(new Error(result.error??'Error de indexación biológica'));
    else waiting.resolve(result.value??{indexed:0,expected:0,missingPhysical:0,candidates:[]});
  });
  instance.addEventListener('error',(event:ErrorEvent)=>{
    for(const waiting of inFlight.values())waiting.reject(new Error(event.message||'Error del worker biológico'));
    inFlight.clear();started.clear();worker=null;instance.terminate();
  });
  worker=instance;
  return instance;
}
function submit(payload:Omit<Payload,'requestId'>):Promise<Vida9PlanetBackfillResult>|null{
  const running=browserWorker();
  if(!running)return null;
  const requestId=++nextId;
  return new Promise((resolve,reject)=>{
    inFlight.set(requestId,{resolve,reject});
    try{running.postMessage({...payload,requestId});}
    catch(error){inFlight.delete(requestId);reject(error);}
  });
}

/** Returns null in Node/Vitest, where the existing test-double indexer remains authoritative. */
export function ensureVida9PlanetsInBackground(key:UniverseGenerationKey,galaxyIndex:bigint,
  confirmed:ReadonlySet<string>):Promise<Vida9PlanetBackfillResult>|null{
  const id=[key.universeSeed.serialize(),key.generatorVersionCode,galaxyIndex,
    [...confirmed].sort().join('|')].join('/');
  const prior=started.get(id);
  if(prior)return prior;
  const promise=submit({kind:'planets',seed:key.universeSeed.serialize(),
    version:key.generatorVersionCode,galaxyIndex:String(galaxyIndex),systems:[...confirmed]});
  if(!promise)return null;
  started.set(id,promise);
  // An incomplete materialization is not a successfully cached index. A
  // subsequent confirmation/visit must be able to resume immutable records.
  void promise.then(result=>{
    if(result.indexed!==result.expected || (result.problems?.length??0)>0)started.delete(id);
  },()=>{started.delete(id);});
  return promise;
}

/** Moon backfill is independent of the inventory. It is queued in the same
 * worker, after the high-priority planetary inventory task. Detail visits can
 * still persist individual moon records without waiting for this work. */
export function scheduleVida9MoonsInBackground(key:UniverseGenerationKey,
  galaxyIndex:bigint,snapshot:GalaxyKnowledgePlanetMoonCatalogSnapshot):Promise<void>|null {
  if(typeof Worker!=='function' || typeof indexedDB==='undefined')return null;
  const moons=snapshot.moons.filter(m=>m.stateName==='CONFIRMED').map(m=>
    [m.locator.galaxyIndex,m.locator.sectorKey,m.locator.galacticObjectIndex,
      m.locator.bodyIndex,m.locator.moonIndex].join('/'));
  if(moons.length===0)return Promise.resolve();
  const work=submit({kind:'moons',seed:key.universeSeed.serialize(),
    version:key.generatorVersionCode,galaxyIndex:String(galaxyIndex),moons});
  return work===null?null:work.then(()=>undefined);
}
