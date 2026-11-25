import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import type {Vida38InfrastructurePlan386} from '../infrastructure/vida38-infrastructure-plan-38-6';
import {systemSceneColonyBodyRingDiameterT7n,systemSceneHasConfirmedColonyT7n} from './system-scene-colonies-t7n';
import {createVida38InfrastructureSurfaceVisual386} from '../infrastructure/vida38-infrastructure-render-38-6';
const plan=(kind:'PLANET'|'MOON'):Vida38InfrastructurePlan386=>({
  revision:'VIDA.38.6/physical-infrastructure/v1',id:'confirmed-body-t7n',
  provenance:'VIDA8_COLONIAL_SETTLEMENT',bodyStorageKey:'confirmed',seedUint32:747,
  locationStatus:'RECONSTRUCTED_NOT_OBSERVED',latitudeRadians:0,longitudeRadians:0,
  form:'COLONIAL_HABITAT',scale:'CITY',tier:'COLONIAL',lineage:'HUMANOID',
  habitat:'SEALED_SURFACE',purpose:'HABITATION',habitatTechnology:'SEALED_SURFACE',
  colonyArchitectureCOLVIS1:{founderTier:'ADVANCED',destinationKind:kind,
    populationRange:[5001,120000],function:'HABITATION',founderSpeciesId:'known-species',
    founderSourceBodyStorageKey:'confirmed-origin'}
});
const countMarkers=(group:THREE.Object3D):number=>{
  let count=0;group.traverse(o=>{if(o.name.includes('colony location indicator'))count++;});return count;
};
describe('GENESIS 38.bis-T7n · capas coloniales científicas',()=>{
  it('distingue colonias confirmadas de infraestructura nativa y datos incompletos',()=>{
    expect(systemSceneHasConfirmedColonyT7n([plan('MOON')])).toBe(true);
    expect(systemSceneHasConfirmedColonyT7n([plan('PLANET')])).toBe(true);
    expect(systemSceneHasConfirmedColonyT7n([])).toBe(false);
    expect(systemSceneHasConfirmedColonyT7n(undefined)).toBe(false);
    expect(systemSceneHasConfirmedColonyT7n([{...plan('MOON'),provenance:'VIDA7_NATIVE_SETTLEMENT'}])).toBe(false);
    expect(systemSceneHasConfirmedColonyT7n([{...plan('MOON'),locationStatus:'OBSERVED'} as unknown as Vida38InfrastructurePlan386])).toBe(false);
    expect(systemSceneHasConfirmedColonyT7n([{...plan('MOON'),colonyArchitectureCOLVIS1:undefined}])).toBe(true); // Plan confirmado antiguo sin arquitectura COLVIS
  });
  it('escala el marcador de cuerpo completo y no introduce métricas físicas',()=>{
    expect(systemSceneColonyBodyRingDiameterT7n(1)).toBeCloseTo(3.2);
    expect(systemSceneColonyBodyRingDiameterT7n(.01)).toBeCloseTo(.14);
    expect(systemSceneColonyBodyRingDiameterT7n(0)).toBe(0);
  });
  it('SystemScene no crea círculos individuales; la ficha y el laboratorio sí',()=>{
    const p=plan('MOON');
    const scene=createVida38InfrastructureSurfaceVisual386([p],1,null,null,true,1,null,false,false);
    const fiche=createVida38InfrastructureSurfaceVisual386([p],1,null,null,true,1,null,true,true);
    const laboratory=createVida38InfrastructureSurfaceVisual386([p],1,null,null,true,1,null,false);
    expect(countMarkers(scene.group)).toBe(0);
    expect(countMarkers(fiche.group)).toBe(3);
    expect(countMarkers(laboratory.group)).toBe(3);
    const lamps:THREE.InstancedMesh[]=[];
    scene.group.traverse(o=>{if(o instanceof THREE.InstancedMesh&&o.name.includes('artificial colony lamps'))lamps.push(o);});
    expect(lamps.length).toBeGreaterThan(0);
    expect(lamps.reduce((sum,l)=>sum+l.count,0)).toBeGreaterThan(0);
    scene.group.updateMatrixWorld(true);
    const lamp=lamps[0]!.material as THREE.MeshBasicMaterial;
    scene.updateColonialNightLighting386c3([new THREE.Vector3(-1,0,0)],
      new THREE.Vector3(1,0,0),new THREE.Matrix4());
    const nightOpacity=lamp.opacity;
    scene.updateColonialNightLighting386c3([new THREE.Vector3(1,0,0)],
      new THREE.Vector3(1,0,0),new THREE.Matrix4());
    expect(nightOpacity).toBeGreaterThan(lamp.opacity);
    scene.resources.forEach(r=>r.dispose());fiche.resources.forEach(r=>r.dispose());
    laboratory.resources.forEach(r=>r.dispose());
  });
});
