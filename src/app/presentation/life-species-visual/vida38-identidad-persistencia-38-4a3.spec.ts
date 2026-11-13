/** 38.4a3 — Contrato productivo VIDA→visual: identidad, rasgos, ubicación y round trip de datos.
 * No es un test de persistencia IndexedDB ni de la función generadora VIDA.6.
 */
import { describe, expect, it } from 'vitest';
import { VIDA6_REVISION } from '../../domain/life/vida6-ecosystems-species';
import { VIDA7_REVISION } from '../../domain/life/vida7-intelligence-civilizations';
import { VIDA9_REVISION } from '../../domain/life/vida9-biology-exploration';
import {
  vida38SpeciesVisualContractFromConfirmedV1,
  type Vida38ConfirmedBiologySource,
} from './vida38-species-visual-contract';

/** Caso sintético válido con los tipos y el mapper productivos, sin datos de laboratorio 38.2. */
function source(id = 'BIO-38-4A3-001'): Vida38ConfirmedBiologySource {
  const species = {
    id,
    proceduralName: 'Organismo de validación',
    group: 'REPTILES',
    habitat: 'SURFACE_OPEN_TERRAIN',
    nutrition: 'PREDATOR',
    niche: 'DEPREDADOR_TERRESTRE',
    adaptations: ['RESISTENCIA_TERMICA'],
    phenotype: {
      bodyPlan: 'TETRAPOD', covering: 'SCALES', locomotion: 'WALKING',
      bodyLengthMeters: 1.9, primaryColorHex: '#597C62', secondaryColorHex: '#B5A680',
      pattern: 'BANDS', appendagePairs: 2, bioluminescent: false,
    },
  };
  // El mapper exige solo un Pick de las estructuras VIDA.6/7/9; otros campos del snapshot
  // no intervienen. La conversión es local al fixture, no altera el código científico.
  return {
    revision: VIDA9_REVISION,
    epoch: 'CT-0',
    bodyStorageKey: 'MUNDO_ORIGEN',
    ecosystem: {
      revision: VIDA6_REVISION,
      bodyStorageKey: 'MUNDO_ORIGEN',
      digest: 'ECOSYSTEM_A',
      species: [species],
    },
    intelligence: {
      revision: VIDA7_REVISION,
      ecosystemDigest: 'ECOSYSTEM_A',
      intelligentSpecies: null,
      civilization: null,
    },
  } as unknown as Vida38ConfirmedBiologySource;
}
function copy<T>(value:T):T { return JSON.parse(JSON.stringify(value)) as T; }
function visual(record:Vida38ConfirmedBiologySource,id='BIO-38-4A3-001') {
  const v=vida38SpeciesVisualContractFromConfirmedV1(record,id);
  expect(v,'el fixture debe cumplir el contrato confirmado CT-0').not.toBeNull();
  return v!;
}
function speciesChange(record:Vida38ConfirmedBiologySource, mutator:(species:any)=>void):Vida38ConfirmedBiologySource {
  const next=copy(record) as any;
  mutator(next.ecosystem.species[0]);
  return next as Vida38ConfirmedBiologySource;
}
function relocate(record:Vida38ConfirmedBiologySource,storageKey:string,digest:string):Vida38ConfirmedBiologySource {
  const next=copy(record) as any;
  next.bodyStorageKey=storageKey;
  next.ecosystem.bodyStorageKey=storageKey;
  next.ecosystem.digest=digest;
  next.intelligence.ecosystemDigest=digest;
  return next as Vida38ConfirmedBiologySource;
}

describe('38.4a3 — mapper productivo VIDA.6/7/9',()=>{
  it('dos evaluaciones independientes producen el mismo contrato completo',()=>{
    const a=source();
    expect(visual(a)).toEqual(visual(copy(a)));
  });
  it('un cambio de ubicación/procedencia no cambia semilla, fingerprint ni rasgos',()=>{
    const original=visual(source());
    const moved=visual(relocate(source(),'OTRO_SISTEMA/OTRO_PLANETA','ECOSYSTEM_B'));
    expect(moved.variantSeedUint32).toBe(original.variantSeedUint32);
    expect(moved.appearanceFingerprint).toBe(original.appearanceFingerprint);
    expect(moved.morphology).toEqual(original.morphology);
    expect(moved.ecology).toEqual(original.ecology);
    expect(moved.pigmentation).toEqual(original.pigmentation);
    expect(moved.provenance.bodyStorageKey).not.toBe(original.provenance.bodyStorageKey);
  });
  it('una modificación del fenotipo afecta al fingerprint sin cambiar identidad/semilla',()=>{
    const original=visual(source());
    const changed=visual(speciesChange(source(),s=>{s.phenotype.primaryColorHex='#A382BC';}));
    expect(changed.variantSeedUint32).toBe(original.variantSeedUint32);
    expect(changed.appearanceFingerprint).not.toBe(original.appearanceFingerprint);
    expect(changed.pigmentation.primaryColorHex).toBe('#A382BC');
  });
  it('una adaptación diferente afecta al fingerprint sin cambiar identidad/semilla',()=>{
    const original=visual(source());
    const changed=visual(speciesChange(source(),s=>{s.adaptations=['RESISTENCIA_TERMICA','CAMUFLAJE'];}));
    expect(changed.variantSeedUint32).toBe(original.variantSeedUint32);
    expect(changed.appearanceFingerprint).not.toBe(original.appearanceFingerprint);
    expect(changed.adaptations).toContain('CAMUFLAJE');
  });
  it('la identidad biológica cambia la semilla sin añadir rasgos falsos',()=>{
    const a=visual(source());
    const b=visual(source('BIO-38-4A3-002'),'BIO-38-4A3-002');
    expect(b.speciesId).not.toBe(a.speciesId);
    expect(b.variantSeedUint32).not.toBe(a.variantSeedUint32);
    expect(b.appearanceFingerprint).toBe(a.appearanceFingerprint);
  });
  it('JSON roundtrip del registro VIDA mantiene seed/fingerprint/contrato completo',()=>{
    const before=visual(source());
    const after=visual(copy(source()));
    expect(after).toEqual(before);
    expect(copy(after)).toEqual(before);
  });
  it('un registro no confirmado o de clave biológica inconsistente nunca genera un visual',()=>{
    const invalid=copy(source()) as any;
    invalid.epoch='CT-1';
    expect(vida38SpeciesVisualContractFromConfirmedV1(invalid,'BIO-38-4A3-001')).toBeNull();
    invalid.epoch='CT-0';invalid.ecosystem.bodyStorageKey='OTRO_CUERPO';
    expect(vida38SpeciesVisualContractFromConfirmedV1(invalid,'BIO-38-4A3-001')).toBeNull();
    expect(vida38SpeciesVisualContractFromConfirmedV1(source(),'BIO-DESCONOCIDO')).toBeNull();
  });
  it('la ficha no cambia por campos espaciales ajenos al tipo de VIDA, cuando la especie es la misma',()=>{
    const record={...source(),systemId:'OTRO_SISTEMA',planetIndex:83,sectorX:52};
    expect(visual(record)).toEqual(visual(source()));
  });
});
