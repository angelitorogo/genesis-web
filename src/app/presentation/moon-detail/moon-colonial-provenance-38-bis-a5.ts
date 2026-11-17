/** 38.bis-a5 — READ-ONLY public source attribution for a confirmed lunar colony.
 * The source VID A.9 row is fetched and digest-validated independently. If a
 * historical digest differs, the same VIDA.8 witness used by Archive 38.bis-a3
 * must prove BOTH digests and the immutable colony/settlement IDs.
 */
import {Injectable} from '@angular/core';
import {GenesisIndexedDb} from '../../data/local/indexed-db/genesis-indexed-db';
import {DexieVida9BiologyExplorationRepository} from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import {UniverseGenerationKey} from '../../domain/generation/universe-generation-key';
import {UniverseSeed} from '../../domain/universe/universe-seed';
import {GeneratorVersion} from '../../domain/generation/generator-version';
import {BodyLocator,SystemLocator} from '../../domain/generation/procedural-locator';
import type {Vida8Colony, Vida8OriginRef} from '../../domain/life/vida8-technological-colonization';
import type {Vida9BiologyRecord} from '../../domain/life/vida9-biology-exploration';
import {Vida8LocalOriginDiscovery} from '../../simulation/life/vida8-local-origin-discovery';
import type {Vida8CivilizationSource} from '../../simulation/life/vida8-technological-colonization';
import {vida9V3ConfirmedPhysicalTargets} from '../runtime/vida9-v3-confirmed-physical-targets';
import {knownCivilizationPlanetNames} from '../galaxy-knowledge-catalog/galaxy-civilization-known-index';
import {diagnoseColonyOrigin38Bis} from '../genesis-archive/38-bis/genesis-universal-archive-38-bis-origin-diagnostics';
import {reconcileColonyOrigin38Bis} from '../genesis-archive/38-bis/genesis-universal-archive-38-bis-origin-reconciliation';
import {verifiedMoonColonyCount386b,type PlanetMoonColonizationRequest386b} from '../planet-detail/planet-moon-colonization-data-source-38-6b';

export type MoonVerifiedColonialProvenance38BisA5 = Readonly<{
  speciesName:string; planetName:string; planetRoute:readonly string[];
  historical:boolean;
}>;
export type MoonColonialProvenances38BisA5 = Readonly<Record<string,MoonVerifiedColonialProvenance38BisA5>>;

/** Pure authorization boundary; labels are NEVER read from the destination
 * moon's private origin IDs or from a guessed public planet designation. */
export function verifiedMoonColonyProvenance38BisA5(
  colony:Vida8Colony,target:Vida9BiologyRecord,source:Vida9BiologyRecord|null,
  confirmed:ReadonlySet<string>,planetName:string|null,
  historicalWitness:Vida8CivilizationSource|null=null,
):MoonVerifiedColonialProvenance38BisA5|null {
  if(!planetName?.trim() || target.identity.kind!=='MOON' ||
      !target.colonization.colonies.some(c=>c.id===colony.id) ||
      !source || source.identity.kind!=='PLANET')return null;
  const decision=reconcileColonyOrigin38Bis(colony.origin,target,source,
    confirmed,colony,historicalWitness);
  if(decision.status==='UNRESOLVED')return null;
  const founder=source.ecosystem.species.find(s=>s.id===colony.origin.founderSpeciesId);
  if(!founder || !founder.proceduralName?.trim())return null;
  const id=source.identity;
  return Object.freeze({speciesName:founder.proceduralName,planetName:planetName.trim(),
    planetRoute:Object.freeze(['/system',id.galaxyIndex,id.sectorKey,
      id.galacticObjectIndex,'planet',id.bodyIndex]),
    historical:decision.status==='HISTORICALLY_RECONCILED'});
}

