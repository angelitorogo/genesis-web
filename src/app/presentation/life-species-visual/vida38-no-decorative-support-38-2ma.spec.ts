import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {VIDA38_SPECIES_VISUAL_REVISION,type Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';

function contract(id:string,group:Vida38SpeciesVisualContract['morphology']['group'],bodyPlan:Vida38SpeciesVisualContract['morphology']['bodyPlan']):Vida38SpeciesVisualContract{
  return {
    revision:VIDA38_SPECIES_VISUAL_REVISION,
    speciesId:id,speciesName:id,variantSeedUint32:424242,appearanceFingerprint:`fp:${id}`,
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',observedImageAvailable:false,bodyStorageKey:`V3:${id}`,ecosystemDigest:'digest:38-2ma'},
    morphology:{group,bodyPlan,covering:group==='INSECTS'?'CHITINOUS':group==='BIRDS'?'FEATHERS':group==='PLANTS_TREES'?'FIBROUS':'LEATHERY',appendagePairs:group==='INSECTS'?3:group==='PLANTS_TREES'?0:2},
    ecology:{habitat:'SURFACE_CANOPY',nutrition:group==='PLANTS_TREES'?'PHOTOSYNTHETIC':'OMNIVORE',niche:'SURFACE_CANOPY/TEST'},
    locomotion:group==='PLANTS_TREES'||group==='FUNGI'||group==='MICROORGANISMS'?'SESSILE':'WALKING',
    bodyLengthMeters:group==='PLANTS_TREES'?2.4:1.1,
    pigmentation:{primaryColorHex:'#6d8b75',secondaryColorHex:'#c9b49b',pattern:'MOTTLED',bioluminescent:false},
    adaptations:['SENSORY_ORIENTATION'],
    intelligence:null,
  };
}

describe('38.2m.a — eliminación global del palo decorativo',()=>{
  it('no instancia ninguna rama decorativa CANOPY en ningún taxón',()=>{
    const cases:[string,Vida38SpeciesVisualContract][]=[
      ['fungi',contract('fungi','FUNGI','FILAMENTOUS')],
      ['plant',contract('plant','PLANTS_TREES','STEMMED')],
      ['insect',contract('insect','INSECTS','ARTHROPOD')],
      ['bird',contract('bird','BIRDS','WINGED')],
      ['mammal',contract('mammal','MAMMALS','TETRAPOD')],
      ['reptile',contract('reptile','REPTILES','TETRAPOD')],
      ['humanoid',contract('humanoid','HUMANOIDS','BIPED')],
      ['microbe',contract('microbe','MICROORGANISMS','FILAMENTOUS')],
    ];
    for(const [,c] of cases){
      const model=createVida38SpeciesPreviewModelV1(c,{humanoidQuality:'LOW'});
      let decorativeBranches=0;
      model.root.traverse(obj=>{
        if(obj.name==='VIDA38_CANOPY_DECORATIVE_REFERENCE_BRANCH')decorativeBranches++;
      });
      expect(decorativeBranches).toBe(0);
      model.dispose();
    }
  },60_000);
  it('conserva la base del hábitat sin añadir el palo de atrezzo',()=>{
    const model=createVida38SpeciesPreviewModelV1(contract('fungi-base','FUNGI','FILAMENTOUS'),{humanoidQuality:'LOW'});
    let cylinders=0;
    model.root.traverse(obj=>{
      const mesh=obj as THREE.Mesh;
      if(mesh.geometry instanceof THREE.CylinderGeometry && obj.name==='VIDA38_CANOPY_DECORATIVE_REFERENCE_BRANCH')cylinders++;
    });
    expect(cylinders).toBe(0);
    model.dispose();
  });
});
