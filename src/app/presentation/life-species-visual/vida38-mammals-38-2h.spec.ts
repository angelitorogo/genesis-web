import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {VIDA38_SPECIES_VISUAL_REVISION,type Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {VIDA38_MAMMAL_ARCHETYPES,deriveVida38MammalMorphologyV1} from './vida38-mammal-morphology-38-2h';
import {buildVida38MammalRawMeshV1,auditVida38MammalRawMeshV1} from './vida38-mammal-organic-field-38-2h';
import {createVida38MammalSkin38H,createVida38MammalFur38H} from './vida38-mammal-materials-38-2h';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';

function contract(id:string,covering:Vida38SpeciesVisualContract['morphology']['covering']='FUR'):Vida38SpeciesVisualContract {
  return {
    revision:VIDA38_SPECIES_VISUAL_REVISION,
    speciesId:id,speciesName:id,variantSeedUint32:0x124a9e11,appearanceFingerprint:'mammal-digest',
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',observedImageAvailable:false,bodyStorageKey:'V3:mammal',ecosystemDigest:'digest:mammal'},
    morphology:{group:'MAMMALS',bodyPlan:'TETRAPOD',covering,appendagePairs:2},
    ecology:{habitat:'SURFACE_OPEN_TERRAIN',nutrition:'OMNIVORE',niche:'SURFACE_OPEN_TERRAIN/OMNIVORE'},
    locomotion:'WALKING',bodyLengthMeters:1.715,
    pigmentation:{primaryColorHex:'#927b66',secondaryColorHex:'#617e77',pattern:'MOTTLED',bioluminescent:false},
    adaptations:['RESOURCE_FORAGING'],intelligence:null,
  };
}

describe('GENESIS 38.2h — mamíferos orgánicos procedurales',()=>{
  it('distribuye once familias parametrizadas e identidades biológicas deterministas',()=>{
    expect(VIDA38_MAMMAL_ARCHETYPES.length).toBe(11);
    const archetypes=new Set<string>();
    for(let i=0;i<200;i++){
      const p=deriveVida38MammalMorphologyV1(contract(`vida6:mammal:${i}`));
      expect(p).toEqual(deriveVida38MammalMorphologyV1(contract(`vida6:mammal:${i}`)));
      expect(p.bodyLength).toBeGreaterThan(0);
      archetypes.add(p.archetype);
    }
    expect(archetypes.size).toBe(11);
  });
  it('cambiar los pigmentos no modifica ni la identidad morfológica ni la geometría',()=>{
    const c=contract('vida6:mammal:chromatic');
    const recolored={...c,pigmentation:{...c.pigmentation,primaryColorHex:'#ffffff',secondaryColorHex:'#050505'}};
    const a=deriveVida38MammalMorphologyV1(c),b=deriveVida38MammalMorphologyV1(recolored);
    expect(a).toEqual(b);
    const ma=buildVida38MammalRawMeshV1(a,'LOW');
    const mb=buildVida38MammalRawMeshV1(b,'LOW');
    expect(ma.positions).toEqual(mb.positions);
    expect(ma.indices).toEqual(mb.indices);
    expect(a.sourceLengthMeters).toBe(c.bodyLengthMeters);
  });
  it('genera once superficies orgánicas conectadas y sin aristas abiertas',()=>{
    const shapes=VIDA38_MAMMAL_ARCHETYPES.map(kind=>{
      const p=deriveVida38MammalMorphologyV1(contract(`vida6:mammal:${kind}`),kind);
      const mesh=buildVida38MammalRawMeshV1(p,'LOW');
      const audit=auditVida38MammalRawMeshV1(mesh);
      expect(audit.invalid).toBe(0);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.inconsistentEdges).toBe(0);
      expect(audit.components).toBe(1);
      return [p.bodyLength,p.legHeight,p.headScale,p.torsoWidth,p.muzzleLength];
    });
    expect(new Set(shapes.map(x=>x.join('|'))).size).toBe(11);
  },60_000);
  it('el material permite pelaje solo donde VIDA lo justifica y mantiene shader estable',()=>{
    const furry=contract('vida6:furry','FUR');
    const smooth=contract('vida6:smooth','LEATHERY');
    const raw=buildVida38MammalRawMeshV1(deriveVida38MammalMorphologyV1(furry),'LOW');
    const skin=createVida38MammalSkin38H(raw,furry);
    expect(skin.material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
    const mat=skin.material as THREE.MeshPhysicalMaterial;
    expect(mat.metalness).toBe(0);
    expect(mat.roughness).toBeGreaterThan(.8);
    const shader={uniforms:{} as Record<string,unknown>,vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>'};
    mat.onBeforeCompile(shader as Parameters<typeof mat.onBeforeCompile>[0],{} as Parameters<typeof mat.onBeforeCompile>[1]);
    expect(shader.fragmentShader).toContain('fwidth');
    expect(shader.fragmentShader).not.toContain('gl_FragCoord');
    const fur=createVida38MammalFur38H(raw,furry);
    expect(fur).toBeInstanceOf(THREE.InstancedMesh);
    expect(createVida38MammalFur38H(raw,smooth)).toBeNull();
    fur?.geometry.dispose();
    (fur?.material as THREE.Material|undefined)?.dispose();
    skin.geometry.dispose();mat.dispose();
  },60_000);
  it('usa el nuevo renderer solo en mamíferos, preserva recursos y la escala VIDA',()=>{
    const c=contract('vida6:mammal:integracion');
    const model=createVida38SpeciesPreviewModelV1(c,{humanoidQuality:'LOW'});
    let main=0,old=0;
    model.root.traverse(obj=>{
      if(obj.name==='VIDA38_2H_MAMMAL_ORGANIC_SKIN')main++;
      if(obj.name==='VIDA38_2E_ORGANIC_SKIN')old++;
    });
    expect(main).toBe(1);expect(old).toBe(0);
    expect(model.subject.userData['mammalScientificLengthMeters']).toBe(c.bodyLengthMeters);
    expect(model.subject.userData['mammalRepresentation']).toBe('ARTISTIC_HYPOTHESIS');
    model.dispose();
  },60_000);
});
