import * as THREE from 'three';
import { buildSystemScenePlanetNightLightsV1 } from '../system/system-scene-planet-night-lights-visciv1';
import {
  buildVida38DayUrbanPlan386a,vida38DayUrbanSphereCoordinates386a,
} from './vida38-day-urban-38-6a';
import type { Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';
import { createVida38InfrastructureSurfaceVisual386 } from './vida38-infrastructure-render-38-6';

const width=256,height=128,maskWidth=129,maskHeight=64;
const mask=new Uint8Array(maskWidth*maskHeight).fill(1);
for(let y=17;y<42;y++)for(let x=28;x<62;x++) mask[y*maskWidth+x]=0;
function atlas(tier:'PRIMITIVE'|'ADVANCED'|'VERY_ADVANCED'){
  return buildSystemScenePlanetNightLightsV1({
    landMask:mask,maskWidth,maskHeight,width,height,seedUint32:0x378ed32a,tier,
  });
}
function native(tier:'PRIMITIVE'|'ADVANCED'|'VERY_ADVANCED'):
  readonly Vida38InfrastructurePlan386[] {
  return [{
    revision:'VIDA.38.6/physical-infrastructure/v1',
    id:'recorded-native-settlement-1',
    provenance:'VIDA7_NATIVE_SETTLEMENT',bodyStorageKey:'0:1:2:3:PLANET:-',
    seedUint32:0x38d85fa4,locationStatus:'RECONSTRUCTED_NOT_OBSERVED',
    latitudeRadians:.31,longitudeRadians:1.1,form:'MODULAR_CITY',scale:'LARGE',
    tier,lineage:'HUMANOID',habitat:'SURFACE_OPEN_TERRAIN',purpose:'HABITATION',habitatTechnology:null,
  }];
}
function texture(source:ReturnType<typeof atlas>):THREE.DataTexture {
  const t=new THREE.DataTexture(new Uint8Array(source.rgba),source.width,source.height,
    THREE.RGBAFormat,THREE.UnsignedByteType);
  t.flipY=true;
  return t;
}
/** DataTexture.image.data is nullable in Three.js typings. Fail explicitly if
 * the RGBA byte atlas changes type instead of hiding a pixel regression. */
function snapshotNightAtlasBytes386a(atlasTexture: THREE.DataTexture): Uint8Array {
  const data = atlasTexture.image.data;
  if (!(data instanceof Uint8Array)) {
    throw new Error('38.6a: se esperaba un atlas nocturno RGBA Uint8Array');
  }
  return data.slice();
}

function bright(source:ReturnType<typeof atlas>,x:number,y:number):number {
  const i=(y*source.width+x)*4;
  return source.rgba[i]!+source.rgba[i+1]!+source.rgba[i+2]!;
}

describe('38.6a · luz nocturna y construcción diurna sobre la misma geografía',()=>{
  it('ancla ciudades diurnas exactamente a zonas luminosas del mapa original',()=>{
    const original=atlas('ADVANCED');
    const before=new Uint8Array(original.rgba);
    const day=buildVida38DayUrbanPlan386a(native('ADVANCED'),original);
    expect(day).not.toBeNull();
    expect(day!.clusters.length).toBeGreaterThan(18);
    expect(day!.clusters.length).toBeLessThanOrEqual(74);
    expect(day!.clusters.some(c=>c.kind==='SECONDARY')).toBe(true);
    expect(day!.clusters.some(c=>c.kind==='LOCAL')).toBe(true);
    for(const c of day!.clusters){
      expect(bright(original,c.sourcePixelX,c.sourcePixelY)).toBe(c.brightness);
      expect(c.brightness).toBeGreaterThanOrEqual(112);
      const mx=Math.floor(c.sourcePixelX*(maskWidth-1)/(original.width-1));
      const my=Math.floor(c.sourcePixelY*maskHeight/original.height);
      expect(mask[my*maskWidth+mx]).toBe(1);
      const uv=(Math.PI-c.longitudeRadians)/(2*Math.PI);
      const v=.5+c.latitudeRadians/Math.PI;
      expect(uv).toBeCloseTo(c.sourcePixelX/(width-1),10);
      expect(v).toBeCloseTo(1-c.sourcePixelY/(height-1),10);
    }
    expect(original.rgba).toEqual(before); // nocturnal appearance frozen
  });
  it('VERY_ADVANCED genera más núcleos que ADVANCED sobre sus propias luces',()=>{
    const a=buildVida38DayUrbanPlan386a(native('ADVANCED'),atlas('ADVANCED'))!;
    const v=buildVida38DayUrbanPlan386a(native('VERY_ADVANCED'),atlas('VERY_ADVANCED'))!;
    expect(v.clusters.length).toBeGreaterThan(a.clusters.length);
    expect(v.clusters.length).toBeLessThanOrEqual(126);
    expect(v.clusters.filter(c=>c.kind==='CORE').length)
      .toBeGreaterThan(a.clusters.filter(c=>c.kind==='CORE').length);
    expect(v.links.length).toBeLessThanOrEqual(18);
  });
  it('no genera la capa en PRIMITIVE, colonias, lunas ni planetas sin atlas',()=>{
    const night=atlas('ADVANCED');
    expect(buildVida38DayUrbanPlan386a(native('PRIMITIVE'),night)).toBeNull();
    expect(buildVida38DayUrbanPlan386a([],night)).toBeNull();
    const colony={...native('ADVANCED')[0]!,provenance:'VIDA8_COLONIAL_SETTLEMENT' as const};
    expect(buildVida38DayUrbanPlan386a([colony],night)).toBeNull();
    const moon={...native('ADVANCED')[0]!,bodyStorageKey:'0:1:2:3:MOON:0'};
    expect(buildVida38DayUrbanPlan386a([moon],night)).toBeNull();
    expect(buildVida38DayUrbanPlan386a(native('ADVANCED'),null)).toBeNull();
    expect(buildVida38DayUrbanPlan386a(native('ADVANCED'),{
      width:256,height:128,rgba:new Uint8Array(20),
    })).toBeNull();
  });
  it('es determinista tras serializar el plan VIDA; no depende del zoom',()=>{
    const night=atlas('VERY_ADVANCED');
    const a=buildVida38DayUrbanPlan386a(native('VERY_ADVANCED'),night);
    const b=buildVida38DayUrbanPlan386a(JSON.parse(JSON.stringify(native('VERY_ADVANCED'))),night);
    expect(b).toEqual(a);
    expect(vida38DayUrbanSphereCoordinates386a(0,0,256,128).latitudeRadians)
      .toBeCloseTo(Math.PI/2,12);
  });
  it('construye cientos de edificios diurnos con pocas mallas GPU y LOD intacto',()=>{
    const night=atlas('VERY_ADVANCED');
    const atlasTexture=texture(night);
    const copy=snapshotNightAtlasBytes386a(atlasTexture);
    const visual=createVida38InfrastructureSurfaceVisual386(native('VERY_ADVANCED'),1,atlasTexture);
    expect(visual.siteCount).toBe(1); // los asentamientos VIDA.7 originales se mantienen
    expect(visual.dayClusterCount).toBeGreaterThan(25);
    const [medium,high]=visual.group.children;
    visual.updateProjectedDiameterPixels(150);
    expect(medium?.visible).toBe(false);
    expect(high?.visible).toBe(false);
    visual.updateProjectedDiameterPixels(300);
    expect(medium?.visible).toBe(true);
    expect(high?.visible).toBe(false);
    visual.updateProjectedDiameterPixels(700);
    expect(high?.visible).toBe(true);
    const urbanHigh=high?.children[high.children.length-1]!;
    const meshes:THREE.InstancedMesh[]=[];
    urbanHigh.traverse(o=>{if(o instanceof THREE.InstancedMesh)meshes.push(o);});
    expect(meshes.length).toBeLessThanOrEqual(3);
    expect(meshes.reduce((sum,m)=>sum+m.count,0)).toBeGreaterThan(80);
    const matrix=new THREE.Matrix4();
    meshes[0]!.getMatrixAt(0,matrix);
    expect(matrix.elements.every(Number.isFinite)).toBe(true);
    const p=new THREE.Vector3().setFromMatrixPosition(matrix);
    expect(p.length()).toBeGreaterThan(1); // elevated above the spherical surface
    expect(snapshotNightAtlasBytes386a(atlasTexture)).toEqual(copy);
    visual.resources.forEach(r=>r.dispose());
    atlasTexture.dispose();
  });
  it('un planeta primitivo no obtiene edificios diurnos aunque tenga su luz nocturna',()=>{
    const light=texture(atlas('PRIMITIVE'));
    const visual=createVida38InfrastructureSurfaceVisual386(native('PRIMITIVE'),1,light);
    expect(visual.siteCount).toBe(1);
    expect(visual.dayClusterCount).toBe(0);
    visual.resources.forEach(r=>r.dispose());
    light.dispose();
  });
});
