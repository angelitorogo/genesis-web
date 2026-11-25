import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {colvis3ColonyOpticalFramingT7m} from './colvis3-colony-optical-zoom-t7m';

const FOOTPRINT=.00015;
const BODY_RADIUS=1;
const levels=[.32,.5,1,2,4,8];

describe('GENESIS 38.bis-T7m · zoom visual común para colonia y terreno',()=>{
  it('conserva una cámara espacial fija y escala únicamente la proyección',()=>{
    const original=colvis3ColonyOpticalFramingT7m(FOOTPRINT,BODY_RADIUS,8)!;
    expect(original.cameraZoom).toBe(1);
    for(const z of levels){
      const result=colvis3ColonyOpticalFramingT7m(FOOTPRINT,BODY_RADIUS,z)!;
      expect(result).not.toBeNull();
      expect(result.framing.distanceScene).toBe(original.framing.distanceScene);
      expect(result.framing.nearScene).toBe(original.framing.nearScene);
      expect(result.framing.farScene).toBe(original.framing.farScene);
      expect(result.framing.bodyCentreBlend).toBe(0);
      expect(result.cameraZoom).toBeCloseTo(8/z,12);
    }
  });

  it('la proyección amplía exactamente igual posiciones a DISTINTA profundidad',()=>{
    const camera=new THREE.PerspectiveCamera(38,16/9,.000001,100);
    camera.position.set(0,0,0);
    camera.lookAt(0,0,-1);
    const landmarkOnTerrain=new THREE.Vector3(.002,.001,-.09);
    const landmarkOnColony=new THREE.Vector3(.0008,.0002,-.008);
    const project=(zoom:number,p:THREE.Vector3)=>{
      camera.zoom=zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      return p.clone().project(camera);
    };
    const terrainBase=project(1,landmarkOnTerrain);
    const colonyBase=project(1,landmarkOnColony);
    for(const z of levels){
      const optical=colvis3ColonyOpticalFramingT7m(FOOTPRINT,BODY_RADIUS,z)!;
      const terrain=project(optical.cameraZoom,landmarkOnTerrain);
      const colony=project(optical.cameraZoom,landmarkOnColony);
      // Misma escala en pantalla, aun cuando el terreno está 10 veces más lejos.
      expect(terrain.x/terrainBase.x).toBeCloseTo(optical.cameraZoom,9);
      expect(colony.x/colonyBase.x).toBeCloseTo(optical.cameraZoom,9);
      expect(terrain.y/terrainBase.y).toBeCloseTo(optical.cameraZoom,9);
      expect(colony.y/colonyBase.y).toBeCloseTo(optical.cameraZoom,9);
    }
  });

  it('rechaza valores inválidos y acota los extremos',()=>{
    expect(colvis3ColonyOpticalFramingT7m(0,1,1)).toBeNull();
    expect(colvis3ColonyOpticalFramingT7m(.001,0,1)).toBeNull();
    expect(colvis3ColonyOpticalFramingT7m(.001,1,NaN)).toBeNull();
    expect(colvis3ColonyOpticalFramingT7m(.001,1,0)).toBeNull();
    expect(colvis3ColonyOpticalFramingT7m(.001,1,-1)).toBeNull();
    expect(colvis3ColonyOpticalFramingT7m(.001,1,100)!.cameraZoom).toBe(1);
    expect(colvis3ColonyOpticalFramingT7m(.001,1,.01)!.cameraZoom).toBe(25);
  });
});
