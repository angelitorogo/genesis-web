import { inject, Injectable } from '@angular/core';
import { GalaxyCivilizationKnownIndex, CIVILIZATION_TIER_LABELS, type KnownGalacticCivilization } from './galaxy-civilization-known-index';
import { catalogNameMatches, type GalaxyKnowledgeCatalogDataRequest, type GalaxyKnowledgeCatalogDataResult,
  type GalaxyKnowledgeCatalogDescriptor, type GalaxyKnowledgeCatalogRow } from './galaxy-knowledge-catalog.model';

const TIERS=Object.freeze(['PRIMITIVE','ADVANCED','VERY_ADVANCED']);
function validTier(tier:string|null):string|null{
  if(tier!==null && !TIERS.includes(tier))throw new RangeError('El nivel de civilización indicado no existe.');
  return tier;
}
@Injectable({providedIn:'root'})
export class GalaxyKnowledgeCivilizationsCatalogDataSource {
  private readonly index=inject(GalaxyCivilizationKnownIndex);
  describe(subtype:string|null):GalaxyKnowledgeCatalogDescriptor{
    const tier=validTier(subtype);
    return Object.freeze({category:'civilizations',title:'Civilizaciones conocidas',
      description:'Civilizaciones nativas identificadas en sistemas confirmados. Las colonias tecnológicas se distinguen de las civilizaciones de origen.',
      identityLabel:'ESPECIE FUNDADORA',
      filterLabel:tier===null?'TODAS':CIVILIZATION_TIER_LABELS[tier as keyof typeof CIVILIZATION_TIER_LABELS],
      sortOptions:Object.freeze([{key:'designation',label:'Especie fundadora'},
        {key:'planet',label:'Planeta de origen'},{key:'system',label:'Sistema anfitrión'},
        {key:'tier',label:'Nivel tecnológico'},{key:'lineage',label:'Linaje'}]),
      defaultSortKey:'designation',columns:Object.freeze([
        {key:'planet',label:'PLANETA DE ORIGEN'}, {key:'system',label:'SISTEMA'},
        {key:'tier',label:'CIVILIZACIÓN'},{key:'lineage',label:'LINAJE'},
      ])});
  }
  async query(request:GalaxyKnowledgeCatalogDataRequest):Promise<GalaxyKnowledgeCatalogDataResult>{
    const tier=validTier(request.query.subtype);
    const census=await this.index.read(request.generationKey,request.galaxyIndex);
    const term=request.query.search;
    const filtered=census.entries.filter(entry=>(tier===null||entry.tier===tier) &&
      (!term || [entry.speciesName,entry.planetName,entry.systemName,entry.lineage,
        CIVILIZATION_TIER_LABELS[entry.tier]].some(v=>catalogNameMatches(v,term))));
    const sortKey=request.query.sortKey;
    const direction=request.query.direction==='desc'?-1:1;
    const collator=new Intl.Collator('es',{sensitivity:'base',numeric:true});
    const sorted=[...filtered].sort((a,b)=>{
      const value=(e:KnownGalacticCivilization)=>sortKey==='planet'?e.planetName:
        sortKey==='system'?e.systemName:sortKey==='tier'?CIVILIZATION_TIER_LABELS[e.tier]:
          sortKey==='lineage'?e.lineage:e.speciesName;
      return direction*collator.compare(value(a),value(b))||collator.compare(a.id,b.id);
    });
    const totalItems=sorted.length;
    const totalPages=Math.max(1,Math.ceil(totalItems/request.query.pageSize));
    const page=Math.min(request.query.page,totalPages);
    const slice=sorted.slice((page-1)*request.query.pageSize,page*request.query.pageSize);
    return Object.freeze({kind:'page' as const,page:Object.freeze({totalItems,totalPages,page,
      pageSize:request.query.pageSize,knowledgeComplete:census.complete,items:Object.freeze(slice.map(toRow))})});
  }
}
function toRow(entry:KnownGalacticCivilization):GalaxyKnowledgeCatalogRow{
  const l=entry.locator;
  const base=['/system',l.galaxyIndex,l.sectorKey,l.galacticObjectIndex,'planet',l.bodyIndex];
  return Object.freeze({id:entry.id,title:entry.speciesName,
    subtitle:CIVILIZATION_TIER_LABELS[entry.tier],
    cells:Object.freeze({planet:entry.planetName,system:entry.systemName,
      tier:CIVILIZATION_TIER_LABELS[entry.tier],lineage:entry.lineage}),
    actions:Object.freeze([{label:'Ver especie',route:Object.freeze([...base,'species',entry.speciesId]),
      emphasis:'primary' as const},{label:'Ver planeta',route:Object.freeze(base)}])});
}
