import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  auditVida38HumanoidRawMesh,
  buildVida38HumanoidRawMesh,
  deriveVida38HumanoidAnatomy,
  evaluateVida38HumanoidField,
  measureVida38HumanoidMeshV1,
} from './vida38-humanoid-organic-field-38-2e';
import {
  VIDA38_HUMANOID_PBR_REVISION,
  buildVida38HumanoidPbrShader38G,
  createVida38HumanoidOcularDetailsV1,
  createVida38HumanoidSkinV1,
} from './vida38-humanoid-organic-material-38-2e';

function contract(speciesId: string): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId,
    speciesName: speciesId,
    variantSeedUint32: 0xb19fa011,
    appearanceFingerprint: 'scientific-hypothesis-not-observed',
    provenance: {
      status:'CONFIRMED_SYSTEM_CT0',
      representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,
      bodyStorageKey:'v3:vida38-2g-test',
      ecosystemDigest:'test-ecosystem',
    },
    morphology:{ group:'HUMANOIDS',bodyPlan:'BIPED',covering:'LEATHERY',appendagePairs:2 },
    ecology:{habitat:'SURFACE_SOIL',nutrition:'OMNIVORE',niche:'SURFACE_SOIL/OMNIVORE'},
    locomotion:'WALKING',
    bodyLengthMeters:1.6126,
    pigmentation:{primaryColorHex:'#987a82',secondaryColorHex:'#6f8f98',pattern:'MOTTLED',bioluminescent:false},
    adaptations:['SENSORY_ORIENTATION','THERMAL_BUFFERING'],
    intelligence:null,
  };
}

function changedPigment(original:Vida38SpeciesVisualContract):Vida38SpeciesVisualContract {
  return {
    ...original,
    appearanceFingerprint:'different-display-only',
    pigmentation:{ primaryColorHex:'#00aaff',secondaryColorHex:'#ee8844',pattern:'BANDS',bioluminescent:true },
  };
}

function digestGeometry(raw:ReturnType<typeof buildVida38HumanoidRawMesh>):string {
  let h=2166136261;
  for(const array of [raw.positions,raw.indices]) {
    const stride=Math.max(1,Math.floor(array.length/900));
    for(let i=0;i<array.length;i+=stride) {
      h=Math.imul(h^Math.round(Number(array[i]!)*1e6),16777619)>>>0;
    }
  }
  return h.toString(16);
}

