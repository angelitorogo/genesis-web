/** GENESIS 38.bis-T7l — dual basis of the COLVIS.2 site in VIEW space.
 * A terrain texel and a building use the same local-world displacement.
 * The camera changes the VIEW vectors; it must never change the UV scale.
 */
export interface Colvis3Vector3T7l {readonly x:number;readonly y:number;readonly z:number}
export interface Colvis3TerrainDualBasisT7l {
  readonly x:Colvis3Vector3T7l;
  readonly z:Colvis3Vector3T7l;
  readonly determinant:number;
}
const dot=(a:Colvis3Vector3T7l,b:Colvis3Vector3T7l)=>a.x*b.x+a.y*b.y+a.z*b.z;

/** Works for uniformly scaled moons, nonuniform host scales and rotated sites.
 * Returns null for collapsed or almost parallel axes instead of NaN UVs. */
export function colvis3TerrainDualBasisT7l(
  axisX:Colvis3Vector3T7l,axisZ:Colvis3Vector3T7l,
):Colvis3TerrainDualBasisT7l|null{
  const xx=dot(axisX,axisX),zz=dot(axisZ,axisZ),xz=dot(axisX,axisZ);
  const determinant=xx*zz-xz*xz;
  if(!Number.isFinite(determinant)||xx<=0||zz<=0||
     determinant<=xx*zz*1e-10)return null;
  const dualX={x:(axisX.x*zz-axisZ.x*xz)/determinant,
    y:(axisX.y*zz-axisZ.y*xz)/determinant,
    z:(axisX.z*zz-axisZ.z*xz)/determinant};
  const dualZ={x:(axisZ.x*xx-axisX.x*xz)/determinant,
    y:(axisZ.y*xx-axisX.y*xz)/determinant,
    z:(axisZ.z*xx-axisX.z*xz)/determinant};
  if(![...Object.values(dualX),...Object.values(dualZ)].every(Number.isFinite))return null;
  return Object.freeze({x:Object.freeze(dualX),z:Object.freeze(dualZ),determinant});
}

/** Samples the same fixed terrain point under any rigid camera transform. */
export function colvis3TerrainCoordinatesT7l(
  delta:Colvis3Vector3T7l,basis:Colvis3TerrainDualBasisT7l,
):Readonly<{x:number;z:number}>{
  return Object.freeze({x:dot(delta,basis.x),z:dot(delta,basis.z)});
}
