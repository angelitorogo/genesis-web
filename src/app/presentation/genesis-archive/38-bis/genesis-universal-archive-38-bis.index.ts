/** 38.bis · Read-only adapter from existing galactic catalogues to a disposable
 * global IndexedDB index. All source categories retain their original knowledge
 * policy; VIDA.8 is projected only from validated CT-0 confirmed VIDA.9 rows.
 */
import {inject,Injectable} from '@angular/core';
import {DiscoveryState} from '../../../domain/discovery/discovery-state';
import type {KnownDiscovery} from '../../../domain/discovery/known-discovery';
import {isConfirmedScientificGalaxy38BisB7} from '../../../domain/exploration/scientific-confirmation-38-bis-b7';
import {archiveMoonDesignation38BisA4} from './genesis-archive-moon-designation-38-bis-a4';
import {archiveSharedFounderA6} from './genesis-universal-archive-public-labels-a6';
import {archivePageBiologyLocator38BisB1,archiveObservedLife38BisB1}
  from './genesis-universal-archive-biology-page-38-bis-b1';
import {GalaxyLocator,SystemLocator,SectorLocator,BodyLocator} from '../../../domain/generation/procedural-locator';
import {GalaxySectorKeyCodec} from '../../../domain/sector/galaxy-sector-key-codec';
import type {UniverseGenerationKey} from '../../../domain/generation/universe-generation-key';
import {GalaxyGeneralProfileEngine} from '../../../simulation/exploration/galaxy-general-profile-engine';
import {GenesisIndexedDb} from '../../../data/local/indexed-db/genesis-indexed-db';
import {DexieVida9BiologyExplorationRepository} from '../../../data/local/repository/dexie-vida9-biology-exploration.repository';
import {VIDA8_REVISION,type Vida8OriginRef} from '../../../domain/life/vida8-technological-colonization';
import {Vida8LocalOriginDiscovery} from '../../../simulation/life/vida8-local-origin-discovery';
import type {Vida8CivilizationSource} from '../../../simulation/life/vida8-technological-colonization';
import {vida9V3ConfirmedPhysicalTargets} from '../../runtime/vida9-v3-confirmed-physical-targets';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';
import {GENESIS_LOCAL_REPOSITORIES} from '../../runtime/genesis-local-repositories';
import {galaxyKnowledgeRevision,GALAXY_SCIENTIFIC_MODEL_VERSION} from '../../runtime/galaxy-knowledge-snapshot.runtime';
import {GALAXY_KNOWLEDGE_CATALOG_DATA_SOURCE} from '../../galaxy-knowledge-catalog/galaxy-knowledge-catalog.data-source';
import type {GalaxyKnowledgeCatalogCategory,GalaxyKnowledgeCatalogQuery,GalaxyKnowledgeCatalogRow} from '../../galaxy-knowledge-catalog/galaxy-knowledge-catalog.model';
import {knownCivilizationPlanetNames,extractConfirmedCivilization,
  confirmedCivilizationKnowledgeRevision,restoreCivilizationKnowledgeIndex,
  CIVILIZATION_TIER_LABELS,CIVILIZATION_LINEAGE_LABELS,type KnownGalacticCivilization} 
  from '../../galaxy-knowledge-catalog/galaxy-civilization-known-index';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';
import {
  type UniversalArchiveAction38Bis, type UniversalArchiveCategory38Bis,
  type UniversalArchiveIndexedCategory38Bis, type UniversalArchiveRow38Bis,
  type ArchiveColonyOriginIssue38Bis, ARCHIVE_COLONY_ORIGIN_ISSUES_38BIS,
  type UniversalArchiveSection38Bis, type UniversalArchiveVerifiedFounder38Bis, universalArchiveCivilizationSubtype38Bis,
  universalArchiveSearchKey38Bis, GENESIS_UNIVERSAL_ARCHIVE_REVISION_38BIS,
} from './genesis-universal-archive-38-bis.model';
import {summarizeArchiveColonies38Bis} from './genesis-universal-archive-38-bis-colonization-stats';
import {archiveColonialPopulation38BisT7,archiveColonialPopulationLabel38BisT7}
  from './genesis-universal-archive-colonial-population-38bis-t7';
import {diagnoseColonyOrigin38Bis} from './genesis-universal-archive-38-bis-origin-diagnostics';
import {reconcileColonyOrigin38Bis} from './genesis-universal-archive-38-bis-origin-reconciliation';
export {diagnoseColonyOrigin38Bis} from './genesis-universal-archive-38-bis-origin-diagnostics';

export interface KnownArchiveGalaxy38Bis {
  readonly index:string;
  readonly title:string;
  readonly stateCode:number;
}

const COLONY_CATEGORIES=new Set<UniversalArchiveCategory38Bis>(['colonies','colonized-planets','colonized-moons']);
const SOURCE_PAGE_SIZE=100;

/** Source catalogue exposes localized family labels; archive filters use stable codes. */
export function universalArchiveExtremeFamily38Bis(value:string):string {
  const families:Readonly<Record<string,string>>={
    'Núcleo galáctico':'GALACTIC_NUCLEUS',
    'Estrella de neutrones':'NEUTRON_STAR',
    'Agujero negro':'BLACK_HOLE',
    'Remanente de supernova':'SUPERNOVA_REMNANT',
    'Binaria compacta':'COMPACT_BINARY',
    'Fuente de alta energía':'HIGH_ENERGY_SOURCE',
  };
  return families[value]??'UNCLASSIFIED';
}


export function archive38BisScope(key:UniverseGenerationKey):string {
  return [GENESIS_UNIVERSAL_ARCHIVE_REVISION_38BIS,key.universeSeed.serialize(),key.generatorVersionCode].join('|');
}

export function confirmedSystems38Bis(known:readonly Readonly<{locator:unknown;state:Readonly<{code:number}>}>[]):ReadonlySet<string> {
  return new Set(known.filter(d=>d.locator instanceof SystemLocator &&
    d.state.code===DiscoveryState.CONFIRMED.code).map(d=>{
      const l=d.locator as SystemLocator;
      return [l.galaxyIndex,l.sectorKey,l.galacticObjectIndex].join('/');
    }));
}

