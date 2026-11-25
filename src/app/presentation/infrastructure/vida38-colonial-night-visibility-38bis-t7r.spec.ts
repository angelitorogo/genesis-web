import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import type {Vida38InfrastructurePlan386} from './vida38-infrastructure-plan-38-6';
import {createVida38InfrastructureSurfaceVisual386} from './vida38-infrastructure-render-38-6';
import {colonialNightVisibilityT7r,colonialNightGlowSceneSizeT7r} from './vida38-colonial-night-visibility-38bis-t7r';

const plan:Vida38InfrastructurePlan386={
  revision:'VIDA.38.6/physical-infrastructure/v1',id:'t7r-night-moon',
  provenance:'VIDA8_COLONIAL_SETTLEMENT',bodyStorageKey:'confirmed',seedUint32:747,
  locationStatus:'RECONSTRUCTED_NOT_OBSERVED',latitudeRadians:0,longitudeRadians:0,
  form:'COLONIAL_HABITAT',scale:'CITY',tier:'COLONIAL',lineage:'HUMANOID',
  habitat:'SEALED_SURFACE',purpose:'HABITATION',habitatTechnology:'SEALED_SURFACE',
  colonyArchitectureCOLVIS1:{founderTier:'ADVANCED',destinationKind:'MOON',
    populationRange:[5001,120000],function:'HABITATION',founderSpeciesId:'known-species',
    founderSourceBodyStorageKey:'confirmed-origin'},
};

describe('GENESIS 38.bis-T7r · luces nocturnas en la escena científica',()=>{
  it('solo muestra emisiones desde el hemisferio observable y con noche estelar',()=>{
    expect(colonialNightVisibilityT7r(0,1,600).opacity).toBeGreaterThan(.90);
    expect(colonialNightVisibilityT7r(1,1,600).opacity).toBeLessThan(.05);
    expect(colonialNightVisibilityT7r(0,-.1,600).opacity).toBe(0);
    expect(colonialNightVisibilityT7r(0,1,1).diameterPixels).toBe(0);
    expect(colonialNightVisibilityT7r(0,1,600).diameterPixels).toBeLessThanOrEqual(7);
    expect(colonialNightGlowSceneSizeT7r(5,4,50,800)).toBeGreaterThan(0);
  });
  it('solo SystemScene incorpora emisores ópticos; ficha y laboratorio no los reciben',()=>{
    const system=createVida38InfrastructureSurfaceVisual386([plan],1,null,null,true,1,null,false,false);
    const fiche=createVida38InfrastructureSurfaceVisual386([plan],1,null,null,true,1,null,true,true);
    const sprites:THREE.Sprite[]=[];
    const ficheSprites:THREE.Sprite[]=[];
    system.group.traverse(o=>{if(o instanceof THREE.Sprite && o.name.includes('T7r colony night'))sprites.push(o);});
    fiche.group.traverse(o=>{if(o instanceof THREE.Sprite && o.name.includes('T7r colony night'))ficheSprites.push(o);});
    expect(sprites.length).toBeGreaterThan(0);
    expect(ficheSprites.length).toBe(0);
    const camera=new THREE.PerspectiveCamera(50,16/9,.01,100);
    camera.position.set(4,0,0);camera.lookAt(0,0,0);
    camera.updateMatrixWorld(true);
    system.group.updateMatrixWorld(true);
    const dir=(x:number)=>new THREE.Vector3(x,0,0).transformDirection(camera.matrixWorldInverse);
    system.updateColonialNightLighting386c3([dir(-1)],new THREE.Vector3(1,0,0),camera.matrixWorldInverse,camera,900);
    expect(sprites.some(s=>s.visible)).toBe(true);
    const night=sprites[0]!.material as THREE.SpriteMaterial;
    const nightOpacity=night.opacity;
    expect(nightOpacity).toBeGreaterThan(.5);
    expect(night.depthTest).toBe(true);
    expect(night.depthWrite).toBe(false);
    system.updateColonialNightLighting386c3([dir(1)],new THREE.Vector3(1,0,0),camera.matrixWorldInverse,camera,900);
    expect(night.opacity).toBeLessThan(nightOpacity);
    camera.position.set(-4,0,0);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
    system.updateColonialNightLighting386c3([new THREE.Vector3(0,1,0)],new THREE.Vector3(1,0,0),camera.matrixWorldInverse,camera,900);
    expect(sprites.every(s=>!s.visible)).toBe(true);
    system.resources.forEach(r=>r.dispose());
    fiche.resources.forEach(r=>r.dispose());
  });
});
