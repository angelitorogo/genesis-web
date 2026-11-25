/** GENESIS 38.bis-T7o — contacto visual con el terreno real en inspección.
 * Los materiales de relieve/bump NO son colisiones. Las bases COLVIS.2 se
 * proyectan solo temporalmente sobre la geometría visible del cuerpo y se
 * restituyen exactamente al salir. No modifica VIDA.8/9 ni SystemScene.
 */
import * as THREE from 'three';

export interface Colvis3ColonyGroundContactT7o {
  readonly tested: number;
  readonly grounded: number;
  dispose():void;
}

/** Contrato heredado T7o: retenido para auditorías y compatibilidad. */
export function colvis3GroundingCorrectionT7o(
  baseHeight:number, groundHeight:number, footprint:number,
):number|null {
  if(![baseHeight,groundHeight,footprint].every(Number.isFinite)||footprint<=0)return null;
  const delta=groundHeight-baseHeight;
  if(Math.abs(delta)>footprint*.65)return null;
  return Math.abs(delta)>footprint*1e-6?delta:0;
}

/** T7p: los elementos elevados se apoyan desde una cota de soporte, NO
 * directamente desde sus pies: preservamos el lift intencionado a la vez que
 * corregimos la separación de TODA la arquitectura con respecto al suelo.
 * La tolerancia sigue acotada por la huella y por el radio del cuerpo.
 */
export function colvis3SupportCorrectionT7p(
  supportHeight:number, groundHeight:number,
  footprintWorld:number,bodyRadiusWorld:number,
):number|null {
  if(![supportHeight,groundHeight,footprintWorld,bodyRadiusWorld].every(Number.isFinite)
    ||footprintWorld<=0||bodyRadiusWorld<=0)return null;
  const delta=groundHeight-supportHeight;
  const safeMax=Math.min(bodyRadiusWorld*.04,footprintWorld*6);
  if(Math.abs(delta)>safeMax)return null;
  return Math.abs(delta)>footprintWorld*1e-7?delta:0;
}

/** GENESIS 38.bis-T7q — distancia de separación visual del contacto.
 * El apoyo exacto (delta = 0) deja bases coplanares al terreno. Los errores de
 * rasterización con perspectiva y precisiones grandes pueden hacer que caras
 * completas desaparezcan al orbitar la cámara (z-fighting / oclusión del suelo).
 * El margen es relativo a la huella, no a la altura del planeta, y permanece
 * entre 0.25 % y 1 % de la huella. No genera otro suelo ni mueve el sitio.
 */
export function colvis3ContactClearanceT7q(
  footprintWorld:number,bodyRadiusWorld:number,
):number|null {
  if(!Number.isFinite(footprintWorld)||!Number.isFinite(bodyRadiusWorld)||
     footprintWorld<=0||bodyRadiusWorld<=0)return null;
  return Math.min(footprintWorld*.01,
    Math.max(footprintWorld*.0025,bodyRadiusWorld*.00000075));
}

/** Apoya cada módulo respecto al MISMO suelo 3D que se está mostrando.
 * En T7o solo se ajustaban los módulos con part.lift === 0: las cápsulas
 * superiores quedaban suspendidas al mover las bases que las soportaban.
 * T7p aplica a todas las piezas la corrección de su soporte, conservando el
 * lift en unidades de escena ya previsto por COLVIS.2.
 * No mueve el grupo de la luna, no duplica LOD ni añade geometría.
 */
