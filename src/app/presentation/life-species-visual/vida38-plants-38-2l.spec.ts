import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {VIDA38_SPECIES_VISUAL_REVISION,type Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {deriveVida38PlantMorphology38L,VIDA38_PLANT_ARCHETYPES} from './vida38-plant-morphology-38-2l';
import {buildVida38PlantArchitecture38L} from './vida38-plant-architecture-38-2l';
import {createVida38PlantLeafGeometry38L,createVida38PlantPreview38L} from './vida38-plant-preview-38-2l';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';
function plant(id:string,height:number,habitat:Vida38SpeciesVisualContract['ecology']['habitat']='SURFACE_WET_MARGIN'):Vida38SpeciesVisualContract {
 return {revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId:id,speciesName:id,variantSeedUint32:8765432,appearanceFingerprint:'test-plant',
 provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',observedImageAvailable:false,bodyStorageKey:'V3:plant',ecosystemDigest:'digest:plant'},
 morphology:{group:'PLANTS_TREES',bodyPlan:'STEMMED',covering:'FIBROUS',appendagePairs:0},
 ecology:{habitat,nutrition:'PHOTOSYNTHETIC',niche:`${habitat}/PHOTOSYNTHETIC`},locomotion:'SESSILE',bodyLengthMeters:height,
 pigmentation:{primaryColorHex:'#527f7a',secondaryColorHex:'#ac8b77',pattern:'MOTTLED',bioluminescent:false},
 adaptations:['HUMIDITY_TOLERANCE'],intelligence:null};
}
describe('38.2l — arquitectura botánica y representación vegetal',()=>{
 it('clasifica exactamente por talla VIDA, no por escala de cámara',()=>{
  for(const [size,form] of [[.25,'HERB'],[1,'HERB'],[1.01,'SHRUB'],[1.8,'SHRUB'],[2,'SHRUB'],[2.01,'TREE'],[3.2142,'TREE']] as const){
   const p=deriveVida38PlantMorphology38L(plant('test:'+size,size));
   expect(p.form).toBe(form);expect(p.sourceHeightMeters).toBe(size);
  }
 });
 it('admite 19 arquetipos y los distribuye en sus clases, sin depender del color',()=>{
  expect(VIDA38_PLANT_ARCHETYPES).toHaveLength(19);
  const found=new Set<string>();
  for(let i=0;i<350;i++){
   const c=plant('plant:'+i,[.7,1.65,4.1][i%3]!);
   const p=deriveVida38PlantMorphology38L(c);
   expect(p).toEqual(deriveVida38PlantMorphology38L(c));found.add(p.archetype);
   expect(p.provenance).toBe('ARTISTIC_HYPOTHESIS_NOT_OBSERVED');
  }
  expect(found.size).toBeGreaterThanOrEqual(15);
  const c=plant('invariant',3.2);
  expect(deriveVida38PlantMorphology38L(c)).toEqual(deriveVida38PlantMorphology38L({
   ...c,pigmentation:{...c.pigmentation,primaryColorHex:'#ffffff',secondaryColorHex:'#000000'},
  }));
 });
 it('inserta hojas en ramas existentes; ningún fruto ni flor flota sin soporte',()=>{
  for(const size of [.7,1.8,3.2142]){
   const m=deriveVida38PlantMorphology38L(plant('insert:'+size,size));
   const a=buildVida38PlantArchitecture38L(m);
   expect(a.stems.length).toBeGreaterThan(m.form==='TREE'?20:2);
   expect(a.leaves.length).toBeGreaterThan(12);
   for(const leaf of a.leaves){
    expect(leaf.branchIndex).toBeGreaterThanOrEqual(0);
    const stem=a.stems[leaf.branchIndex]!;
    let distance=Infinity;
    for(let k=1;k<stem.points.length;k++){
     const p=new THREE.Vector3(...leaf.position),x=new THREE.Vector3(...stem.points[k-1]!),y=new THREE.Vector3(...stem.points[k]!);
     const seg=y.sub(x);const t=THREE.MathUtils.clamp(p.clone().sub(x).dot(seg)/seg.lengthSq(),0,1);
     distance=Math.min(distance,p.distanceTo(x.addScaledVector(seg,t)));
    }
    expect(distance).toBeLessThan(1e-5);
   }
   for(const flower of a.flowers)expect(a.leaves).toContain(flower);
  }
 });
 it('genera hojas con limbo curvo y geometría triangulada en lugar de esferas',()=>{
  for(const kind of ['LANCEOLATE','ROUND','NEEDLE','LOBED','SUCCULENT'] as const){
   const g=createVida38PlantLeafGeometry38L(kind,'MEDIUM');
   expect(g.index?.count).toBeGreaterThan(90);
   expect(g.getAttribute('position').count).toBeGreaterThan(50);
   expect(g.getAttribute('normal').count).toBeGreaterThan(50);
   g.dispose();
  }
 });
 it('integra tronco y hojas instanciadas únicamente en PLANTS_TREES',()=>{
  for(const height of [.6,1.8,3.2142]){
   const c=plant('runtime:'+height,height);
   // LOW representa una de cada cuatro hojas de la arquitectura completa.
   // Una herbácea puede tener legítimamente 3 instancias: no exigir >5 por malla.
   const fullLeafCount=buildVida38PlantArchitecture38L(deriveVida38PlantMorphology38L(c)).leaves.length;
   const expectedLowLeafCount=Math.ceil(fullLeafCount/4);
   const model=createVida38SpeciesPreviewModelV1(c,{humanoidQuality:'LOW'});
   let branches=0,leaves=0,old=0;
   model.subject.traverse(obj=>{
    if(obj.name==='VIDA38_2L_PLANT_BRANCH_ARCHITECTURE')branches++;
    if(obj.name==='VIDA38_2L_PLANT_LEAVES'){
     leaves++;expect(obj).toBeInstanceOf(THREE.InstancedMesh);
     const mesh=obj as THREE.InstancedMesh;
     expect(mesh.count).toBe(expectedLowLeafCount);
     expect(mesh.count).toBeGreaterThan(0);
     expect((mesh.material as THREE.MeshPhysicalMaterial).transparent).toBe(false);
    }
    if(obj.name==='VIDA38_2K_INSECT_ORGANIC_BODY')old++;
   });
   expect(model.descriptor.family).toBe('PLANT_FORM');
   expect(branches).toBe(1);expect(leaves).toBe(1);expect(old).toBe(0);
   expect(model.subject.userData['plantScientificHeightMeters']).toBe(height);
   expect(model.subject.userData['plantReconstructionStatus']).toBe('ARTISTIC_HYPOTHESIS_NOT_OBSERVED');
   const y=model.subject.position.y;model.animation(0);expect(model.subject.position.y).toBeCloseTo(y,4);
   model.dispose();
  }
 },15000);
 it('repite arquitectura exacta en distintos órdenes de consulta',()=>{
  const a=plant('stable-ID',1.8),b=plant('other-ID',3.2);
  const first=buildVida38PlantArchitecture38L(deriveVida38PlantMorphology38L(a));
  buildVida38PlantArchitecture38L(deriveVida38PlantMorphology38L(b));
  expect(buildVida38PlantArchitecture38L(deriveVida38PlantMorphology38L(a))).toEqual(first);
 });
 it('no modifica las otras familias',()=>{
  const group=new THREE.Group();
  expect(()=>createVida38PlantPreview38L(group,plant('control',1.8),'LOW')).not.toThrow();
  group.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();if(m.material)(m.material as THREE.Material).dispose();});
 });
});
