/** STARCAT.1 — Individual stellar components of CONFIRMED systems only.
 * This is a disposable read model, not an additional discovery or persistent
 * scientific truth. Public A/B/C identities always point to the parent system.
 */
import {DestroyRef,inject, Injectable} from '@angular/core';
import {subscribeGenesisKnowledgeCommits38BisB6} from '../../data/local/repository/genesis-knowledge-commits-38-bis-b6';
import {DiscoveryState} from '../../domain/discovery/discovery-state';
import {DiscoveryTargetType} from '../../domain/discovery/discovery-target-type';
import {type KnownDiscovery} from '../../domain/discovery/known-discovery';
import {type UniverseGenerationKey} from '../../domain/generation/universe-generation-key';
import {SystemLocator} from '../../domain/generation/procedural-locator';
import {GalaxySectorKeyCodec} from '../../domain/sector/galaxy-sector-key-codec';
import {type StellarPhysicalProperties} from '../../domain/stellar/stellar-physical-properties';
import {type StellarSpectralAppearance} from '../../domain/stellar/stellar-spectral-appearance';
import {type StellarLifetimeProfile} from '../../domain/stellar/stellar-lifetime-profile';
import {type StellarEvolutionStateName} from '../../domain/stellar/stellar-evolution-state';
import {GalaxyGenerator} from '../../simulation/universe/galaxy-generator';
import {GalaxySectorGridGenerator} from '../../simulation/sector/galaxy-sector-grid-generator';
import {GalaxySectorStellarDensityGenerator} from '../../simulation/sector/galaxy-sector-stellar-density-generator';
import {GalaxySectorStellarPopulationPropertiesGenerator} from '../../simulation/sector/galaxy-sector-stellar-population-properties-generator';
import {StellarPopulationProfileGenerator} from '../../simulation/stellar/stellar-population-profile-generator';
import {StellarSystemGenerator} from '../../simulation/stellar/stellar-system-generator';
import {StellarGenerator} from '../../simulation/stellar/stellar-generator';
import {StellarMultihostFormation} from '../../simulation/stellar/stellar-multihost-formation';
import {multihostPhysicalSourceKey} from '../../simulation/stellar/stellar-multihost-physical-source-key';
import {StellarSystemMultiplicitySelector} from '../../simulation/stellar/stellar-system-multiplicity-selector';
import {StellarSystemMultiplicity} from '../../domain/stellar/stellar-system-multiplicity';
import {ProceduralTargetResolver} from '../../simulation/regeneration/procedural-target-resolver';
import {type SystemSeed} from '../../domain/seed/hierarchical-seeds';
import {GENESIS_LOCAL_REPOSITORIES} from '../runtime/genesis-local-repositories';
import {galaxyKnowledgeRevision} from '../runtime/galaxy-knowledge-snapshot.runtime';
import {
  catalogNameMatches,type GalaxyKnowledgeCatalogDataRequest,
  type GalaxyKnowledgeCatalogDataResult,type GalaxyKnowledgeCatalogDescriptor,
  type GalaxyKnowledgeCatalogDirection,type GalaxyKnowledgeCatalogRow,
} from './galaxy-knowledge-catalog.model';
import {GalaxyKnowledgeCatalogViewCache,galaxyKnowledgeCatalogViewKey} from './galaxy-knowledge-catalog-view-cache';
import {stellarFilterPublicLabel} from './stellar-catalog-public-labels';

type ComponentLabel='A'|'B'|'C';
export interface ConfirmedStarCatalogRecord {
  readonly id:string;
  readonly designation:string;
  readonly systemDesignation:string;
  readonly component:ComponentLabel;
  readonly sectorKey:string;
  readonly evolution:StellarEvolutionStateName;
  readonly stage:string;
  readonly spectral:string;
  readonly family:string;
  readonly radiusSolar:number;
  readonly massSolar:number;
  readonly temperatureKelvin:number;
  readonly luminositySolar:number;
  readonly ageBillionYears:number;
  readonly route:readonly string[];
}

/** Values are the same raw scientific attributes used by the stellar fiche.
 * Distinct B/C bodies in V2/V3 come from the actual multihost formation,
 * never from the unrelated legacy V1 companion approximation. */
export function starCatalogComponent(
  locator:SystemLocator, systemDesignation:string, component:ComponentLabel,
  physical:StellarPhysicalProperties, spectral:StellarSpectralAppearance,
  lifetime:StellarLifetimeProfile,
):ConfirmedStarCatalogRecord {
  const evolution=lifetime.evolutionAssessment;
  const id=[locator.galaxyIndex,locator.sectorKey,locator.galacticObjectIndex,component].join('/');
  return Object.freeze({id,designation:`${systemDesignation} ${component}`,
    systemDesignation,component,sectorKey:locator.sectorKey.toString(),
    evolution:evolution.evolutionState.name,
    stage:evolution.postMainSequenceStage?.name??'—',
    spectral:spectral.spectralType.designation,family:spectral.spectralType.family,
    radiusSolar:physical.radiusSolar,massSolar:physical.currentMassSolar,
    temperatureKelvin:physical.effectiveTemperatureKelvin,
    luminositySolar:physical.luminositySolar,ageBillionYears:lifetime.ageBillionYears,
    route:Object.freeze(['/archive/system',locator.galaxyIndex.toString(),
      locator.sectorKey.toString(),locator.galacticObjectIndex.toString()]),
  });
}

