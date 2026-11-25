import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {colvis3ColonyOrbitOffsetT7n} from './colvis3-colony-orbit-camera-t7n';

describe('38.bis-T7n · cámara orbital alrededor de la colonia',()=>{
  const normal=new THREE.Vector3(0,1,0),tangent=new THREE.Vector3(0,0,1);
  it('orbita un asentamiento estático con distancia constante',()=>{
    for(const yaw of [0,.5,1.4,Math.PI,2*Math.PI]){
      const offset=colvis3ColonyOrbitOffsetT7n(normal,tangent,yaw,.75,2);
      expect(offset.length()).toBeCloseTo(2,7);
      expect(offset.dot(normal)).toBeGreaterThan(0);
    }
    expect(normal.toArray()).toEqual([0,1,0]);
    expect(tangent.toArray()).toEqual([0,0,1]);
  });
  it('gira la vista horizontalmente sin rotar el planeta ni cambiar la luz',()=>{
    const start=colvis3ColonyOrbitOffsetT7n(normal,tangent,0,.75,1);
    const right=colvis3ColonyOrbitOffsetT7n(normal,tangent,Math.PI/2,.75,1);
    expect(start.z).toBeGreaterThan(.6);
    expect(right.x).toBeGreaterThan(.6);
    expect(start.y).toBeCloseTo(right.y,7);
  });
  it('limita la elevación por encima del horizonte',()=>{
    expect(colvis3ColonyOrbitOffsetT7n(normal,tangent,0,-1,1).y).toBeGreaterThan(0);
    expect(colvis3ColonyOrbitOffsetT7n(normal,tangent,0,2.4,1).y).toBeLessThan(1);
  });
});
