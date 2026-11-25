/** GENESIS 38.bis-T7h — terreno colonial de dos escalas.
 * Generación lineal: el terreno NO hace muestreo costoso de cráteres por texel.
 * Casquetes curvos ópticos solo en el modal; no cambian datos físicos de VIDA.8/9.
 */
import * as THREE from 'three';

export interface Colvis3ColonyContextSurfaceT7e {
  /** Terreno amplio (para continuidad de la superficie anfitriona). */
  readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  /** Microdetalle de primer plano, difuminado sobre la superficie amplia. */
  readonly detailMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  readonly material: THREE.MeshStandardMaterial;
  readonly detailRadiusScene: number;
  setZoom(zoom: number): void;
  dispose(): void;
}

const clamp01=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(a:number,b:number,x:number)=>{
  const t=clamp01((x-a)/(b-a));return t*t*(3-2*t);
};
function hash(x:number,y:number,seed:number):number{
  let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+(seed|0))|0;
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967295;
}
function noise(x:number,y:number,seed:number):number{
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const a=hash(ix,iy,seed),b=hash(ix+1,iy,seed);
  const c=hash(ix,iy+1,seed),d=hash(ix+1,iy+1,seed);
  return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;
}

/** Estampación acotada: procesa solo los píxeles de cada cráter, no TODOS los
 * cráteres por píxel. El coste es ~O(n²) y no O(n² × nº de cráteres). */
function stampCraters(height:Float32Array,n:number,seed:number,count:number,moon:boolean):void{
  for(let i=0;i<count;i++){
    const cx=(.04+.92*hash(i,23,seed))*n;
    const cy=(.04+.92*hash(i,51,seed))*n;
    const r=(.008+.041*hash(i,88,seed))*n;
    const reach=r*1.2;
    const startX=Math.max(0,Math.floor(cx-reach)),endX=Math.min(n-1,Math.ceil(cx+reach));
    const startY=Math.max(0,Math.floor(cy-reach)),endY=Math.min(n-1,Math.ceil(cy+reach));
    const strength=moon?.075:.025;
    for(let y=startY;y<=endY;y++)for(let x=startX;x<=endX;x++){
      const dx=(x+.5-cx)/r,dy=(y+.5-cy)/r;
      const d2=dx*dx+dy*dy;
      if(d2>1.44)continue;
      const d=Math.sqrt(d2);
      const rim=Math.max(0,1-Math.abs(d-1)/.23);
      const bowl=Math.max(0,1-d2);
      height[y*n+x]+=strength*(rim*rim*.8-bowl*bowl*.75);
    }
  }
}

/** Se mantiene la API T7e/T7g para pruebas y compatibilidad. */
export function colvis3SurfaceDetailPixelsT7e(
  seed:number,moon:boolean,size=512,nearField=false,
):Uint8Array{
  const n=Math.max(32,Math.min(1024,Math.floor(size)));
  const heights=new Float32Array(n*n);
  const fine=nearField?1.9:1;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const u=(x+.5)/n,v=(y+.5)/n;
    const a=noise(u*8*fine,v*8*fine,seed);
    const b=noise(u*31*fine,v*31*fine,seed+11);
    const c=noise(u*91*fine,v*91*fine,seed+31);
    const d=noise(u*217*fine,v*217*fine,seed+73);
    const ridges=1-Math.abs(noise(u*48*fine,v*48*fine,seed+127)*2-1);
    heights[y*n+x]=.12+.28*a+.25*b+.16*c+.09*d+.10*ridges;
  }
  stampCraters(heights,n,seed+101,moon?(nearField?36:56):(nearField?12:18),moon);
  const pixels=new Uint8Array(n*n*4);
  // Paletas sobrias: la geografía y el material original siguen visibles
  // bajo la capa. No se superpone una lámina gris opaca.
  const base=moon?[155,172,184]:[151,142,127];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const i=y*n+x,h=heights[i]!;
    const left=heights[y*n+Math.max(0,x-1)]!;
    const right=heights[y*n+Math.min(n-1,x+1)]!;
    const up=heights[Math.max(0,y-1)*n+x]!;
    const down=heights[Math.min(n-1,y+1)*n+x]!;
    const oblique=((left-right)*.85+(up-down)*.55)*140;
    const grit=(hash(x,y,seed+873)-.5)*(nearField?18:7);
    const variation=(h-.5)*(nearField?155:130)+oblique+grit;
    const radial=Math.hypot((x+.5)/n*2-1,(y+.5)/n*2-1);
    const edge=1-smooth(nearField?.70:.83,.985,radial);
    const p=i*4;
    pixels[p]=Math.max(0,Math.min(255,Math.round(base[0]!+variation)));
    pixels[p+1]=Math.max(0,Math.min(255,Math.round(base[1]!+variation)));
    pixels[p+2]=Math.max(0,Math.min(255,Math.round(base[2]!+variation)));
    // Alpha radial real: fuera de la malla, ninguna 'niebla' visible.
    pixels[p+3]=Math.round(edge*255);
  }
  return pixels;
}

