import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {VIDA38_BIRD_ARCHETYPES,deriveVida38BirdMorphology38I} from './vida38-bird-morphology-38-2i';
import {buildVida38BirdRawMeshV1,auditVida38BirdRawMeshV1} from './vida38-bird-organic-field-38-2i';
import {createVida38BirdSkin38I,createVida38BirdContourFeathers38I,createVida38BirdFlightFeathers38I} from './vida38-bird-materials-38-2i';
import {createVida38SpeciesPreviewModelV1} from './vida38-species-visual-preview-scene';

function contract(id:string,covering:Vida38SpeciesVisualContract['morphology']['covering']='FEATHERS'):Vida38SpeciesVisualContract {
  return {
    revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId:id,speciesName:id,
    variantSeedUint32:0x7ac91a33,appearanceFingerprint:'avian-source-digest',
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'V3:bird',ecosystemDigest:'digest:bird'},
    morphology:{group:'BIRDS',bodyPlan:'WINGED',covering,appendagePairs:2},
    ecology:{habitat:'SURFACE_AIR',nutrition:'OMNIVORE',niche:'SURFACE_AIR/OMNIVORE'},
    locomotion:'FLYING',bodyLengthMeters:.8524,
    pigmentation:{primaryColorHex:'#987b71',secondaryColorHex:'#647ea2',pattern:'MOTTLED',bioluminescent:false},
    adaptations:['AERIAL_STABILITY','SENSORY_ORIENTATION'],intelligence:null,
  };
}

describe('GENESIS 38.2i — aves orgánicas y plumaje procedural',()=>{
  it('selecciona siete arquetipos y conserva identidad determinista sin depender del orden de consulta',()=>{
    expect(VIDA38_BIRD_ARCHETYPES).toHaveLength(7);
    const selected=new Set<string>();
    for(let i=0;i<180;i++){
      const c=contract(`vida6:bird:${i}`);
      const a=deriveVida38BirdMorphology38I(c);
      const b=deriveVida38BirdMorphology38I(c);
      expect(a).toEqual(b);
      expect(a.sourceLengthMeters).toBe(c.bodyLengthMeters);
      selected.add(a.archetype);
    }
    expect(selected.size).toBe(7);
  });
  it('recolor no altera morfología ni malla y la longitud VIDA permanece invariable',()=>{
    const a=contract('vida6:bird:identidad');
    const recolor={...a,pigmentation:{...a.pigmentation,primaryColorHex:'#fefefe',secondaryColorHex:'#1e1e1e'}};
    const pa=deriveVida38BirdMorphology38I(a),pb=deriveVida38BirdMorphology38I(recolor);
    expect(pa).toEqual(pb);
    const ma=buildVida38BirdRawMeshV1(pa,'LOW');
    const mb=buildVida38BirdRawMeshV1(pb,'LOW');
    expect(ma.positions).toEqual(mb.positions);
    expect(ma.indices).toEqual(mb.indices);
    expect(pa.sourceLengthMeters).toBe(.8524);
  },60_000);
  it('genera siete siluetas distintas con una sola superficie cerrada',()=>{
    const shapes=VIDA38_BIRD_ARCHETYPES.map(archetype=>{
      const profile=deriveVida38BirdMorphology38I(contract(`vida6:bird:${archetype}`),archetype);
      const raw=buildVida38BirdRawMeshV1(profile,'LOW');
      const audit=auditVida38BirdRawMeshV1(raw);
      expect(audit.invalid).toBe(0);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.inconsistentEdges).toBe(0);
      expect(audit.components).toBe(1);
      return [profile.bodyLength,profile.bodyDepth,profile.legLength,profile.neckLength,
        profile.billLength,profile.wingSpan,profile.tailLength].map(v=>v.toFixed(3)).join('/');
    });
    expect(new Set(shapes).size).toBe(7);
  },60_000);
  it('plumaje condicionado por FEATHERS; pigmentación estable con antialias procedural',()=>{
    const covered=contract('vida6:bird:plumaje');
    const naked=contract('vida6:bird:sin-plumaje','LEATHERY');
    const raw=buildVida38BirdRawMeshV1(deriveVida38BirdMorphology38I(covered),'LOW');
    const skin=createVida38BirdSkin38I(raw,covered);
    expect(skin.material).toBeInstanceOf(THREE.MeshPhysicalMaterial);
    const material=skin.material as THREE.MeshPhysicalMaterial;
    expect(material.metalness).toBe(0);
    const shader={uniforms:{} as Record<string,unknown>,vertexShader:'#include <common>\n#include <begin_vertex>',
      fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>'};
    material.onBeforeCompile(shader as Parameters<typeof material.onBeforeCompile>[0],{} as Parameters<typeof material.onBeforeCompile>[1]);
    expect(shader.fragmentShader).toContain('fwidth');
    expect(shader.fragmentShader).toContain('vVida38BirdLocal');
    expect(shader.fragmentShader).not.toContain('gl_FragCoord');
    const contour=createVida38BirdContourFeathers38I(raw,covered);
    const flight=createVida38BirdFlightFeathers38I(raw,covered);
    expect(contour).toBeInstanceOf(THREE.InstancedMesh);
    expect(flight).toBeInstanceOf(THREE.InstancedMesh);
    expect(createVida38BirdContourFeathers38I(raw,naked)).toBeNull();
    expect(createVida38BirdFlightFeathers38I(raw,naked)).toBeNull();
    contour?.geometry.dispose();(contour?.material as THREE.Material|undefined)?.dispose();
    flight?.geometry.dispose();(flight?.material as THREE.Material|undefined)?.dispose();
    skin.geometry.dispose();material.dispose();
  },60_000);
  it('integra BIRDS sin sustituir mamíferos y preserva encuadre base durante animación',()=>{
    const bird=createVida38SpeciesPreviewModelV1(contract('vida6:bird:scene'),{humanoidQuality:'LOW'});
    let organic=0,feathers=0,obsolete=0;
    bird.subject.traverse(obj=>{
      if(obj.name==='VIDA38_2I_BIRD_ORGANIC_SKIN')organic++;
      if(obj.name==='VIDA38_2I_BIRD_FLIGHT_FEATHERS')feathers++;
      if(obj.name==='VIDA38_2H_MAMMAL_ORGANIC_SKIN')obsolete++;
    });
    expect(organic).toBe(1);expect(feathers).toBe(1);expect(obsolete).toBe(0);
    expect(bird.subject.userData['birdScientificLengthMeters']).toBe(.8524);
    expect(bird.subject.userData['birdRepresentation']).toBe('ARTISTIC_HYPOTHESIS');
    const y0=bird.subject.position.y;
    bird.animation(0);
    expect(bird.subject.position.y).toBeCloseTo(y0,6);
    bird.animation(2);
    expect(Math.abs(bird.subject.position.y-y0)).toBeLessThan(.025);
    bird.dispose();
  },60_000);
});
