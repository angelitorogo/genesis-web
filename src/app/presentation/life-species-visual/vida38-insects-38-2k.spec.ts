import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {VIDA38_SPECIES_VISUAL_REVISION,type Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {VIDA38_INSECT_ARCHETYPES,deriveVida38InsectMorphology38K} from './vida38-insect-morphology-38-2k';
import {buildVida38InsectRawMesh38K,auditVida38InsectRawMesh38K} from './vida38-insect-organic-field-38-2k';
import {createVida38InsectSkin38K,VIDA38_INSECT_MATERIAL_REVISION} from './vida38-insect-materials-38-2k';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';

function specimen(id:string,locomotion:Vida38SpeciesVisualContract['locomotion']='WALKING',appendagePairs=3):Vida38SpeciesVisualContract{
  return {
    revision:VIDA38_SPECIES_VISUAL_REVISION,
    speciesId:id,speciesName:id,variantSeedUint32:0x6e8c971a,appearanceFingerprint:'38k-specimen',
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'V3:insect-test',ecosystemDigest:'digest:insect-test'},
    morphology:{group:'INSECTS',bodyPlan:'ARTHROPOD',covering:'CHITINOUS',appendagePairs},
    ecology:{habitat:'SURFACE_CANOPY',nutrition:'OMNIVORE',niche:'SURFACE_CANOPY/OMNIVORE'},
    locomotion,bodyLengthMeters:.035307,
    pigmentation:{primaryColorHex:'#568f7d',secondaryColorHex:'#c1ae79',pattern:'MOTTLED',bioluminescent:false},
    adaptations:['EXTERNAL_ARMOR','SENSORY_ORIENTATION'],intelligence:null,
  };
}