/** Independent check for colony semantics, after the productive VIDA.9 repository digest check. */
export function validatedColonies38Bis(record:Vida9BiologyRecord|null):Vida9BiologyRecord['colonization']['colonies']|null {
  if(!record || record.identity.generatorVersionCode!==3 || record.epoch!=='CT-0' ||
      record.epochOffsetYears!==0 || record.revealPolicy!=='FULL_SYSTEM_REVEAL_ON_CONFIRMED' ||
      !['PLANET','MOON'].includes(record.identity.kind))return null;
  const c=record.colonization;
  if(!c || c.revision!==VIDA8_REVISION || c.bodyStorageKey!==record.bodyStorageKey ||
      c.identity.universeSeed!==record.identity.universeSeed ||
      c.identity.generatorVersionCode!==record.identity.generatorVersionCode ||
      c.identity.galaxyIndex!==record.identity.galaxyIndex ||
      c.identity.sectorKey!==record.identity.sectorKey ||
      c.identity.galacticObjectIndex!==record.identity.galacticObjectIndex ||
      c.identity.bodyIndex!==record.identity.bodyIndex ||
      c.identity.kind!==record.identity.kind ||
      (c.identity.moonIndex??null)!==(record.identity.moonIndex??null) ||
      c.ecosystemDigest!==record.ecosystem.digest ||
      c.nativeCivilizationDigest!==record.intelligence.digest ||
      !Array.isArray(c.colonies) || c.colonialPopulationPresent!==(c.colonies.length>0) ||
      record.colonialPopulationPresent!==(c.colonies.length>0) ||
      (c.outcome==='COLONIZED')!==(c.colonies.length>0))return null;
  const ids=new Set<string>();
  for(const colony of c.colonies){
    if(!colony || colony.provenance!=='TECHNOLOGICAL_COLONIZATION' ||
      typeof colony.id!=='string' || !colony.id || ids.has(colony.id) ||
      !colony.settlement?.id || !colony.origin?.sourceBodyStorageKey ||
      colony.origin.sourceBodyStorageKey===record.bodyStorageKey ||
      !['SEALED_SURFACE','SUBSURFACE_VAULT','ENVIRONMENTAL_SHIELD'].includes(colony.settlement.habitatTechnology) ||
      !['RESEARCH','EXTRACTION','HABITATION','BIOSPHERE_CONSERVATION'].includes(colony.settlement.function) ||
      !['ADVANCED','VERY_ADVANCED'].includes(colony.origin.tier))return null;
    ids.add(colony.id);
  }
  return c.colonies;
}

/** Source must be a separately persisted, digest-validated native civilization
 * in the SAME confirmed system. A colonial ref by itself cannot unlock a route. */
/** Compatibility predicate, now backed by the same diagnostic decision tree. */
export function verifiedColonySource38Bis(origin:Vida8OriginRef,
  target:Vida9BiologyRecord,source:Vida9BiologyRecord|null,
  confirmed:ReadonlySet<string>):boolean {
  return diagnoseColonyOrigin38Bis(origin,target,source,confirmed)==='VERIFIED';
}

function archiveBodyRoute(record:Vida9BiologyRecord):readonly string[] {
  const id=record.identity;
  const base=['/system',id.galaxyIndex,id.sectorKey,id.galacticObjectIndex,'planet',id.bodyIndex];
  return id.kind==='MOON' && id.moonIndex!==null
    ? [...base,'moon',id.moonIndex] : base;
}

function colonyLabel(kind:'PLANET'|'MOON'):string{return kind==='MOON'?'Luna':'Planeta';}
function colonyTechnology(value:string):string {
  return ({SEALED_SURFACE:'Superficie sellada',SUBSURFACE_VAULT:'Subsuperficie',
    ENVIRONMENTAL_SHIELD:'Escudo ambiental'} as Record<string,string>)[value]??'No clasificada';
}
function colonyFunction(value:string):string {
  return ({RESEARCH:'Investigación',EXTRACTION:'Extracción',HABITATION:'Habitación',
    BIOSPHERE_CONSERVATION:'Conservación de biosfera'} as Record<string,string>)[value]??'No clasificada';
}

function archiveRowId(scope:string,category:UniversalArchiveIndexedCategory38Bis,
  galaxyIndex:string,id:string):string {return JSON.stringify([scope,category,galaxyIndex,id]);}

function wrapRow(scope:string,category:UniversalArchiveIndexedCategory38Bis,
  galaxyIndex:string,row:GalaxyKnowledgeCatalogRow):UniversalArchiveRow38Bis {
  const title=row.title.trim()||'Sin designación';
  const subtype=category==='stars' ? (row.cells['evolution']??'ALL')
    : category==='civilizations'
    ? universalArchiveCivilizationSubtype38Bis(row.cells['tier']??'')
    : category==='extremes' ? universalArchiveExtremeFamily38Bis(row.cells['family']??'') : 'ALL';
  return Object.freeze({id:archiveRowId(scope,category,galaxyIndex,row.id),scope,category,
    galaxyIndex,subtype,sortTitle:universalArchiveSearchKey38Bis(title)+'\u0000'+row.id,
    title,subtitle:row.subtitle??'',cells:Object.freeze({...row.cells} as Record<string,string>),
    ...(row.sortNumbers?{sortNumbers:Object.freeze({...row.sortNumbers})}:{}),
    actions:Object.freeze(row.actions.map(action=>Object.freeze({label:action.label,
      route:Object.freeze(action.route.map(String)),
      ...(action.queryParams?{queryParams:Object.freeze({...action.queryParams})}:{})}))),
  });
}