const SORTS=Object.freeze([
  {key:'designation',label:'Nombre / designación'},
  {key:'radius',label:'Radio físico (R☉)'},
  {key:'mass',label:'Masa actual (M☉)'},
  {key:'temperature',label:'Temperatura efectiva (K)'},
  {key:'luminosity',label:'Luminosidad (L☉)'},
  {key:'age',label:'Edad (Ga)'},
  {key:'evolution',label:'Estado evolutivo'},
  {key:'stage',label:'Etapa gigante (RGB / AGB)'},
  {key:'spectral',label:'Tipo espectral'},
  {key:'family',label:'Familia espectral'},
  {key:'system',label:'Sistema anfitrión'},
  {key:'component',label:'Componente A/B/C'},
] as const);
const FILTERS=new Set(['MAIN_SEQUENCE','BROWN_DWARF','WHITE_DWARF','GIANT','SUPERGIANT',
  'NEUTRON_STAR','STELLAR_BLACK_HOLE','RGB','AGB','RED_GIANT_BRANCH',
  'ASYMPTOTIC_GIANT_BRANCH','O','B','A','F','G','K','M','L','T','Y']);
const numericFields:Readonly<Record<string,keyof ConfirmedStarCatalogRecord>>={
  radius:'radiusSolar',mass:'massSolar',temperature:'temperatureKelvin',
  luminosity:'luminositySolar',age:'ageBillionYears',
};
const stringFields:Readonly<Record<string,keyof ConfirmedStarCatalogRecord>>={
  designation:'designation',evolution:'evolution',stage:'stage',spectral:'spectral',
  family:'family',system:'systemDesignation',component:'component',
};
const format=(v:number,digits=3)=>v.toLocaleString('es-ES',{maximumFractionDigits:digits});
const numeric=(row:ConfirmedStarCatalogRecord,key:string):number|null=>{
  const field=numericFields[key];
  if(!field)return null;
  const value=row[field];return typeof value==='number'&&Number.isFinite(value)?value:null;
};
export function compareStarsCatalog(a:ConfirmedStarCatalogRecord,b:ConfirmedStarCatalogRecord,
  field:string,direction:GalaxyKnowledgeCatalogDirection):number {
  const factor=direction==='desc'?-1:1;
  const av=numeric(a,field),bv=numeric(b,field);
  let value=0;
  if(av!==null&&bv!==null)value=av-bv;
  else {
    const prop=stringFields[field]??'designation';
    value=String(a[prop]).localeCompare(String(b[prop]),'es',{numeric:true});
  }
  return value!==0?Math.sign(value)*factor:a.id.localeCompare(b.id,'es',{numeric:true});
}
function matchesSubtype(row:ConfirmedStarCatalogRecord,subtype:string|null):boolean {
  if(!subtype)return true;
  const type=subtype.toUpperCase();
  if(!FILTERS.has(type))return false;
  return row.evolution===type||row.stage===type||row.family===type||
    (type==='RGB'&&row.stage==='RED_GIANT_BRANCH')||
    (type==='AGB'&&row.stage==='ASYMPTOTIC_GIANT_BRANCH');
}
function stageTitle(stage:string):string {
  return stage==='RED_GIANT_BRANCH'?'Gigante roja (RGB)':
    stage==='ASYMPTOTIC_GIANT_BRANCH'?'Gigante AGB':stage==='—'?'—':stage;
}
export function projectStarCatalogRowStarcat1(record:ConfirmedStarCatalogRecord):GalaxyKnowledgeCatalogRow {
  return Object.freeze({id:record.id,title:record.designation,
    subtitle:`${record.systemDesignation} · componente ${record.component}`,
    cells:Object.freeze({system:record.systemDesignation,component:record.component,
      evolution:record.evolution,stage:stageTitle(record.stage),spectral:record.spectral,family:record.family,
      radius:`${format(record.radiusSolar,5)} R☉`,mass:`${format(record.massSolar,5)} M☉`,
      temperature:`${format(record.temperatureKelvin,2)} K`,
      luminosity:`${format(record.luminositySolar,6)} L☉`,
      age:`${format(record.ageBillionYears,4)} Ga`,sector:record.sectorKey}),
    sortNumbers:Object.freeze({radius:record.radiusSolar,mass:record.massSolar,
      temperature:record.temperatureKelvin,luminosity:record.luminositySolar,
      age:record.ageBillionYears}),
    actions:Object.freeze([{label:'Abrir ficha del sistema',route:record.route,
      emphasis:'primary' as const},
      {label:'Ver escena científica 3D',route:Object.freeze(['/system',...record.route.slice(1)])}]),
  });
}

