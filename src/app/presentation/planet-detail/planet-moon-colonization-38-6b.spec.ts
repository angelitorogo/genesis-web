import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieVida9BiologyExplorationRepository } from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import { Vida9BiologyExploration } from '../../simulation/life/vida9-biology-exploration';
import { vida9TestSources } from '../../simulation/life/vida9-test-fixture';
import type { Vida8Colony, Vida8ColonizationSnapshot } from '../../domain/life/vida8-technological-colonization';
import { planetMoonColonizationView386b } from './planet-moon-colonization-38-6b';
import {
  readPlanetMoonColonies386b, verifiedMoonColonyCount386b,
  type PlanetMoonColonizationRequest386b,
} from './planet-moon-colonization-data-source-38-6b';

const seed = '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const request: PlanetMoonColonizationRequest386b = {
  confirmed: true, universeSeed: seed, generatorVersionCode: 3,
  galaxyIndex: 0n, sectorKey: 1n, galacticObjectIndex: 2n, bodyIndex: 3n,
  moonIndices: [0,1],
};
function makeRecord(colonyCount: number) {
  const {ecosystem,intelligence,colonization} = vida9TestSources();
  const colonies: Vida8Colony[] = Array.from({length:colonyCount}, (_,index)=>({
    id:`colony-${index}`, provenance:'TECHNOLOGICAL_COLONIZATION' as const,
    origin: {
      civilizationDigest: 'origin-civ', sourceEcosystemDigest: 'origin-eco',
      sourceBodyStorageKey:'0:1:2:1:PLANET:-',
      sourceIdentity: {...ecosystem.identity,kind:'PLANET' as const,bodyIndex:'1',moonIndex:null},
      founderSpeciesId:'founder', lineage:'HUMANOID' as const, tier:'ADVANCED' as const,
    },
    settlement: {id:`settlement-${index}`,habitatTechnology:'SEALED_SURFACE' as const,
      function:'RESEARCH' as const,populationBand:'OUTPOST' as const,
      colonialPopulationRange:[10,30] as const,supportSystems:[]},
    introducedOrganisms:[],terraform:null,
  }));
  const snapshot: Vida8ColonizationSnapshot = {
    ...colonization, outcome:colonyCount > 0?'COLONIZED':'NOT_SELECTED',
    colonies, colonialPopulationPresent:colonyCount > 0,
  };
  return Vida9BiologyExploration.evaluate(ecosystem,intelligence,snapshot);
}
function database():GenesisIndexedDb {
  return new GenesisIndexedDb(`genesis-38-6b-${Math.random().toString(36).slice(2)}`,{indexedDB,IDBKeyRange});
}

describe('38.6b · contador lunar confirmado VIDA.8/9',()=>{
  it('distingue lunas colonizadas de número total de colonias',()=>{
    const view=planetMoonColonizationView386b([0,1,2],3,new Map([[0,2],[1,0],[2,1]]));
    expect(view.total.value).toBe('2');
    expect(view.perMoon.get(0)?.value).toBe('2 colonias');
    expect(view.perMoon.get(1)?.value).toBe('Sin colonias registradas');
    expect(view.perMoon.get(2)?.value).toBe('1 colonia');
  });
  it('no presenta como estéril una luna sin registro o un recuento incompleto',()=>{
    const result=planetMoonColonizationView386b([0,1,2],3,new Map([[0,0],[1,null],[2,2]]));
    expect(result.total.value).toBe('1 verificada');
    expect(result.perMoon.get(1)?.value).toBe('No evaluable');
    expect(planetMoonColonizationView386b([0],2,new Map([[0,0]])).total.value).toBe('No evaluable');
    expect(planetMoonColonizationView386b([0],1,null).perMoon.get(0)?.value).toBe('No evaluable');
  });
  it('rechaza rutas y cuerpos ajenos aunque el registro sea correcto',()=>{
    const record=makeRecord(2);
    expect(verifiedMoonColonyCount386b(record,request,0)).toBe(2);
    expect(verifiedMoonColonyCount386b(record,{...request,bodyIndex:4n},0)).toBeNull();
    expect(verifiedMoonColonyCount386b(record,{...request,confirmed:false},0)).toBeNull();
    expect(verifiedMoonColonyCount386b(record,request,1)).toBeNull();
  });
  it('no abre la base de datos ni accede a registros privados sin confirmación',async()=>{
    const db=database();
    const open=vi.spyOn(db,'openDatabase');
    try {
      const counts=await readPlanetMoonColonies386b(db,{...request,confirmed:false});
      expect(counts.size).toBe(0);
      expect(open).not.toHaveBeenCalled();
    } finally { db.closeDatabase(); }
  });
  it('lee colonias de un registro Dexie real y diferencia una luna ausente',async()=>{
    const db=database();
    try {
      await new DexieVida9BiologyExplorationRepository(db).ensure(makeRecord(2));
      const counts=await readPlanetMoonColonies386b(db,request);
      expect(counts.get(0)).toBe(2);
      expect(counts.get(1)).toBeNull();
      expect(planetMoonColonizationView386b([0,1],2,counts).total.value).toBe('1 verificada');
    } finally { db.closeDatabase(); }
  });
  it('rechaza digest dañado en la base y no interpreta el error como cero colonias',async()=>{
    const db=database();
    try {
      const record=makeRecord(1);
      await new DexieVida9BiologyExplorationRepository(db).ensure(record);
      const row=await db.privateBiologicalRecordsVIDA9.get([seed,3,record.bodyStorageKey]);
      expect(row).toBeDefined();
      await db.privateBiologicalRecordsVIDA9.put({...row!,digest:'INVALID'});
      const result=await readPlanetMoonColonies386b(db,request);
      expect(result.get(0)).toBeNull();
    } finally { db.closeDatabase(); }
  });
  it('mantiene el recuento tras cerrar y abrir la base (CT-0 inmutable)',async()=>{
    const db=database();
    try {
      await new DexieVida9BiologyExplorationRepository(db).ensure(makeRecord(1));
      db.closeDatabase();
      const counts=await readPlanetMoonColonies386b(db,request);
      expect(counts.get(0)).toBe(1);
    } finally { db.closeDatabase(); }
  });
});
