import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {attachColvis3NativeTerrainT7i} from './colvis3-native-terrain-t7i';
import {colvis3TerrainCoordinatesT7l,colvis3TerrainDualBasisT7l} from './colvis3-colony-terrain-frame-t7l';

function setup(scale:number,irregular=false){
  const root=new THREE.Group();
  root.rotation.set(.23,-.38,.12);
  const moon=new THREE.Group();
  moon.scale.setScalar(scale);
  root.add(moon);
  const original=new THREE.MeshPhysicalMaterial({color:0xc6d5e4,roughness:.82});
  const surface=new THREE.Mesh(irregular
    ? new THREE.IcosahedronGeometry(1,3):new THREE.SphereGeometry(1,32,24),original);
  moon.add(surface);
  const site=new THREE.Group();
  site.position.set(0,scale,0);
  site.rotation.y=.8;
  root.add(site);
  root.updateMatrixWorld(true);
  return {root,moon,surface,site,original};
}

describe('GENESIS 38.bis-T7l · frame local colonia/superficie bloqueado al zoom',()=>{
  it('no añade superficies y restaura el material y atlas al cerrar',()=>{
    const {surface,site,original}=setup(.2);
    const before=surface.children.length;
    const ctx=attachColvis3NativeTerrainT7i(surface,site,18374,true,.0002,.2)!;
    expect(ctx).not.toBeNull();
    expect(surface.children.length).toBe(before);
    expect(surface.material).not.toBe(original);
    ctx.setZoom(.32);
    ctx.setZoom(8);
    ctx.dispose();ctx.dispose();
    expect(surface.material).toBe(original);
    surface.geometry.dispose();original.dispose();
  });
  it.each([1,.08,.007])('mantiene el mismo detalle espacial con escala lunar %s',scale=>{
    const {root,surface,site,original}=setup(scale,scale<.1);
    const footprint=scale*.00025;
    const ctx=attachColvis3NativeTerrainT7i(surface,site,7,true,footprint,scale)!;
    const shader={
      vertexShader:'#include <common>\n#include <begin_vertex>',
      fragmentShader:'#include <common>\nvoid main(){vec4 diffuseColor=vec4(1.);#include <map_fragment>}',
      uniforms:{} as Record<string,THREE.IUniform>,
    };
    (surface.material as THREE.MeshStandardMaterial).onBeforeCompile(shader as never,null as never);
    expect(shader.vertexShader).toContain('modelViewMatrix*vec4(transformed,1.0)');
    expect(shader.fragmentShader).toContain('dot(colvisDeltaT7l,uColvisTerrainDualXViewT7l)');
    expect(shader.fragmentShader).not.toContain('uColvisTerrainFootprintT7k');
    expect((surface.material as THREE.MeshStandardMaterial).customProgramCacheKey()).toContain('T7l-VIEW-FRAME-LOCKED');
    const camera=new THREE.PerspectiveCamera(55,1.6,.000001,50);
    for(const zoom of [.32,1,2,4,8]){
      camera.position.set(scale*.02*zoom,scale*(1+.02*zoom),scale*.04*zoom);
      const siteWorld=site.getWorldPosition(new THREE.Vector3());
      camera.lookAt(siteWorld);
      ctx.setZoom(zoom);
      ctx.updateFrame(camera);
      const uniforms=shader.uniforms;
      const o=uniforms['uColvisTerrainOriginViewT7l']!.value as THREE.Vector3;
      const ex=uniforms['uColvisTerrainDualXViewT7l']!.value as THREE.Vector3;
      const ez=uniforms['uColvisTerrainDualZViewT7l']!.value as THREE.Vector3;
      const point=site.localToWorld(new THREE.Vector3(footprint*.8,0,footprint*-.45));
      const p=point.applyMatrix4(camera.matrixWorldInverse).sub(o);
      const x=p.dot(ex),z=p.dot(ez);
      expect(x).toBeCloseTo(.8,6);
      expect(z).toBeCloseTo(-.45,6);
    }
    root.rotation.y+=.61;
    root.updateMatrixWorld(true);
    ctx.updateFrame(camera);
    const after=site.localToWorld(new THREE.Vector3(footprint*.8,0,footprint*-.45))
      .applyMatrix4(camera.matrixWorldInverse)
      .sub(shader.uniforms['uColvisTerrainOriginViewT7l']!.value as THREE.Vector3);
    expect(after.dot(shader.uniforms['uColvisTerrainDualXViewT7l']!.value as THREE.Vector3))
      .toBeCloseTo(.8,6);
    expect(after.dot(shader.uniforms['uColvisTerrainDualZViewT7l']!.value as THREE.Vector3))
      .toBeCloseTo(-.45,6);
    expect(shader.uniforms['uColvisTerrainExtentT7l']!.value).toBe(120);
    ctx.dispose();surface.geometry.dispose();original.dispose();
  });
  it('rechaza contratos y materiales inválidos sin tocar la superficie',()=>{
    const {surface,site,original}=setup(1);
    expect(attachColvis3NativeTerrainT7i(surface,site,1,true,0,1)).toBeNull();
    // Do not assign a MeshBasicMaterial to a Mesh inferred as MeshPhysicalMaterial:
    // test the rejection against a separate, correctly typed mesh instead.
    const unsupportedMaterial=new THREE.MeshBasicMaterial();
    const unsupportedSurface=new THREE.Mesh(surface.geometry,unsupportedMaterial);
    expect(attachColvis3NativeTerrainT7i(unsupportedSurface,site,1,true,.001,1)).toBeNull();
    expect(surface.material).toBe(original);
    unsupportedMaterial.dispose();
    surface.geometry.dispose();original.dispose();
  });
  it('resuelve ejes no perpendiculares por su base dual, sin deriva',()=>{
    const b=colvis3TerrainDualBasisT7l({x:2,y:0,z:.3},{x:1,y:0,z:3})!;
    const p=colvis3TerrainCoordinatesT7l({x:2*.6+1*.3,y:0,z:.3*.6+3*.3},b);
    expect(p.x).toBeCloseTo(.6,10);expect(p.z).toBeCloseTo(.3,10);
    expect(colvis3TerrainDualBasisT7l({x:1,y:0,z:0},{x:2,y:0,z:0})).toBeNull();
  });
});
