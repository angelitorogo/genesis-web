import 'fake-indexeddb/auto';
import {describe,expect,it,vi} from 'vitest';
import {GenesisIndexedDb} from '../../data/local/indexed-db/genesis-indexed-db';
import {DexieVida9BiologyExplorationRepository} from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import {Vida9BiologyExploration} from '../../simulation/life/vida9-biology-exploration';
import {vida9TestSources} from '../../simulation/life/vida9-test-fixture';
import type {Vida8ColonizationSnapshot,Vida8Colony} from '../../domain/life/vida8-technological-colonization';
import {ScientificBodyPreviewKind,type ScientificBodyPreviewModel} from '../scientific/scientific-body-preview';
import {planetPreviewWithVerifiedBiology38BisT4} from './planet-confirmed-preview-38bis-t4';
import {readVerifiedPlanetBiology38BisT4,verifiedPlanetBiology38BisT4,
  type PlanetConfirmedBiologyRequest38BisT4} from './planet-confirmed-biology-38bis-t4';

const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const request:PlanetConfirmedBiologyRequest38BisT4={confirmed:true,universeSeed:seed,
  generatorVersionCode:3,galaxyIndex:0n,sectorKey:1n,galacticObjectIndex:2n,bodyIndex:3n};
function recordWithColonies(count:number){
  const base=vida9TestSources();
  const identity={...base.ecosystem.identity,kind:'PLANET' as const,moonIndex:null};
  const bodyStorageKey='0:1:2:3:PLANET:-';
  const ecosystem={...base.ecosystem,identity,bodyStorageKey};
  const intelligence={...base.intelligence,identity,bodyStorageKey};
  const colonies:Vida8Colony[]=Array.from({length:count},(_,i)=>({
    id:`colony-${i}`,provenance:'TECHNOLOGICAL_COLONIZATION' as const,
    origin:{civilizationDigest:'source-civilization',sourceEcosystemDigest:'source-ecosystem',
      sourceBodyStorageKey:'0:1:2:1:PLANET:-',sourceIdentity:{...identity,bodyIndex:'1'},
      founderSpeciesId:'founder',lineage:'HUMANOID' as const,tier:'ADVANCED' as const},
    settlement:{id:`habitat-${i}`,habitatTechnology:'SEALED_SURFACE' as const,
      function:'RESEARCH' as const,populationBand:'OUTPOST' as const,
      colonialPopulationRange:[10,30] as const,supportSystems:[]},
    introducedOrganisms:[],terraform:null,
  }));
  const colonization:Vida8ColonizationSnapshot={...base.colonization,identity,bodyStorageKey,
    outcome:count?'COLONIZED':'NOT_SELECTED',colonialPopulationPresent:count>0,colonies};
  return Vida9BiologyExploration.evaluate(ecosystem,intelligence,colonization);
}
function database():GenesisIndexedDb{
  return new GenesisIndexedDb('genesis-38bis-t4-'+Math.random().toString(36).slice(2),
    {indexedDB,IDBKeyRange});
}
function preview():ScientificBodyPreviewModel {
  return {kind:ScientificBodyPreviewKind.PLANET,accessibleLabel:'Aetor b',
    primary:{title:'Aetor b',planetId:'planet-1',infrastructurePlans:[],
      nightCivilizationTier:null,vegetationProfile:null} as unknown as Extract<ScientificBodyPreviewModel,
      {kind:typeof ScientificBodyPreviewKind.PLANET}>['primary'],
    moons:[],epochSimulationDay:0,spinPlaybackDaysPerRealSecond:1};
}
describe('38.bis-T4 · paridad colonial planetaria persistida',()=>{
  it('lee para planetas la misma instantánea VIDA.9 válida que utiliza el Archivo',async()=>{
    const db=database();
    try {
      const record=recordWithColonies(1);
      await new DexieVida9BiologyExplorationRepository(db).ensure(record);
      const loaded=await readVerifiedPlanetBiology38BisT4(db,request);
      expect(loaded?.digest).toBe(record.digest);
      expect(loaded?.colonization.colonies).toHaveLength(1);
      expect(loaded?.intelligence.civilizationPresent).toBe(false);
    } finally { db.closeDatabase(); }
  });
  it('no toca la base si el sistema no está confirmado o el localizador es inválido',async()=>{
    const db=database(),spy=vi.spyOn(db,'openDatabase');
    try {
      expect(await readVerifiedPlanetBiology38BisT4(db,{...request,confirmed:false})).toBeNull();
      expect(await readVerifiedPlanetBiology38BisT4(db,{...request,bodyIndex:-1n})).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    } finally { db.closeDatabase(); }
  });
  it('no confunde otro planeta, otra semilla ni un registro alterado con cero colonias',async()=>{
    const db=database();
    try {
      const record=recordWithColonies(1);
      await new DexieVida9BiologyExplorationRepository(db).ensure(record);
      expect(await readVerifiedPlanetBiology38BisT4(db,{...request,bodyIndex:4n})).toBeNull();
      expect(verifiedPlanetBiology38BisT4(record,{...request,universeSeed:'otro'})).toBeNull();
      const row=await db.privateBiologicalRecordsVIDA9.get([seed,3,record.bodyStorageKey]);
      await db.privateBiologicalRecordsVIDA9.put({...row!,digest:'DAMAGED'});
      expect(await readVerifiedPlanetBiology38BisT4(db,request)).toBeNull();
    } finally { db.closeDatabase(); }
  });
  it('las colonias confirmadas crean infraestructura del planeta sin añadir civilización nativa',()=>{
    const source=preview(),record=recordWithColonies(1);
    const updated=planetPreviewWithVerifiedBiology38BisT4(source,record);
    if(updated.kind!==ScientificBodyPreviewKind.PLANET || source.kind!==ScientificBodyPreviewKind.PLANET)
      throw Error('Unexpected preview type');
    expect(updated.primary.infrastructurePlans).toHaveLength(1);
    expect(updated.primary.infrastructurePlans?.[0]?.provenance).toBe('VIDA8_COLONIAL_SETTLEMENT');
    expect(updated.primary.nightCivilizationTier).toBeNull();
    expect(updated.primary.planetId).toBe(source.primary.planetId);
    expect(updated.moons).toBe(source.moons);
    expect(source.primary.infrastructurePlans).toHaveLength(0);
  });
  it('una instantánea confirmada sin colonias produce cero solo si está verificada',()=>{
    const barren=recordWithColonies(0);
    expect(verifiedPlanetBiology38BisT4(barren,request)?.colonization.colonies).toHaveLength(0);
    const updated=planetPreviewWithVerifiedBiology38BisT4(preview(),barren);
    if(updated.kind!==ScientificBodyPreviewKind.PLANET)throw Error('Unexpected preview type');
    expect(updated.primary.infrastructurePlans).toHaveLength(0);
    expect(verifiedPlanetBiology38BisT4(null,request)).toBeNull();
  });
  it('otras vistas y registros nulos no se alteran',()=>{
    const p=preview(),r=recordWithColonies(1);
    expect(planetPreviewWithVerifiedBiology38BisT4(p,null)).toBe(p);
    const moon={...p,kind:ScientificBodyPreviewKind.MOON} as unknown as ScientificBodyPreviewModel;
    expect(planetPreviewWithVerifiedBiology38BisT4(moon,r)).toBe(moon);
  });
});
