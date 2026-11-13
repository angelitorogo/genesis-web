import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  deriveVida38HumanoidAnatomy, evaluateVida38HumanoidField,
  buildVida38HumanoidRawMesh, auditVida38HumanoidRawMesh, measureVida38HumanoidMeshV1,
} from './vida38-humanoid-organic-field-38-2e';
import { createVida38HumanoidChestHair38GE } from './vida38-humanoid-chest-hair-38-2ge';
import { deriveVida38HumanoidTorso38GE, VIDA38_HUMANOID_TORSO_REVISION } from './vida38-humanoid-torso-38-2ge';
import { deriveVida38HumanoidMorphologyV1 } from './vida38-humanoid-morphology-38-2f';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';

function contract(id: string, covering: Vida38SpeciesVisualContract['morphology']['covering']='LEATHERY'): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: `vida6:${id}`, speciesName: id, variantSeedUint32: 149,
    appearanceFingerprint: `test-${id}`,
    provenance: {status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'V3:38-2ge',ecosystemDigest:'test-torso'},
    morphology:{group:'HUMANOIDS',bodyPlan:'BIPED',covering,appendagePairs:2},
    ecology:{habitat:'SURFACE_SOIL',nutrition:'OMNIVORE',niche:'SURFACE_SOIL/OMNIVORE'},
    locomotion:'WALKING',bodyLengthMeters:1.74,
    pigmentation:{primaryColorHex:'#998879',secondaryColorHex:'#6b8580',pattern:'MOTTLED',bioluminescent:false},
    adaptations:['SENSORY_ORIENTATION','THERMAL_BUFFERING'],intelligence:null,
  };
}

function dispose(objects: readonly THREE.Object3D[]) {
  for(const object of objects) object.traverse(child=>{
    const mesh=child as THREE.Mesh;
    mesh.geometry?.dispose();
    if(Array.isArray(mesh.material)) mesh.material.forEach(m=>m.dispose());
    else mesh.material?.dispose();
  });
}

