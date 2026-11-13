import { describe, expect, it } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { vida9DigestForRecord, type Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import { Vida9BiologyExploration } from '../../simulation/life/vida9-biology-exploration';
import { vida9TestSources } from '../../simulation/life/vida9-test-fixture';
import { vida38AuthorizeSpeciesRoute385, vida38ExpectedBodyKey385, type Vida38KnowledgeRoute385 } from './vida38-acceso-ficha-38-5';

const SPECIES_ID = 'vida6:38-5-authorized';
function fixture(): Vida9BiologyRecord {
  const { ecosystem, intelligence, colonization } = vida9TestSources();
  const base = Vida9BiologyExploration.evaluate(ecosystem, intelligence, colonization);
  const { digest: _unused, ...content } = base;
  const identity = {
    ...base.identity,
    galaxyIndex: '0', sectorKey: '1', galacticObjectIndex: '2',
    bodyIndex: '3', kind: 'PLANET' as const, moonIndex: null,
  };
  const bodyStorageKey = '0:1:2:3:PLANET:-';
  const species = {
    id: SPECIES_ID, proceduralName: 'Taxón confirmado de ensayo',
    group: 'REPTILES' as const, habitat: 'SURFACE_OPEN_TERRAIN' as const,
    nutrition: 'PREDATOR' as const, niche: 'SURFACE_OPEN_TERRAIN/PREDATOR',
    adaptations: ['THERMAL_TOLERANCE'],
    phenotype: {
      bodyPlan: 'TETRAPOD' as const, covering: 'SCALES' as const,
      locomotion: 'WALKING' as const, bodyLengthMeters: 1.8,
      primaryColorHex: '#4A875E', secondaryColorHex: '#325844',
      pattern: 'SPOTS' as const, appendagePairs: 2, bioluminescent: false,
    },
  };
  const e = { ...base.ecosystem, identity, bodyStorageKey, species: [species] };
  const i = { ...base.intelligence, identity, bodyStorageKey, ecosystemDigest: e.digest };
  const c = { ...base.colonization, identity, bodyStorageKey };
  const changed = { ...content, identity, bodyStorageKey, ecosystem: e, intelligence: i, colonization: c };
  return { ...changed, digest: vida9DigestForRecord(changed) };
}
function route(r: Vida9BiologyRecord): Vida38KnowledgeRoute385 {
  return {
    locatorKind: 'system', discoveryState: DiscoveryState.CONFIRMED,
    universeSeed: r.identity.universeSeed, generatorVersionCode: 3,
    galaxyIndex: 0n, sectorKey: 1n, galacticObjectIndex: 2n,
  };
}
function read(r: Vida9BiologyRecord, m = route(r), id = SPECIES_ID) {
  return vida38AuthorizeSpeciesRoute385(m, 3n, null, false, r, id);
}
describe('38.5 — ficha real: permiso de descubrimiento y procedencia del cuerpo', () => {
  it('acepta el sistema confirmado y mantiene íntegro el taxón VIDA.6/7/9', () => {
    const r = fixture();
    const d = read(r);
    expect(d).not.toBeNull();
    expect(d?.species).toEqual(r.ecosystem.species[0]);
    expect(d?.visualContract.speciesId).toBe(SPECIES_ID);
    expect(d?.originBodyStorageKey).toBe(r.bodyStorageKey);
    expect(d?.civilization).toBeNull();
  });
  it('bloquea estados no confirmados y ausencia de modelo', () => {
    const r = fixture();
    expect(read(r, { ...route(r), discoveryState: DiscoveryState.DISCOVERED })).toBeNull();
    expect(read(r, { ...route(r), discoveryState: DiscoveryState.CATALOGUED })).toBeNull();
    expect(vida38AuthorizeSpeciesRoute385(null,3n,null,false,r,SPECIES_ID)).toBeNull();
    expect(vida38ExpectedBodyKey385(null,3n,null,false)).toBeNull();
  });
  it('no autoriza versiones, localizadores ni universos ajenos', () => {
    const r = fixture();
    expect(read(r,{...route(r), generatorVersionCode:2})).toBeNull();
    expect(read(r,{...route(r), locatorKind:'galactic-object'})).toBeNull();
    expect(read(r,{...route(r), universeSeed:'OTHER-UNIVERSE'})).toBeNull();
    expect(read(r,{...route(r), galacticObjectIndex:3n})).toBeNull();
  });
  it('impide mostrar una especie de otro planeta o una luna desde ruta planetaria', () => {
    const r = fixture();
    expect(vida38AuthorizeSpeciesRoute385(route(r),4n,null,false,r,SPECIES_ID)).toBeNull();
    expect(vida38AuthorizeSpeciesRoute385(route(r),3n,0n,true,r,SPECIES_ID)).toBeNull();
    expect(read(r,{...route(r),sectorKey:2n})).toBeNull();
  });
  it('no divulga especies inexistentes ni registros de digest alterado', () => {
    const r = fixture();
    expect(read(r,route(r),'vida6:no-existe')).toBeNull();
    expect(read({...r,digest:'INVALID'})).toBeNull();
  });
  it('reconstruye la misma ficha tras serialización del registro confirmado', () => {
    const r=fixture();
    const restored=JSON.parse(JSON.stringify(r)) as Vida9BiologyRecord;
    expect(read(restored)).toEqual(read(r));
  });
});