/** One confirmed moon, at most its actual colonies; never scans the galaxy. */
export async function readMoonColonialProvenances38BisA5(
  db:GenesisIndexedDb,record:Vida9BiologyRecord|null,
  request:PlanetMoonColonizationRequest386b,moonIndex:number,
):Promise<MoonColonialProvenances38BisA5> {
  const empty=Object.freeze({}) as MoonColonialProvenances38BisA5;
  if(verifiedMoonColonyCount386b(record,request,moonIndex)===null ||
      !record?.colonization.colonies.length)return empty;
  const id=record.identity;
  const systemId=[id.galaxyIndex,id.sectorKey,id.galacticObjectIndex].join('/');
  const confirmed=new Set([systemId]);
  const repo=new DexieVida9BiologyExplorationRepository(db);
  const key=new UniverseGenerationKey(UniverseSeed.parse(request.universeSeed),GeneratorVersion.V3);
  const system=new SystemLocator(request.galaxyIndex,request.sectorKey,request.galacticObjectIndex);
  const sourceCache=new Map<string,Vida9BiologyRecord|null>();
  const historicalCache=new Map<string,Vida8CivilizationSource|null>();
  let physical:ReturnType<typeof vida9V3ConfirmedPhysicalTargets>|undefined;
  const results:Record<string,MoonVerifiedColonialProvenance38BisA5>={};
  for(const colony of record.colonization.colonies){
    const origin=colony.origin;
    // Preflight must reject any unconfirmed, foreign or invalid reference before
    // attempting a private IndexedDB lookup. A system confirmed by the fiche
    // is the ONLY allowed source system in VIDA.8.
    if(diagnoseColonyOrigin38Bis(origin,record,null,confirmed)!=='SOURCE_RECORD_UNAVAILABLE')continue;
    const sourceId=origin.sourceBodyStorageKey;
    if(!sourceCache.has(sourceId)){
      let stored:Vida9BiologyRecord|null=null;
      try{stored=await repo.get(request.universeSeed,3,sourceId);}catch{/* fail closed */}
      sourceCache.set(sourceId,stored);
    }
    const source=sourceCache.get(sourceId)??null;
    if(!source)continue;
    const issue=diagnoseColonyOrigin38Bis(origin,record,source,confirmed);
    let witness:Vida8CivilizationSource|null=null;
    if(issue==='SOURCE_DIGEST_MISMATCH'){
      // Costly historical replay is performed ONLY for a source with differing
      // digests; it never persists or modifies a VIDA.9 record.
      if(!historicalCache.has(sourceId)){
        let found:Vida8CivilizationSource|null=null;
        try{
          physical??=vida9V3ConfirmedPhysicalTargets(key,system)??undefined;
          const index=BigInt(origin.sourceIdentity.bodyIndex);
          if(physical && index>=0n && index<BigInt(physical.planetCount)){
            const produced=Vida8LocalOriginDiscovery.findInSystem({
              universeSeed:request.universeSeed,generatorVersionCode:3,
              galaxyIndex:id.galaxyIndex,sectorKey:id.sectorKey,
              galacticObjectIndex:id.galacticObjectIndex},physical.planetCount,
              i=>i===index ? physical!.resolvePlanet(new BodyLocator(
                request.galaxyIndex,request.sectorKey,request.galacticObjectIndex,i)):null,false);
            found=produced.find(item=>item.ecosystem.bodyStorageKey===sourceId)??null;
          }
        }catch{/* fail closed */}
        historicalCache.set(sourceId,found);
      }
      witness=historicalCache.get(sourceId)??null;
    }else if(issue!=='VERIFIED')continue;
    let planetName:string|null=null;
    try{planetName=knownCivilizationPlanetNames(key,system,
      BigInt(origin.sourceIdentity.bodyIndex))?.planetName??null;}catch{/* fail closed */}
    const displayed=verifiedMoonColonyProvenance38BisA5(
      colony,record,source,confirmed,planetName,witness);
    if(displayed)results[colony.id]=displayed;
  }
  return Object.freeze(results);
}

@Injectable({providedIn:'root'})
export class MoonColonialProvenanceDataSource38BisA5 {
  private readonly db=new GenesisIndexedDb();
  read(record:Vida9BiologyRecord|null,request:PlanetMoonColonizationRequest386b,
    moonIndex:number):Promise<MoonColonialProvenances38BisA5>{
    return readMoonColonialProvenances38BisA5(this.db,record,request,moonIndex);
  }
}