describe('GENESIS 38.2g.e — constitución, axilas, manos y pilosidad torácica',()=>{
  it('ofrece cinco constituciones y distribuciones de vello estables sin depender del color',()=>{
    const profiles=Array.from({length:120},(_,i)=> {
      const c=contract(`body-${i}`);
      return deriveVida38HumanoidTorso38GE(c,deriveVida38HumanoidMorphologyV1(c));
    });
    expect(new Set(profiles.map(p=>p.fingerprint)).size).toBe(profiles.length);
    expect(new Set(profiles.map(p=>p.build)).size).toBe(5);
    expect(profiles.some(p=>p.build==='WIRY')).toBe(true);
    expect(profiles.some(p=>p.build==='HEAVY')).toBe(true);
    expect(profiles.some(p=>p.chestHairPattern==='BARE')).toBe(true);
    expect(profiles.some(p=>p.chestHairPattern==='DENSE')).toBe(true);
    expect(profiles.every(p=>p.revision===VIDA38_HUMANOID_TORSO_REVISION)).toBe(true);
    const c=contract('same-species');
    const recolor={...c,appearanceFingerprint:'changed',pigmentation:{...c.pigmentation,primaryColorHex:'#ffffff',secondaryColorHex:'#112233',pattern:'BANDS' as const}};
    expect(deriveVida38HumanoidAnatomy(c)).toEqual(deriveVida38HumanoidAnatomy(recolor));
  });

  it('el vello torácico respeta cobertura, anclaje, material mate y LOD',()=>{
    const bare=contract('scaled-no-hair','SCALES');
    expect(createVida38HumanoidChestHair38GE(deriveVida38HumanoidAnatomy(bare),bare,'LOW')).toHaveLength(0);
    const hairy=Array.from({length:90},(_,i)=>contract(`chest-${i}`,'FUR'))
      .find(c=>deriveVida38HumanoidAnatomy(c).torso.chestHairPattern==='DENSE');
    expect(hairy).toBeDefined();
    const a=deriveVida38HumanoidAnatomy(hairy!);
    const objects=createVida38HumanoidChestHair38GE(a,hairy!,'MEDIUM');
    expect(objects).toHaveLength(1);
    const hair=objects[0] as THREE.Mesh;
    expect(hair.name).toBe('VIDA38_2GE_CHEST_FIBERS');
    expect(hair.geometry.getAttribute('position').count).toBeGreaterThan(80);
    expect(hair.geometry.getAttribute('color')).toBeDefined();
    expect(hair.userData['torsoFingerprint']).toBe(a.torso.fingerprint);
    expect((hair.material as THREE.MeshPhysicalMaterial).transparent).toBe(false);
    expect((hair.material as THREE.MeshPhysicalMaterial).metalness).toBe(0);
    dispose(objects);
  },20000);

  it('abre las axilas sin separar el brazo, y distingue puntas de dedos mediante SDF',()=>{
    const a=deriveVida38HumanoidAnatomy(contract('axila-arms'));
    const p=a.legLength, t=a.torso;
    const shoulderX=a.shoulderWidth*1.03*t.chestScale;
    const elbowX=shoulderX+t.elbowOutset;
    const elbowY=p+0.31-(a.upperArmRatio-1)*0.075;
    expect(t.elbowOutset).toBeGreaterThanOrEqual(0.17);
    expect(t.wristOutset).toBeGreaterThanOrEqual(0.18);
    expect(evaluateVida38HumanoidField(a,elbowX,elbowY,-0.07)).toBeLessThan(0);
    let clearCount=0;
    for(let x=0.30;x<=elbowX-0.08;x+=0.02) {
      if(evaluateVida38HumanoidField(a,x,elbowY,-0.03)>0.015) clearCount++;
    }
    expect(clearCount).toBeGreaterThanOrEqual(1);
    expect(a.fingerCount).toBeGreaterThanOrEqual(3);
    // Diferencia volumétrica entre punta y hueco interdigital: no son
    // dedos pintados sobre una palma, realmente se separan en el SDF.
    const wristX=shoulderX+t.wristOutset;
    const wristY=p+0.64-a.armReach-(a.forearmRatio-1)*0.04;
    const handY=wristY-0.113*a.handSize;
    const palmX=wristX+0.014;
    const tipSpacing=0.056*a.handSize*t.fingerSpread;
    const tipY=handY-0.216*a.fingerLength*t.digitLength;
    const gap=evaluateVida38HumanoidField(a,palmX+tipSpacing*0.5,tipY,0.178);
    expect(gap).toBeGreaterThan(0.004);
  });

  it('mantiene una única malla cerrada, coherente y con longitud VIDA inalterada',()=>{
    for (const id of ['Sania on1','Zulix en7','Fasyl a3','Kamera ix1']) {
      const c=contract(id);
      const a=deriveVida38HumanoidAnatomy(c);
      const raw=buildVida38HumanoidRawMesh(a,'LOW');
      const audit=auditVida38HumanoidRawMesh(raw);
      expect(audit.invalid).toBe(0);
      expect(audit.components).toBe(1);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.inconsistentEdges).toBe(0);
      expect(measureVida38HumanoidMeshV1(raw).actualHeightMeters).toBe(c.bodyLengthMeters);
    }
  },35000);

  it('integra la nueva versión en la ficha sin cambiar el estado de conocimiento',()=>{
    const c=contract('torso-metadata');
    const model=createVida38SpeciesPreviewModelV1(c,{humanoidQuality:'LOW'});
    expect(model.subject.userData['vida38ReconstructionRevision']).toBe('38.2g.e');
    expect(model.subject.userData['vida38TorsoFingerprint']).toBeDefined();
    expect(model.subject.userData['vida38ScientificObservedImage']).toBe(false);
    model.dispose();
  },20000);
});