export function projectColonyRow(scope:string,category:UniversalArchiveIndexedCategory38Bis,galaxyIndex:string,
  record:Vida9BiologyRecord,label:string,system:string,colonies:readonly NonNullable<Vida9BiologyRecord['colonization']>['colonies'][number][],
  colony?:NonNullable<Vida9BiologyRecord['colonization']>['colonies'][number],
  founder?:UniversalArchiveVerifiedFounder38Bis,
  originIssue?:ArchiveColonyOriginIssue38Bis,
  historical=false,drift?:UniversalArchiveRow38Bis['colonyDigestDrift'],
  hostPlanetName?:string):UniversalArchiveRow38Bis {
  const chosen=colony??colonies[0]!;
  const count=colonies.length;
  const colonyOrdinal=colony?colonies.findIndex(entry=>entry.id===colony.id)+1:0;
  const population=archiveColonialPopulation38BisT7(colony?[colony]:colonies);
  const title=colony?`${label} · Colonia ${colonyOrdinal}`:label;
  const id=archiveRowId(scope,category,galaxyIndex,record.bodyStorageKey+(colony?'|'+colony.id:''));
  return Object.freeze({id,scope,category,galaxyIndex,
    subtype:record.identity.kind,sortTitle:universalArchiveSearchKey38Bis(title)+'\u0000'+id,
    title,subtitle:colony?'Colonia tecnológica':`${count} ${count===1?'colonia verificada':'colonias verificadas'}`,
    ...(colony?{colonyOriginTier:colony.origin.tier,
      ...(founder?{colonyFounder:founder}:{colonyOriginIssue:originIssue??'NOT_DIAGNOSED'}),
      ...(historical&&founder?{historicalOriginReconciled:true}:{}),
      ...(drift&&drift!=='NONE'&&drift!=='NOT_COMPARABLE'?{colonyDigestDrift:drift}:{})}:{}),
    cells:Object.freeze({system,body:label,kind:colonyLabel(record.identity.kind),
      ...(record.identity.kind==='MOON'&&hostPlanetName?{planet:hostPlanetName}:{}),
      count:String(colony?1:count),
      population:archiveColonialPopulationLabel38BisT7(population),
      ...(founder?.speciesName&&founder.planetName?{
        species:founder.speciesName,originPlanet:founder.planetName}:{}),
      ...(!founder?{origin:colony?
        'Origen no verificable · '+ARCHIVE_COLONY_ORIGIN_ISSUES_38BIS[originIssue??'NOT_DIAGNOSED']:
        'Las colonias tienen diferentes procedencias o su origen no está confirmado'}:{}),
      technology:colony?colonyTechnology(colony.settlement.habitatTechnology):'Varias instalaciones',
      purpose:colony?colonyFunction(colony.settlement.function):'Consultar ficha',
      tier:chosen.origin.tier==='VERY_ADVANCED'?'Muy avanzada':'Avanzada'}),
    sortNumbers:Object.freeze({population:population?.midpoint??null}),
    actions:Object.freeze([{label:'Abrir ficha del cuerpo',route:archiveBodyRoute(record)},
      ...(founder?[{label:'Ver mundo natal',route:founder.route}]:[])]),
  });
}

@Injectable({providedIn:'root'})
export class GenesisUniversalArchiveIndex38Bis {
  private readonly repository=inject(GENESIS_LOCAL_REPOSITORIES);
  private readonly catalog=inject(GALAXY_KNOWLEDGE_CATALOG_DATA_SOURCE);
  private readonly sourceDb=new GenesisIndexedDb();
  readonly store=new GenesisUniversalArchiveStore38Bis();
  private readonly pending=new Map<string,Promise<UniversalArchiveSection38Bis>>();
  // Small derived read-model only: no private VIDA.9 payload is retained here.
  private readonly colonialProjectionCache=new Map<string,ReadonlyMap<UniversalArchiveIndexedCategory38Bis,UniversalArchiveRow38Bis[]>>();

  /** ARCHFAST.1: a bounded, short-lived snapshot shared only by the automatic
   * maintenance of ONE galaxy. Normal UI requests retain their independent
   * revision checks. A new local scientific commit invalidates it immediately.
   * The bulk-confirmation Web Lock prevents concurrent bulk writes in other tabs. */
  private archiveFastSnapshot: {
    readonly identity:string;
    readonly expiresAt:number;
    readonly known:readonly KnownDiscovery[];
    readonly revision:string;
    readonly biological:Map<'public'|'all',Readonly<{count:number;revision:string}>>;
  }|null=null;

  invalidateArchiveFastGalaxy(key:UniverseGenerationKey,galaxyIndex:string):void {
    if(this.archiveFastSnapshot?.identity===JSON.stringify([archive38BisScope(key),galaxyIndex]))
      this.archiveFastSnapshot=null;
  }

  releaseArchiveFastGalaxy(key:UniverseGenerationKey,galaxyIndex:string):void {
    this.invalidateArchiveFastGalaxy(key,galaxyIndex);
  }


  async knownGalaxies(key:UniverseGenerationKey):Promise<readonly KnownArchiveGalaxy38Bis[]> {
    await this.sourceDb.openDatabase();
    const seed=key.universeSeed.serialize(),version=key.generatorVersionCode;
    const candidates=await this.sourceDb.discoveries.where('targetTypeCode').equals(1)
      .filter(d=>d.universeSeed===seed && d.generatorVersionCode===version && d.discoveryStateCode===DiscoveryState.CONFIRMED.code).toArray();
    const indices=[...new Set(candidates.map(d=>d.galaxyIndex))]
      .filter(id=>/^(0|[1-9]\d*)$/.test(id))
      .sort((a,b)=>BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0);
    const result:KnownArchiveGalaxy38Bis[]=[];
    for(const index of indices){
      const state=await this.repository.discoveryRepository.getState(key,new GalaxyLocator(BigInt(index)));
      if(!isConfirmedScientificGalaxy38BisB7(state))continue;
      const profile=GalaxyGeneralProfileEngine.build(key,BigInt(index),state);
      result.push(Object.freeze({index,title:profile.knownName??profile.designationCode,
        stateCode:state.code}));
    }
    return Object.freeze(result);
  }