describe('GENESIS 38.2g — anatomía y materiales biológicos de humanoides',()=>{
  it('genera variación craneofacial determinista independiente de los pigmentos',()=>{
    const a=deriveVida38HumanoidAnatomy(contract('vida6:kamera'));
    const b=deriveVida38HumanoidAnatomy(contract('vida6:kamera'));
    const c=deriveVida38HumanoidAnatomy(changedPigment(contract('vida6:kamera')));
    expect(a).toEqual(b);
    expect(a).toEqual(c);
    for(const value of [a.cheekFullness,a.chinShape,a.mouthWidth,a.nasalBridge,a.orbitalRidge]) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0.7);
      expect(value).toBeLessThan(1.4);
    }
    expect(a.cheekFullness).not.toBe(deriveVida38HumanoidAnatomy(contract('vida6:elvar')).cheekFullness);
  });

  it('reconstruye cráneo, párpados y musculatura antes de extraer la malla orgánica',()=>{
    const a=deriveVida38HumanoidAnatomy(contract('vida6:kamera'));
    const altered={...a,cheekFullness:1.24,chinShape:1.3,nasalBridge:1.31};
    let accumulatedDifference=0;
    for(let x=-0.22;x<=0.22;x+=0.04) for(let y=a.legLength+0.95;y<=a.legLength+1.35;y+=0.045) for(let z=0.15;z<=0.43;z+=0.04) {
      accumulatedDifference+=Math.abs(evaluateVida38HumanoidField(a,x,y,z)-evaluateVida38HumanoidField(altered,x,y,z));
    }
    expect(accumulatedDifference).toBeGreaterThan(0.1);
  });

  it('conserva mallas cerradas y finitas en seis identidades y mantiene la longitud VIDA',()=>{
    const fingerprints=new Set<string>();
    for(const id of ['Kamera ix1','Sania on1','Elvar um3','Lonia aj2','Ivar en8','Amier or5']) {
      const c=contract(`vida6:${id}`);
      const raw=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(c),'LOW');
      const audit=auditVida38HumanoidRawMesh(raw);
      expect(audit.invalid).toBe(0);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.inconsistentEdges).toBe(0);
      expect(audit.components).toBe(1);
      expect(measureVida38HumanoidMeshV1(raw).actualHeightMeters).toBe(c.bodyLengthMeters);
      fingerprints.add(digestGeometry(raw));
    }
    expect(fingerprints.size).toBe(6);
  });

  it('aplica la pigmentación en espacio local POR FRAGMENTO y no como manchas por vértice',()=>{
    const patch=buildVida38HumanoidPbrShader38G();
    expect(VIDA38_HUMANOID_PBR_REVISION).toContain('38.2g');
    expect(patch.vertexBody).toContain('vVida38OrganicPosition = position');
    expect(patch.fragmentCommon).toContain('vida38Pigment');
    expect(patch.fragmentCommon).toContain('vida38Worley');
    expect(patch.colorFragment).toContain('diffuseColor.rgb');
    expect(patch.roughnessFragment).toContain('roughnessFactor=clamp');
    expect(patch.normalFragment).toContain('dFdx');
    expect(patch.normalFragment).toContain('vida38BiologicalRelief');
    expect(patch.fragmentCommon).not.toContain('smoothstep(0.1,-0.4');
  });

  it('no crea atributo de color por vértice y configura el shader PBR orgánico',()=>{
    const c=contract('vida6:shader');
    const raw=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(c),'LOW');
    const mesh=createVida38HumanoidSkinV1(raw,c);
    expect(mesh.geometry.getAttribute('color')).toBeUndefined();
    expect(mesh.userData['pbrRevision']).toBe(VIDA38_HUMANOID_PBR_REVISION);
    const material=mesh.material as THREE.MeshPhysicalMaterial;
    expect(material.metalness).toBe(0);
    const fake={
      uniforms:{} as Record<string,unknown>,
      vertexShader:'#include <common>\n#include <begin_vertex>',
      fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>',
    };
    material.onBeforeCompile(fake as Parameters<typeof material.onBeforeCompile>[0],{} as Parameters<typeof material.onBeforeCompile>[1]);
    expect(fake.vertexShader).toContain('vVida38OrganicPosition');
    expect(fake.fragmentShader).toContain('vida38BiologicalRelief');
    expect(fake.fragmentShader).toContain('vida38Pigment');
    expect(fake.uniforms['uVida38PigmentPrimary']).toBeDefined();
    expect(fake.uniforms['uVida38PigmentSecondary']).toBeDefined();
    mesh.geometry.dispose();material.dispose();
  });

  it('integra cada ojo en una única esfera con iris/pupila pigmentados, no tres capas flotantes',()=>{
    const c=contract('vida6:eyes');
    const anatomy=deriveVida38HumanoidAnatomy(c);
    const objects=createVida38HumanoidOcularDetailsV1(anatomy,c);
    expect(objects).toHaveLength(2);
    for(const obj of objects) {
      expect(obj).toBeInstanceOf(THREE.Mesh);
      const eye=obj as THREE.Mesh;
      const geometry=eye.geometry;
      expect(geometry.getAttribute('color')).toBeDefined();
      expect(eye.name).toContain('OCULAR_INTEGRATED');
      expect(eye.position.z).toBeGreaterThan(0.24);
      geometry.dispose();
      (eye.material as THREE.Material).dispose();
    }
  });

  it('recolorear un humanoide no modifica ni posiciones ni topología',()=>{
    const c=contract('vida6:recolor');
    const a=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(c),'LOW');
    const b=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(changedPigment(c)),'LOW');
    expect(a.positions).toEqual(b.positions);
    expect(a.indices).toEqual(b.indices);
  });
});
