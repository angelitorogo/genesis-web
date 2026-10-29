import {extractConfirmedCivilization,planetVida9KeysInGalaxy} from './galaxy-civilization-known-index';
import {VIDA9_REVISION,vida9DigestForRecord,type Vida9BiologyRecord,type Vida9BiologyStoredEntity} from '../../domain/life/vida9-biology-exploration';
import {vida9TestSources} from '../../simulation/life/vida9-test-fixture';

function recordAndRow(){
  const source=vida9TestSources();
  const identity={...source.ecosystem.identity,kind:'PLANET' as const,moonIndex:null};
  const bodyStorageKey='0:1:2:3:PLANET:-';
  const ecosystem={...source.ecosystem,identity,bodyStorageKey,species:[{
    id:'spec-a',proceduralName:'Nasyl al2',group:'REPTILES' as const,
  }]};
  const intelligence={...source.intelligence,identity,bodyStorageKey,
    intelligencePresent:true,civilizationPresent:true,
    civilization:{founderSpeciesId:'spec-a',lineage:'REPTILIAN' as const,tier:'VERY_ADVANCED' as const,
      culture:{} as never,technology:[],settlementPatterns:[]},
    intelligentSpecies:{speciesId:'spec-a',lineage:'REPTILIAN' as const,
      communication:'VOCAL_SYMBOLIC' as const,socialStructure:'CLAN' as const,cognitionTraits:[]}};
  const colonization={...source.colonization,identity,bodyStorageKey};
  const content={revision:VIDA9_REVISION,identity,bodyStorageKey,epoch:'CT-0' as const,
    epochOffsetYears:0 as const,revealPolicy:'FULL_SYSTEM_REVEAL_ON_CONFIRMED' as const,
    ecosystem,intelligence,colonization,nativeLifePresent:true,nativeIntelligencePresent:true,
    nativeCivilizationPresent:true,introducedLifePresent:false,colonialPopulationPresent:false,
    historicalOriginEpochYears:null} as unknown as Omit<Vida9BiologyRecord,'digest'>;
  const record={...content,digest:vida9DigestForRecord(content)};
  const row:Vida9BiologyStoredEntity={universeSeed:identity.universeSeed,generatorVersionCode:3,
    bodyStorageKey,systemStorageKey:'0/1/2',revision:VIDA9_REVISION,
    epochOffsetYears:0,payloadJson:JSON.stringify(record),digest:record.digest};
  return {row,record};
}
describe('Inventario de civilizaciones conocidas por galaxia',()=>{
  it('revela una civilización nativa válida solamente en un sistema CONFIRMADO',()=>{
    const {row,record}=recordAndRow();
    expect(extractConfirmedCivilization(row,new Set(['0/1/2']))).toEqual(record);
    expect(extractConfirmedCivilization(row,new Set())).toBeNull();
  });
  it('no confunde las colonias lunares con civilizaciones nativas',()=>{
    const {row}=recordAndRow();
    expect(extractConfirmedCivilization({...row,bodyStorageKey:'0:1:2:3:MOON:0'},new Set(['0/1/2']))).toBeNull();
  });
  it('rechaza huellas manipuladas e identidades discordantes sin revelar nada',()=>{
    const {row}=recordAndRow();
    expect(()=>extractConfirmedCivilization({...row,digest:'CORRUPTO'},new Set(['0/1/2']))).toThrow();
    expect(()=>extractConfirmedCivilization({...row,systemStorageKey:'0/1/3'},new Set(['0/1/3']))).toThrow();
  });
  it('exige que la especie fundadora exista en el ecosistema persistido',()=>{
    const {row,record}=recordAndRow();
    const content={...record,ecosystem:{...record.ecosystem,species:[]}};
    const {digest:oldDigest,...withoutDigest}=content;
    const tampered={...withoutDigest,digest:vida9DigestForRecord(withoutDigest)};
    expect(()=>extractConfirmedCivilization({...row,payloadJson:JSON.stringify(tampered),digest:tampered.digest},
      new Set(['0/1/2']))).toThrow();
  });
});

describe('VIDA.9: índice galáctico ligero de civilizaciones',()=>{
  it('solo solicita claves planetarias de la galaxia y no hidrata lunas',()=>{
    const keys:[string,number,string][]=[
      ['semilla',3,'0:1:2:3:PLANET:-'],
      ['semilla',3,'0:1:2:3:MOON:0'],
      ['semilla',3,'10:1:2:3:PLANET:-'],
      ['semilla',3,'0:2:4:0:PLANET:-'],
    ];
    expect(planetVida9KeysInGalaxy(keys,0n)).toEqual([keys[0],keys[3]]);
    expect(planetVida9KeysInGalaxy(keys,10n)).toEqual([keys[2]]);
  });
});
