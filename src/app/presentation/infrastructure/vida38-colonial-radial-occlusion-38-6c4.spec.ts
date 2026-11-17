import * as THREE from 'three';
import { installSystemSceneDayNightMaterialV1 } from '../system/system-scene-atmosphere-material';
import { v2SmallBodyDayNightProfile } from '../system/system-scene-v2-body-lighting';
import {
  vida38ColonialHorizonVisibility386c4,
  installVida38ColonialRadialOcclusion386c4,
  patchVida38ColonialRadialOcclusion386c4,
} from './vida38-colonial-radial-occlusion-38-6c4';
import {
  VIDA38_INFRASTRUCTURE_REVISION_386,
  vida38InfrastructureAnchor386,
  type Vida38InfrastructurePlan386,
} from './vida38-infrastructure-plan-38-6';
import { createVida38InfrastructureSurfaceVisual386 } from './vida38-infrastructure-render-38-6';

const binding = () => ({
  lightDirectionsView: [
    new THREE.Vector3(0,0,-1),
    new THREE.Vector3(0,0,1),
    new THREE.Vector3(1,0,0),
  ] as const,
  lightWeightsView: new THREE.Vector3(.7,.3,0),
});

function fixture(): Vida38InfrastructurePlan386 {
  const seed=0x386c4;
  return Object.freeze({
    revision: VIDA38_INFRASTRUCTURE_REVISION_386,
    id:'verified-colony-1',provenance:'VIDA8_COLONIAL_SETTLEMENT',
    bodyStorageKey:'0:1:2:8:MOON:3',seedUint32:seed,
    locationStatus:'RECONSTRUCTED_NOT_OBSERVED',
    ...vida38InfrastructureAnchor386(seed),
    form:'COLONIAL_HABITAT',scale:'OUTPOST',tier:'COLONIAL',
    lineage:'HUMANOID',habitat:'SUBSURFACE_VAULT',purpose:'RESEARCH',
    habitatTechnology:'SUBSURFACE_VAULT',
  });
}

function probeShader(material:THREE.MeshStandardMaterial) {
  const shader = {
    uniforms: {} as Record<string,{value:unknown}>,
    vertexShader: '#include <common>\n#include <begin_vertex>\n#include <project_vertex>\n',
    fragmentShader: '#include <common>\nvec3 normal = vec3(0.0,1.0,0.0);\nvec3 outgoingLight=vec3(1.0);\n#include <opaque_fragment>\n',
  };
  material.onBeforeCompile(shader as unknown as Parameters<typeof material.onBeforeCompile>[0],
    {} as THREE.WebGLRenderer);
  return shader;
}

