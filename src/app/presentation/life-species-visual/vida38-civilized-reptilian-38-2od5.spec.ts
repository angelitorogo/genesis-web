import { deriveVida38WardrobeCoherencePlan38OE8B } from './vida38-reptilian-wardrobe-coherence-38-2oe8b';
import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {VIDA38_SPECIES_VISUAL_REVISION,type Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';
import {buildVida38CivilReptilianSdfMesh38OD5} from './vida38-civilized-reptilian-sdf-union-38-2od5';
import {deriveVida38HumanoidAnatomy} from './vida38-humanoid-organic-field-38-2e';
function specimen(level:'PRIMITIVE'|'ADVANCED'|'VERY_ADVANCED',id='reptilian'):Vida38SpeciesVisualContract {
  return {
    revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId:id,speciesName:id,variantSeedUint32:382005,
    appearanceFingerprint:`38-2od5:${id}`,
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',observedImageAvailable:false,bodyStorageKey:'V3:reptilian',ecosystemDigest:'digest'},
    morphology:{group:'REPTILES',bodyPlan:'TETRAPOD',covering:'SCALES',appendagePairs:2},
    ecology:{habitat:'SURFACE_WET_MARGIN',nutrition:'OMNIVORE',niche:'reptilian/surface'},
    locomotion:'WALKING',bodyLengthMeters:2.25,
    pigmentation:{primaryColorHex:'#668f95',secondaryColorHex:'#a4b6ac',pattern:'BANDS',bioluminescent:false},
    adaptations:['SENSORY_ORIENTATION'],
    intelligence:{lineage:'REPTILIAN',civilizationLevel:level} as unknown as NonNullable<Vida38SpeciesVisualContract['intelligence']>,
  };
}
function sampleTechSuit38S8C(prefix: string): Vida38SpeciesVisualContract {
  for (let i = 0; i < 360; i++) {
    const candidate = specimen('VERY_ADVANCED', `${prefix}:${i}`);
    if (deriveVida38WardrobeCoherencePlan38OE8B(candidate).family === 'TECH_SUIT') return candidate;
  }
  throw new Error('38.2s8c: no se encontró TECH_SUIT en 360 identidades CT-0');
}
describe('38.2o.d5 — anatomía y vestimenta civilizada',()=>{
  it('cola continua en una única malla de piel con el mismo material',()=>{
    const model=createVida38SpeciesPreviewModelV1(specimen('VERY_ADVANCED'),{humanoidQuality:'LOW'});
    const skin=model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh;
    const root=model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_TAIL')!;
    expect(root).toBeInstanceOf(THREE.Group);
    expect(model.subject.userData['vida38IntegratedSdfTail38OD5']).toBe(true);
    const positions=(skin.geometry as THREE.BufferGeometry).getAttribute('position') as THREE.BufferAttribute;
    let caudal=0;
    for(let i=0;i<positions.count;i++)if(positions.getZ(i)<-0.9)caudal++;
    expect(caudal).toBeGreaterThan(10);
    model.dispose();
  },60_000);
  it('el traje muy avanzado abarca delante, espalda, extremidades y pies; sin rosa',()=>{
    const model=createVida38SpeciesPreviewModelV1(sampleTechSuit38S8C('rept:full360'),{humanoidQuality:'LOW'});
    const body=model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY') as THREE.Mesh;
    const suit=model.subject.getObjectByName('VIDA38_2OD_REPTILIAN_GARMENT') as THREE.Mesh;
    expect(suit.userData['garmentCoverage38OD5']).toBe('FULL_360');
    expect(suit.userData['colorPalette38OD5']).toBe('BLACK_BLUE_GREEN_NEON');
    expect(suit.userData['tailOpening38OD5']).toBe(true);
    expect((suit.geometry as THREE.BufferGeometry).getAttribute('position').count)
      .toBe((body.geometry as THREE.BufferGeometry).getAttribute('position').count);
    const positions=(suit.geometry as THREE.BufferGeometry).getAttribute('position') as THREE.BufferAttribute;
    let back=0,feet=0;
    for(let i=0;i<positions.count;i++) {
      if(positions.getZ(i)<-0.12)back++;
      if(positions.getY(i)<0.18)feet++;
    }
    expect(back).toBeGreaterThan(25);
    expect(feet).toBeGreaterThan(25);
    model.dispose();
  },60_000);
  it('ojos ovoides integrados sin globos saltones',()=>{
    const model=createVida38SpeciesPreviewModelV1(specimen('VERY_ADVANCED','eyes'),{humanoidQuality:'LOW'});
    const eyes:THREE.Mesh[]=[];
    model.subject.traverse((obj: THREE.Object3D)=>{if(obj.name.startsWith('VIDA38_2OE4_REPTILIAN_'))eyes.push(obj as THREE.Mesh);});
    expect(eyes.length).toBe(6);
    expect(eyes.filter(e=>e.name.includes('_GLOBE_'))).toHaveLength(2);
    expect(eyes.filter(e=>e.name.includes('_IRIS_'))).toHaveLength(2);
    expect(eyes.filter(e=>e.name.includes('_PUPIL_'))).toHaveLength(2);
    model.dispose();
  },60_000);
  it('SDF fusionado determinista para una anatomía fija',()=>{
    const c=specimen('VERY_ADVANCED','deterministic');
    const a=deriveVida38HumanoidAnatomy({...c,morphology:{...c.morphology,group:'HUMANOIDS',bodyPlan:'BIPED'}});
    const g1=buildVida38CivilReptilianSdfMesh38OD5(a,'LOW',0.84);
    const g2=buildVida38CivilReptilianSdfMesh38OD5(a,'LOW',0.84);
    expect(g1.positions.length).toBe(g2.positions.length);
    for(let i=0;i<Math.min(g1.positions.length,120);i++)expect(g1.positions[i]).toBe(g2.positions[i]);
  },60_000);
});
