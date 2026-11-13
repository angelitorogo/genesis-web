import { describe, expect, it } from 'vitest';
import { VIDA9_REVISION, vida9DigestForRecord, type Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import { Vida9BiologyExploration } from '../../simulation/life/vida9-biology-exploration';
import { vida9TestSources } from '../../simulation/life/vida9-test-fixture';
import { vida38ConfirmedSpeciesDetail385 } from './vida38-ficha-conocimiento-38-5';

const id = 'vida6:38-5-certified';
function fixture(): Vida9BiologyRecord {
  const {ecosystem, intelligence, colonization} = vida9TestSources();
  const species = {
    id, proceduralName:'Especie registrada 38.5', group:'REPTILES' as const,
    habitat:'SURFACE_OPEN_TERRAIN' as const, nutrition:'PREDATOR' as const,
    niche:'SURFACE_OPEN_TERRAIN/PREDATOR', adaptations:['THERMAL_TOLERANCE'],
    phenotype: {
      bodyPlan:'TETRAPOD' as const, covering:'SCALES' as const,
      locomotion:'WALKING' as const, bodyLengthMeters:1.8,
      primaryColorHex:'#4A875E',secondaryColorHex:'#325844',pattern:'SPOTS' as const,
      appendagePairs:2, bioluminescent:false,
    },
  };
  const e={...ecosystem,species:[species]};
  const i={...intelligence,ecosystemDigest:e.digest};
  const base=Vida9BiologyExploration.evaluate(ecosystem,intelligence,colonization);
  const {digest:_unused,...original}=base;
  const content={...original,revision:VIDA9_REVISION,ecosystem:e,intelligence:i};
  return {...content,digest:vida9DigestForRecord(content)};
}
function grant(record:Vida9BiologyRecord) {
  return {confirmedSystem:true,bodyStorageKey:record.bodyStorageKey};
}
describe('38.5 — ficha CT-0: procedencia y acceso fail-closed',()=>{
  it('niega datos privados cuando no hay confirmación externa',()=>{
    const record=fixture();
    expect(vida38ConfirmedSpeciesDetail385(record,id,{...grant(record),confirmedSystem:false})).toBeNull();
    expect(vida38ConfirmedSpeciesDetail385(record,id,{...grant(record),bodyStorageKey:'otro'})).toBeNull();
  });
  it('solo presenta especies existentes y conserva el taxón VIDA.6',()=>{
    const record=fixture();
    expect(vida38ConfirmedSpeciesDetail385(record,'no-existe',grant(record))).toBeNull();
    const detail=vida38ConfirmedSpeciesDetail385(record,id,grant(record));
    expect(detail).not.toBeNull();
    expect(detail?.species).toEqual(record.ecosystem.species[0]);
    expect(detail?.visualContract.speciesId).toBe(id);
    expect(detail?.originBodyStorageKey).toBe(record.bodyStorageKey);
    expect(detail?.historicalOriginEpochYears).toBeNull();
    expect(detail?.representation).toContain('NO IMAGEN OBSERVADA');
  });
  it('no inventa civilizaciones, tecnologías ni relaciones',()=>{
    const record=fixture();
    const detail=vida38ConfirmedSpeciesDetail385(record,id,grant(record));
    expect(detail?.civilization).toBeNull();
    expect(detail?.ecologicalRelations).toEqual([]);
  });
  it('rechaza registros modificados sin digest válido',()=>{
    const record=fixture();
    const changed={...record,ecosystem:{...record.ecosystem,species:[]}};
    expect(vida38ConfirmedSpeciesDetail385(changed,id,grant(record))).toBeNull();
  });
  it('el mismo registro serializado preserva sus datos de conocimiento',()=>{
    const record=fixture();
    const restored=JSON.parse(JSON.stringify(record)) as Vida9BiologyRecord;
    expect(vida38ConfirmedSpeciesDetail385(restored,id,grant(restored)))
      .toEqual(vida38ConfirmedSpeciesDetail385(record,id,grant(record)));
  });
  it('no confunde un sistema confirmado con un registro de otra época',()=>{
    const record=fixture();
    const altered={...record,epoch:'OTHER' as Vida9BiologyRecord['epoch']};
    expect(vida38ConfirmedSpeciesDetail385(altered,id,grant(record))).toBeNull();
  });
});
