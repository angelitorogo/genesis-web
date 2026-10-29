import { inject, Injectable } from '@angular/core';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { GALAXY_SCIENTIFIC_MODEL_VERSION, galaxyKnowledgeRevision } from '../runtime/galaxy-knowledge-snapshot.runtime';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { DiscoveryTargetType } from '../../domain/discovery/discovery-target-type';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { stellarMultihostPublicPlanetDesignation } from '../../simulation/stellar/stellar-multihost-public-designation';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import type { Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';
import type { Vida9BiologyRecord, Vida9BiologyStoredEntity } from '../../domain/life/vida9-biology-exploration';
import { VIDA9_REVISION, vida9DigestForRecord } from '../../domain/life/vida9-biology-exploration';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import { ensureVida9PlanetsInBackground } from '../runtime/vida9-background-materializer';

export type KnownCivilizationTier = Vida7CivilizationTier;
export const CIVILIZATION_TIER_LABELS: Readonly<Record<KnownCivilizationTier,string>> = Object.freeze({
  PRIMITIVE: 'Primitiva', ADVANCED: 'Avanzada', VERY_ADVANCED: 'Muy avanzada',
});
export const CIVILIZATION_LINEAGE_LABELS: Readonly<Record<string,string>> = Object.freeze({
  HUMANOID:'Humanoide', REPTILIAN:'Reptiliana', INSECTOID:'Insectoide',
});

export interface KnownGalacticCivilization {
  readonly id:string;
  readonly systemKey:string;
  readonly planetName:string;
  readonly systemName:string;
  readonly speciesName:string;
  readonly speciesId:string;
  readonly lineage:string;
  readonly tier:KnownCivilizationTier;
  readonly locator:Readonly<{galaxyIndex:string;sectorKey:string;galacticObjectIndex:string;bodyIndex:string}>;
}
export interface KnownGalacticCivilizationCensus {
  readonly entries:readonly KnownGalacticCivilization[];
  readonly primitive:number;
  readonly advanced:number;
  readonly veryAdvanced:number;
  readonly complete:boolean;
  readonly planetsWithBiologicalRecord:number;
  readonly knownPhysicalPlanets:number;
}

/** Only PLANET rows from CONFIRMED systems may reveal native VIDA.7 civilizations.
 * Do not infer a civilization from colonists, microbial life or a historical
 * CivilizationLocator. Never generate new bodies or write discovery state here. */
export function extractConfirmedCivilization(
  row:Vida9BiologyStoredEntity, confirmedSystems:ReadonlySet<string>,
):Vida9BiologyRecord|null {
  if (!row.bodyStorageKey.endsWith(':PLANET:-') || !confirmedSystems.has(row.systemStorageKey)) return null;
  if (!row.payloadJson.includes('"nativeCivilizationPresent":true')) return null;
  let record:Vida9BiologyRecord;
  try { record=JSON.parse(row.payloadJson) as Vida9BiologyRecord; }
  catch { throw Error('Registro biológico de civilización dañado'); }
  if (!record || record.revision!==VIDA9_REVISION || record.epoch!=='CT-0' ||
      record.epochOffsetYears!==0 || record.revealPolicy!=='FULL_SYSTEM_REVEAL_ON_CONFIRMED' ||
      record.bodyStorageKey!==row.bodyStorageKey || record.digest!==row.digest ||
      record.identity.universeSeed!==row.universeSeed ||
      record.identity.generatorVersionCode!==row.generatorVersionCode ||
      record.identity.kind!=='PLANET' ||
      [record.identity.galaxyIndex,record.identity.sectorKey,record.identity.galacticObjectIndex].join('/')!==row.systemStorageKey ||
      [record.identity.galaxyIndex,record.identity.sectorKey,record.identity.galacticObjectIndex,
        record.identity.bodyIndex,'PLANET','-'].join(':')!==row.bodyStorageKey ||
      !record.nativeCivilizationPresent || !record.intelligence.civilizationPresent ||
      !record.intelligence.civilization ||
      !['PRIMITIVE','ADVANCED','VERY_ADVANCED'].includes(record.intelligence.civilization.tier) ||
      !record.ecosystem.species.some(species=>species.id===record.intelligence.civilization?.founderSpeciesId))
    throw Error('Registro biológico de civilización incoherente; no revelar');
  const {digest,...payload}=record;
  if(vida9DigestForRecord(payload)!==digest)throw Error('Huella biológica de civilización incorrecta; no revelar');
  return record;
}

/** Recorrer primero las claves evita hidratar las decenas de miles de lunas.
 * Nunca confundir registros lunares ni otras galaxias con planetas nativos. */
export function planetVida9KeysInGalaxy(
  keys:readonly (readonly [string,number,string])[],
  galaxyIndex:bigint,
):readonly (readonly [string,number,string])[] {
  const prefix=galaxyIndex.toString()+':';
  return keys.filter(key=>key[2].startsWith(prefix)&&key[2].endsWith(':PLANET:-'));
}

/** A single system is resolved ONLY after finding a persisted native civilization.
 * Do not resolve the galaxy-wide physical snapshot or recompute VIDA.7. */
export function knownCivilizationPlanetNames(
  key:UniverseGenerationKey,
  system:SystemLocator,
  publicBodyIndex:bigint,
):Readonly<{systemName:string;planetName:string}>|null {
  const systemName=StellarDesignationGenerator.generate(multihostPhysicalSourceKey(key),system).name;
  const bodyIndex=Number(publicBodyIndex);
  if(!Number.isSafeInteger(bodyIndex)||bodyIndex<0)return null;
  const multiple=StellarMultihostFormation.generateOrNull(key,system);
  if(multiple!==null){
    const entry=multiple.publicPlanets[bodyIndex];
    return entry && entry.publicLocator.bodyIndex===publicBodyIndex ? Object.freeze({
      systemName,planetName:stellarMultihostPublicPlanetDesignation(systemName,entry.host,entry.sourcePlanetOrdinal),
    }):null;
  }
  const single=StellarMultihostFormation.generateSingleOrNull(key,system);
  const planet=single?.planets[bodyIndex];
  return planet ? Object.freeze({systemName,planetName:planet.designation.name}):null;
}

function censusOf(entries:readonly KnownGalacticCivilization[],recorded:number,
  inspected:number,complete:boolean):KnownGalacticCivilizationCensus{
  return Object.freeze({entries:Object.freeze([...entries]),
    primitive:entries.filter(e=>e.tier==='PRIMITIVE').length,
    advanced:entries.filter(e=>e.tier==='ADVANCED').length,
    veryAdvanced:entries.filter(e=>e.tier==='VERY_ADVANCED').length,
    complete,planetsWithBiologicalRecord:recorded,knownPhysicalPlanets:inspected});
}

/** Revision of the actually confirmed systems, not of hidden procedural bodies.
 * A new confirmation invalidates the materialized observed-knowledge projection. */
export function confirmedCivilizationKnowledgeRevision(confirmed:ReadonlySet<string>):string {
  const canonical=[...confirmed].sort().join('\n');
  return `CIVILIZACIONES-1-${bytesToHex(sha256(utf8ToBytes(canonical))).toUpperCase()}`;
}

/** A derived observed-knowledge fragment, never independent biological Ground Truth. */
export function restoreCivilizationKnowledgeIndex(json:string,confirmed:ReadonlySet<string>,
  galaxyIndex:bigint):KnownGalacticCivilizationCensus {
  const parsed=JSON.parse(json) as KnownGalacticCivilizationCensus;
  if (!parsed || !Array.isArray(parsed.entries) || parsed.complete!==true ||
      !Number.isSafeInteger(parsed.planetsWithBiologicalRecord) ||
      !Number.isSafeInteger(parsed.knownPhysicalPlanets) ||
      parsed.planetsWithBiologicalRecord!==parsed.knownPhysicalPlanets)
    throw new Error('Índice persistido de civilizaciones incompleto o dañado');
  const ids=new Set<string>();
  for(const entry of parsed.entries){
    if(!entry || !entry.locator || typeof entry.id!=='string' ||
        typeof entry.systemKey!=='string' || ids.has(entry.id) ||
        !confirmed.has(entry.systemKey) || entry.locator.galaxyIndex!==galaxyIndex.toString() ||
        !['PRIMITIVE','ADVANCED','VERY_ADVANCED'].includes(entry.tier) ||
        !entry.planetName || !entry.systemName || !entry.speciesName || !entry.speciesId ||
        !entry.lineage ||
        [entry.locator.galaxyIndex,entry.locator.sectorKey,
          entry.locator.galacticObjectIndex].join('/')!==entry.systemKey ||
        entry.id!==[entry.locator.galaxyIndex,entry.locator.sectorKey,
          entry.locator.galacticObjectIndex,entry.locator.bodyIndex,'PLANET','-'].join(':'))
      throw new Error('Índice persistido de civilizaciones contiene una identidad no confirmada');
    ids.add(entry.id);
  }
  if(parsed.primitive!==parsed.entries.filter(e=>e.tier==='PRIMITIVE').length ||
     parsed.advanced!==parsed.entries.filter(e=>e.tier==='ADVANCED').length ||
     parsed.veryAdvanced!==parsed.entries.filter(e=>e.tier==='VERY_ADVANCED').length)
    throw new Error('Índice persistido de civilizaciones no coincide con sus contadores');
  return censusOf(parsed.entries,parsed.planetsWithBiologicalRecord,
    parsed.knownPhysicalPlanets,true);
}

/** Only publish a complete read-model when *all* public, confirmed physical
 * planets have immutable VIDA.9 rows. A pending indexer cannot produce a
 * misleading definitive zero. A missing/stale physical snapshot is provisional. */
export function confirmedPhysicalPlanetCount(json:string|undefined,
  confirmed:ReadonlySet<string>):number|null{
  if(!json)return null;
  let raw:unknown;
  try { raw=JSON.parse(json); } catch { return null; }
  if(!raw || typeof raw!=='object' || !('planets' in raw) ||
      !Array.isArray(raw.planets))return null;
  const planets=raw.planets as Array<{locator?:{galaxyIndex?:unknown;sectorKey?:unknown;
    galacticObjectIndex?:unknown}|null;stateName?:string;orbitClass?:string}>;
  let count=0;
  const numberText=(part:unknown):string|null=> {
    if(typeof part==='string')return part;
    if(typeof part==='bigint')return String(part);
    if(typeof part==='object' && part!==null && '__genesisBigInt' in part){
      const value=(part as {__genesisBigInt:unknown}).__genesisBigInt;
      return typeof value==='string'?value:null;
    }
    return null;
  };
  for(const planet of planets){
    if(planet.stateName!=='CONFIRMED' || !planet.locator ||
        planet.orbitClass==='COMPACT_HOST')continue;
    const loc=planet.locator;
    const galaxy=numberText(loc.galaxyIndex),sector=numberText(loc.sectorKey),
      object=numberText(loc.galacticObjectIndex);
    if(galaxy===null || sector===null || object===null)return null;
    const key=[galaxy,sector,object].join('/');
    if(!confirmed.has(key))return null; // stale/contradictory physical snapshot
    count++;
  }
  // System without planets contributes zero; currency of the physical snapshot
  // must be checked separately using the full persisted knowledge revision.
  return count;
}

const yieldUi=():Promise<void>=>new Promise(resolve=>setTimeout(resolve,0));

@Injectable({providedIn:'root'})
export class GalaxyCivilizationKnownIndex {
  private readonly db=new GenesisIndexedDb();
  private readonly repositories=inject(GENESIS_LOCAL_REPOSITORIES);

  // Share an in-flight scan between the galactic inventory and its catalog.
  private readonly pending=new Map<string,{
    promise:Promise<KnownGalacticCivilizationCensus>;
    listeners:Set<(census:KnownGalacticCivilizationCensus)=>void>;
  }>();
  // El índice persistido se valida contra la lista actual de sistemas
  // confirmados en cada consulta. No conservar contadores en memoria que
  // puedan quedar obsoletos tras la siguiente confirmación.

  async read(key:UniverseGenerationKey,galaxyIndex:bigint,
    onProgress?:(census:KnownGalacticCivilizationCensus)=>void):Promise<KnownGalacticCivilizationCensus>{
    const id=[key.universeSeed.serialize(),key.generatorVersionCode,galaxyIndex].join('/');
    const existing=this.pending.get(id);
    if(existing){if(onProgress)existing.listeners.add(onProgress);return existing.promise;}
    const listeners=new Set<(census:KnownGalacticCivilizationCensus)=>void>();
    if(onProgress)listeners.add(onProgress);
    const promise=this.readFresh(key,galaxyIndex,partial=>{
      for(const listener of listeners)listener(partial);
    });
    this.pending.set(id,{promise,listeners});
    try{
      return await promise;
    }finally{this.pending.delete(id);}
  }

  /** Read-only, bounded work. NEVER build the full planet/moon galaxy catalogue. */
  private async readFresh(key:UniverseGenerationKey,galaxyIndex:bigint,
    progress:(value:KnownGalacticCivilizationCensus)=>void):Promise<KnownGalacticCivilizationCensus>{
    if(key.generatorVersion!==GeneratorVersion.V3)
      return censusOf([],0,0,false);
    const repository=this.repositories.discoveryRepository;
    const known=repository.getKnownDiscoveriesInGalaxy
      ? await repository.getKnownDiscoveriesInGalaxy(key,galaxyIndex,DiscoveryTargetType.SYSTEM.code)
      : (await repository.getKnownDiscoveries(key)).filter(d=>d.locator instanceof SystemLocator &&
          d.locator.galaxyIndex===galaxyIndex);
    const confirmed=new Set(known.filter(d=>d.locator instanceof SystemLocator &&
      d.state.code>=DiscoveryState.CONFIRMED.code).map(d=>{
        const loc=d.locator as SystemLocator;
        return [loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex].join('/');
      }));
    if(confirmed.size===0)return censusOf([],0,0,true);
    await this.db.openDatabase();
    const seed=key.universeSeed.serialize(),version=key.generatorVersionCode;
    const revision=confirmedCivilizationKnowledgeRevision(confirmed);
    const cacheKey: [string,number,string,number]=[seed,version,galaxyIndex.toString(),
      GALAXY_SCIENTIFIC_MODEL_VERSION];
    const saved=await this.db.galaxyKnowledgeSnapshots.get(cacheKey);
    if(saved?.civilizationKnowledgeRevision===revision && saved.civilizationKnowledgeJson){
      // Observed knowledge is read directly from the persisted galactic snapshot;
      // no private biological records or galaxy-wide procedural reconstruction.
      try {
        return restoreCivilizationKnowledgeIndex(saved.civilizationKnowledgeJson,confirmed,galaxyIndex);
      } catch {
        // A derived cache is replaceable; validate and rebuild it from the
        // immutable sources instead of trusting a damaged observed fragment.
      }
    }
    // A new game has no VIDA.9 rows yet, although the physical catalogue may
    // already list tens of thousands of CONFIRMED planets. The old read-only
    // scan returned a misleading 0. Materialize ONLY the confirmed planets in
    // the browser worker, reusing immutable VIDA.9 records. Do not start
    // 110,000 biological computations on Angular's main thread.
    const backfill=ensureVida9PlanetsInBackground(key,galaxyIndex,confirmed);
    if(backfill!==null){
      let outcome:Awaited<typeof backfill>|null=null;
      try { outcome=await backfill; }
      catch(error) {
        // Never convert a Worker/IDB failure into a fake galaxy with zero
        // civilizations. Keep any pre-existing valid VIDA.9 rows accessible.
        console.error('Civilizaciones: la materialización en segundo plano falló; se consultarán los registros disponibles.',error);
      }
      if(outcome!==null){
      if(outcome.problems?.length){
        console.warn('Civilizaciones: sistemas que requieren revisión física o biológica',
          outcome.problems.slice(0,20), 'Total:',outcome.problems.length);
      }
      const entries:KnownGalacticCivilization[]=[];
      let unresolvedCandidates=0;
      const candidates=[...new Set(outcome.candidates)];
      const names=new Map<string,Readonly<{systemName:string;planetName:string}>|null>();
      for(let start=0;start<candidates.length;start+=32){
        const rows=await this.db.privateBiologicalRecordsVIDA9.bulkGet(
          candidates.slice(start,start+32).map(body=>[seed,version,body] as [string,number,string]));
        for(const row of rows){
          if(!row){unresolvedCandidates++;continue;}
          let record:Vida9BiologyRecord|null=null;
          try {record=extractConfirmedCivilization(row,confirmed);}
          catch(error){
            console.error('Civilizaciones: registro biológico inválido, sin revelar',row.bodyStorageKey,error);
          }
          if(!record){unresolvedCandidates++;continue;}
          const identity=record.identity;
          const loc=new SystemLocator(BigInt(identity.galaxyIndex),BigInt(identity.sectorKey),
            BigInt(identity.galacticObjectIndex));
          const nameKey=row.systemStorageKey+'/'+identity.bodyIndex;
          let designation=names.get(nameKey);
          if(designation===undefined){
            designation=knownCivilizationPlanetNames(key,loc,BigInt(identity.bodyIndex));
            names.set(nameKey,designation);
          }
          if(!designation){unresolvedCandidates++;continue;}
          const civilization=record.intelligence.civilization!;
          const species=record.ecosystem.species.find(s=>s.id===civilization.founderSpeciesId)!;
          entries.push(Object.freeze({id:row.bodyStorageKey,systemKey:row.systemStorageKey,
            planetName:designation.planetName,systemName:designation.systemName,
            speciesName:species.proceduralName,speciesId:species.id,
            lineage:CIVILIZATION_LINEAGE_LABELS[civilization.lineage]??'No clasificado',
            tier:civilization.tier,locator:Object.freeze({galaxyIndex:identity.galaxyIndex,
              sectorKey:identity.sectorKey,galacticObjectIndex:identity.galacticObjectIndex,
              bodyIndex:identity.bodyIndex})}));
        }
      }
      // Compact hosts and documented systems without an applicable physical
      // model are not biological negatives. The worker counts exactly the
      // physically evaluable V3 bodies, rather than all catalogued identities.
      // The physical inventory is the authoritative count of CONFIRMED
      // planets. The worker may not certify a zero merely because every
      // source failed to resolve (or was skipped as a known physical gap).
      let physicalCount:number|null=null;
      if(saved?.planetMoonCatalogJson){
        const allPhysicalKnown=repository.getKnownDiscoveriesInGalaxy
          ? await repository.getKnownDiscoveriesInGalaxy(key,galaxyIndex)
          : (await repository.getKnownDiscoveries(key)).filter(d=>d.locator.galaxyIndex===galaxyIndex);
        if(saved.knowledgeRevision===galaxyKnowledgeRevision(galaxyIndex,allPhysicalKnown))
          physicalCount=confirmedPhysicalPlanetCount(saved.planetMoonCatalogJson,confirmed);
      }
      const complete=outcome.indexed===outcome.expected && (outcome.problems?.length??0)===0 &&
        unresolvedCandidates===0 && (physicalCount===null || outcome.expected===physicalCount);
      const result=censusOf(entries,outcome.indexed,outcome.expected,complete);
      if(complete){
        const allKnown=repository.getKnownDiscoveriesInGalaxy
          ? await repository.getKnownDiscoveriesInGalaxy(key,galaxyIndex)
          : (await repository.getKnownDiscoveries(key)).filter(d=>d.locator.galaxyIndex===galaxyIndex);
        const currentRevision=galaxyKnowledgeRevision(galaxyIndex,allKnown);
        // Recheck the confirmed-system revision before writing the derived view.
        const latest=repository.getKnownDiscoveriesInGalaxy
          ? await repository.getKnownDiscoveriesInGalaxy(key,galaxyIndex,DiscoveryTargetType.SYSTEM.code)
          : (await repository.getKnownDiscoveries(key)).filter(d=>d.locator instanceof SystemLocator &&
              d.locator.galaxyIndex===galaxyIndex);
        const newest=new Set(latest.filter(d=>d.locator instanceof SystemLocator &&
          d.state.code>=DiscoveryState.CONFIRMED.code).map(d=>{
            const loc=d.locator as SystemLocator;
            return [loc.galaxyIndex,loc.sectorKey,loc.galacticObjectIndex].join('/');
          }));
        if(confirmedCivilizationKnowledgeRevision(newest)!==revision)return result;
        await this.db.transaction('rw',this.db.galaxyKnowledgeSnapshots,async()=>{
          const present=await this.db.galaxyKnowledgeSnapshots.get(cacheKey);
          const payload={...(present?.knowledgeRevision===currentRevision?present:{}),
            universeSeed:seed,generatorVersionCode:version,galaxyIndex:String(galaxyIndex),
            scientificModelVersion:GALAXY_SCIENTIFIC_MODEL_VERSION,
            knowledgeRevision:currentRevision,civilizationKnowledgeRevision:revision,
            civilizationKnowledgeJson:JSON.stringify(result),updatedAtEpochMs:Date.now()};
          await this.db.galaxyKnowledgeSnapshots.put(payload);
        });
      }
      return result;
      }
    }
    // One-time projection for old confirmed games; subsequently the derived
    // snapshot is the same persisted knowledge surface used by planet/moon lists.
    const prefix=galaxyIndex.toString()+':';
    // Dexie primaryKeys reads indexed keys, NOT 80,000+ complete lunar JSON bodies.
    const keys=await this.db.privateBiologicalRecordsVIDA9
      .where('[universeSeed+generatorVersionCode+bodyStorageKey]')
      .between([seed,version,prefix],[seed,version,prefix+'\uffff'])
      .primaryKeys();
    const planets=planetVida9KeysInGalaxy(
      keys as unknown as readonly (readonly [string,number,string])[],galaxyIndex);
    const entries:KnownGalacticCivilization[]=[];
    const names=new Map<string,Readonly<{systemName:string;planetName:string}>|null>();
    let recorded=0,scanned=0,unresolvedNames=0;
    for(let start=0;start<planets.length;start+=128){
      const rows=await this.db.privateBiologicalRecordsVIDA9.bulkGet(
        planets.slice(start,start+128).map(item=>[...item] as [string,number,string]));
      for(const row of rows){
        scanned++;
        if(!row || !confirmed.has(row.systemStorageKey))continue;
        recorded++;
        const record=extractConfirmedCivilization(row,confirmed);
        if(!record)continue;
        const identity=record.identity;
        const system=new SystemLocator(BigInt(identity.galaxyIndex),BigInt(identity.sectorKey),
          BigInt(identity.galacticObjectIndex));
        const systemId=row.systemStorageKey+'/'+identity.bodyIndex;
        let designation=names.get(systemId);
        if(designation===undefined){
          designation=knownCivilizationPlanetNames(key,system,BigInt(identity.bodyIndex));
          names.set(systemId,designation);
        }
        if(!designation){unresolvedNames++;continue;}
        const civilization=record.intelligence.civilization!;
        const species=record.ecosystem.species.find(s=>s.id===civilization.founderSpeciesId)!;
        entries.push(Object.freeze({id:row.bodyStorageKey,systemKey:row.systemStorageKey,
          planetName:designation.planetName,systemName:designation.systemName,
          speciesName:species.proceduralName,speciesId:species.id,
          lineage:CIVILIZATION_LINEAGE_LABELS[civilization.lineage]??'No clasificado',tier:civilization.tier,
          locator:Object.freeze({galaxyIndex:identity.galaxyIndex,sectorKey:identity.sectorKey,
            galacticObjectIndex:identity.galacticObjectIndex,bodyIndex:identity.bodyIndex})}));
      }
      // A partial census is better than a spinner with an unknown completion time.
      if(start%1024===0 || start+128>=planets.length)
        progress(censusOf(entries,recorded,scanned,false));
      await yieldUi();
    }
    // Only a physical, confirmed catalogue can certify completeness.
    // Do not freeze an incomplete VIDA.9 backfill as the definitive inventory.
    let expected:number|null=null;
    if(saved?.planetMoonCatalogJson){
      const fullKnown=repository.getKnownDiscoveriesInGalaxy
        ? await repository.getKnownDiscoveriesInGalaxy(key,galaxyIndex)
        : (await repository.getKnownDiscoveries(key)).filter(d=>d.locator.galaxyIndex===galaxyIndex);
      // Only a current, canonical physical read model can certify expected rows.
      if(saved.knowledgeRevision===galaxyKnowledgeRevision(galaxyIndex,fullKnown))
        expected=confirmedPhysicalPlanetCount(saved.planetMoonCatalogJson,confirmed);
    }
    const complete=expected!==null && expected===recorded && unresolvedNames===0;
    const result=censusOf(entries,recorded,expected??scanned,complete);
    if(complete){
      await this.db.transaction('rw',this.db.galaxyKnowledgeSnapshots,async()=>{
        const current=await this.db.galaxyKnowledgeSnapshots.get(cacheKey);
        // Do not overwrite a newer scientific fragment or create a standalone
        // row with an artificial global knowledge revision.
        if(!current || current.planetMoonCatalogJson!==saved?.planetMoonCatalogJson)return;
        await this.db.galaxyKnowledgeSnapshots.update(cacheKey,{
          civilizationKnowledgeRevision:revision,
          civilizationKnowledgeJson:JSON.stringify(result),
          updatedAtEpochMs:Date.now(),
        });
      });
    }
    return result;
  }
}