export function attachColvis3ColonyGroundContactT7o(
  surface:THREE.Mesh, colony:THREE.Group,
  footprintScene:number,
):Colvis3ColonyGroundContactT7o {
  if(!Number.isFinite(footprintScene)||footprintScene<=0)
    return Object.freeze({tested:0,grounded:0,dispose:()=>{}});
  // No desplazar el pivote si este LOD no contiene piezas verificadas que
  // puedan apoyarse: eso evita alterar incluso una escena vacía del modal.
  let hasSupportedParts=false;
  colony.traverse(object=>{
    if(!(object instanceof THREE.InstancedMesh))return;
    const lifts=object.userData['colvis2SupportLiftSceneT7p'];
    const flags=object.userData['colvis2GroundEligibleT7o'];
    if(Array.isArray(lifts)&&lifts.length===object.count ||
       Array.isArray(flags)&&flags.length===object.count)hasSupportedParts=true;
  });
  if(!hasSupportedParts)
    return Object.freeze({tested:0,grounded:0,dispose:()=>{}});
  surface.updateWorldMatrix(true,false);
  colony.updateWorldMatrix(true,true);
  const up=new THREE.Vector3(0,1,0).transformDirection(colony.matrixWorld).normalize();
  const surfaceScale=surface.getWorldScale(new THREE.Vector3());
  if(!surface.geometry.boundingSphere)surface.geometry.computeBoundingSphere();
  const radius=(surface.geometry.boundingSphere?.radius??1)*
    Math.max(Math.abs(surfaceScale.x),Math.abs(surfaceScale.y),Math.abs(surfaceScale.z));
  if(!Number.isFinite(radius)||radius<=0)
    return Object.freeze({tested:0,grounded:0,dispose:()=>{}});
  const origin=colony.getWorldPosition(new THREE.Vector3());
  const localOffset=colony.localToWorld(new THREE.Vector3(footprintScene,0,0));
  const footprintWorld=origin.distanceTo(localOffset);
  // A few world-space ULPs above the native surface avoids coplanar depth
  // fights. Never introduce an offset for unsupported/invalid geometry.
  const contactClearanceT7q=colvis3ContactClearanceT7q(footprintWorld,radius)??0;
  const rayStart=Math.max(radius*.18,footprintWorld*18);
  const raycaster=new THREE.Raycaster();
  raycaster.near=0;
  raycaster.far=rayStart*2+radius*.12;
  const original:Array<{mesh:THREE.InstancedMesh;matrices:THREE.Matrix4[]}>=[];
  const originalSitePosition=colony.position.clone();
  let siteMoved=false;
  // T7p: ANTES de ajustar instancias, hacer coincidir el ancla de la colonia
  // con la malla real. Si la luna renderizada difiere del radio de diseño,
  // todos los módulos (incluidos los elevados) conservan la misma referencia.
  const siteRaycaster=new THREE.Raycaster();
  siteRaycaster.near=0;siteRaycaster.far=rayStart*2+radius*.12;
  siteRaycaster.set(origin.clone().addScaledVector(up,rayStart),up.clone().negate());
  const siteHit=siteRaycaster.intersectObject(surface,false)[0];
  if(siteHit){
    const delta=siteHit.point.clone().sub(origin).dot(up);
    if(Number.isFinite(delta)&&Math.abs(delta)<radius*.30&&
       Math.abs(delta)>footprintWorld*1e-7&&colony.parent){
      const targetWorld=origin.clone().addScaledVector(up,delta);
      colony.parent.worldToLocal(targetWorld);
      colony.position.copy(targetWorld);
      colony.updateWorldMatrix(true,true);
      siteMoved=true;
    }
  }
  const instMatrix=new THREE.Matrix4();
  const worldBase=new THREE.Vector3(),support=new THREE.Vector3(),above=new THREE.Vector3();
  const localBase=new THREE.Vector3(),desired=new THREE.Vector3();
  const desiredLocal=new THREE.Vector3(),diffLocal=new THREE.Vector3();
  const localOriginWorld=new THREE.Vector3(),liftedWorld=new THREE.Vector3();
  let tested=0,grounded=0;
  colony.traverse(object=>{
    if(!(object instanceof THREE.InstancedMesh))return;
    const oldFlags=object.userData['colvis2GroundEligibleT7o'];
    const lifts=object.userData['colvis2SupportLiftSceneT7p'];
    const newContract=Array.isArray(lifts)&&lifts.length===object.count&&
      lifts.every((v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0);
    const legacyContract=Array.isArray(oldFlags)&&oldFlags.length===object.count;
    if(!newContract&&!legacyContract)return;
    object.updateWorldMatrix(true,false);
    if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
    const lower=object.geometry.boundingBox?.min.y??0;
    const matrices:THREE.Matrix4[]=[];
    let modified=false;
    object.localToWorld(localOriginWorld.set(0,0,0));
    for(let i=0;i<object.count;i++){
      object.getMatrixAt(i,instMatrix);
      matrices.push(instMatrix.clone());
      // No podemos recuperar el lift de los meshes antiguos de T7o:
      // mantenemos el contrato antiguo sin inventar una cota de apoyo.
      if(!newContract&&oldFlags[i]!==true)continue;
      tested++;
      localBase.set(0,lower,0).applyMatrix4(instMatrix);
      worldBase.copy(localBase);
      object.localToWorld(worldBase);
      const liftScene:number=newContract?(lifts[i] as number):0;
      // El lift está en el sistema local del sitio. Restar el vector
      // transformado correctamente también funciona con lunas escaladas,
      // transformaciones paternas y superficies elipsoidales.
      liftedWorld.set(0,liftScene,0);
      object.localToWorld(liftedWorld);
      support.copy(worldBase).sub(liftedWorld.sub(localOriginWorld));
      above.copy(support).addScaledVector(up,rayStart);
      raycaster.set(above,up.clone().negate());
      const hit=raycaster.intersectObject(surface,false)[0];
      if(!hit)continue;
      // T7q: keep the lowest vertex a fraction of a footprint above the
      // surface. Without this, T7p placed it *exactly* on the depth-tested
      // sphere; when orbiting, flat hangar pads intermittently disappear.
      // Preserve the pre-existing architectural lift above this support.
      const visibleGround=hit.point.dot(up)+contactClearanceT7q;
      const correction=newContract
        ?colvis3SupportCorrectionT7p(support.dot(up),visibleGround,footprintWorld,radius)
        :colvis3GroundingCorrectionT7o(support.dot(up),visibleGround,footprintWorld);
      if(correction===null||correction===0)continue;
      desired.copy(worldBase).addScaledVector(up,correction);
      desiredLocal.copy(desired);object.worldToLocal(desiredLocal);
      diffLocal.copy(desiredLocal).sub(localBase);
      const elements=instMatrix.elements;
      elements[12]!+=diffLocal.x;
      elements[13]!+=diffLocal.y;
      elements[14]!+=diffLocal.z;
      object.setMatrixAt(i,instMatrix);
      modified=true;grounded++;
    }
    if(modified){
      original.push({mesh:object,matrices});
      object.instanceMatrix.needsUpdate=true;
      // La esfera de visibilidad debe seguir siendo válida después de mover
      // las instancias individuales (especialmente en lunas pequeñas).
      object.computeBoundingSphere();
    }
  });
  let disposed=false;
  return Object.freeze({tested,grounded,dispose:()=>{
    if(disposed)return;disposed=true;
    for(const {mesh,matrices} of original){
      matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
      mesh.instanceMatrix.needsUpdate=true;
      mesh.computeBoundingSphere();
    }
    if(siteMoved){
      colony.position.copy(originalSitePosition);
      colony.updateWorldMatrix(true,true);
    }
  }});
}
