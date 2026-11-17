/** 38.bis-b5 — destinos de colonización de una especie civilizada.
 * Solo consulta VIDA.9 persistido del MISMO sistema ya confirmado; no genera
 * nuevas colonias ni divulga Ground Truth de sistemas desconocidos.
 */
import { Injectable } from '@angular/core';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieVida9BiologyExplorationRepository } from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import type { Vida8CivilizationSource } from '../../simulation/life/vida8-technological-colonization';
import { Vida8LocalOriginDiscovery } from '../../simulation/life/vida8-local-origin-discovery';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { knownCivilizationPlanetNames } from '../galaxy-knowledge-catalog/galaxy-civilization-known-index';
import { archiveMoonDesignation38BisA4 } from '../genesis-archive/38-bis/genesis-archive-moon-designation-38-bis-a4';
import { diagnoseColonyOrigin38Bis } from '../genesis-archive/38-bis/genesis-universal-archive-38-bis-origin-diagnostics';
import { reconcileColonyOrigin38Bis } from '../genesis-archive/38-bis/genesis-universal-archive-38-bis-origin-reconciliation';
import { vida9V3ConfirmedPhysicalTargets } from '../runtime/vida9-v3-confirmed-physical-targets';
import { vida38AuthorizeSpeciesRoute385, type Vida38KnowledgeRoute385 } from './vida38-acceso-ficha-38-5';

export interface Vida38ColonizedDestinationB5 {
  readonly bodyStorageKey: string;
  readonly kind: 'PLANET' | 'MOON';
  readonly title: string;
  readonly colonyCount: number;
  readonly route: readonly string[];
  readonly historicallyReconciled: boolean;
}
export interface Vida38SpeciesColoniesB5 {
  readonly planets: readonly Vida38ColonizedDestinationB5[];
  readonly moons: readonly Vida38ColonizedDestinationB5[];
  readonly totalColonies: number;
  /** Missing/corrupt VIDA.9 targets are not treated as zero colonies. */
  readonly partial: boolean;
}

/** Pure grouping: one planet/luna per destino, even with several colonies. */
export function groupVida38SpeciesColoniesB5(
  entries: readonly Vida38ColonizedDestinationB5[], partial = false,
): Vida38SpeciesColoniesB5 {
  const byBody = new Map<string,Vida38ColonizedDestinationB5>();
  for (const entry of entries) {
    const existing = byBody.get(entry.bodyStorageKey);
    if (existing) {
      byBody.set(entry.bodyStorageKey, Object.freeze({
        ...existing, colonyCount: existing.colonyCount + entry.colonyCount,
        historicallyReconciled: existing.historicallyReconciled || entry.historicallyReconciled,
      }));
    } else byBody.set(entry.bodyStorageKey, entry);
  }
  const sorted = [...byBody.values()].sort((a,b) =>
    a.title.localeCompare(b.title,'es') || a.bodyStorageKey.localeCompare(b.bodyStorageKey));
  return Object.freeze({
    planets: Object.freeze(sorted.filter(x=>x.kind==='PLANET')),
    moons: Object.freeze(sorted.filter(x=>x.kind==='MOON')),
    totalColonies: sorted.reduce((sum,x)=>sum+x.colonyCount,0),
    partial,
  });
}

/** Input must already be authorized by the species fiche; repeat the gate at
 * the data boundary before reading any PRIVATE row. */
export interface Vida38SpeciesColoniesRequestB5 {
  readonly model: Vida38KnowledgeRoute385;
  readonly bodyIndex: bigint;
  readonly speciesId: string;
  readonly visibleSourceRecord: Vida9BiologyRecord;
}