function createPatch(
  radius:number,bodyRadiusScene:number,groundRadiusScene:number,
  footprintScene:number,seed:number,moon:boolean,
  resolution:number,segments:number,nearField:boolean,
):{mesh:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;dispose():void}{
  const geometry=new THREE.PlaneGeometry(radius*2,radius*2,segments,segments);
  geometry.rotateX(-Math.PI/2);
  const position=geometry.getAttribute('position') as THREE.BufferAttribute;
  // No se permite que una superficie de apoyo emerja encima de los edificios.
  // El relieve es <3% de la huella local (antes podía llegar a 0,62% del
  // radio planetario: cientos de veces la altura de la colonia).
  const lift=Math.max(footprintScene*.0003,bodyRadiusScene*2e-7);
  const amplitude=Math.min(footprintScene*.025,bodyRadiusScene*.000012);
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),z=position.getZ(i);
    const u=(x/radius+1)*.5,v=(z/radius+1)*.5;
    const distance=Math.hypot(x,z);
    const safe=smooth(footprintScene*1.8,footprintScene*5,distance);
    const fade=1-smooth(radius*.83,radius*.985,distance);
    const elevation=(noise(u*17,v*17,seed+5)-.5)*amplitude*safe*fade;
    const sphere=Math.sqrt(Math.max(0,groundRadiusScene*groundRadiusScene-x*x-z*z))-
      groundRadiusScene;
    position.setY(i,sphere+lift+elevation);
  }
  position.needsUpdate=true;
  geometry.computeVertexNormals();
  const bytes=colvis3SurfaceDetailPixelsT7e(seed,moon,resolution,nearField);
  const tex=new THREE.DataTexture(bytes,resolution,resolution,THREE.RGBAFormat);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.minFilter=THREE.LinearMipmapLinearFilter;
  tex.magFilter=THREE.LinearFilter;
  tex.generateMipmaps=true;
  tex.needsUpdate=true;
  const mat=new THREE.MeshStandardMaterial({
    map:tex,bumpMap:tex,
    bumpScale:Math.min(footprintScene*(nearField?.035:.016),bodyRadiusScene*.00001),
    roughness:.93,metalness:0,transparent:true,
    opacity:nearField?.68:.42,
    alphaTest:.015,depthTest:true,depthWrite:false,
    side:THREE.FrontSide,
    polygonOffset:true,polygonOffsetFactor:-1,
  });
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.name=nearField?'T7h colony terrain fine LOD (modal only)':'T7h colony terrain broad LOD (modal only)';
  mesh.frustumCulled=false;
  mesh.renderOrder=0;
  return {mesh,dispose:()=>{geometry.dispose();mat.dispose();tex.dispose();}};
}

export function createColvis3ColonyContextSurfaceT7e(
  footprintScene:number,bodyRadiusScene:number,groundRadiusScene:number,
  seed:number,moon:boolean,
):Colvis3ColonyContextSurfaceT7e|null{
  if(!Number.isFinite(footprintScene)||footprintScene<=0||
     !Number.isFinite(bodyRadiusScene)||bodyRadiusScene<=0||
     !Number.isFinite(groundRadiusScene)||groundRadiusScene<=0)return null;
  const outerRadius=Math.min(bodyRadiusScene*.24,footprintScene*88);
  const nearRadius=Math.min(outerRadius*.55,footprintScene*13);
  const outer=createPatch(outerRadius,bodyRadiusScene,groundRadiusScene,footprintScene,
    seed,moon,512,72,false);
  const near=createPatch(nearRadius,bodyRadiusScene,groundRadiusScene,footprintScene,
    seed+23419,moon,768,96,true);
  const material=outer.mesh.material;
  return Object.freeze({
    mesh:outer.mesh,detailMesh:near.mesh,material,detailRadiusScene:nearRadius,
    setZoom:(zoom:number)=>{
      const z=Math.max(.32,Math.min(8,zoom));
      const fade=smooth(2.8,6.8,z);
      outer.mesh.material.opacity=.42+.06*fade;
      near.mesh.material.opacity=.68*(1-fade);
      // No shader recompilation/reupload when scrolling or rotating.
    },
    dispose:()=>{outer.dispose();near.dispose();},
  });
}
