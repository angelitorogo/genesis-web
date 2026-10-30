import { describe, expect, it } from 'vitest';
import { VIDA38_SPECIES_VISUAL_REVISION, type Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  VIDA38_HUMANOID_ORGANIC_REVISION,
  auditVida38HumanoidRawMesh,
  buildVida38HumanoidRawMesh,
  deriveVida38HumanoidAnatomy,
} from './vida38-humanoid-organic-field-38-2e';

function contract(speciesId:string, seed=0x12345678):Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId,
    speciesName: speciesId,
    variantSeedUint32: seed,
    appearanceFingerprint: 'b315af20',
    provenance: {
      status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable:false,bodyStorageKey:'V3:test',ecosystemDigest:'test',
    },
    morphology:{group:'HUMANOIDS',bodyPlan:'BIPED',covering:'LEATHERY',appendagePairs:2},
    ecology:{habitat:'SURFACE_SOIL',nutrition:'OMNIVORE',niche:'SURFACE_SOIL/OMNIVORE'},
    locomotion:'WALKING',bodyLengthMeters:1.6126,
    pigmentation:{primaryColorHex:'#B19F9B',secondaryColorHex:'#827A9C',pattern:'MOTTLED',bioluminescent:false},
    adaptations:['THERMAL_BUFFERING','SENSORY_ORIENTATION'],intelligence:null,
  };
}
function digest(array:Float32Array|Uint32Array):number {
  let hash=2166136261;
  const step=Math.max(1,Math.floor(array.length/1200));
  for(let i=0;i<array.length;i+=step){
    const scaled=Math.round(Number(array[i])*1000000);
    hash=Math.imul(hash^scaled,16777619)>>>0;
  }
  return hash;
}

describe('GENESIS 38.2e — nueva malla humanoide implícita',()=>{
  it('respeta la longitud corporal de VIDA, sin generar nuevos datos observados',()=>{
    const original=contract('vida6:kamera');
    const a=deriveVida38HumanoidAnatomy(original);
    expect(a.revision).toBe(VIDA38_HUMANOID_ORGANIC_REVISION);
    expect(a.lengthMeters).toBe(1.6126);
    expect(original.provenance.observedImageAvailable).toBe(false);
    expect(a.shoulderWidth).toBeGreaterThan(0.28);
    expect(a.headHeight).toBeLessThan(0.34);
    expect(a.fingerCount).toBeGreaterThanOrEqual(3);
    expect(a.fingerCount).toBeLessThanOrEqual(5);
  });
  it('crea una única superficie estanca, orientable y sin aristas no manifold',()=>{
    const raw=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(contract('vida6:kamera')),'MEDIUM');
    const audit=auditVida38HumanoidRawMesh(raw);
    expect(audit.vertexCount).toBeGreaterThan(4000);
    expect(audit.triangleCount).toBeGreaterThan(7000);
    expect(audit.invalid).toBe(0);
    expect(audit.boundaryEdges).toBe(0);
    expect(audit.nonManifoldEdges).toBe(0);
    expect(audit.inconsistentEdges).toBe(0);
    expect(audit.components).toBe(1);
  });
  it('es reproducible incluso al regenerar la geometría desde cero',()=>{
    const a=deriveVida38HumanoidAnatomy(contract('vida6:repro'));
    const first=buildVida38HumanoidRawMesh(a,'LOW');
    const second=buildVida38HumanoidRawMesh(a,'LOW');
    expect(first.anatomy).toEqual(second.anatomy);
    expect(digest(first.positions)).toBe(digest(second.positions));
    expect(digest(first.normals)).toBe(digest(second.normals));
    expect(digest(first.indices)).toBe(digest(second.indices));
  });
  it('las especies distintas no obtienen exactamente la misma anatomía',()=>{
    const left=deriveVida38HumanoidAnatomy(contract('vida6:speciesA'));
    const right=deriveVida38HumanoidAnatomy(contract('vida6:speciesB'));
    expect(left.visualSeed).not.toBe(right.visualSeed);
    expect(left.headWidth).not.toBe(right.headWidth);
    expect(left.shoulderWidth).not.toBe(right.shoulderWidth);
  });
  it('ofrece tres niveles de detalle sin cambiar los rasgos ni la identidad',()=>{
    const a=deriveVida38HumanoidAnatomy(contract('vida6:lod'));
    const low=buildVida38HumanoidRawMesh(a,'LOW');
    const medium=buildVida38HumanoidRawMesh(a,'MEDIUM');
    const high=buildVida38HumanoidRawMesh(a,'HIGH');
    expect(low.positions.length).toBeLessThan(medium.positions.length);
    expect(medium.positions.length).toBeLessThan(high.positions.length);
    for(const mesh of [low,medium,high]){
      const audit=auditVida38HumanoidRawMesh(mesh);
      expect(audit.invalid).toBe(0);
      expect(audit.components).toBe(1);
      expect(audit.boundaryEdges).toBe(0);
      expect(audit.nonManifoldEdges).toBe(0);
    expect(audit.inconsistentEdges).toBe(0);
      expect(mesh.anatomy.speciesId).toBe('vida6:lod');
    }
  });
  it('normales finitas y casi unitarias en toda la superficie',()=>{
    const mesh=buildVida38HumanoidRawMesh(deriveVida38HumanoidAnatomy(contract('vida6:normals')),'LOW');
    for(let i=0;i<mesh.normals.length;i+=3){
      const magnitude=Math.hypot(mesh.normals[i]!,mesh.normals[i+1]!,mesh.normals[i+2]!);
      expect(magnitude).toBeGreaterThan(0.95);
      expect(magnitude).toBeLessThan(1.05);
    }
    for(const uv of mesh.uvs){expect(uv).toBeGreaterThanOrEqual(0);expect(uv).toBeLessThanOrEqual(1);}
  });
});