export async function readVida38SpeciesColoniesB5(
  db:GenesisIndexedDb, request:Vida38SpeciesColoniesRequestB5,
):Promise<Vida38SpeciesColoniesB5|null> {
  const {model,bodyIndex,speciesId,visibleSourceRecord} = request;
  if(model.discoveryState.code < DiscoveryState.CONFIRMED.code ||
      !vida38AuthorizeSpeciesRoute385(model,bodyIndex,null,false,visibleSourceRecord,speciesId)?.civilization ||
      visibleSourceRecord.identity.kind!=='PLANET')return null;

  const seed=model.universeSeed, version=3;
  const systemId=[model.galaxyIndex,model.sectorKey,model.galacticObjectIndex].join('/');
  const repo=new DexieVida9BiologyExplorationRepository(db);
  let source:Vida9BiologyRecord|null;
  try{source=await repo.get(seed,version,visibleSourceRecord.bodyStorageKey);}
  catch{return null;}
  if(!source || !source.nativeCivilizationPresent ||
      source.identity.kind!=='PLANET' || source.bodyStorageKey!==visibleSourceRecord.bodyStorageKey ||
      source.intelligence.civilization?.founderSpeciesId!==speciesId ||
      source.intelligence.intelligentSpecies?.speciesId!==speciesId ||
      !source.ecosystem.species.some(s=>s.id===speciesId))return null;

  const key=new UniverseGenerationKey(UniverseSeed.parse(seed),GeneratorVersion.V3);
  const system=new SystemLocator(model.galaxyIndex,model.sectorKey,model.galacticObjectIndex);
  const confirmed=new Set([systemId]);
  let witness:Vida8CivilizationSource|null|undefined;
  const historicSource=():Vida8CivilizationSource|null=>{
    if(witness!==undefined)return witness;
    witness=null;
    try{
      const physical=vida9V3ConfirmedPhysicalTargets(key,system);
      if(physical && bodyIndex>=0n && bodyIndex<BigInt(physical.planetCount)){
        const found=Vida8LocalOriginDiscovery.findInSystem({
          universeSeed:seed,generatorVersionCode:version,
          galaxyIndex:model.galaxyIndex.toString(),sectorKey:model.sectorKey.toString(),
          galacticObjectIndex:model.galacticObjectIndex.toString(),
        },physical.planetCount,i=>i===bodyIndex ? physical.resolvePlanet(new BodyLocator(
          model.galaxyIndex,model.sectorKey,model.galacticObjectIndex,i)):null,false);
        witness=found.find(x=>x.ecosystem.bodyStorageKey===source!.bodyStorageKey)??null;
      }
    }catch{/* No proof: leave the destination unattributed. */}
    return witness;
  };

  await db.openDatabase();
  const candidateKeys:string[]=[];
  await db.privateBiologicalRecordsVIDA9
    .where('[universeSeed+generatorVersionCode+systemStorageKey]')
    .equals([seed,version,systemId])
    .each(row=>{
      if(row.payloadJson.includes('"colonialPopulationPresent":true'))candidateKeys.push(row.bodyStorageKey);
    });
  const entries:Vida38ColonizedDestinationB5[]=[];
  let partial=false;
  const names=new Map<string,string|null>();
  for(const bodyKey of candidateKeys){
    let target:Vida9BiologyRecord|null;
    try{target=await repo.get(seed,version,bodyKey);}catch{partial=true;continue;}
    if(!target){partial=true;continue;}
    const id=target.identity;
    if([id.galaxyIndex,id.sectorKey,id.galacticObjectIndex].join('/')!==systemId ||
        target.bodyStorageKey===source.bodyStorageKey ||
        (id.kind!=='PLANET'&&id.kind!=='MOON') ||
        target.colonization.bodyStorageKey!==target.bodyStorageKey ||
        target.colonization.identity.kind!==id.kind ||
        target.colonization.colonies.length===0)continue;
    let count=0,historical=false;
    for(const colony of target.colonization.colonies){
      if(colony.origin.sourceBodyStorageKey!==source.bodyStorageKey ||
          colony.origin.founderSpeciesId!==speciesId)continue;
      const issue=diagnoseColonyOrigin38Bis(colony.origin,target,source,confirmed);
      const historicalWitness=issue==='SOURCE_DIGEST_MISMATCH'?historicSource():null;
      const decision=reconcileColonyOrigin38Bis(colony.origin,target,source,confirmed,
        colony,historicalWitness);
      if(decision.status==='UNRESOLVED'){partial=true;continue;}
      count++;
      if(decision.status==='HISTORICALLY_RECONCILED')historical=true;
    }
    if(!count)continue;
    if(!names.has(id.bodyIndex)){
      let planetName:string|null=null;
      try{planetName=knownCivilizationPlanetNames(key,system,BigInt(id.bodyIndex))?.planetName??null;}
      catch{/* No public designation: never synthesize a scientific name. */}
      names.set(id.bodyIndex,planetName);
    }
    const planetName=names.get(id.bodyIndex)??null;
    const title=id.kind==='PLANET'?(planetName??'Planeta sin designación'):
      (planetName&&id.moonIndex!==null
        ?archiveMoonDesignation38BisA4(planetName,id.moonIndex):'Luna sin designación');
    const route=['/system',id.galaxyIndex,id.sectorKey,id.galacticObjectIndex,
      'planet',id.bodyIndex];
    if(id.kind==='MOON' && id.moonIndex!==null)route.push('moon',id.moonIndex);
    entries.push(Object.freeze({bodyStorageKey:target.bodyStorageKey,kind:id.kind,
      title,colonyCount:count,route:Object.freeze(route),historicallyReconciled:historical}));
  }
  return groupVida38SpeciesColoniesB5(entries,partial);
}

@Injectable({providedIn:'root'})
export class Vida38SpeciesColoniesDataSourceB5 {
  private readonly db=new GenesisIndexedDb();
  read(request:Vida38SpeciesColoniesRequestB5):Promise<Vida38SpeciesColoniesB5|null>{
    return readVida38SpeciesColoniesB5(this.db,request);
  }
}
