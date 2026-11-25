/** GENESIS 38.bis-T7k — atlas de microrrelieve tonal periódico (solo presentación).
 * El mapa es continuo en sus cuatro bordes; se aplica DIRECTAMENTE en el
 * shader del cuerpo, sin crear superficies ni nuevas características VIDA.8.
 */
const clamp=(v:number,low:number,high:number)=>Math.max(low,Math.min(high,v));
const fade=(t:number)=>t*t*(3-2*t);
function hash(x:number,y:number,seed:number):number{
  let h=(Math.imul(x,374761393)^Math.imul(y,668265263)^(seed|0))|0;
  h=Math.imul(h^(h>>>13),1274126177);
  h=Math.imul(h^(h>>>16),2246822519);
  return ((h^(h>>>15))>>>0)/4294967295;
}
function wrap(v:number,n:number){return ((v%n)+n)%n;}
/** Value noise with an exact periodic boundary for arbitrary octave periods. */
function periodicNoise(u:number,v:number,period:number,seed:number):number{
  const x=u*period,y=v*period;
  const ix=Math.floor(x),iy=Math.floor(y);
  const fx=fade(x-ix),fy=fade(y-iy);
  const a=hash(wrap(ix,period),wrap(iy,period),seed);
  const b=hash(wrap(ix+1,period),wrap(iy,period),seed);
  const c=hash(wrap(ix,period),wrap(iy+1,period),seed);
  const d=hash(wrap(ix+1,period),wrap(iy+1,period),seed);
  return ((a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy);
}
/** Craters are stamped only in their bounding squares, with toroidal wrapping. */
function stampCraters(heights:Float32Array,n:number,seed:number,moon:boolean){
  const count=moon?44:18;
  for(let i=0;i<count;i++){
    const cx=hash(i,23,seed)*n,cy=hash(i,51,seed)*n;
    const radius=n*(.006+.035*hash(i,88,seed));
    const extent=Math.ceil(radius*1.2);
    for(let dy=-extent;dy<=extent;dy++)for(let dx=-extent;dx<=extent;dx++){
      const rr=Math.hypot(dx/radius,dy/radius);
      if(rr>1.2)continue;
      const rim=Math.exp(-Math.pow((rr-1)/.16,2));
      const bowl=Math.exp(-Math.pow(rr/.68,2));
      const x=wrap(Math.round(cx+dx),n),y=wrap(Math.round(cy+dy),n);
      heights[y*n+x]+= (moon?.17:.06)*(rim*.82-bowl*.76);
    }
  }
}
/** Deterministic color-detail texture (RGBA, constant alpha 255).
 * Designed for tileable macro/detail/grain sampling at site-ground scale.
 * Typical 512² generation is linear in texels plus small crater stamps. */
export function colvis3ColonyTerrainAtlasT7k(seed:number,moon:boolean,size=512):Uint8Array{
  const n=clamp(Math.floor(size),32,512);
  const heights=new Float32Array(n*n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const u=x/n,v=y/n;
    const a=periodicNoise(u,v,5,seed),b=periodicNoise(u,v,13,seed+17);
    const c=periodicNoise(u,v,37,seed+53),d=periodicNoise(u,v,89,seed+101);
    const ridges=1-Math.abs(periodicNoise(u,v,21,seed+201)*2-1);
    heights[y*n+x]=.18+.28*a+.23*b+.17*c+.08*d+.08*ridges;
  }
  stampCraters(heights,n,seed+137,moon);
  const data=new Uint8Array(n*n*4);
  const color=moon?[168,177,187]:[158,150,135];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=y*n+x;
    const left=heights[y*n+wrap(x-1,n)]!,right=heights[y*n+wrap(x+1,n)]!;
    const top=heights[wrap(y-1,n)*n+x]!,bottom=heights[wrap(y+1,n)*n+x]!;
    // Directional micro-shading makes the grain legible even on pale ice.
    const slope=((left-right)*.64+(top-bottom)*.36)*72;
    const grain=(hash(x,y,seed+491)-.5)*6;
    const variation=(heights[i]!-.50)*158+slope+grain;
    const p=i*4;
    data[p]=Math.round(clamp(color[0]!+variation,12,250));
    data[p+1]=Math.round(clamp(color[1]!+variation,12,250));
    data[p+2]=Math.round(clamp(color[2]!+variation,12,250));
    data[p+3]=255;
  }
  return data;
}

/** Maps a real COLVIS.2 footprint into an angular scale on the source mesh.
 * Unlike the previous fixed 0.58 rad, this produces perceptible gradients
 * at the actual scale of the close-up. */
export function colvis3ColonyTerrainFootprintAngleT7k(
  footprintScene:number,bodyRadiusScene:number,
):number|null{
  if(!Number.isFinite(footprintScene)||footprintScene<=0||
     !Number.isFinite(bodyRadiusScene)||bodyRadiusScene<=0)return null;
  return clamp(footprintScene/bodyRadiusScene,1e-8,.08);
}
