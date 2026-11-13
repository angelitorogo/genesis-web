import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {VIDA38_BIRD_ARCHETYPES,deriveVida38BirdMorphology38I} from './vida38-bird-morphology-38-2i';
import {
  deriveVida38BirdLandmarks38I,deriveVida38BirdLegLandmarks38IA,
  evaluateVida38BirdField38I,buildVida38BirdRawMeshV1,auditVida38BirdRawMeshV1,
} from './vida38-bird-organic-field-38-2i';
import {createVida38BirdFlightFeathers38I} from './vida38-bird-materials-38-2i';

function contract(id:string, habitat:Vida38SpeciesVisualContract['ecology']['habitat']='SURFACE_AIR',
  nutrition:Vida38SpeciesVisualContract['ecology']['nutrition']='OMNIVORE',
  locomotion:Vida38SpeciesVisualContract['locomotion']='FLYING'):Vida38SpeciesVisualContract {
  return {
    revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId:id,speciesName:id,
    variantSeedUint32:0x7ac91a33,appearanceFingerprint:'avian-refinement-source',
    provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'V3:bird-refinement',ecosystemDigest:'digest:bird-refinement'},
    morphology:{group:'BIRDS',bodyPlan:'WINGED',covering:'FEATHERS',appendagePairs:2},
    ecology:{habitat,nutrition,niche:`${habitat}/${nutrition}`},locomotion,bodyLengthMeters:.8524,
    pigmentation:{primaryColorHex:'#957b6b',secondaryColorHex:'#596f93',pattern:'MOTTLED',bioluminescent:false},
    adaptations:['AERIAL_STABILITY','SENSORY_ORIENTATION'],intelligence:null,
  };
}

describe('GENESIS 38.2i.a — patas aviares y diversidad morfológica',()=>{
  it('diferencia visualmente zancuda, corredora, planeadora y ave pesada sin depender de los pigmentos',()=>{
    const c=contract('vida6:bird:diversity');
    const samples=Object.fromEntries(VIDA38_BIRD_ARCHETYPES.map(a=>[a,deriveVida38BirdMorphology38I(c,a)]));
    const wader=samples['WADER']!,runner=samples['CURSORIAL']!,glider=samples['GLIDER']!,heavy=samples['HEAVY']!,small=samples['PASSERINE']!;
    expect(wader.legLength).toBeGreaterThan(heavy.legLength*1.6);
    expect(wader.neckLength).toBeGreaterThan(small.neckLength*2);
    expect(wader.billLength).toBeGreaterThan(small.billLength*2);
    expect(glider.wingSpan).toBeGreaterThan(runner.wingSpan*2);
    expect(glider.wingSpan).toBeGreaterThan(heavy.wingSpan*2);
    expect(glider.wingDisplay).toBeGreaterThan(.4);
    const b=deriveVida38BirdMorphology38I({...c,pigmentation:{...c.pigmentation,
      primaryColorHex:'#ffffff',secondaryColorHex:'#101010'}},'GLIDER');
    expect(glider).toEqual(b);
    expect(glider.sourceLengthMeters).toBe(.8524);
  });
  it('genera muslo oculto, corvejón, tarsometatarso y tres dedos anteriores más uno posterior',()=>{
    for(const a of VIDA38_BIRD_ARCHETYPES){
      const m=deriveVida38BirdMorphology38I(contract(`vida6:bird:leg:${a}`),a);
      const leg=deriveVida38BirdLegLandmarks38IA(m,-1);
      expect(leg.hip[1]).toBeGreaterThan(leg.knee[1]);
      expect(leg.knee[1]).toBeGreaterThan(leg.hock[1]);
      expect(leg.hock[1]).toBeGreaterThan(leg.ankle[1]);
      expect(leg.hock[2]).toBeLessThan(leg.knee[2]);
      expect(leg.frontToes).toHaveLength(3);
      expect(leg.frontToes.every(toe=>toe[2]>leg.ankle[2])).toBe(true);
      expect(leg.hallux[2]).toBeLessThan(leg.ankle[2]);
      expect(new Set(leg.frontToes.map(toe=>toe[0].toFixed(5))).size).toBe(3);
      const other=deriveVida38BirdLegLandmarks38IA(m,1);
      expect(other.hip[0]).toBeCloseTo(-leg.hip[0],6);
    }
  });
  it('incorpora cambios geométricos reales de pico y ala al campo SDF',()=>{
    const c=contract('vida6:bird:sdf-specializations');
    const wader=deriveVida38BirdMorphology38I(c,'WADER');
    const passerine=deriveVida38BirdMorphology38I(c,'PASSERINE');
    const a=deriveVida38BirdLandmarks38I(wader);
    const b=deriveVida38BirdLandmarks38I(passerine);
    expect(a.billTipZ-a.headZ).toBeGreaterThan((b.billTipZ-b.headZ)*2);
    const glider=deriveVida38BirdMorphology38I(c,'GLIDER');
    const heavy=deriveVida38BirdMorphology38I(c,'HEAVY');
    expect(deriveVida38BirdLandmarks38I(glider).wingTipX).toBeGreaterThan(
      deriveVida38BirdLandmarks38I(heavy).wingTipX*2);
    expect(Number.isFinite(evaluateVida38BirdField38I(glider,0,1.2,0))).toBe(true);
  });
  it('conserva mallas cerradas y conectadas tras modificar las patas y las alas',()=>{
    for(const archetype of ['WADER','GLIDER','CURSORIAL'] as const){
      const m=deriveVida38BirdMorphology38I(contract(`vida6:bird:mesh:${archetype}`),archetype);
      const raw=buildVida38BirdRawMeshV1(m,'LOW');
      const audit=auditVida38BirdRawMeshV1(raw);
      expect(audit.invalid).toBe(0);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
      expect(audit.inconsistentEdges).toBe(0);
      expect(audit.components).toBe(1);
    }
  },60_000);
  it('añade secundarias, primarias y rectrices procedurales con LOD sin dependencia de cámara',()=>{
    const c=contract('vida6:bird:plumes');
    const m=deriveVida38BirdMorphology38I(c,'GLIDER');
    const raw=buildVida38BirdRawMeshV1(m,'LOW');
    const flight=createVida38BirdFlightFeathers38I(raw,c);
    expect(flight).toBeInstanceOf(THREE.InstancedMesh);
    expect(flight?.count).toBeGreaterThan(30);
    expect(flight?.instanceMatrix.count).toBe(flight?.count);
    flight?.geometry.dispose();
    (flight?.material as THREE.Material|undefined)?.dispose();
  },60_000);
});
