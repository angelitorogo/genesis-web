import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {VIDA38_SPECIES_VISUAL_REVISION,type Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {VIDA38_REPTILE_ARCHETYPES,deriveVida38ReptileMorphology38J} from './vida38-reptile-morphology-38-2j';
import {
  evaluateVida38ReptileField38J,buildVida38ReptileRawMesh38J,auditVida38ReptileRawMesh38J,
} from './vida38-reptile-organic-field-38-2j';
import {
  deriveVida38ReptileJaw38JB,findVida38ReptileOuterJawX38JB,VIDA38_REPTILE_DENTITION_REVISION,
} from './vida38-reptile-dentition-38-2jb';
import {createVida38ReptilePreview38J} from './vida38-reptile-preview-38-2j';

const contract=(speciesId:string,nutrition:Vida38SpeciesVisualContract['ecology']['nutrition']):Vida38SpeciesVisualContract=>({
  revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId,speciesName:speciesId,
  variantSeedUint32:0x6c3591fb,appearanceFingerprint:'reptile-dental-test',
  provenance:{status:'CONFIRMED_SYSTEM_CT0',representation:'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
    observedImageAvailable:false,bodyStorageKey:'V3:reptile-test',ecosystemDigest:'reptile-dental-test'},
  morphology:{group:'REPTILES',bodyPlan:'TETRAPOD',covering:'SCALES',appendagePairs:2},
  ecology:{habitat:'SURFACE_OPEN_TERRAIN',niche:'SURFACE_OPEN_TERRAIN/'+nutrition,nutrition},
  locomotion:'WALKING',bodyLengthMeters:1.83,
  pigmentation:{primaryColorHex:'#847462',secondaryColorHex:'#52654a',pattern:'MOTTLED',bioluminescent:false},
  adaptations:['RESOURCE_FORAGING'],intelligence:null,
});

describe('GENESIS 38.2j.b — anclaje y exposición de dentición reptiliana',()=>{
  it('reconstruye la misma mandíbula para la misma identidad y no depende de pigmentos',()=>{
    const c=contract('reptile:deterministic','PREDATOR');
    const m=deriveVida38ReptileMorphology38J(c);
    const a=deriveVida38ReptileJaw38JB(m,c.ecology.nutrition);
    expect(a).toEqual(deriveVida38ReptileJaw38JB(m,c.ecology.nutrition));
    expect(a.revision).toBe(VIDA38_REPTILE_DENTITION_REVISION);
    const recolored={...c,pigmentation:{...c.pigmentation,primaryColorHex:'#ffffff'}};
    expect(deriveVida38ReptileJaw38JB(deriveVida38ReptileMorphology38J(recolored),c.ecology.nutrition)).toEqual(a);
  });
  it('ancla raíces en la piel real y mantiene puntas externas en nueve arquetipos',()=>{
    for(const kind of VIDA38_REPTILE_ARCHETYPES){
      const m=deriveVida38ReptileMorphology38J(contract('reptile:jaw:'+kind,'PREDATOR'),kind);
      const jaw=deriveVida38ReptileJaw38JB(m,'PREDATOR');
      expect(jaw.seam.every(side=>side.length>=10)).toBe(true);
      expect(jaw.teeth.length).toBeGreaterThan(10);
      for(const tooth of jaw.teeth){
        const [x,y,z]=tooth.base;
        const surface=findVida38ReptileOuterJawX38JB(m,y,z);
        expect(surface).not.toBeNull();
        expect(Math.abs(Math.abs(x)-surface!)).toBeLessThan(.017*m.headSize);
        expect(evaluateVida38ReptileField38J(m,...tooth.tip)).toBeGreaterThan(0);
        expect(tooth.exposedLength).toBeGreaterThan(.012);
        expect(tooth.radius).toBeGreaterThan(0);
      }
    }
  },20000);
  it('la exposición cambia con la dieta sin inventar dientes en herbívoros',()=>{
    const predator=deriveVida38ReptileMorphology38J(contract('reptile:predator','PREDATOR'));
    const predatorJaw=deriveVida38ReptileJaw38JB(predator,'PREDATOR');
    expect(predatorJaw.exposure).toMatch(/MODERATE|PRONOUNCED/);
    expect(predatorJaw.teeth.some(t=>t.row==='LOWER')).toBe(true);
    let hidden=0,subtle=0;
    for(let i=0;i<35;i++){
      const m=deriveVida38ReptileMorphology38J(contract('reptile:herb:'+i,'HERBIVORE'));
      const jaw=deriveVida38ReptileJaw38JB(m,'HERBIVORE');
      expect(['HIDDEN','SUBTLE']).toContain(jaw.exposure);
      if(jaw.exposure==='HIDDEN'){hidden++;expect(jaw.teeth.length).toBe(0);}
      else subtle++;
    }
    expect(hidden).toBeGreaterThan(0);
    expect(subtle).toBeGreaterThan(0);
  });
  it('mantiene el volumen reptiliano cerrado tras perfilar la mandíbula',()=>{
    const m=deriveVida38ReptileMorphology38J(contract('reptile:topology','PREDATOR'),'CROCODILIAN');
    const mesh=buildVida38ReptileRawMesh38J(m,'LOW');
    const a=auditVida38ReptileRawMesh38J(mesh);
    expect(a.invalid).toBe(0);expect(a.boundaryEdges).toBe(0);
    expect(a.nonManifoldEdges).toBe(0);expect(a.components).toBe(1);
  },20000);
  it('la vista conserva dentición opaca orientada sin exigir juntas o labios como mallas separadas',()=>{
    const c=contract('reptile:preview:teeth','PREDATOR');
    const root=new THREE.Group();
    const objects=createVida38ReptilePreview38J(root,c,'LOW');
    const skin=objects.find(o=>o.name==='VIDA38_2J_REPTILE_ORGANIC_SKIN') as THREE.Mesh;
    expect(skin).toBeTruthy();
    expect((skin.material as THREE.MeshPhysicalMaterial).transparent).toBe(false);
    // GENESIS_38_2S8F_DENTITION_COMPAT: aceptar las mallas 38.2j y 38.2j.b, incluso dentro de grupos.
    const teeth: THREE.Mesh[] = [];
    for (const object of objects) object.traverse(node => {
      if (node instanceof THREE.Mesh && /^VIDA38_2J(?:B)?_TOOTH/.test(node.name)) teeth.push(node);
    });
    const expectedDentition = deriveVida38ReptileMorphology38J(c).dentition;
    // GENESIS_38_2S8H_CLOSED_SDF_DENTITION: 38.2p2a conserva la dentición en el perfil científico,
    // pero NO dibuja dientes sueltos sobre una mandíbula SDF cerrada.
    expect(root.userData['reptileDentition38J']).toBe(expectedDentition);
    expect(teeth.length).toBe(0);
    
    
    for(const o of objects){
      if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}
    }
  },20000);
});
