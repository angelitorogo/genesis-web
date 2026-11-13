import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {VIDA38_SPECIES_VISUAL_REVISION,type Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {VIDA38_REPTILE_ARCHETYPES,deriveVida38ReptileMorphology38J} from './vida38-reptile-morphology-38-2j';
import {buildVida38ReptileRawMesh38J,auditVida38ReptileRawMesh38J,deriveVida38ReptileLandmarks38J} from './vida38-reptile-organic-field-38-2j';
import {createVida38ReptileSkin38J,VIDA38_REPTILE_MATERIAL_REVISION} from './vida38-reptile-materials-38-2j';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';

function contract(speciesId:string,nutrition:Vida38SpeciesVisualContract['ecology']['nutrition']='OMNIVORE'):Vida38SpeciesVisualContract{
  return {
    revision:VIDA38_SPECIES_VISUAL_REVISION,
    speciesId,speciesName:speciesId,variantSeedUint32:0x04d2a12a,appearanceFingerprint:'reptile-specimen',
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',observedImageAvailable:false,bodyStorageKey:'V3:reptile-test',ecosystemDigest:'reptile-test'},
    morphology:{group:'REPTILES',bodyPlan:'TETRAPOD',covering:'SCALES',appendagePairs:2},
    ecology:{habitat:'SURFACE_OPEN_TERRAIN',niche:'SURFACE_OPEN_TERRAIN/'+nutrition,nutrition},
    locomotion:'WALKING',bodyLengthMeters:1.732,
    pigmentation:{primaryColorHex:'#827e61',secondaryColorHex:'#3c7853',pattern:'BANDS',bioluminescent:false},
    adaptations:['RESOURCE_FORAGING'],intelligence:null,
  };
}

describe('GENESIS 38.2j — reptiles orgánicos procedurales',()=>{
  it('distribuye nueve arquetipos y produce perfiles idénticos para la misma especie',()=>{
    expect(VIDA38_REPTILE_ARCHETYPES.length).toBe(9);
    const types=new Set<string>();
    for(let i=0;i<240;i++){
      const c=contract(`vida6:reptile:${i}`);
      const a=deriveVida38ReptileMorphology38J(c);
      expect(a).toEqual(deriveVida38ReptileMorphology38J(c));
      expect(a.sourceLengthMeters).toBe(c.bodyLengthMeters);
      types.add(a.archetype);
    }
    expect(types.size).toBe(9);
  });
  it('el perfil y la malla son independientes de los pigmentos',()=>{
    const c=contract('vida6:reptile:color');
    const changed={...c,pigmentation:{...c.pigmentation,primaryColorHex:'#ffffff',secondaryColorHex:'#000000'}};
    const a=deriveVida38ReptileMorphology38J(c);
    const b=deriveVida38ReptileMorphology38J(changed);
    expect(a).toEqual(b);
    const meshA=buildVida38ReptileRawMesh38J(a,'LOW');
    const meshB=buildVida38ReptileRawMesh38J(b,'LOW');
    expect(meshA.positions).toEqual(meshB.positions);
    expect(meshA.indices).toEqual(meshB.indices);
  },60_000);
  it('produce mallas conectadas en tres arquetipos muy divergentes',()=>{
    for(const kind of ['GEKKONID','CROCODILIAN','SERPENTIFORM'] as const){
      const p=deriveVida38ReptileMorphology38J(contract('vida6:'+kind),kind);
      const raw=buildVida38ReptileRawMesh38J(p,'LOW');
      const audit=auditVida38ReptileRawMesh38J(raw);
      expect(audit.invalid).toBe(0);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.inconsistentEdges).toBe(0);
      expect(audit.components).toBe(1);
    }
  },60_000);
  it('diversifica realmente cráneo, extremidades y cola entre los nueve tipos',()=>{
    const p=VIDA38_REPTILE_ARCHETYPES.map(kind=>deriveVida38ReptileMorphology38J(contract('vida6:'+kind),kind));
    expect(new Set(p.map(v=>[v.bodyLength,v.headSize,v.legLength,v.snoutLength,v.tailLength].join('|'))).size).toBe(9);
    const crocodile=p.find(v=>v.archetype==='CROCODILIAN')!;
    const gecko=p.find(v=>v.archetype==='GEKKONID')!;
    expect(crocodile.snoutLength).toBeGreaterThan(gecko.snoutLength);
    expect(crocodile.bodyLength).toBeGreaterThan(gecko.bodyLength);
    expect(deriveVida38ReptileLandmarks38J(crocodile).tailTipZ).toBeLessThan(deriveVida38ReptileLandmarks38J(gecko).tailTipZ);
  });
  it('adapta la dentición a la alimentación sin convertirla en evidencia biológica',()=>{
    let predatorProminent=false,herbivoreDiscrete=false;
    for(let i=0;i<40;i++){
      const predator=deriveVida38ReptileMorphology38J(contract('reptile:pred:'+i,'PREDATOR'));
      const herbivore=deriveVida38ReptileMorphology38J(contract('reptile:herb:'+i,'HERBIVORE'));
      if(predator.dentition==='FANGS')predatorProminent=true;
      if(herbivore.dentition==='NONE_VISIBLE')herbivoreDiscrete=true;
      expect(predator.toothLength).toBeGreaterThan(0);
      expect(['NONE_VISIBLE','FINE']).toContain(herbivore.dentition);
    }
    expect(predatorProminent).toBe(true);
    expect(herbivoreDiscrete).toBe(true);
  });
  it('inyecta un material de escamas estable sin ruido temporal ni coordenadas de pantalla',()=>{
    const c=contract('vida6:reptile:material');
    const raw=buildVida38ReptileRawMesh38J(deriveVida38ReptileMorphology38J(c),'LOW');
    const skin=createVida38ReptileSkin38J(raw,c);
    const mat=skin.material as THREE.MeshPhysicalMaterial;
    expect(VIDA38_REPTILE_MATERIAL_REVISION).toContain('38.2j');
    expect(mat.metalness).toBe(0);
    expect(mat.roughness).toBeGreaterThan(.8);
    const fake={uniforms:{} as Record<string,unknown>,vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>'};
    mat.onBeforeCompile(fake as Parameters<typeof mat.onBeforeCompile>[0],{} as Parameters<typeof mat.onBeforeCompile>[1]);
    expect(fake.fragmentShader).toContain('fwidth');
    expect(fake.fragmentShader).toContain('vida38ReptileScaleMask');
    expect(fake.fragmentShader).not.toContain('gl_FragCoord');
    expect(fake.fragmentShader).not.toContain('uTime');
    skin.geometry.dispose();mat.dispose();
  },60_000);
  it('activa el generador únicamente para reptiles cuadrúpedos y conserva la longitud VIDA',()=>{
    const c=contract('vida6:reptile:integration');
    const model=createVida38SpeciesPreviewModelV1(c,{humanoidQuality:'LOW'});
    let organic=0,old=0;
    model.root.traverse(o=>{
      if(o.name==='VIDA38_2J_REPTILE_ORGANIC_SKIN')organic++;
      if(o.name==='VIDA38_2H_MAMMAL_ORGANIC_SKIN')old++;
    });
    expect(organic).toBe(1);
    expect(old).toBe(0);
    expect(model.subject.userData['reptileScientificLengthMeters']).toBe(c.bodyLengthMeters);
    expect(model.subject.userData['reptileRepresentation']).toBe('ARTISTIC_HYPOTHESIS');
    model.dispose();
  },60_000);
});
