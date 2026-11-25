import { describe, expect, it } from 'vitest';
import { scientificPreviewDaylightCameraT7s } from './scientific-preview-daylight-camera-t7s';

const dot = (a: {x:number;y:number;z:number},b: {x:number;y:number;z:number}) =>
  a.x*b.x+a.y*b.y+a.z*b.z;

/** T7s: todas las pruebas comprueban la posición real del observador. */
describe('GENESIS 38.bis-T7s reparación · cámara diurna planetaria', () => {
  it('mira al lado iluminado con estrella en +X, -Z o +Y', () => {
    for (const star of [{x:1,y:0,z:0},{x:0,y:0,z:-1},{x:0,y:1,z:0}]) {
      const view=scientificPreviewDaylightCameraT7s([{...star,weight01:1}]);
      expect(dot(view,star)).toBeGreaterThan(0.98);
      expect(Math.hypot(view.x,view.y,view.z)).toBeCloseTo(1,9);
    }
  });
  it('da prioridad a una estrella anfitriona frente a una secundaria', () => {
    const view=scientificPreviewDaylightCameraT7s([
      {x:1,y:0,z:0,weight01:1,isOrbitalHost:false},
      {x:-1,y:0,z:0,weight01:.75,isOrbitalHost:true},
    ]);
    expect(view.x).toBeLessThan(-.95);
  });
  it('combina estrellas anfitrionas y trata cancelaciones y datos vacíos', () => {
    const view=scientificPreviewDaylightCameraT7s([
      {x:1,y:0,z:0,weight01:.9,isOrbitalHost:true},
      {x:0,y:0,z:1,weight01:.8,isOrbitalHost:true},
    ]);
    expect(dot(view,{x:1,y:0,z:1})/Math.sqrt(2)).toBeGreaterThan(.97);
    const opposed=scientificPreviewDaylightCameraT7s([
      {x:1,y:0,z:0,weight01:1},
      {x:-1,y:0,z:0,weight01:1},
    ]);
    expect(Number.isFinite(opposed.x)).toBe(true);
    expect(Math.hypot(opposed.x,opposed.y,opposed.z)).toBeCloseTo(1,9);
    const fallback=scientificPreviewDaylightCameraT7s(undefined);
    expect(dot(fallback,{x:4.5,y:3,z:5})).toBeGreaterThan(6);
  });
});
