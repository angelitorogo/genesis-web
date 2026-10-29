import { TestBed } from '@angular/core/testing';
import { describe,it,expect,vi,beforeEach } from 'vitest';
import { VIDA9_REVISION,vida9DigestForRecord,
  type Vida9BiologyRecord,type Vida9BiologyStoredEntity } from '../../domain/life/vida9-biology-exploration';
import { vida9TestSources } from '../../simulation/life/vida9-test-fixture';
import { SystemTechnosignature37aDataSource } from './system-technosignature-37a.data-source';

const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const request={universeSeed:seed,generatorVersionCode:3,
  galaxyIndex:0n,sectorKey:1n,galacticObjectIndex:2n,confirmed:true};

function planetRow(tier:'PRIMITIVE'|'ADVANCED'|'VERY_ADVANCED'):Vida9BiologyStoredEntity {
  const source=vida9TestSources();
  const identity={...source.ecosystem.identity,universeSeed:seed,generatorVersionCode:3,
    galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'2',bodyIndex:'3',kind:'PLANET' as const,
    moonIndex:null};
  const bodyStorageKey='0:1:2:3:PLANET:-';
  const ecosystem={...source.ecosystem,identity,bodyStorageKey,
    species:[{id:'founder',proceduralName:'Nadora',group:'REPTILES' as const}]};
  const intelligence={...source.intelligence,identity,bodyStorageKey,
    civilizationPresent:true,intelligencePresent:true,
    civilization:{founderSpeciesId:'founder',lineage:'REPTILIAN' as const,tier,
      culture:{} as never,technology:[],settlementPatterns:[]}};
  const content={revision:VIDA9_REVISION,identity,bodyStorageKey,epoch:'CT-0' as const,
    epochOffsetYears:0 as const,revealPolicy:'FULL_SYSTEM_REVEAL_ON_CONFIRMED' as const,
    ecosystem,intelligence,colonization:{...source.colonization,identity,bodyStorageKey},
    nativeLifePresent:true,nativeIntelligencePresent:true,nativeCivilizationPresent:true,
    introducedLifePresent:false,colonialPopulationPresent:false,historicalOriginEpochYears:null
  } as unknown as Omit<Vida9BiologyRecord,'digest'>;
  const record={...content,digest:vida9DigestForRecord(content)};
  return {universeSeed:seed,generatorVersionCode:3,bodyStorageKey,
    systemStorageKey:'0/1/2',revision:VIDA9_REVISION,epochOffsetYears:0,
    payloadJson:JSON.stringify(record),digest:record.digest};
}

describe('37.A: consulta puntual del conocimiento persistido',()=>{
  beforeEach(()=>TestBed.configureTestingModule({}));
  function subject(row:Vida9BiologyStoredEntity) {
    const primaryKeys=vi.fn().mockResolvedValue([
      [seed,3,'0:1:2:3:MOON:0'],
      [seed,3,'0:1:2:3:PLANET:-'],
    ]);
    const bulkGet=vi.fn().mockResolvedValue([row]);
    const equals=vi.fn().mockReturnValue({primaryKeys});
    const where=vi.fn().mockReturnValue({equals});
    const db={openDatabase:vi.fn().mockResolvedValue(undefined),
      privateBiologicalRecordsVIDA9:{where,bulkGet}};
    const source=TestBed.runInInjectionContext(()=>new SystemTechnosignature37aDataSource());
    (source as unknown as {db:unknown}).db=db;
    return {source,db,equals,bulkGet};
  }
  it('no lee registros privados de un sistema no confirmado ni de V2',async()=>{
    const {source,db}=subject(planetRow('ADVANCED'));
    expect((await source.read({...request,confirmed:false})).alert).toBeNull();
    expect((await source.read({...request,generatorVersionCode:2})).alert).toBeNull();
    expect(db.openDatabase).not.toHaveBeenCalled();
  });
  it('lee sólo los planetas del sistema confirmado y genera un aviso sin localización',async()=>{
    const {source,equals,bulkGet}=subject(planetRow('ADVANCED'));
    const result=await source.read(request);
    expect(equals).toHaveBeenCalledWith([seed,3,'0/1/2']);
    expect(bulkGet).toHaveBeenCalledWith([[seed,3,'0:1:2:3:PLANET:-']]);
    expect(result.alert).toBe('ADVANCED');
    expect(result.profiles).toHaveLength(1);
    expect(JSON.stringify(result)).not.toContain('founder');
    expect(JSON.stringify(result)).not.toContain('bodyIndex');
  });
  it('una civilización primitiva no activa ninguna alerta',async()=>{
    const {source}=subject(planetRow('PRIMITIVE'));
    const result=await source.read(request);
    expect(result.alert).toBeNull();
    expect(result.profiles[0]?.radio).toBe('NONE');
  });
});
