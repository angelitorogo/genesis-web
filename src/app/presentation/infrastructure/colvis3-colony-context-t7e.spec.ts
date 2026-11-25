import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {colvis3ColonyFramingT7e,COLVIS3_MAX_INSPECTION_ZOOM_T7E} from './colvis3-colony-camera-t7e';
import {createColvis3ColonyContextSurfaceT7e,colvis3SurfaceDetailPixelsT7e} from './colvis3-colony-context-surface-t7e';

describe('GENESIS 38.bis-T7h · inspección rápida y colonia sin niebla',()=>{
  it('respeta el rango local aprobado y descarta datos inválidos',()=>{
    expect(colvis3ColonyFramingT7e(0,1,1)).toBeNull();
    expect(colvis3ColonyFramingT7e(.001,0,1)).toBeNull();
    expect(COLVIS3_MAX_INSPECTION_ZOOM_T7E).toBe(8);
    expect(colvis3ColonyFramingT7e(.00015,1,8)?.bodyCentreBlend).toBe(0);
    expect(createColvis3ColonyContextSurfaceT7e(0,1,1,3,true)).toBeNull();
  });
  it('genera texturas deterministas, detalladas y con transparencia exterior',()=>{
    const a=colvis3SurfaceDetailPixelsT7e(123,true,64,true);
    const b=colvis3SurfaceDetailPixelsT7e(123,true,64,true);
    expect(a).toEqual(b);
    expect(a[3]).toBe(0);
    expect(a[(32*64+32)*4+3]).toBeGreaterThan(240);
    expect(colvis3SurfaceDetailPixelsT7e(124,true,64,true)).not.toEqual(a);
    const colors=new Set<number>();
    for(let i=0;i<a.length;i+=4)colors.add(a[i]!);
    expect(colors.size).toBeGreaterThan(30);
  });
  it('la capa de superficie está por debajo de edificios y no se superpone como niebla',()=>{
    const footprint=.0002;
    const context=createColvis3ColonyContextSurfaceT7e(footprint,1,1,123,true)!;
    const near=context.detailMesh;
    const broad=context.mesh;
    expect(near).toBeInstanceOf(THREE.Mesh);
    expect(broad.material.transparent).toBe(true);
    expect(broad.material.depthTest).toBe(true);
    expect(broad.material.depthWrite).toBe(false);
    expect(broad.material.opacity).toBeLessThan(.85);
    expect(broad.material.bumpScale).toBeLessThan(footprint*.04);
    expect(near.material.opacity).toBeLessThan(.9);
    expect(near.material.depthTest).toBe(true);
    expect(near.renderOrder).toBe(0);
    const pos=near.geometry.getAttribute('position') as THREE.BufferAttribute;
    const middle=pos.getY(Math.floor(pos.count/2));
    expect(middle).toBeLessThan(footprint*.04);
    expect(middle).toBeGreaterThan(-footprint*.04);
    expect(context.detailRadiusScene).toBeGreaterThan(footprint*5);
    context.setZoom(8);
    expect(near.material.opacity).toBeCloseTo(0);
    context.setZoom(1);
    expect(near.material.opacity).toBeGreaterThan(.65);
    context.dispose();
  });
});
