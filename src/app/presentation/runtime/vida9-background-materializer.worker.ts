/** Dedicated background CPU/IDB worker. All science is produced by the same
 * immutable VIDA.9 indexer used before this optimization. Never generate new
 * planets or force a civilization; only V3 physical models are eligible. */
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator, BodyLocator, MoonLocator } from '../../domain/generation/procedural-locator';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { Vida9ConfirmedSystemBiologyIndexer } from './vida9-confirmed-system-biology-indexer';
import { vida9V3ConfirmedPhysicalTargets } from './vida9-v3-confirmed-physical-targets';
import type { GalaxyKnowledgePlanetMoonCatalogSnapshot } from './galaxy-planet-moon-catalog-snapshot.runtime';

type Job = {requestId:number;kind:'planets'|'moons';seed:string;version:number;
  galaxyIndex:string;systems?:string[];moons?:string[]};
const scope=globalThis as unknown as {onmessage:(event:MessageEvent<Job>)=>void;
  postMessage:(value:unknown)=>void};
const db=new GenesisIndexedDb();
const indexer=new Vida9ConfirmedSystemBiologyIndexer(db);
let queue=Promise.resolve();
const epoch=()=>new Promise<void>(resolve=>setTimeout(resolve,0));

const empty=(galaxyIndex:bigint,planets:readonly {id:string;locator:BodyLocator;stateName:'CONFIRMED'}[],
  moons:readonly {id:string;locator:MoonLocator;stateName:'CONFIRMED'}[]):GalaxyKnowledgePlanetMoonCatalogSnapshot=>({
    galaxyIndex,planets:planets as unknown as GalaxyKnowledgePlanetMoonCatalogSnapshot['planets'],
    moons:moons as unknown as GalaxyKnowledgePlanetMoonCatalogSnapshot['moons'],
    unmaterializedMinorMoonCount:0n,
  });
function parts(raw:string,count:number):bigint[]{
  const bits=raw.split('/');
  if(bits.length!==count || bits.some(v=>!(/^-?\d+$/.test(v))))throw Error('Identidad de sistema/cuerpo inválida');
  return bits.map(v=>BigInt(v));
}
async function run(job:Job):Promise<void>{
  if(job.version!==GeneratorVersion.V3.code)throw Error('VIDA.9 requiere generador V3');
  const key=new UniverseGenerationKey(UniverseSeed.parse(job.seed),GeneratorVersion.V3);
  const galaxyIndex=BigInt(job.galaxyIndex);
  let indexed=0,expected=0,missingPhysical=0;
  const candidates:string[]=[];
  const problems:{system:string;message:string}[]=[];
  if(job.kind==='planets'){
    const confirmed=[...new Set(job.systems??[])].sort();
    for(let i=0;i<confirmed.length;i++){
      const s=parts(confirmed[i],3);
      if(s[0]!==galaxyIndex)throw Error('Sistema de otra galaxia en la proyección');
      const system=new SystemLocator(s[0],s[1],s[2]);
      // One unavailable physical system must not discard already validated
      // civilization records from the rest of the galaxy. Record the gap: it
      // prevents certifying a complete index until the cause is addressed.
      try {
        const source=vida9V3ConfirmedPhysicalTargets(key,system);
        if(source===null){missingPhysical++;continue;}
        const planets=[];
        for(let p=0;p<source.planetCount;p++){
          const locator=new BodyLocator(s[0],s[1],s[2],BigInt(p));
          planets.push({id:[...s,BigInt(p)].join(':'),locator,stateName:'CONFIRMED' as const});
        }
        expected+=planets.length;
        const report=await indexer.ensureConfirmedCatalog(key,empty(galaxyIndex,planets,[]));
        indexed+=report.indexed;
        missingPhysical+=report.withoutPhysicalModel;
        candidates.push(...(report.civilizationBodyKeys??[]));
      } catch(error) {
        problems.push({system:confirmed[i],message:String(error instanceof Error?error.message:error)});
      }
      if(i%8===0)await epoch();
    }
  }else{
    const moons=job.moons??[];
    for(let i=0;i<moons.length;i+=64){
      const batch=moons.slice(i,i+64).map(raw=>{
        const m=parts(raw,5);
        if(m[0]!==galaxyIndex)throw Error('Luna de otra galaxia en la proyección');
        return {id:m.join(':'),locator:new MoonLocator(m[0],m[1],m[2],m[3],m[4]),
          stateName:'CONFIRMED' as const};
      });
      expected+=batch.length;
      const report=await indexer.ensureConfirmedCatalog(key,empty(galaxyIndex,[],batch));
      indexed+=report.indexed;missingPhysical+=report.withoutPhysicalModel;
      await epoch();
    }
  }
  scope.postMessage({requestId:job.requestId,kind:'done',value:{indexed,expected,missingPhysical,candidates,problems}});
}
scope.onmessage=(event:MessageEvent<Job>)=>{
  const job=event.data;
  queue=queue.then(()=>run(job)).catch(error=>{
    scope.postMessage({requestId:job.requestId,kind:'error',error:String(error instanceof Error?error.message:error)});
  });
};
