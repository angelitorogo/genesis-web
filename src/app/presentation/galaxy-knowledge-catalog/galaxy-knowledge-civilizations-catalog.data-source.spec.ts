import {TestBed} from '@angular/core/testing';
import {DiscoveryState} from '../../domain/discovery/discovery-state';
import {GeneratorVersion} from '../../domain/generation/generator-version';
import {UniverseGenerationKey} from '../../domain/generation/universe-generation-key';
import {UniverseSeed} from '../../domain/universe/universe-seed';
import {GalaxyCivilizationKnownIndex,type KnownGalacticCivilizationCensus} from './galaxy-civilization-known-index';
import {GalaxyKnowledgeCivilizationsCatalogDataSource} from './galaxy-knowledge-civilizations-catalog.data-source';
import type {GalaxyKnowledgeCatalogDataRequest} from './galaxy-knowledge-catalog.model';

const entries=[
  {id:'a',systemKey:'0/1/2',planetName:'Glavara B-4',systemName:'Glavara',speciesName:'Arvor al5',
    speciesId:'species-a',lineage:'Reptiliana',tier:'VERY_ADVANCED' as const,
    locator:{galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'2',bodyIndex:'3'}},
  {id:'b',systemKey:'0/4/5',planetName:'Cinia d',systemName:'Cinia',speciesName:'Elira an1',
    speciesId:'species-b',lineage:'Humanoide',tier:'PRIMITIVE' as const,
    locator:{galaxyIndex:'0',sectorKey:'4',galacticObjectIndex:'5',bodyIndex:'6'}},
];
const census:KnownGalacticCivilizationCensus={entries,primitive:1,advanced:0,veryAdvanced:1,
  complete:true,planetsWithBiologicalRecord:20,knownPhysicalPlanets:20};
const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V3);
function request(type:string|null=null,search:string|null=null):GalaxyKnowledgeCatalogDataRequest{
  return {generationKey:key,galaxyIndex:0n,galaxyState:DiscoveryState.CONFIRMED,query:{
    category:'civilizations',subtype:type,page:1,pageSize:25,sortKey:'designation',direction:'asc',search}};
}
describe('Catálogo de civilizaciones VIDA.9',()=>{
  let source:GalaxyKnowledgeCivilizationsCatalogDataSource;
  beforeEach(()=>{
    TestBed.configureTestingModule({providers:[{provide:GalaxyCivilizationKnownIndex,useValue:{read:async()=>census}}]});
    source=TestBed.inject(GalaxyKnowledgeCivilizationsCatalogDataSource);
  });
  it('conserva la búsqueda por especie, planeta y sistema',async()=>{
    const response=await source.query(request(null,'glavara'));
    expect(response.kind).toBe('page');
    if(response.kind==='page'){
      expect(response.page.totalItems).toBe(1);
      expect(response.page.items[0]?.title).toBe('Arvor al5');
      expect(response.page.items[0]?.actions[0]?.route).toEqual([
        '/system','0','1','2','planet','3','species','species-a']);
    }
  });
  it('filtra por nivel tecnológico sin inventar colonias',async()=>{
    const response=await source.query(request('VERY_ADVANCED'));
    expect(response.kind).toBe('page');
    if(response.kind==='page')expect(response.page.items.map(x=>x.title)).toEqual(['Arvor al5']);
    expect(()=>source.describe('INEXISTENTE')).toThrow(RangeError);
  });
});
