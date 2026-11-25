/** GENESIS 38.bis-T7l — terreno nativo anclado al frame local COLVIS.2.
 * Nada se escala con la cámara: la misma distancia física que ocupa una
 * estructura ocupa una unidad del mapa procedural del terreno.
 * Sin nuevos meshes, sin paneles superpuestos y sin cambiar ciencia VIDA.8.
 */
import * as THREE from 'three';
import { colvis3ColonyTerrainAtlasT7k } from './colvis3-colony-terrain-atlas-t7k';
import { colvis3TerrainDualBasisT7l } from './colvis3-colony-terrain-frame-t7l';

export interface Colvis3NativeTerrainT7i {
  setZoom(zoom:number):void;
  updateFrame(camera:THREE.Camera):void;
  dispose():void;
}

const TEXTURE_SIZE_T7L=512;
// At the approved maximum zoom the camera sees tens, not thousands, of
// site footprints. This radius covers the complete local view with a fade.
const VISIBLE_FOOTPRINT_RADIUS_T7L=120;

export function attachColvis3NativeTerrainT7i(
  surface:THREE.Mesh,
  colonySite:THREE.Object3D,
  seed:number,
  moon:boolean,
  footprintScene:number,
  bodyRadiusScene:number,
):Colvis3NativeTerrainT7i|null {
  const original=surface.material;
  if(Array.isArray(original)||!(original instanceof THREE.MeshStandardMaterial)||
     !Number.isFinite(seed)||!Number.isFinite(footprintScene)||footprintScene<=0||
     !Number.isFinite(bodyRadiusScene)||bodyRadiusScene<=0)return null;

  const bytes=colvis3ColonyTerrainAtlasT7k(seed,moon,TEXTURE_SIZE_T7L);
  let brightness=0,samples=0;
  for(let i=0;i<bytes.length;i+=64){
    brightness+=bytes[i]!*.2126+bytes[i+1]!*.7152+bytes[i+2]!*.0722;
    samples++;
  }
  const meanBrightness=(samples?brightness/samples:160)/255;
  const texture=new THREE.DataTexture(bytes,TEXTURE_SIZE_T7L,TEXTURE_SIZE_T7L,THREE.RGBAFormat);
  texture.colorSpace=THREE.NoColorSpace;
  texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.magFilter=THREE.LinearFilter;
  texture.wrapS=THREE.RepeatWrapping;
  texture.wrapT=THREE.RepeatWrapping;
  texture.generateMipmaps=true;
  texture.needsUpdate=true;

  const originView=new THREE.Vector3();
  const dualXView=new THREE.Vector3();
  const dualZView=new THREE.Vector3();
  const bodyCentreView=new THREE.Vector3();
  const siteNormalView=new THREE.Vector3(0,1,0);
  const uniforms:{[key:string]:THREE.IUniform}={
    uColvisTerrainTextureT7l:{value:texture},
    uColvisTerrainOriginViewT7l:{value:originView},
    uColvisTerrainDualXViewT7l:{value:dualXView},
    uColvisTerrainDualZViewT7l:{value:dualZView},
    uColvisTerrainBodyCenterViewT7l:{value:bodyCentreView},
    uColvisTerrainNormalViewT7l:{value:siteNormalView},
    uColvisTerrainMeanT7l:{value:meanBrightness},
    uColvisTerrainStrengthT7l:{value:.82},
    uColvisTerrainExtentT7l:{value:VISIBLE_FOOTPRINT_RADIUS_T7L},
  };

  const decorated=original.clone();
  const previousCompile=original.onBeforeCompile;
  const previousKey=original.customProgramCacheKey();
  decorated.onBeforeCompile=(shader,renderer)=>{
    previousCompile.call(decorated,shader,renderer);
    if(!shader.vertexShader.includes('#include <begin_vertex>')||
       !shader.fragmentShader.includes('#include <map_fragment>')||
       !shader.vertexShader.includes('#include <common>')||
       !shader.fragmentShader.includes('#include <common>'))return;
    for(const [key,value] of Object.entries(uniforms))shader.uniforms[key]=value;
    shader.vertexShader=shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vColvisTerrainViewPositionT7l;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvColvisTerrainViewPositionT7l=(modelViewMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
      `#include <common>
       varying vec3 vColvisTerrainViewPositionT7l;
       uniform sampler2D uColvisTerrainTextureT7l;
       uniform vec3 uColvisTerrainOriginViewT7l;
       uniform vec3 uColvisTerrainDualXViewT7l;
       uniform vec3 uColvisTerrainDualZViewT7l;
       uniform vec3 uColvisTerrainBodyCenterViewT7l;
       uniform vec3 uColvisTerrainNormalViewT7l;
       uniform float uColvisTerrainMeanT7l;
       uniform float uColvisTerrainStrengthT7l;
       uniform float uColvisTerrainExtentT7l;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
      `#include <map_fragment>
       // The surface and buildings use exactly the same view-space frame.
       // Neither this projection nor its texture frequencies depend on zoom.
       vec3 colvisDeltaT7l=vColvisTerrainViewPositionT7l-uColvisTerrainOriginViewT7l;
       vec2 colvisSiteT7l=vec2(dot(colvisDeltaT7l,uColvisTerrainDualXViewT7l),
         dot(colvisDeltaT7l,uColvisTerrainDualZViewT7l));
       float colvisRadiusT7l=length(colvisSiteT7l)/uColvisTerrainExtentT7l;
       vec3 colvisBodyRayT7l=normalize(vColvisTerrainViewPositionT7l-uColvisTerrainBodyCenterViewT7l);
       if(colvisRadiusT7l<1.0 && dot(colvisBodyRayT7l,uColvisTerrainNormalViewT7l)>.15){
         vec2 colvisUvMacroT7l=colvisSiteT7l/12.0+vec2(.23,.31);
         vec2 colvisUvFineT7l=mat2(.866,-.5,.5,.866)*colvisSiteT7l/2.25+vec2(.38,.19);
         vec2 colvisUvGrainT7l=mat2(.766,.643,-.643,.766)*colvisSiteT7l/.42+vec2(.12,.71);
         vec3 colvisMacroT7l=texture2D(uColvisTerrainTextureT7l,colvisUvMacroT7l).rgb;
         vec3 colvisFineT7l=texture2D(uColvisTerrainTextureT7l,colvisUvFineT7l).rgb;
         vec3 colvisGrainT7l=texture2D(uColvisTerrainTextureT7l,colvisUvGrainT7l).rgb;
         vec3 colvisLumaWeightsT7l=vec3(.2126,.7152,.0722);
         float colvisVariationT7l=(dot(colvisMacroT7l,colvisLumaWeightsT7l)-uColvisTerrainMeanT7l)*2.1+
           (dot(colvisFineT7l,colvisLumaWeightsT7l)-uColvisTerrainMeanT7l)*1.65+
           (dot(colvisGrainT7l,colvisLumaWeightsT7l)-uColvisTerrainMeanT7l)*.68;
         float colvisFadeT7l=1.0-smoothstep(.78,1.0,colvisRadiusT7l);
         diffuseColor.rgb*=clamp(1.0+colvisVariationT7l*uColvisTerrainStrengthT7l*colvisFadeT7l,.56,1.48);
       }`);
  };
  decorated.customProgramCacheKey=()=>`${previousKey}|COLVIS-T7l-VIEW-FRAME-LOCKED-v1`;
  surface.material=decorated;
  decorated.needsUpdate=true;

  const worldOrigin=new THREE.Vector3(),worldX=new THREE.Vector3(),worldZ=new THREE.Vector3();
  const viewX=new THREE.Vector3(),viewZ=new THREE.Vector3();
  const siteUp=new THREE.Vector3(),siteQuat=new THREE.Quaternion();
  let disposed=false,currentZoom=1;
  const context:Colvis3NativeTerrainT7i={
    setZoom:(zoom:number)=>{
      if(disposed)return;
      // Only the tonal amplitude changes subtly. One UV footprint remains
      // exactly one site footprint at every camera distance/angle.
      if(!Number.isFinite(zoom))return;
      currentZoom=Math.max(.32,Math.min(8,zoom));
      uniforms['uColvisTerrainStrengthT7l']!.value=.78+.04*(1-(currentZoom-.32)/7.68);
    },
    updateFrame:(camera:THREE.Camera)=>{
      if(disposed)return;
      // Both objects share a body-spin hierarchy, but can have DIFFERENT
      // intermediate scales (minor/irregular moons). Transform both to VIEW
      // space instead of normalizing an approximate spherical direction.
      camera.updateWorldMatrix(true,false);
      surface.updateWorldMatrix(true,false);
      colonySite.updateWorldMatrix(true,false);
      colonySite.getWorldPosition(worldOrigin);
      worldX.copy(colonySite.localToWorld(new THREE.Vector3(footprintScene,0,0)));
      worldZ.copy(colonySite.localToWorld(new THREE.Vector3(0,0,footprintScene)));
      originView.copy(worldOrigin).applyMatrix4(camera.matrixWorldInverse);
      viewX.copy(worldX).applyMatrix4(camera.matrixWorldInverse).sub(originView);
      viewZ.copy(worldZ).applyMatrix4(camera.matrixWorldInverse).sub(originView);
      const dual=colvis3TerrainDualBasisT7l(viewX,viewZ);
      if(!dual){
        // Do not leave a stale frame visible after a degenerate transform.
        uniforms['uColvisTerrainStrengthT7l']!.value=0;
        return;
      }
      dualXView.set(dual.x.x,dual.x.y,dual.x.z);
      dualZView.set(dual.z.x,dual.z.y,dual.z.z);
      surface.getWorldPosition(bodyCentreView).applyMatrix4(camera.matrixWorldInverse);
      siteUp.set(0,1,0).applyQuaternion(colonySite.getWorldQuaternion(siteQuat));
      uniforms['uColvisTerrainStrengthT7l']!.value=.78+.04*(1-(currentZoom-.32)/7.68);
      siteNormalView.copy(siteUp).transformDirection(camera.matrixWorldInverse);
    },
    dispose:()=>{
      if(disposed)return;
      disposed=true;
      surface.material=original;
      decorated.dispose();
      texture.dispose();
    },
  };
  return Object.freeze(context);
}