describe('38.6c4 — horizonte lunar real para la iluminación de colonias',()=>{
  it('noche lunar: una pared puede mirar a la estrella, pero el horizonte la bloquea',()=>{
    const centre=new THREE.Vector3(0,0,0);
    const site=new THREE.Vector3(0,0,1); // radio hacia +Z
    const behind=new THREE.Vector3(0,0,-1); // estrella DETRÁS de la luna
    // Una pared que mira hacia -Z daría un reflejo erróneo con su normal.
    expect(new THREE.Vector3(0,0,-1).dot(behind)).toBe(1);
    expect(vida38ColonialHorizonVisibility386c4(centre,site,[behind],new THREE.Vector3(1,0,0))).toBe(0);
  });
  it('triple A/B/C: la estrella secundaria ilumina aunque la primaria esté detrás',()=>{
    const centre=new THREE.Vector3(0,0,0);
    const site=new THREE.Vector3(0,0,1);
    const directions=[new THREE.Vector3(0,0,-1),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)];
    const partial=vida38ColonialHorizonVisibility386c4(centre,site,directions,new THREE.Vector3(.7,.3,0));
    expect(partial).toBeCloseTo(.3,6);
    expect(vida38ColonialHorizonVisibility386c4(centre,site,directions,new THREE.Vector3(1,0,0))).toBe(0);
    expect(vida38ColonialHorizonVisibility386c4(centre,site,directions,new THREE.Vector3(0,1,0))).toBe(1);
  });
  it('traslación orbital y cámara no cambian la exposición radial',()=>{
    const centre=new THREE.Vector3(3,8,-12);
    const structure=new THREE.Vector3(3,8,-11);
    const star=new THREE.Vector3(0,0,-1);
    expect(vida38ColonialHorizonVisibility386c4(centre,structure,[star],new THREE.Vector3(1,0,0))).toBe(0);
    const delta=new THREE.Vector3(400,-20,20);
    expect(vida38ColonialHorizonVisibility386c4(centre.clone().add(delta),structure.clone().add(delta),[star],new THREE.Vector3(1,0,0))).toBe(0);
  });
  it('aplica el radio desde el CENTRO del cuerpo, no las normales de las paredes',()=>{
    const mat=new THREE.MeshStandardMaterial();
    const lights=binding();
    const center=new THREE.Vector3(42,1,-7);
    installSystemSceneDayNightMaterialV1(mat,v2SmallBodyDayNightProfile(false),lights);
    installVida38ColonialRadialOcclusion386c4(mat,lights,center);
    const shader=probeShader(mat);
    expect(shader.vertexShader).toContain('mvPosition.xyz - uVida38ColonialBodyCenterView');
    expect(shader.fragmentShader).toContain('normalize(vVida38ColonialRadialView)');
    expect(shader.fragmentShader).toContain('outgoingLight *= clamp(vida38RadialDay, 0.0, 1.0)');
    expect(shader.fragmentShader).not.toContain('vida38Incidence = dot(normal,');
    expect(shader.uniforms['uVida38ColonialBodyCenterView']?.value).toBe(center);
    expect(shader.uniforms['uGenesisLightDirectionsView']?.value).toBe(lights.lightDirectionsView);
    expect(shader.uniforms['uGenesisLightWeights']?.value).toBe(lights.lightWeightsView);
    expect(mat.userData['vida38ColonialRadialOcclusion386c4']).toBe(true);
    mat.dispose();
  });

  it('calcula sombras incluso con InstancedMesh (posición posterior a project_vertex)',()=>{
    const patched=patchVida38ColonialRadialOcclusion386c4(
      '#include <common>\n#include <project_vertex>',
      '#include <common>\nuniform vec3 uGenesisLightDirectionsView[3];\nuniform vec3 uGenesisLightWeights;\nvec3 outgoingLight;\n#include <opaque_fragment>');
    expect(patched.vertexShader.indexOf('mvPosition.xyz -')).toBeGreaterThan(
      patched.vertexShader.indexOf('#include <project_vertex>'));
    expect(patched.fragmentShader).toContain('for (int vida38Star = 0; vida38Star < 3; vida38Star++)');
    expect(patched.fragmentShader).toContain('smoothstep(-0.025, 0.025, vida38Incidence)');
    expect(patched.fragmentShader).toContain('uGenesisLightWeights[vida38Star]');
  });

  it('no se instala sobre materiales sin el shader multiestelar validado',()=>{
    const plain=new THREE.MeshStandardMaterial();
    expect(()=>installVida38ColonialRadialOcclusion386c4(plain,binding(),new THREE.Vector3())).toThrow();
    plain.dispose();
  });

  it('se instala una sola vez por material, manteniendo la clave WebGL estable',()=>{
    const mat=new THREE.MeshStandardMaterial();
    const lights=binding();
    installSystemSceneDayNightMaterialV1(mat,v2SmallBodyDayNightProfile(false),lights);
    const center=new THREE.Vector3();
    installVida38ColonialRadialOcclusion386c4(mat,lights,center);
    const key=mat.customProgramCacheKey();
    installVida38ColonialRadialOcclusion386c4(mat,lights,center);
    expect(mat.customProgramCacheKey()).toBe(key);
    expect(key).toContain('VIDA38-COLONIAL-RADIAL-OCCLUSION-386C4');
    const shader=probeShader(mat);
    expect(shader.fragmentShader.match(/outgoingLight \*= clamp\(vida38RadialDay/g)).toHaveLength(1);
    mat.dispose();
  });

  it('mueve el centro lunar en espacio de cámara sin desplazar la colonia CT-0',()=>{
    const plan=fixture();
    const original=JSON.stringify(plan);
    const visual=createVida38InfrastructureSurfaceVisual386([plan],1,null,null,true);
    visual.group.position.set(4,5,6);
    visual.group.updateMatrixWorld(true);
    const view=new THREE.Matrix4().makeTranslation(-2,-3,-4);
    visual.updateColonialNightLighting386c3(binding().lightDirectionsView,
      binding().lightWeightsView,view);
    expect(visual.colonialBodyCenterView386c4.toArray()).toEqual([2,2,2]);
    expect(JSON.stringify(plan)).toBe(original);
    visual.resources.forEach(r=>r.dispose());
  });

  it('la máscara es exclusiva del material colonial; el indicador artificial sigue siendo independiente',()=>{
    const visual=createVida38InfrastructureSurfaceVisual386([fixture()],1,null,null,true);
    const colonial:THREE.MeshStandardMaterial[]=[];
    const lamps:THREE.MeshBasicMaterial[]=[];
    visual.group.traverse(obj=>{
      if(!(obj instanceof THREE.InstancedMesh)) return;
      if(obj.userData['colonialVisual386c']) colonial.push(obj.material as THREE.MeshStandardMaterial);
      if(obj.userData['colonialNightIndicators386c3']) lamps.push(obj.material as THREE.MeshBasicMaterial);
    });
    expect(colonial.length).toBeGreaterThan(0);
    expect(lamps).toHaveLength(3);
    expect(lamps.every(m=>m instanceof THREE.MeshBasicMaterial && m.depthTest && !m.depthWrite)).toBe(true);
    visual.resources.forEach(r=>r.dispose());
  });
});
