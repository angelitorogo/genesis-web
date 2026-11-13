import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  VIDA38_SPECIES_VISUAL_REVISION,
  type Vida38SpeciesVisualContract,
} from './vida38-species-visual-contract';
import {
  VIDA38_BIRD_ARCHETYPES,
  deriveVida38BirdMorphology38I,
} from './vida38-bird-morphology-38-2i';
import {
  VIDA38_BIRD_MESH_REVISION,
  auditVida38BirdRawMeshV1,
  buildVida38BirdRawMeshV1,
  deriveVida38BirdEyeSurface38IA2,
  deriveVida38BirdLandmarks38I,
  evaluateVida38BirdField38I,
  isVida38BirdProtectedFace38IA2,
} from './vida38-bird-organic-field-38-2i';
import { createVida38BirdPreview38I } from './vida38-bird-preview-38-2i';

function contract(index: number): Vida38SpeciesVisualContract {
  const habitats: Vida38SpeciesVisualContract['ecology']['habitat'][] = [
    'SURFACE_AIR','SURFACE_OPEN_TERRAIN','SURFACE_WET_MARGIN','SURFACE_SOIL',
  ];
  const diets: Vida38SpeciesVisualContract['ecology']['nutrition'][] = [
    'OMNIVORE','PREDATOR','HERBIVORE',
  ];
  const habitat = habitats[index % habitats.length]!;
  const nutrition = diets[index % diets.length]!;
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: `vida6:bird:face38ia2b:${index}`,
    speciesName: `Ave de regresión ${index}`,
    variantSeedUint32: (0x3a924a71 + index * 711) >>> 0,
    appearanceFingerprint: 'bird-face-38ia2b',
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0',
      representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false,
      bodyStorageKey: 'V3:bird-face-test',
      ecosystemDigest: 'digest:bird-face-test',
    },
    morphology: {group:'BIRDS',bodyPlan:'WINGED',covering:'FEATHERS',appendagePairs:2},
    ecology: {habitat,nutrition,niche:`${habitat}/${nutrition}`},
    locomotion:index%3===0?'FLYING':'WALKING',
    bodyLengthMeters:0.84 + (index%7)*0.19,
    pigmentation: {
      primaryColorHex:'#a27b58',secondaryColorHex:'#597b83',
      pattern:'MOTTLED',bioluminescent:false,
    },
    adaptations:['SENSORY_ORIENTATION'],intelligence:null,
  };
}

describe('GENESIS 38.2i.a.2b — cara aviar legible', () => {
  it('garantiza que el pico sobrepasa la superficie frontal craneal en muchas semillas', () => {
    expect(VIDA38_BIRD_MESH_REVISION).toContain('38.2i.a.2b');
    for(let i=0;i<140;i++) {
      const profile=deriveVida38BirdMorphology38I(contract(i));
      const a=deriveVida38BirdLandmarks38I(profile);
      const clearance=a.billTipZ - (a.headZ + a.headRadius*1.12);
      expect(clearance).toBeGreaterThanOrEqual(0.145*profile.headSize - 0.000001);
      expect(deriveVida38BirdLandmarks38I(profile)).toBe(a);
    }
  });

  it('sitúa las córneas sobre la ÚLTIMA salida del SDF, con iris realmente exterior', () => {
    for(let i=0;i<110;i++) {
      const profile=deriveVida38BirdMorphology38I(contract(i));
      for(const side of [-1,1] as const) {
        const eye=deriveVida38BirdEyeSurface38IA2(profile,side);
        expect(Math.abs(eye.surfaceResidual)).toBeLessThan(0.00001);
        expect(evaluateVida38BirdField38I(profile,...eye.irisCenter)).toBeGreaterThan(0);
        expect(eye.center[0]*side).toBeGreaterThan(0);
        expect(isVida38BirdProtectedFace38IA2(profile,...eye.surface)).toBe(true);
        expect(eye).toEqual(deriveVida38BirdEyeSurface38IA2(profile,side));
      }
    }
  },60_000);

  it('conserva un pico visible en malla LOW y una topología cerrada', () => {
    for(const archetype of ['PASSERINE','HEAVY','WADER'] as const) {
      const profile=deriveVida38BirdMorphology38I(contract(30),archetype);
      const a=deriveVida38BirdLandmarks38I(profile);
      const raw=buildVida38BirdRawMeshV1(profile,'LOW');
      const audit=auditVida38BirdRawMeshV1(raw);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.components).toBe(1);
      let furthest=-Infinity;
      for(let j=0;j<raw.positions.length;j+=3) {
        const x=raw.positions[j]!,y=raw.positions[j+1]!,z=raw.positions[j+2]!;
        if(Math.abs(x)<.24*profile.headSize &&
          Math.abs(y-(a.headY-.10*profile.headSize))<.22*profile.headSize) {
          furthest=Math.max(furthest,z);
        }
      }
      expect(furthest).toBeGreaterThan(a.headZ+a.headRadius*1.12+.07*profile.headSize);
    }
  },60_000);

  it('integra ojos e iris en las posiciones calculadas, no en un punto fijo', () => {
    const c=contract(4);
    const profile=deriveVida38BirdMorphology38I(c);
    const group=new THREE.Group();
    const objects=createVida38BirdPreview38I(group,c,'LOW');
    expect(objects.length).toBeGreaterThan(4);
    for(const side of [-1,1] as const) {
      const anchor=deriveVida38BirdEyeSurface38IA2(profile,side);
      const eye=objects.find(o=>o.name===`VIDA38_2I_BIRD_EYE_${side}`);
      const iris=objects.find(o=>o.name===`VIDA38_2I_BIRD_IRIS_${side}`);
      expect(eye).toBeInstanceOf(THREE.Mesh);
      expect(iris).toBeInstanceOf(THREE.Mesh);
      expect(eye?.position.toArray()).toEqual([...anchor.center]);
      expect(iris?.position.toArray()).toEqual([...anchor.irisCenter]);
    }
    for(const object of objects) {
      if(object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials=Array.isArray(object.material)?object.material:[object.material];
        for(const material of materials) material.dispose();
      }
    }
  },60_000);

  it('mantiene la anatomía independiente de pigmentación y la variedad previa', () => {
    expect(VIDA38_BIRD_ARCHETYPES).toHaveLength(7);
    const source=contract(13);
    const original=deriveVida38BirdMorphology38I(source);
    const recolored=deriveVida38BirdMorphology38I({
      ...source,pigmentation:{...source.pigmentation,primaryColorHex:'#101010'},
    });
    expect(recolored).toEqual(original);
    for(const side of [-1,1] as const) {
      expect(deriveVida38BirdEyeSurface38IA2(recolored,side)).toEqual(
        deriveVida38BirdEyeSurface38IA2(original,side));
    }
  });
});
