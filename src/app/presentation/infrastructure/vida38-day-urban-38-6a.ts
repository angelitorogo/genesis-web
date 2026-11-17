/** 38.6a · Daytime reconstruction from the *existing* VISCIV.1c night-light raster.
 * This module never generates or changes emissive pixels. Coordinates are graphical
 * reconstructions of confirmed native VIDA.7 civilization, not observed locations.
 */
import type { Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';

export const VIDA38_DAY_URBAN_REVISION_386A = 'VIDA.38.6a/day-night-geography/v1' as const;

export interface Vida38DayUrbanRaster386a {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8Array;
}
export interface Vida38DayUrbanCluster386a {
  readonly id: string;
  readonly kind: 'CORE' | 'SECONDARY' | 'LOCAL';
  readonly latitudeRadians: number;
  readonly longitudeRadians: number;
  /** Exact luminous source pixel. Not an observed location or population. */
  readonly sourcePixelX: number;
  readonly sourcePixelY: number;
  readonly brightness: number;
  readonly seedUint32: number;
}
export interface Vida38DayUrbanLink386a {
  readonly from: number;
  readonly to: number;
}
export interface Vida38DayUrbanPlan386a {
  readonly revision: typeof VIDA38_DAY_URBAN_REVISION_386A;
  readonly tier: 'ADVANCED' | 'VERY_ADVANCED';
  readonly bodyStorageKey: string;
  readonly clusters: readonly Vida38DayUrbanCluster386a[];
  readonly links: readonly Vida38DayUrbanLink386a[];
}
function hash32(s: string): number {
  let h = 2166136261;
  for (let i=0;i<s.length;i++) h = Math.imul(h ^ s.charCodeAt(i),16777619) >>> 0;
  return h;
}
function luminance(rgba: Uint8Array, width: number, x: number, y: number): number {
  const p=(y*width+x)*4;
  return (rgba[p]??0)+(rgba[p+1]??0)+(rgba[p+2]??0);
}
/** Inverse of THREE.SphereGeometry UV with the VISCIV DataTexture flipY=true.
 * THREE sphere: x=-cos(phi)sin(theta), z=sin(phi)sin(theta), uv.x=phi/(2*pi).
 * Atlas row zero is the north pole after texture upload.
 */
export function vida38DayUrbanSphereCoordinates386a(
  x: number,y: number,width: number,height: number,
): Readonly<{latitudeRadians:number;longitudeRadians:number}> {
  return Object.freeze({
    latitudeRadians: Math.PI*(0.5-y/(height-1)),
    longitudeRadians: Math.PI-2*Math.PI*x/(width-1),
  });
}

/** Produce one bounded, geographically aligned day layer. The caller must supply
 * the already authorized VIDA.9 -> VIDA.7 infrastructure plans and the exact
 * canonical night atlas used to render this same body. No new light positions.
 */
export function buildVida38DayUrbanPlan386a(
  plans: readonly Vida38InfrastructurePlan386[],
  atlas: Vida38DayUrbanRaster386a | null | undefined,
): Vida38DayUrbanPlan386a | null {
  if (!atlas || !Number.isInteger(atlas.width) || !Number.isInteger(atlas.height) ||
      atlas.width<64 || atlas.height<32 || atlas.width!==atlas.height*2 ||
      !(atlas.rgba instanceof Uint8Array) || atlas.rgba.length!==atlas.width*atlas.height*4) return null;
  const native=plans.filter(p=>p?.revision==='VIDA.38.6/physical-infrastructure/v1' &&
    p.provenance==='VIDA7_NATIVE_SETTLEMENT' && p.locationStatus==='RECONSTRUCTED_NOT_OBSERVED' &&
    p.bodyStorageKey.endsWith(':PLANET:-') && (p.tier==='ADVANCED'||p.tier==='VERY_ADVANCED'));
  if (!native.length) return null;
  const tier=native[0]!.tier as 'ADVANCED'|'VERY_ADVANCED';
  const bodyStorageKey=native[0]!.bodyStorageKey;
  if (native.some(p=>p.tier!==tier || p.bodyStorageKey!==bodyStorageKey)) return null;
  // The canonical VISCIV atlas is 1024x512; pixels contain both city cores and
  // smaller satellites. Select strong local hotspots without adding a 2nd RNG.
  const {width,height,rgba}=atlas;
  const tile=tier==='ADVANCED'?9:7;
  const candidates: {x:number;y:number;light:number}[]=[];
  for(let y0=1;y0<height-1;y0+=tile){
    for(let x0=1;x0<width-2;x0+=tile){
      let best=0,bx=-1,by=-1;
      for(let y=y0;y<Math.min(height-1,y0+tile);y++){
        for(let x=x0;x<Math.min(width-1,x0+tile);x++){
          const l=luminance(rgba,width,x,y);
          if(l>best){best=l;bx=x;by=y;}
        }
      }
      if(best>=112) candidates.push({x:bx,y:by,light:best});
    }
  }
  candidates.sort((a,b)=>b.light-a.light || a.y-b.y || a.x-b.x);
  const goal=tier==='ADVANCED'?74:126;
  const minSeparation=tier==='ADVANCED'?7.5:5.5;
  const selected: typeof candidates=[];
  for(const c of candidates){
    if(selected.length>=goal)break;
    // Treat x=0 and x=width-1 as the same meridian, without imposing a
    // fictitious settlement grid on the atlas or the scientific planet.
    const crowd=selected.some(other=>{
      const dx=Math.min(Math.abs(other.x-c.x),width-1-Math.abs(other.x-c.x));
      const dy=Math.abs(other.y-c.y);
      const correction=Math.cos((c.y+other.y)*0.5/(height-1)*Math.PI-Math.PI*0.5);
      return (dx*correction)**2+dy**2 < minSeparation**2;
    });
    if(!crowd)selected.push(c);
  }
  const clusters=selected.map((c,index):Vida38DayUrbanCluster386a=>{
    const kind=index < (tier==='ADVANCED'?6:14)?'CORE':
      index < (tier==='ADVANCED'?29:55)?'SECONDARY':'LOCAL';
    const id=`${VIDA38_DAY_URBAN_REVISION_386A}|${native[0]!.id}|${c.x}|${c.y}`;
    return Object.freeze({id,kind,...vida38DayUrbanSphereCoordinates386a(c.x,c.y,width,height),
      sourcePixelX:c.x,sourcePixelY:c.y,brightness:c.light,seedUint32:hash32(id)});
  });
  const links: Vida38DayUrbanLink386a[]=[];
  if(tier==='VERY_ADVANCED'){
    // A corridor is suggested only where the existing light raster already
    // contains a luminous path. Never create a road over a dark ocean.
    for(let i=0;i<Math.min(clusters.length,90) && links.length<18;i++){
      const a=clusters[i]!;
      let best:{j:number;distance:number}|null=null;
      for(let j=0;j<Math.min(clusters.length,90);j++){
        if(i===j)continue;
        const b=clusters[j]!;
        const dx=b.sourcePixelX-a.sourcePixelX;
        const dy=b.sourcePixelY-a.sourcePixelY;
        const dist=Math.hypot(dx,dy);
        if(dist<11 || dist>70 || (best!==null && dist>=best.distance))continue;
        let lit=0;
        const steps=Math.ceil(dist);
        for(let s=1;s<steps;s++){
          const x=Math.round(a.sourcePixelX+dx*s/steps);
          const y=Math.round(a.sourcePixelY+dy*s/steps);
          if(luminance(rgba,width,x,y)>10)lit++;
        }
        if(lit/Math.max(1,steps-1)>0.65)best={j,distance:dist};
      }
      if(best && !links.some(l=>(l.from===best!.j && l.to===i)||(l.from===i && l.to===best!.j))){
        links.push(Object.freeze({from:i,to:best.j}));
      }
    }
  }
  return Object.freeze({revision:VIDA38_DAY_URBAN_REVISION_386A,tier,bodyStorageKey,
    clusters:Object.freeze(clusters),links:Object.freeze(links)});
}