  /** Detalle biológico de la página visible: nunca escanea miles de objetos,
   * nunca genera registros y no almacena indicadores privados en el índice. */
  async enrichVisibleBiologyB1(key:UniverseGenerationKey,
    rows:readonly UniversalArchiveRow38Bis[]):Promise<readonly UniversalArchiveRow38Bis[]> {
    if(!rows.some(r=>r.category==='planets'||r.category==='moons'))return rows;
    const repo=new DexieVida9BiologyExplorationRepository(this.sourceDb);
    const systemStates=new Map<string,Promise<boolean>>();
    const seed=key.universeSeed.serialize(),version=key.generatorVersionCode;
    await this.sourceDb.openDatabase();
    const project=async(row:UniversalArchiveRow38Bis):Promise<UniversalArchiveRow38Bis>=>{
      const locator=archivePageBiologyLocator38BisB1(row);
      if(!locator)return row;
      let allowed=systemStates.get(locator.systemStorageKey);
      if(!allowed){
        allowed=this.repository.discoveryRepository.getState(key,new SystemLocator(
          BigInt(locator.galaxyIndex),BigInt(locator.sectorKey),BigInt(locator.galacticObjectIndex)))
          .then(state=>state.code===DiscoveryState.CONFIRMED.code)
          .catch(()=>false);
        systemStates.set(locator.systemStorageKey,allowed);
      }
      let life='No evaluable',colonies='No evaluable',civilization='No evaluable';
      if(await allowed){
        try{
          const record=await repo.get(seed,version,locator.bodyStorageKey);
          const validColonies=validatedColonies38Bis(record);
          if(record && validColonies!==null){
            life=archiveObservedLife38BisB1(record);
            colonies=validColonies.length>0?'Sí':'No';
            // Native civilization is separate from introduced colonies.
            // An inconsistent VIDA.7 snapshot must remain undetermined.
            const consistentNative=record.nativeCivilizationPresent===record.intelligence.civilizationPresent &&
              record.nativeCivilizationPresent===(record.intelligence.civilization!=null);
            if(consistentNative)civilization=record.nativeCivilizationPresent?'Sí':'No';
          }
        }catch{ /* Un digest erróneo no autoriza afirmar ausencia ni existencia. */ }
      }
      return Object.freeze({...row,cells:Object.freeze({...row.cells,life,colonies,civilization})});
    };
    // Máximo de 12 lecturas simultáneas: paginación rápida, sin grandes
    // transacciones ni reconstrucción de miles de registros al abrir el archivo.
    const result:UniversalArchiveRow38Bis[]=[];
    for(let offset=0;offset<rows.length;offset+=12){
      result.push(...await Promise.all(rows.slice(offset,offset+12).map(project)));
    }
    return Object.freeze(result);
  }

  private readonly sorting38BisT3=new Map<string,Promise<void>>();

  /** Builds a persisted sort from confirmed read-models, deduplicating a UI
   * request racing against an always-on background refresh. */
  ensureSort38BisT3(key:UniverseGenerationKey,galaxyIndex:string,
    category:UniversalArchiveIndexedCategory38Bis,field:string,galaxyTitle:string,
    sharedRows?:readonly UniversalArchiveRow38Bis[],
    preparedProject?:(rows:readonly UniversalArchiveRow38Bis[])=>Promise<readonly UniversalArchiveRow38Bis[]>):Promise<void> {
    const scope=archive38BisScope(key);
    const identity=JSON.stringify([scope,galaxyIndex,category,field]);
    const pending=this.sorting38BisT3.get(identity);
    if(pending)return pending;
    const project=async(rows:readonly UniversalArchiveRow38Bis[]):Promise<readonly UniversalArchiveRow38Bis[]>=>{
      if(field==='galaxy')return rows.map(row=>({...row,cells:{...row.cells,galaxy:galaxyTitle}}));
      if(['life','colonies','civilization'].includes(field))
        return this.enrichVisibleBiologyB1(key,rows);
      return rows;
    };
    const task=this.store.ensureSortField(scope,category,galaxyIndex,field,
      preparedProject??project,sharedRows);
    this.sorting38BisT3.set(identity,task);
    void task.finally(()=>{if(this.sorting38BisT3.get(identity)===task)this.sorting38BisT3.delete(identity);})
      .catch(()=>undefined);
    return task;
  }