@Injectable({providedIn:'root'})
export class GalaxyKnowledgeStarsCatalogDataSource {
  private readonly repositories=inject(GENESIS_LOCAL_REPOSITORIES);
  private readonly destroy=inject(DestroyRef);
  private readonly views=new GalaxyKnowledgeCatalogViewCache<ConfirmedStarCatalogRecord>();
  // One galaxy at a time; ARCHFAST's paginated rebuild reuses these rows.
  // A changed system confirmation fingerprint invalidates the snapshot.
  private hot:Readonly<{identity:string;revision:string;expires:number;
    rows:readonly ConfirmedStarCatalogRecord[]}>|null=null;
  private readonly inflight=new Map<string,Promise<readonly ConfirmedStarCatalogRecord[]>>();
  private invalidationSerial=0;

  constructor(){
    const stop=subscribeGenesisKnowledgeCommits38BisB6(event=>{
      if(event.kind!=='GALAXY'&&event.kind!=='SYSTEM'&&event.kind!=='RESTORE')return;
      const identity=JSON.stringify([event.universeSeed,event.generatorVersionCode,event.galaxyIndex]);
      this.invalidationSerial++;
      if(this.hot?.identity===identity)this.hot=null;
    });
    this.destroy.onDestroy(stop);
  }

  describe(subtype:string|null):GalaxyKnowledgeCatalogDescriptor {
    const filter=subtype?.trim().toUpperCase()??null;
    const filterTitle=filter===null?null:stellarFilterPublicLabel(filter);
    return Object.freeze({category:'stars' as const,title:filterTitle?`Estrellas · ${filterTitle}`:'Estrellas conocidas',
      description:'Componentes A/B/C de sistemas científicamente confirmados; radios, masas y temperaturas físicos, no escalas visuales STARVIS.1.',
      identityLabel:'ESTRELLA',filterLabel:filterTitle??'TODAS',sortOptions:SORTS,
      defaultSortKey:'designation',columns:Object.freeze([
        {key:'system',label:'SISTEMA'},{key:'component',label:'COMPONENTE'},
        {key:'evolution',label:'EVOLUCIÓN'},{key:'spectral',label:'ESPECTRO'},
        {key:'radius',label:'RADIO',align:'end' as const},
        {key:'temperature',label:'TEMPERATURA',align:'end' as const},
      ])});
  }

  async query(request:GalaxyKnowledgeCatalogDataRequest):Promise<GalaxyKnowledgeCatalogDataResult> {
    if(request.query.category!=='stars')return Object.freeze({kind:'not-connected' as const});
    const identity=JSON.stringify([request.generationKey.universeSeed.serialize(),
      request.generationKey.generatorVersionCode,request.galaxyIndex.toString()]);
    let rows:readonly ConfirmedStarCatalogRecord[];
    if(this.hot?.identity===identity&&this.hot.expires>Date.now())rows=this.hot.rows;
    else {
      const locatorRecords=await this.confirmedSystems(request.generationKey,request.galaxyIndex);
      const revision=galaxyKnowledgeRevision(request.galaxyIndex,locatorRecords);
      if(this.hot?.identity===identity&&this.hot.revision===revision){
        this.hot={...this.hot,expires:Date.now()+30_000};
        rows=this.hot.rows;
      }else{
      const seenSerial=this.invalidationSerial;
      const taskKey=identity+'|'+revision;
      let pending=this.inflight.get(taskKey);
      if(!pending){
        pending=this.build(request.generationKey,request.galaxyIndex,locatorRecords);
        this.inflight.set(taskKey,pending);
      }
      try{rows=await pending;}finally{if(this.inflight.get(taskKey)===pending)this.inflight.delete(taskKey);}
      // A newer commit must never be overwritten by an older in-flight build.
      if(seenSerial===this.invalidationSerial)
        this.hot={identity,revision,rows,expires:Date.now()+30_000};
      }
    }
    const subtype=request.query.subtype;
    const selected=this.views.resolve(rows,
      galaxyKnowledgeCatalogViewKey(subtype,request.query.sortKey,request.query.direction,request.query.search),
      row=>matchesSubtype(row,subtype)&&catalogNameMatches(row.designation,request.query.search),
      (a,b)=>compareStarsCatalog(a,b,request.query.sortKey,request.query.direction));
    const totalItems=selected.length,totalPages=Math.max(1,Math.ceil(totalItems/request.query.pageSize));
    const page=Math.min(Math.max(1,request.query.page),totalPages),start=(page-1)*request.query.pageSize;
    return Object.freeze({kind:'page' as const,page:Object.freeze({totalItems,totalPages,page,
      pageSize:request.query.pageSize,items:Object.freeze(selected.slice(start,start+request.query.pageSize).map(projectStarCatalogRowStarcat1))})});
  }