describe('GENESIS 38.2k — insectos orgánicos y diversidad procedural',()=>{
  it('deriva diez familias distintas y reproduce idénticos perfiles por ID',()=>{
    expect(VIDA38_INSECT_ARCHETYPES).toHaveLength(10);
    const found=new Set<string>();
    for(let i=0;i<240;i++){
      const c=specimen(`vida6:insect:${i}`);
      const p=deriveVida38InsectMorphology38K(c);
      expect(p).toEqual(deriveVida38InsectMorphology38K(c));
      expect(p.sourceLengthMeters).toBe(c.bodyLengthMeters);
      expect(p.provenance).toBe('ARTISTIC_HYPOTHESIS_NOT_OBSERVED');
      found.add(p.archetype);
    }
    expect(found.size).toBe(10);
  });
  it('mantiene la misma anatomía al cambiar solo pigmentación',()=>{
    const c=specimen('vida6:color-invariant');
    const colored={...c,pigmentation:{...c.pigmentation,primaryColorHex:'#ffffff',secondaryColorHex:'#000000'}};
    const a=deriveVida38InsectMorphology38K(c),b=deriveVida38InsectMorphology38K(colored);
    expect(a).toEqual(b);
    const ma=buildVida38InsectRawMesh38K(a,'LOW');
    const mb=buildVida38InsectRawMesh38K(b,'LOW');
    expect(ma.positions).toEqual(mb.positions);expect(ma.indices).toEqual(mb.indices);
  },60_000);
  it('produce una malla cerrada para insectos de anatomía divergente',()=>{
    for(const type of ['BEETLE','MANTIS','DRAGONFLY','STICK'] as const){
      const p=deriveVida38InsectMorphology38K(specimen('vida6:'+type),type);
      const raw=buildVida38InsectRawMesh38K(p,'LOW');
      const audit=auditVida38InsectRawMesh38K(raw);
      expect(audit.invalid).toBe(0);expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);expect(audit.inconsistentEdges).toBe(0);
      expect(audit.components).toBe(1);
    }
  },60_000);
  it('mantiene los pares de patas de VIDA, sin inventar miembros',()=>{
    for(const pairs of [0,2,3,4,6]){
      const c=specimen(`vida6:legs:${pairs}`,'WALKING',pairs);
      const profile=deriveVida38InsectMorphology38K(c);
      expect(profile.legPairs).toBe(pairs);
    }
  });
  it('representa alas solo cuando la locomoción o el plan corporal lo permiten',()=>{
    for(let i=0;i<80;i++){
      const walked=deriveVida38InsectMorphology38K(specimen('vida6:wingless:'+i,'WALKING'));
      expect(walked.wingPairs).toBe(0);
      expect(walked.wingStyle).toBe('NONE');
    }
    const flyer=deriveVida38InsectMorphology38K(specimen('vida6:fly','FLYING'),'DRAGONFLY');
    expect(flyer.wingPairs).toBe(2);
    expect(flyer.wingStyle).toBe('LONG');
  });
  it('presenta contrastes de morfología craneal, patas, abdomen y alas',()=>{
    const c=specimen('vida6:types','FLYING');
    const all=VIDA38_INSECT_ARCHETYPES.map(a=>deriveVida38InsectMorphology38K(c,a));
    expect(new Set(all.map(m=>[m.abdomenWidth,m.headSize,m.legReach,m.wingSpan].join('/'))).size).toBe(10);
    const mantis=all.find(m=>m.archetype==='MANTIS')!;
    const hopper=all.find(m=>m.archetype==='GRASSHOPPER')!;
    const dragon=all.find(m=>m.archetype==='DRAGONFLY')!;
    expect(mantis.legSpecialization).toBe('RAPTORIAL');
    expect(hopper.legSpecialization).toBe('JUMPER');
    expect(dragon.wingSpan).toBeGreaterThan(mantis.wingSpan);
  });
  it('aplica quitina opaca, color VIDA y GLSL estable sin tiempo/pantalla',()=>{
    const c=specimen('vida6:insect:shader');
    const raw=buildVida38InsectRawMesh38K(deriveVida38InsectMorphology38K(c),'LOW');
    const mesh=createVida38InsectSkin38K(raw,c);
    const mat=mesh.material as THREE.MeshPhysicalMaterial;
    expect(mat.transparent).toBe(false);expect(mat.opacity).toBe(1);
    expect(mat.depthWrite).toBe(true);expect(mat.metalness).toBe(0);
    expect(VIDA38_INSECT_MATERIAL_REVISION).toContain('38.2k');
    const fake={uniforms:{} as Record<string,unknown>,vertexShader:'#include <common>\n#include <begin_vertex>',
      fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>'};
    mat.onBeforeCompile(fake as Parameters<typeof mat.onBeforeCompile>[0],{} as Parameters<typeof mat.onBeforeCompile>[1]);
    expect(fake.fragmentShader).toContain('fwidth');
    expect(fake.fragmentShader).toContain('uVida38InsectSecondary');
    expect(fake.fragmentShader).not.toContain('gl_FragCoord');
    expect(fake.fragmentShader).not.toContain('uTime');
    mesh.geometry.dispose();mat.dispose();
  },60_000);
  it('integra solo INSECTS en el visor y conserva identidad/encuadre/recursos',()=>{
    const c=specimen('vida6:insect:scene','FLYING');
    const model=createVida38SpeciesPreviewModelV1(c,{humanoidQuality:'LOW'});
    let bodyCount=0,oldBodies=0,eyes=0;
    model.root.traverse(o=>{
      if(o.name==='VIDA38_2K_INSECT_ORGANIC_BODY')bodyCount++;
      if(o.name==='VIDA38_2H_MAMMAL_ORGANIC_SKIN'||o.name==='VIDA38_2J_REPTILE_ORGANIC_SKIN')oldBodies++;
      if(o.name.startsWith('VIDA38_2K_COMPOUND_EYE_'))eyes++;
    });
    expect(model.descriptor.family).toBe('INSECT_BODY');
    expect(bodyCount).toBe(1);expect(oldBodies).toBe(0);expect(eyes).toBe(2);
    expect(model.subject.userData['insectScientificLengthMeters']).toBe(c.bodyLengthMeters);
    expect(model.subject.userData['insectRepresentation']).toBe('ARTISTIC_HYPOTHESIS');
    expect(Number.isFinite(model.subject.position.y)).toBe(true);
    const position=model.subject.position.y;
    model.animation(0);expect(model.subject.position.y).toBeCloseTo(position,5);
    model.dispose();
  },60_000);
});
