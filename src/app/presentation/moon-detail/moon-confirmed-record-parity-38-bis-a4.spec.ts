import 'fake-indexeddb/auto';
import {describe,expect,it,vi} from 'vitest';
import {GenesisIndexedDb} from '../../data/local/indexed-db/genesis-indexed-db';
import {DexieVida9BiologyExplorationRepository} from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import {Vida9BiologyExploration} from '../../simulation/life/vida9-biology-exploration';
import {vida9TestSources} from '../../simulation/life/vida9-test-fixture';
import type {Vida8Colony,Vida8ColonizationSnapshot} from '../../domain/life/vida8-technological-colonization';
import {readVerifiedMoonBiology386c,
  type PlanetMoonColonizationRequest386b} from '../planet-detail/planet-moon-colonization-data-source-38-6b';
import {moonPreviewWithVerifiedBiology38BisA4,verifiedMoonDetailRecord38BisA4} from './moon-confirmed-record-parity-38-bis-a4';
import {ScientificBodyPreviewKind,type ScientificBodyPreviewModel} from '../scientific/scientific-body-preview';
import {archiveMoonDesignation38BisA4} from '../genesis-archive/38-bis/genesis-archive-moon-designation-38-bis-a4';

const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const request:PlanetMoonColonizationRequest386b={confirmed:true,universeSeed:seed,
  generatorVersionCode:3,galaxyIndex:0n,sectorKey:1n,galacticObjectIndex:2n,
  bodyIndex:3n,moonIndices:[0]};
function recordWithColonies(count:number){
  const {ecosystem,intelligence,colonization}=vida9TestSources();
  const colonies:Vida8Colony[]=Array.from({length:count},(_,index)=>({
    id:`colony-${index}`,provenance:'TECHNOLOGICAL_COLONIZATION' as const,
    origin:{civilizationDigest:'origin-digest',sourceEcosystemDigest:'origin-ecosystem',
      sourceBodyStorageKey:'0:1:2:1:PLANET:-',sourceIdentity:{...ecosystem.identity,
        kind:'PLANET' as const,bodyIndex:'1',moonIndex:null},founderSpeciesId:'founder',
      lineage:'HUMANOID' as const,tier:'ADVANCED' as const},
    settlement:{id:`habitat-${index}`,habitatTechnology:'SEALED_SURFACE' as const,
      function:'RESEARCH' as const,populationBand:'OUTPOST' as const,
      colonialPopulationRange:[10,30] as const,supportSystems:[]},
    introducedOrganisms:[],terraform:null,
  }));
  const c:Vida8ColonizationSnapshot={...colonization,
    outcome:count>0?'COLONIZED':'NOT_SELECTED',colonialPopulationPresent:count>0,colonies};
  return Vida9BiologyExploration.evaluate(ecosystem,intelligence,c);
}
function database():GenesisIndexedDb{
  return new GenesisIndexedDb('genesis-38bis-a4-'+Math.random().toString(36).slice(2),
    {indexedDB,IDBKeyRange});
}
function minimalPreview():ScientificBodyPreviewModel {
  const primary={moonOrdinal:1,shapeClass:'REGULAR_SMALL',title:'Aaras A-11 I',
    infrastructurePlans:[]} as unknown as Extract<ScientificBodyPreviewModel,
      {kind:typeof ScientificBodyPreviewKind.MOON}>['primary'];
  return {kind:ScientificBodyPreviewKind.MOON,accessibleLabel:'Luna I',
    primary,hostPlanet:null,moons:[primary],epochSimulationDay:0,
    spinPlaybackDaysPerRealSecond:1};
}
describe('38.bis-a4 · ficha lunar, atlas colonial y designaciones',()=>{
  it('lee el mismo registro VIDA.9 persistido y verificado que cuenta 38.6b',async()=>{
    const db=database();
    try{
      const original=recordWithColonies(1);
      await new DexieVida9BiologyExplorationRepository(db).ensure(original);
      const loaded=await readVerifiedMoonBiology386c(db,request,0);
      expect(loaded?.digest).toBe(original.digest);
      expect(loaded?.colonization.colonies).toHaveLength(1);
    }finally{db.closeDatabase();}
  });
  it('no consulta IndexedDB sin confirmación o para otro localizador',async()=>{
    const db=database();const spy=vi.spyOn(db,'openDatabase');
    try{
      expect(await readVerifiedMoonBiology386c(db,{...request,confirmed:false},0)).toBeNull();
      expect(await readVerifiedMoonBiology386c(db,request,9)).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    }finally{db.closeDatabase();}
  });
  it('rechaza un digest alterado y nunca proyecta un registro de otra luna',async()=>{
    const db=database();
    try{
      const original=recordWithColonies(1);
      await new DexieVida9BiologyExplorationRepository(db).ensure(original);
      expect(await readVerifiedMoonBiology386c(db,{...request,bodyIndex:4n},0)).toBeNull();
      const row=await db.privateBiologicalRecordsVIDA9.get([seed,3,original.bodyStorageKey]);
      await db.privateBiologicalRecordsVIDA9.put({...row!,digest:'INVALID'});
      expect(await readVerifiedMoonBiology386c(db,request,0)).toBeNull();
    }finally{db.closeDatabase();}
  });
  it('actualiza los planes 3D de la luna seleccionada sin alterar ni contexto ni registros',()=>{
    const preview=minimalPreview(),record=recordWithColonies(1);
    const updated=moonPreviewWithVerifiedBiology38BisA4(preview,record);
    expect(updated.kind).toBe(ScientificBodyPreviewKind.MOON);
    if(updated.kind!==ScientificBodyPreviewKind.MOON||preview.kind!==ScientificBodyPreviewKind.MOON)throw Error('Unexpected kind');
    expect(updated.primary.infrastructurePlans).toHaveLength(1);
    expect(updated.moons[0]).toBe(updated.primary);
    expect(preview.primary.infrastructurePlans).toEqual([]);
    expect(record.colonization.colonies).toHaveLength(1);
    expect(updated.primary.title).toBe(preview.primary.title);
  });
  it('requiere identidad lunar y permiso incluso en la proyección pura',()=>{
    const record=recordWithColonies(1);
    expect(verifiedMoonDetailRecord38BisA4(record,request,0)).toBe(record);
    expect(verifiedMoonDetailRecord38BisA4(record,{...request,confirmed:false},0)).toBeNull();
    expect(verifiedMoonDetailRecord38BisA4(record,{...request,bodyIndex:9n},0)).toBeNull();
    expect(verifiedMoonDetailRecord38BisA4(record,request,1)).toBeNull();
  });
  it('no introduce infraestructura adicional si el registro no contiene colonias',()=>{
    const updated=moonPreviewWithVerifiedBiology38BisA4(minimalPreview(),recordWithColonies(0));
    expect(updated.kind).toBe(ScientificBodyPreviewKind.MOON);
    if(updated.kind!==ScientificBodyPreviewKind.MOON)throw Error('Unexpected kind');
    expect(updated.primary.infrastructurePlans).toHaveLength(0);
  });
  it('el índice 0 se muestra como I y el índice 3 como IV, sin alterar la ruta',()=>{
    expect(archiveMoonDesignation38BisA4('Aaras A-11','0')).toBe('Aaras A-11 I');
    expect(archiveMoonDesignation38BisA4('Aaras A-9','3')).toBe('Aaras A-9 IV');
    expect(archiveMoonDesignation38BisA4('Planeta 10','x')).toBe('Planeta 10 · Luna x');
  });
});
