import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  deriveVida38FungalMorphology38M, VIDA38_FUNGAL_FORMS_38M,
  VIDA38_FUNGAL_LABELS_38M,
} from './vida38-fungi-morphology-38-2m';
import { createVida38FungalPreview38M } from './vida38-fungi-preview-38-2m';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';

function fungus(id: string, height = .95): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: id, speciesName: id, variantSeedUint32: 381827,
    appearanceFingerprint: 'fungi-m-38-2m',
    provenance: {status: 'CONFIRMED_SYSTEM_CT0', representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false, bodyStorageKey: `V3:fungus:${id}`, ecosystemDigest: 'digest:fungi'},
    morphology: {group: 'FUNGI', bodyPlan: 'FILAMENTOUS', covering: 'FIBROUS', appendagePairs: 0},
    ecology: {habitat: 'SURFACE_WET_MARGIN', nutrition: 'DECOMPOSER', niche: 'WET_MARGIN/DECOMPOSER'},
    locomotion: 'SESSILE', bodyLengthMeters: height,
    pigmentation: {primaryColorHex: '#8275aa', secondaryColorHex: '#c8a778', pattern: 'MOTTLED', bioluminescent: false},
    adaptations: ['HUMIDITY_TOLERANCE'], intelligence: null,
  };
}
function representativeIds(): Map<string, string> {
  const ids = new Map<string,string>();
  for(let i=0; i<500 && ids.size<VIDA38_FUNGAL_FORMS_38M.length; i++) {
    const id=`fungal-family:${i}`;
    ids.set(deriveVida38FungalMorphology38M(fungus(id)).form, id);
  }
  return ids;
}
function geometrySnapshot(subject: THREE.Group): number[] {
  const numbers:number[]=[];
  subject.traverse(obj => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.geometry || numbers.length >= 180) return;
    const arr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i=0; i<Math.min(20, arr.count); i++) {
      numbers.push(arr.getX(i),arr.getY(i),arr.getZ(i));
    }
  });
  return numbers.slice(0,180);
}

describe('38.2m — hongos orgánicos y familias fúngicas', () => {
  it('cubre las ocho familias con anatomía invariante al cambio de color', () => {
    expect(VIDA38_FUNGAL_FORMS_38M).toHaveLength(8);
    const found = representativeIds();
    expect(found.size).toBe(8);
    for(const form of VIDA38_FUNGAL_FORMS_38M) {
      const id = found.get(form)!;
      const first = deriveVida38FungalMorphology38M(fungus(id));
      const original = fungus(id);
      const changed = {...original, pigmentation: {...original.pigmentation, primaryColorHex:'#000000', secondaryColorHex:'#ffffff'}};
      expect(deriveVida38FungalMorphology38M(changed)).toEqual(first);
      expect(first.form).toBe(form);
      expect(VIDA38_FUNGAL_LABELS_38M[form].length).toBeGreaterThan(8);
    }
  });
  it('solo admite especies FUNGI y mantiene talla VIDA y procedencia artística', () => {
    const c = fungus('fungus-length', 3.2142);
    const m = deriveVida38FungalMorphology38M(c);
    expect(m.sourceLengthMeters).toBe(3.2142);
    expect(m.provenance).toBe('ARTISTIC_HYPOTHESIS_NOT_OBSERVED');
    expect(deriveVida38FungalMorphology38M(c)).toEqual(m);
    expect(() => deriveVida38FungalMorphology38M({...c,morphology:{...c.morphology,group:'PLANTS_TREES'}})).toThrow();
  });
  it('construye cuerpos fructíferos distintos, mallas indexadas y orgánicas para todas las familias', () => {
    for(const [form, id] of representativeIds()) {
      const group = new THREE.Group();
      const model = createVida38FungalPreview38M(group, fungus(id), 'LOW');
      expect(model.form).toBe(form);
      expect(group.userData['fungalMorphotype38M']).toBe(form);
      expect(group.children.filter(o=>o.name.includes('_ARCHITECTURE'))).toHaveLength(1);
      let count=0;
      group.traverse(object => {
        if(!(object instanceof THREE.Mesh)) return;
        count++;
        expect(object).not.toBeInstanceOf(THREE.InstancedMesh);
        const mesh = object as THREE.Mesh;
        const pos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
        const col = mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
        expect(pos.count).toBeGreaterThan(24);
        expect(col.count).toBe(pos.count);
        expect(mesh.geometry.index?.count).toBeGreaterThan(60);
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        expect(mat).toBeInstanceOf(THREE.MeshPhysicalMaterial);
        expect(mat.vertexColors).toBe(true);
        expect(mat.transparent).toBe(form === 'GELATINOUS');
        for(let i=0; i<pos.count; i++) {
          expect(Number.isFinite(pos.getX(i)+pos.getY(i)+pos.getZ(i))).toBe(true);
        }
      });
      expect(count).toBeGreaterThan(1);
      expect(count).toBeLessThanOrEqual(90);
      group.traverse(o => {
        const mesh=o as THREE.Mesh;
        if(mesh.geometry)mesh.geometry.dispose();
        if(mesh.material)(mesh.material as THREE.Material).dispose();
      });
    }
  }, 15000);
  it('no se limita a cilindros con sombreros; cada familia expone órganos específicos', () => {
    const expected:Record<string,string> = {
      AGARICOID:'RADIAL_GILLS',BOLETOID:'PORES',BRACKET:'FERTILE_UNDERSIDE',
      CORAL:'RAMUS',GASTEROID:'SPOROCARP',CUP:'INNER_HYMENIUM',
      GELATINOUS:'FOLDED_LOBE',ROSETTE:'UPPER_LAMINA',
    };
    for(const [form,id] of representativeIds()) {
      const model = createVida38SpeciesPreviewModelV1(fungus(id),{humanoidQuality:'LOW'});
      const names:string[]=[];
      model.subject.traverse(obj=>names.push(obj.name));
      expect(names.some(n=>n.includes(expected[form]!))).toBe(true);
      expect(model.descriptor.family).toBe('FUNGAL_CLUSTER');
      expect(names.some(n=>n.startsWith('VIDA38_2L_PLANT_'))).toBe(false);
      expect(model.subject.userData['fungalReconstructionStatus38M']).toBe('ARTISTIC_HYPOTHESIS_NOT_OBSERVED');
      const before=model.subject.position.y;
      model.animation(0);
      expect(model.subject.position.y).toBeCloseTo(before,5);
      model.dispose();
    }
  }, 15000);
  it('repite exactamente la geometría tras consultar otra especie (determinismo CT-0)', () => {
    const a = fungus('identity-stability',2.7);
    const b = fungus('independent-state',.4);
    const first = new THREE.Group();
    createVida38FungalPreview38M(first,a,'LOW');
    const snapshot=geometrySnapshot(first);
    createVida38FungalPreview38M(new THREE.Group(),b,'LOW');
    const repeated=new THREE.Group();
    createVida38FungalPreview38M(repeated,a,'LOW');
    expect(geometrySnapshot(repeated)).toEqual(snapshot);
  },15000);
  it('mantiene un presupuesto acotado de cuerpos en LOD LOW/MEDIUM/HIGH',()=>{
    const id=representativeIds().get('CORAL')!;
    for(const quality of ['LOW','MEDIUM','HIGH'] as const) {
      const g=new THREE.Group();
      createVida38FungalPreview38M(g,fungus(id),quality);
      let meshes=0;g.traverse(o=>{if(o instanceof THREE.Mesh)meshes++;});
      expect(meshes).toBeLessThanOrEqual(quality==='HIGH'?230:quality==='MEDIUM'?145:90);
    }
  },15000);
});
