/** GENESIS 38.2r1a — superficies labiales adheridas al campo facial y no piezas volumétricas flotantes. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import type { Vida38CivilHumanoidOralPlan38R1A } from './vida38-civilized-humanoid-oral-shape-38-2r1a';
import { sampleVida38CivilHumanoidOralSurface38R1A } from './vida38-civilized-humanoid-oral-shape-38-2r1a';

export type Vida38CivilHumanoidOralPart38R1A = 'UPPER_LIP'|'LOWER_LIP'|'ORAL_OPENING';

function paletteColor(hex:string,factor:number):THREE.Color {
  const base = new THREE.Color(hex);
  return base.multiplyScalar(factor);
}

function surfaceBand(
  anatomy:Vida38HumanoidAnatomy,
  plan:Vida38CivilHumanoidOralPlan38R1A,
  part:Vida38CivilHumanoidOralPart38R1A,
  skin:THREE.Color,
  shadow:THREE.Color,
):THREE.Mesh | null {
  const columns=26, rows=5;
  const position:number[]=[],color:number[]=[],indices:number[]=[];
  for(let j=0;j<=rows;j++){
    const v=j/rows;
    for(let i=0;i<=columns;i++){
      const u=i/columns*2-1;
      const x=u*plan.halfWidth*.98;
      const edge = Math.pow(Math.max(0,1-u*u),.72);
      const gap=plan.cleftHalfHeight*edge;
      const curve=plan.cornerRise*u*u;
      const outerUpper=(plan.fullness*1.55)*edge;
      const outerLower=(plan.fullness*1.40)*edge;
      let localY:number;
      if(part==='UPPER_LIP')localY=gap+outerUpper*(1-v);
      else if(part==='LOWER_LIP')localY=-gap-outerLower*v;
      else localY=-gap+2*gap*v;
      const y=plan.y+curve+localY;
      const off = part==='ORAL_OPENING' ? .0055 : .0042 + .0014*Math.sin(Math.PI*v);
      const z=sampleVida38CivilHumanoidOralSurface38R1A(anatomy,plan,x,y,off);
      if(!Number.isFinite(z))return null;
      position.push(x,y,z);
      const c=part==='ORAL_OPENING'
        ? shadow.clone().lerp(skin,Math.min(.16,Math.abs(u)*.13))
        : skin.clone().lerp(shadow, part==='UPPER_LIP'? v*.23 : (1-v)*.19);
      color.push(c.r,c.g,c.b);
      if(j>0&&i>0){
        const a=j*(columns+1)+i,b=a-1,cidx=a-columns-1,d=cidx-1;
        indices.push(a,b,cidx,b,d,cidx);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();geometry.computeBoundingBox();
  const material=new THREE.MeshPhysicalMaterial({
    vertexColors:true,roughness:part==='ORAL_OPENING'?.84:.79,
    metalness:0,side:THREE.DoubleSide,depthWrite:true,
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.castShadow=false;
  mesh.renderOrder=2;
  mesh.userData['vida38CivilHumanoidOralPart38R1A']=part;
  mesh.userData['vida38CivilHumanoidOralRevision38R1A']=plan.revision;
  mesh.name='VIDA38_R1A_'+part;
  return mesh;
}

export function createVida38CivilHumanoidOralMeshes38R1A(
  anatomy:Vida38HumanoidAnatomy,
  plan:Vida38CivilHumanoidOralPlan38R1A,
  contract:Vida38SpeciesVisualContract,
):THREE.Mesh[] {
  const skin=new THREE.Color(contract.pigmentation.primaryColorHex);
  const secondary=new THREE.Color(contract.pigmentation.secondaryColorHex);
  // Tono derivado de pigmentación biológica, nunca de ropa/cultura.
  const lip=skin.clone().lerp(secondary,.12).multiplyScalar(.94);
  const opening=paletteColor(contract.pigmentation.primaryColorHex,.24);
  const out:THREE.Mesh[]=[];
  for(const part of ['UPPER_LIP','ORAL_OPENING','LOWER_LIP'] as const){
    const mesh=surfaceBand(anatomy,plan,part,part==='ORAL_OPENING'? lip:lip,opening);
    if(mesh)out.push(mesh);
  }
  return out;
}