  /** ARCHFAST.1: during a consolidated galactic update, read the published
   * fragment ONCE for all used sort columns; biological projection is likewise
   * computed once, without changing the independently committed column format. */
  async ensureUsedSortsArchfast1(key:UniverseGenerationKey,galaxyIndex:string,
    category:UniversalArchiveIndexedCategory38Bis,galaxyTitle:string,
    onField?:(field:string,done:number,total:number)=>Promise<void>|void):Promise<void> {
    const scope=archive38BisScope(key);
    const fields=await this.store.usedSortFields38BisT3(scope,category);
    if(fields.length===0)return;
    const outdated=await this.store.outdatedSortFieldsArchfast1(scope,category,galaxyIndex,fields);
    if(outdated.length===0)return;
    const sourceRows=await this.store.sortSourceRowsArchfast1(scope,category,galaxyIndex);
    let biologyRows:Promise<readonly UniversalArchiveRow38Bis[]>|null=null;
    let galaxyRows:readonly UniversalArchiveRow38Bis[]|null=null;
    for(let i=0;i<outdated.length;i++){
      const field=outdated[i]!;
      await onField?.(field,i,outdated.length);
      const project=async():Promise<readonly UniversalArchiveRow38Bis[]>=>{
        if(field==='galaxy'){
          galaxyRows??=sourceRows.map(row=>({...row,cells:{...row.cells,galaxy:galaxyTitle}}));
          return galaxyRows;
        }
        if(['life','colonies','civilization'].includes(field)){
          biologyRows??=this.enrichVisibleBiologyB1(key,sourceRows);
          return biologyRows;
        }
        return sourceRows;
      };
      await this.ensureSort38BisT3(key,galaxyIndex,category,field,galaxyTitle,
        sourceRows,project);
      // Yield between independent transactions; never freeze the 3D scene.
      if(i%3===2)await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
  }

  ensure(key:UniverseGenerationKey,galaxyIndex:string,category:UniversalArchiveIndexedCategory38Bis,
    onProgress?:(info:string)=>void,force=false,consolidate=false,
    onIndexedPages?:(completed:number,total:number)=>Promise<void>|void):Promise<UniversalArchiveSection38Bis> {
    const id=JSON.stringify([archive38BisScope(key),galaxyIndex,category]);
    const existing=this.pending.get(id);
    if(existing)return existing;
    const promise=this.ensureFresh(key,galaxyIndex,category,onProgress,force,consolidate,onIndexedPages).catch(async error=>{
      // Store the failed attempt independently of the last fully published section.
      try{await this.store.checkpoint(archive38BisScope(key),category,galaxyIndex,'base','ERROR');}
      catch{ /* A checkpoint must never replace the original indexing error. */ }
      throw error;
    });
    this.pending.set(id,promise);
    void promise.finally(()=>{if(this.pending.get(id)===promise)this.pending.delete(id);}).catch(()=>undefined);
    return promise;
  }

  private async ensureFresh(key:UniverseGenerationKey,galaxyIndex:string,
    category:UniversalArchiveIndexedCategory38Bis,onProgress?:(info:string)=>void,force=false,
    consolidate=false,
    onIndexedPages?:(completed:number,total:number)=>Promise<void>|void):Promise<UniversalArchiveSection38Bis> {
    const galaxy=BigInt(galaxyIndex),scope=archive38BisScope(key);
    const repository=this.repository.discoveryRepository;
    const state=await repository.getState(key,new GalaxyLocator(galaxy));
    if(!isConfirmedScientificGalaxy38BisB7(state))throw new Error('38.bis-b7: solo se indexan galaxias confirmadas');
    const identity=JSON.stringify([scope,galaxyIndex]);
    const savedSnapshot=consolidate && this.archiveFastSnapshot?.identity===identity &&
      this.archiveFastSnapshot.expiresAt>Date.now()?this.archiveFastSnapshot:null;
    const known=savedSnapshot?.known ?? (repository.getKnownDiscoveriesInGalaxy
      ?await repository.getKnownDiscoveriesInGalaxy(key,galaxy)
      :(await repository.getKnownDiscoveries(key)).filter(d=>d.locator.galaxyIndex===galaxy));
    const originalRevision=savedSnapshot?.revision??galaxyKnowledgeRevision(galaxy,known);
    if(consolidate&&!savedSnapshot){
      this.archiveFastSnapshot={identity,expiresAt:Date.now()+90_000,known,
        revision:originalRevision,biological:new Map()};
    }
    // T3: los criterios booleanos de planeta/luna dependen de VIDA.9 confirmado.
    const biological=category==='planets'||category==='moons'||
      category==='civilizations'||COLONY_CATEGORIES.has(category);
    let vida9Count=0;let vida9Revision='0';
    // Nunca incorporar en la huella pública registros de sistemas sin confirmar.
    const publicBodyCategory=category==='planets'||category==='moons';
    const confirmedBiologicalSystems=publicBodyCategory?confirmedSystems38Bis(known):null;
    const biologyKey: 'public'|'all'=publicBodyCategory?'public':'all';
    const previousFingerprint=consolidate && this.archiveFastSnapshot?.identity===identity
      ?this.archiveFastSnapshot.biological.get(biologyKey):undefined;
    if(previousFingerprint && biological && key.generatorVersionCode===3){
      vida9Count=previousFingerprint.count;vida9Revision=previousFingerprint.revision;
    }else if(biological && key.generatorVersionCode===3){
      await this.sourceDb.openDatabase();
      let hashA=2166136261,hashB=2246822519;
      await this.sourceDb.privateBiologicalRecordsVIDA9
        .where('[universeSeed+generatorVersionCode+bodyStorageKey]')
        .between([key.universeSeed.serialize(),key.generatorVersionCode,galaxyIndex+':'],
          [key.universeSeed.serialize(),key.generatorVersionCode,galaxyIndex+':\uffff'])
        .each(row=>{
          if(confirmedBiologicalSystems && !confirmedBiologicalSystems.has(row.systemStorageKey))return;
          vida9Count++;
          // IndexedDB iterates bodyStorageKey in stable ascending order. Fingerprint
          // persisted biological IDs, immutable digests and payload length, so an
          // unchanged count alone never licenses a stale census after restore.
          const fragment=row.bodyStorageKey+'|'+row.digest+'|'+row.payloadJson.length;
          for(let i=0;i<fragment.length;i++){
            hashA=Math.imul(hashA^fragment.charCodeAt(i),16777619);
            hashB=Math.imul(hashB^fragment.charCodeAt(i),2246822519);
          }
        });
      vida9Revision=(hashA>>>0).toString(16)+'-'+(hashB>>>0).toString(16);
      if(consolidate && this.archiveFastSnapshot?.identity===identity)
        this.archiveFastSnapshot.biological.set(biologyKey,{count:vida9Count,revision:vida9Revision});
    }
    const revision=[GENESIS_UNIVERSAL_ARCHIVE_REVISION_38BIS,GALAXY_SCIENTIFIC_MODEL_VERSION,
      originalRevision,biological?vida9Count:'-',biological?vida9Revision:'-',
      ['planets','moons','asteroids','comets','tno','captured'].includes(category)
        ?'public-numeric-sort-b3-v1':'-',
      category==='colonies'?'founder-reconciliation-a3-v1-lunar-designation-a4-public-origins-a6-population-t7b-v2':
      category==='colonized-moons'?'lunar-designation-a4-public-origins-a6-host-planet-b1-population-t7b-v2':
      category==='colonized-planets'?'public-origins-a6-population-t7b-v2':
      category==='civilizations'?'tier-stats-v1':
      category==='stars'?'individual-stellar-components-starcat1-v1':'-'].join('|');
    await this.store.open();
    const saved=await this.store.sections.get([scope,category,galaxyIndex]);
    if(!force && saved?.sourceRevision===revision)return saved;
    await this.store.checkpoint(scope,category,galaxyIndex,'base','RUNNING');
    onProgress?.(`Indexando galaxia ${galaxyIndex} · ${category}`);
    let rows:UniversalArchiveRow38Bis[];
    let complete=true;
    if(COLONY_CATEGORIES.has(category)){
      // Las tres vistas derivan del mismo conjunto de colonias certificadas.
      // La caché comparte una sola proyección por revisión biológica/galáctica,
      // no tres escaneos VIDA.9 por las distintas revisiones de categoría.
      const cacheKey=JSON.stringify([scope,galaxyIndex,GALAXY_SCIENTIFIC_MODEL_VERSION,
        originalRevision,vida9Count,vida9Revision,'colony-projection-population-t7b-v2']);
      let projected=force?undefined:this.colonialProjectionCache.get(cacheKey);
      if(!projected){
        projected=await this.colonialRows(key,galaxy,known,scope,onProgress);
        if(this.colonialProjectionCache.size>20)this.colonialProjectionCache.clear();
        this.colonialProjectionCache.set(cacheKey,projected);
      }
      rows=projected.get(category)??[];
      // Persisted VIDA.9 may be incomplete even though confirmed systems exist.
      complete=confirmedSystems38Bis(known).size===0;
    }else if(category==='sectors'){
      rows=known.filter(d=>d.locator instanceof SectorLocator &&
        d.state.code===DiscoveryState.CONFIRMED.code).map(d=>{
        const loc=d.locator as SectorLocator;
        const coordinates=GalaxySectorKeyCodec.decode(loc.sectorKey);
        const label=`Sector (${coordinates.x}, ${coordinates.y})`;
        return wrapRow(scope,'sectors',galaxyIndex,{id:loc.sectorKey.toString(),title:label,
          subtitle:`Galaxia ${galaxyIndex}`,
          cells:{sector:loc.sectorKey.toString(),state:d.state.name},
          actions:[{label:'Abrir mapa galáctico',route:['/galaxy-map']}]});
      });
    }else if(category==='civilizations'){
      const indexed=await this.nativeCivilizationRows(key,galaxy,known,scope,onProgress);
      rows=indexed.rows;complete=indexed.complete;
    }else{
      const catalogCategory=category as GalaxyKnowledgeCatalogCategory;
      const descriptor=this.catalog.describe(catalogCategory,null);
      const requestQuery:GalaxyKnowledgeCatalogQuery={category:catalogCategory,subtype:null,
        sortKey:descriptor.defaultSortKey,direction:'asc',page:1,pageSize:SOURCE_PAGE_SIZE};
      rows=[];
      let totalPages=1;
      for(let page=1;page<=totalPages;page++){
        const result=await this.catalog.query({generationKey:key,galaxyIndex:galaxy,galaxyState:state,
          query:{...requestQuery,page},scientificOnly:true});
        if(result.kind!=='page')throw new Error(`38.bis: catálogo de ${category} no conectado`);
        totalPages=result.page.totalPages;
        if(result.page.knowledgeComplete===false)complete=false;
        if(totalPages>1&&result.page.items.length===0)throw new Error('38.bis: paginación incompleta');
        rows.push(...result.page.items.map(row=>wrapRow(scope,category,galaxyIndex,row)));
        if(onIndexedPages && (page===totalPages||page%12===0))
          await onIndexedPages(page,totalPages);
        if(page%12===0){onProgress?.(`${category}: galaxia ${galaxyIndex}, página ${page}/${totalPages}`);
          await yieldArchiveUi38Bis();}
      }
    }
    const section:UniversalArchiveSection38Bis=Object.freeze({scope,category,galaxyIndex,
      sourceRevision:revision,indexedAtEpochMs:Date.now(),count:rows.length,knowledgeComplete:complete,
      ...(category==='colonies'?{colonizationStatistics:summarizeArchiveColonies38Bis(rows)}:{}),
      ...(category==='civilizations'?{civilizationTierCounts:{
        primitive:rows.filter(r=>r.subtype==='PRIMITIVE').length,
        advanced:rows.filter(r=>r.subtype==='ADVANCED').length,
        veryAdvanced:rows.filter(r=>r.subtype==='VERY_ADVANCED').length}}:{}),
    });
    await this.store.publish(section,rows);
    return section;
  }

  /** Native VIDA.7 census from already persisted CT-0 (never triggers the
   * background biology materializer). Reuse the certified galactic read-model
   * if it is complete and its confirmed-system revision still matches. */
  private async nativeCivilizationRows(key:UniverseGenerationKey,galaxy:bigint,
    known:readonly Readonly<{locator:unknown;state:Readonly<{code:number}>}>[],scope:string,
    onProgress?:(info:string)=>void):Promise<Readonly<{rows:UniversalArchiveRow38Bis[];complete:boolean}>> {
    const results:UniversalArchiveRow38Bis[]=[];
    if(key.generatorVersionCode!==3)return {rows:results,complete:false};
    const confirmed=confirmedSystems38Bis(known);
    if(confirmed.size===0)return {rows:results,complete:true};
    await this.sourceDb.openDatabase();
    const seed=key.universeSeed.serialize(),version=key.generatorVersionCode;
    const revision=confirmedCivilizationKnowledgeRevision(confirmed);
    const snapshot=await this.sourceDb.galaxyKnowledgeSnapshots.get([
      seed,version,galaxy.toString(),GALAXY_SCIENTIFIC_MODEL_VERSION]);
    let entries:readonly KnownGalacticCivilization[]|null=null;
    let complete=false;
    if(snapshot?.civilizationKnowledgeRevision===revision&&snapshot.civilizationKnowledgeJson){
      try {
        const restored=restoreCivilizationKnowledgeIndex(snapshot.civilizationKnowledgeJson,confirmed,galaxy);
        entries=restored.entries;complete=restored.complete;
      }catch{ /* Corrupt derived fragment: fall through to immutable VIDA.9. */ }
    }
    if(entries===null){
      const found:KnownGalacticCivilization[]=[];
      const prefix=galaxy.toString()+':';
      const candidates:string[]=[];
      await this.sourceDb.privateBiologicalRecordsVIDA9
        .where('[universeSeed+generatorVersionCode+bodyStorageKey]')
        .between([seed,version,prefix],[seed,version,prefix+'\uffff'])
        .each(row=>{
          if(row.bodyStorageKey.endsWith(':PLANET:-') && confirmed.has(row.systemStorageKey) &&
            row.payloadJson.includes('\"nativeCivilizationPresent\":true'))candidates.push(row.bodyStorageKey);
        });
      const repo=new DexieVida9BiologyExplorationRepository(this.sourceDb);
      for(let i=0;i<candidates.length;i+=32){
        for(const bodyKey of candidates.slice(i,i+32)){
          let record:Vida9BiologyRecord|null;
          try{
            record=await repo.get(seed,version,bodyKey);
            const source=await this.sourceDb.privateBiologicalRecordsVIDA9.get([seed,version,bodyKey]);
            if(!source || !extractConfirmedCivilization(source,confirmed))continue;
          }catch{continue;}
          if(!record)continue;
          const identity=record.identity;
          const systemKey=[identity.galaxyIndex,identity.sectorKey,identity.galacticObjectIndex].join('/');
          if(!confirmed.has(systemKey) || !record.nativeCivilizationPresent ||
              !record.intelligence.civilization)continue;
          let designation:ReturnType<typeof knownCivilizationPlanetNames>;
          try{designation=knownCivilizationPlanetNames(key,new SystemLocator(galaxy,
            BigInt(identity.sectorKey),BigInt(identity.galacticObjectIndex)),BigInt(identity.bodyIndex));}
          catch{continue;}
          if(!designation)continue;
          const civilization=record.intelligence.civilization;
          const species=record.ecosystem.species.find(s=>s.id===civilization.founderSpeciesId);
          if(!species)continue;
          // The productive repository has already checked the full VIDA.9 digest.
          found.push(Object.freeze({id:bodyKey,systemKey,planetName:designation.planetName,
            systemName:designation.systemName,speciesName:species.proceduralName,
            speciesId:species.id,lineage:CIVILIZATION_LINEAGE_LABELS[civilization.lineage]??'No clasificado',
            tier:civilization.tier,locator:Object.freeze({galaxyIndex:identity.galaxyIndex,
              sectorKey:identity.sectorKey,galacticObjectIndex:identity.galacticObjectIndex,
              bodyIndex:identity.bodyIndex})}));
        }
        if(i%320===0 || i+32>=candidates.length){
          onProgress?.(`Civilizaciones: ${Math.min(i+32,candidates.length)}/${candidates.length} candidatas`);
          await yieldArchiveUi38Bis();
        }
      }
      entries=found;
    }
    for(const entry of entries){
      const l=entry.locator;
      const base=['/system',l.galaxyIndex,l.sectorKey,l.galacticObjectIndex,'planet',l.bodyIndex];
      const row:GalaxyKnowledgeCatalogRow={id:entry.id,title:entry.speciesName,
        subtitle:CIVILIZATION_TIER_LABELS[entry.tier],
        cells:{planet:entry.planetName,system:entry.systemName,
          tier:CIVILIZATION_TIER_LABELS[entry.tier],lineage:entry.lineage},
        actions:[{label:'Ver especie',route:[...base,'species',entry.speciesId]},
          {label:'Ver planeta',route:base}]};
      results.push(wrapRow(scope,'civilizations',galaxy.toString(),row));
    }
    return {rows:results,complete};
  }

  private async colonialRows(key:UniverseGenerationKey,galaxy:bigint,
    known:readonly Readonly<{locator:unknown;state:Readonly<{code:number}>}>[],scope:string,
    onProgress?:(info:string)=>void):Promise<ReadonlyMap<UniversalArchiveIndexedCategory38Bis,UniversalArchiveRow38Bis[]>> {
    const results=new Map<UniversalArchiveIndexedCategory38Bis,UniversalArchiveRow38Bis[]>([
      ['colonies',[]],['colonized-planets',[]],['colonized-moons',[]]]);
    if(key.generatorVersionCode!==3)return results;
    const confirmed=confirmedSystems38Bis(known);
    if(confirmed.size===0)return results;
    await this.sourceDb.openDatabase();
    const seed=key.universeSeed.serialize(),version=key.generatorVersionCode;
    const prefix=galaxy.toString()+':';
    const candidates:string[]=[];
    await this.sourceDb.privateBiologicalRecordsVIDA9
      .where('[universeSeed+generatorVersionCode+bodyStorageKey]')
      .between([seed,version,prefix],[seed,version,prefix+'\uffff'])
      .each(row=>{
        if(confirmed.has(row.systemStorageKey) &&
          row.payloadJson.includes('"colonialPopulationPresent":true'))candidates.push(row.bodyStorageKey);
      });
    const repo=new DexieVida9BiologyExplorationRepository(this.sourceDb);
    // Each source is fetched once per galactic fragment; do not index private
    // sources or generate new VIDA.9 records merely to build statistics.
    const sourceRecords=new Map<string,Readonly<{record:Vida9BiologyRecord|null;readFailed:boolean}>>();
    // Re-evaluate ONLY the confirmed native planet involved in a digest
    // discrepancy. Other planets are not read or regenerated, avoiding a
    // full per-system scan; this is a read-only source witness, not a new colony.
    const historicalBySource=new Map<string,Vida8CivilizationSource|null>();
    const historicalSource=(origin:Vida8OriginRef):Vida8CivilizationSource|null=>{
      const a=origin.sourceIdentity;
      const system=[a.galaxyIndex,a.sectorKey,a.galacticObjectIndex].join('/');
      if(!confirmed.has(system))return null;
      const sourceId=origin.sourceBodyStorageKey;
      if(!historicalBySource.has(sourceId)){
        let replayed:Vida8CivilizationSource|null=null;
        try{
          const galaxyIndex=BigInt(a.galaxyIndex),sectorKey=BigInt(a.sectorKey),
            galacticObjectIndex=BigInt(a.galacticObjectIndex),bodyIndex=BigInt(a.bodyIndex);
          const physical=vida9V3ConfirmedPhysicalTargets(key,
            new SystemLocator(galaxyIndex,sectorKey,galacticObjectIndex));
          if(physical && bodyIndex>=0n && bodyIndex<BigInt(physical.planetCount)){
            const replay=Vida8LocalOriginDiscovery.findInSystem({
              universeSeed:seed,generatorVersionCode:version,galaxyIndex:a.galaxyIndex,
              sectorKey:a.sectorKey,galacticObjectIndex:a.galacticObjectIndex,
            },physical.planetCount,index=>index===bodyIndex ? physical.resolvePlanet(
              new BodyLocator(galaxyIndex,sectorKey,galacticObjectIndex,index)) : null,false);
            replayed=replay.find(item=>item.ecosystem.bodyStorageKey===sourceId)??null;
          }
        }catch{ /* No proof: a failed replay must not authorize a source. */ }
        historicalBySource.set(sourceId,replayed);
      }
      return historicalBySource.get(sourceId)??null;
    };
    for(let offset=0;offset<candidates.length;offset+=24){
      for(const bodyKey of candidates.slice(offset,offset+24)){
        let record:Vida9BiologyRecord|null;
        try{record=await repo.get(seed,version,bodyKey);}catch{continue;}
        if(!record || !confirmed.has([record.identity.galaxyIndex,record.identity.sectorKey,
          record.identity.galacticObjectIndex].join('/')))continue;
        const colonies=validatedColonies38Bis(record);
        if(!colonies || colonies.length===0)continue;
        const i=record.identity;
        const galIndex=i.galaxyIndex;
        let system=`Sistema ${i.galaxyIndex}/${i.sectorKey}/${i.galacticObjectIndex}`;
        let hostPlanetName:string|undefined;
        let body=i.kind==='MOON'&&i.moonIndex!==null
          ?archiveMoonDesignation38BisA4(`Planeta ${i.bodyIndex}`,i.moonIndex)
          :`${colonyLabel(i.kind)} ${i.bodyIndex}`;
        try{
          const name=knownCivilizationPlanetNames(key,new SystemLocator(
            BigInt(i.galaxyIndex),BigInt(i.sectorKey),BigInt(i.galacticObjectIndex)),BigInt(i.bodyIndex));
          if(name){system=name.systemName;hostPlanetName=name.planetName;body=i.kind==='PLANET'?name.planetName:
            archiveMoonDesignation38BisA4(name.planetName,i.moonIndex??'?');}
        }catch{ /* Unknown public designation: preserve the explicit locator, never invent it. */ }
        const foundersByColony=new Map<string,UniversalArchiveVerifiedFounder38Bis>();
        for(const colony of colonies){
          const origin=colony.origin;
          let founder:UniversalArchiveVerifiedFounder38Bis|undefined;
          let historical=false;
          let drift:UniversalArchiveRow38Bis['colonyDigestDrift'];
          // Preflight never reads private source records from unknown systems.
          let issue=diagnoseColonyOrigin38Bis(origin,record,null,confirmed);
          if(issue==='SOURCE_RECORD_UNAVAILABLE'){
            const sourceKey=origin.sourceBodyStorageKey;
            if(!sourceRecords.has(sourceKey)){
              let source:Vida9BiologyRecord|null=null,readFailed=false;
              try{source=await repo.get(seed,version,sourceKey);}
              catch{readFailed=true;}
              sourceRecords.set(sourceKey,Object.freeze({record:source,readFailed}));
            }
            const sourceLookup=sourceRecords.get(sourceKey)!;
            const diagnosis=diagnoseColonyOrigin38Bis(origin,record,sourceLookup.record,confirmed,
              {sourceReadFailed:sourceLookup.readFailed});
            // Do NOT replay when the source is absent, invalid, inconsistent, or
            // unconfirmed. Matching species names alone cannot reconcile it.
            const witness=diagnosis==='SOURCE_DIGEST_MISMATCH'
              ? historicalSource(origin):null;
            const reconciliation=reconcileColonyOrigin38Bis(origin,record,
              sourceLookup.record,confirmed,colony,witness,
              {sourceReadFailed:sourceLookup.readFailed});
            issue=reconciliation.issue??'VERIFIED';
            historical=reconciliation.status==='HISTORICALLY_RECONCILED';
            drift=reconciliation.drift;
            if(reconciliation.status==='EXACT'||historical){
              const source=sourceLookup.record!;
              const species=source.ecosystem.species.find(sp=>sp.id===origin.founderSpeciesId)!;
              let designation:string|null=null;
              try{
                designation=knownCivilizationPlanetNames(key,new SystemLocator(
                  BigInt(i.galaxyIndex),BigInt(i.sectorKey),BigInt(i.galacticObjectIndex)),
                  BigInt(origin.sourceIdentity.bodyIndex))?.planetName??null;
              }catch{ /* Never expose an unverified origin locator. */ }
              if(designation?.trim() && species.proceduralName?.trim()){
                founder=Object.freeze({id:source.bodyStorageKey,galaxyIndex:galIndex,
                  name:`${species.proceduralName} · ${designation}`,
                  speciesName:species.proceduralName,planetName:designation,
                  tier:origin.tier,route:archiveBodyRoute(source)});
                foundersByColony.set(colony.id,founder);
              } else {issue='PUBLIC_DESIGNATION_UNAVAILABLE';historical=false;}
            }
          }
          results.get('colonies')!.push(projectColonyRow(
            scope,'colonies',galIndex,record,body,system,colonies,colony,founder,
            issue==='VERIFIED'?undefined:issue,historical,drift,hostPlanetName));
        }
        const category=i.kind==='MOON'?'colonized-moons':'colonized-planets';
        const commonFounder=archiveSharedFounderA6(colonies.map(item=>item.id),foundersByColony);
        results.get(category)!.push(projectColonyRow(scope,category,galIndex,record,
          body,system,colonies,undefined,commonFounder??undefined,undefined,false,undefined,hostPlanetName));
      }
      if(offset%240===0||offset+24>=candidates.length){
        onProgress?.(`Colonias: ${Math.min(offset+24,candidates.length)}/${candidates.length} registros candidatos`);
        await yieldArchiveUi38Bis();
      }
    }
    return results;
  }
}

function yieldArchiveUi38Bis():Promise<void>{return new Promise(resolve=>setTimeout(resolve,0));}