  private async confirmedSystems(key:UniverseGenerationKey,galaxy:bigint):Promise<readonly KnownDiscovery[]> {
    const repository=this.repositories.discoveryRepository;
    const candidates=repository.getKnownDiscoveriesInGalaxy
      ?await repository.getKnownDiscoveriesInGalaxy(key,galaxy,DiscoveryTargetType.SYSTEM.code)
      :(await repository.getKnownDiscoveries(key));
    const unique=new Map<string,KnownDiscovery>();
    for(const discovery of candidates as readonly KnownDiscovery[]){
      if(!(discovery.locator instanceof SystemLocator)||discovery.locator.galaxyIndex!==galaxy||
        discovery.state.code!==DiscoveryState.CONFIRMED.code)continue;
      const locator=discovery.locator;
      unique.set(`${locator.galaxyIndex}/${locator.sectorKey}/${locator.galacticObjectIndex}`,discovery);
    }
    return [...unique.values()];
  }

  private async build(key:UniverseGenerationKey,galaxyIndex:bigint,
    systems:readonly KnownDiscovery[]):Promise<readonly ConfirmedStarCatalogRecord[]> {
    if(systems.length===0)return Object.freeze([]);
    const physicalKey=multihostPhysicalSourceKey(key);
    const galaxy=GalaxyGenerator.generate(physicalKey,galaxyIndex);
    const grid=GalaxySectorGridGenerator.generate(galaxy);
    // Group addresses by sector so we reuse galaxy and sector profiles, not
    // thousands of identical procedural materializations during bulk indexing.
    const confirmed=systems.map(s=>s.locator as SystemLocator).sort((a,b)=>
      a.sectorKey<b.sectorKey?-1:a.sectorKey>b.sectorKey?1:
      a.galacticObjectIndex<b.galacticObjectIndex?-1:a.galacticObjectIndex>b.galacticObjectIndex?1:0);
    const result:ConfirmedStarCatalogRecord[]=[];
    let lastSector:bigint|null=null;
    let population:ReturnType<typeof GalaxySectorStellarPopulationPropertiesGenerator.generate>|null=null;
    let profile:ReturnType<typeof StellarPopulationProfileGenerator.generate>|null=null;
    for(let i=0;i<confirmed.length;i++){
      const locator=confirmed[i]!;
      if(lastSector!==locator.sectorKey){
        const density=GalaxySectorStellarDensityGenerator.generate(galaxy,grid,
          GalaxySectorKeyCodec.decode(locator.sectorKey));
        population=GalaxySectorStellarPopulationPropertiesGenerator.generate(galaxy,density);
        profile=StellarPopulationProfileGenerator.generate(physicalKey,galaxy.physicalProperties,population);
        lastSector=locator.sectorKey;
      }
      const seed=ProceduralTargetResolver.resolveTargetSeed(physicalKey,locator) as SystemSeed;
      const multiplicity=StellarSystemMultiplicitySelector.select(physicalKey,seed);
      if(multiplicity===StellarSystemMultiplicity.SINGLE||key.generatorVersionCode===1){
        const system=StellarSystemGenerator.generate(physicalKey,locator,population!,profile!);
        const primary=StellarGenerator.generatePhysicalProperties(physicalKey,locator,population!,profile!);
        const spectral=StellarGenerator.generateSpectralAppearance(physicalKey,primary,population!);
        const life=StellarGenerator.generateLifetimeProfile(physicalKey,locator,primary,population!,profile!);
        result.push(starCatalogComponent(locator,system.designation.name,'A',primary,spectral,life));
        for(const companion of [system.secondaryCompanion,system.tertiaryCompanion]){
          if(companion){result.push(starCatalogComponent(locator,system.designation.name,
            companion.componentLabel.name as ComponentLabel,companion.physicalProperties,
            companion.spectralAppearance,companion.lifetimeProfile));}
        }
      }else{
        // B/C for V2 and V3 MUST use the same materialized host sources as
        // SystemScene; V3 specifically uses fresh coeval candidates.
        const formation=StellarMultihostFormation.generateOrNull(key,locator);
        if(!formation)throw new Error('El sistema confirmado no tiene su composición estelar V2/V3');
        for(const host of formation.components){
          result.push(starCatalogComponent(locator,formation.components[0]!.stellarSystem.designation.name,
            host.label,host.physical,host.spectral,host.lifetime));
        }
      }
      if(i%32===31)await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
    return Object.freeze(result);
  }
}
