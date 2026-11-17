/** 38.6 · Physical, non-emissive surface reconstruction; never a light-map.
 * Shared by fiche previews and SystemScene. No edits to scientific geometry.
 */
import * as THREE from 'three';
import type { Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';
import { createVida38DayUrbanSurface386a } from './vida38-day-urban-visual-38-6a';
import { vida38ColonialComplexLayout386c, type Vida38ColonyVisualPart386c } from './vida38-colonial-complex-38-6c';
import { vida38ColonialDirectStellarExposure386c3, vida38ColonialLampOpacity386c3 } from './vida38-colonial-night-lighting-38-6c3';

/** Optional geometry for a tiny irregular moon. Never a scientific world radius.
 * Source geometry must be the SAME mesh that the corresponding moon renderer
 * displays. geometryScale accounts for preview-only scene scaling. */
export interface Vida38IrregularMoonSurface386c2 {
  readonly geometry: THREE.BufferGeometry;
  readonly geometryScale: number;
  readonly radiusEarth: number;
}

/** Relative optical readability only, not the installation's physical size.
 * On a 0.007 R_E moon the same outpost should occupy more of the projected
 * surface than on a 0.1 R_E moon. Bounded to prevent a false moon-wide city. */
export function vida38SmallMoonColonyOpticalScale386c2(radiusEarth: number): number {
  if (!Number.isFinite(radiusEarth) || radiusEarth <= 0) return 1;
  return Math.min(3.5, Math.max(1, Math.sqrt(0.07 / radiusEarth)));
}

/** A tiny irregular moon may not host native surface cities in this visual
 * path, but an authorized colonial settlement must not be thrown away. */
export function vida38MoonVisibleInfrastructurePlans386c2(
  plans: readonly Vida38InfrastructurePlan386[] | null | undefined,
  minorIrregular: boolean,
): readonly Vida38InfrastructurePlan386[] {
  if (!plans?.length) return Object.freeze([]);
  if (!minorIrregular) return plans;
  return Object.freeze(plans.filter(plan => plan.provenance === 'VIDA8_COLONIAL_SETTLEMENT'));
}

export interface Vida38InfrastructureVisual386 {
  readonly group: THREE.Group;
  readonly resources: readonly { dispose(): void }[];
  readonly siteCount: number;
  /** 38.6a: count of day-only cities aligned to the original VISCIV light atlas. */
  readonly dayClusterCount: number;
  /** Mutable view-space centre, used exclusively for colonial horizon masking. */
  readonly colonialBodyCenterView386c4: THREE.Vector3;
  updateProjectedDiameterPixels(diameter: number): void;
  /** SystemScene-only: update artificial equipment indicators with its REAL
   * multistellar light binding; never modify surface emission or star flux. */
  updateColonialNightLighting386c3(
    directionsView: readonly THREE.Vector3[], weights: THREE.Vector3,
    cameraMatrixWorldInverse: THREE.Matrix4,
  ): void;
}

const UP = new THREE.Vector3(0,1,0);
/** 38.6c1. Visual-only gain of a genuine colonial complex at distant zoom.
 * 1 at the 200px LOD boundary; capped at 3.5 to avoid orbital megastructures.
 * Since gain grows more slowly than 1/diameter, on-screen size still grows
 * when zooming in. No marker or false illumination is introduced. */
export function vida38ColonialDistantScale386c1(projectedDiameterPixels: number): number {
  if (!Number.isFinite(projectedDiameterPixels) || projectedDiameterPixels<=0) return 1;
  return Math.min(3.5,Math.max(1,Math.sqrt(200 / projectedDiameterPixels)));
}
function fraction(seed: number, index: number): number {
  let n = (seed ^ Math.imul(index + 1,0x9e3779b1)) >>> 0;
  n = Math.imul(n ^ (n >>> 16),0x7feb352d) >>> 0;
  n = Math.imul(n ^ (n >>> 15),0x846ca68b) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function material(color: string, metallic = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({color,roughness:metallic ? .58 : .92,metalness:metallic});
}

/** Instance geometry is local (Y = up); the site frame is aligned to the sphere normal. */
export function createVida38InfrastructureSurfaceVisual386(
  plans: readonly Vida38InfrastructurePlan386[], bodyRadiusScene: number,
  canonicalNightLights: THREE.DataTexture | null = null,
  irregularMoonSurface: Vida38IrregularMoonSurface386c2 | null = null,
  /** Opt-in ONLY from confirmed SystemScene, never from a private catalogue. */
  colonialNightIndicators386c3 = false,
): Vida38InfrastructureVisual386 {
  const group = new THREE.Group();
  group.name = 'VIDA.38.6 reconstructed surface infrastructure (not observed coordinates)';
  const resources: {dispose():void}[] = [];
  const medium = new THREE.Group();
  const high = new THREE.Group();
  // 38.6c1: only authorized colonial sites receive a distant geometric LOD.
  // Native buildings and 38.6a day-urbanization retain their approved LOD.
  const distantColonies = new THREE.Group();
  distantColonies.name = 'VIDA.38.6c1 distant colonial infrastructure';
  const distantColonySites: THREE.Group[] = [];
  const colonialLampBindings: Array<{site:THREE.Group;material:THREE.MeshBasicMaterial}> = [];
  /** Moon/planet centre IN VIEW SPACE, independent of each site's pivot.
   * Shared with colonial reflection shaders, refreshed after orbital motion. */
  const colonialBodyCenterView386c4 = new THREE.Vector3();
  const colonialBodyCenterWorld386c4 = new THREE.Vector3();
  const lampWorldQuaternion = new THREE.Quaternion();
  const lampNormalView = new THREE.Vector3();
  const updateColonialNightLighting386c3 = (
    directionsView: readonly THREE.Vector3[], weights: THREE.Vector3,
    cameraMatrixWorldInverse: THREE.Matrix4,
  ):void => {
    // Site geometry is instanced inside a rotated, moving body. Its own mesh
    // origin is the settlement, NOT the lunar centre; use the parent group.
    group.getWorldPosition(colonialBodyCenterWorld386c4);
    colonialBodyCenterView386c4.copy(colonialBodyCenterWorld386c4).applyMatrix4(cameraMatrixWorldInverse);
    for(const {site,material} of colonialLampBindings) {
      site.getWorldQuaternion(lampWorldQuaternion);
      lampNormalView.copy(UP).applyQuaternion(lampWorldQuaternion)
        .transformDirection(cameraMatrixWorldInverse);
      material.opacity = vida38ColonialLampOpacity386c3(
        vida38ColonialDirectStellarExposure386c3(lampNormalView,directionsView,weights));
    }
  };
  group.add(medium,high);
  const maxSites = Math.min(plans.length,20);
  const base = bodyRadiusScene * .0056;
  if (!(bodyRadiusScene > 0) || !Number.isFinite(bodyRadiusScene)) {
    return Object.freeze({group,resources:Object.freeze(resources),siteCount:0,dayClusterCount:0,colonialBodyCenterView386c4,
      updateProjectedDiameterPixels: (_diameter:number)=>{medium.visible=false;high.visible=false;},
      updateColonialNightLighting386c3});
  }
  const simpleGeometry = new THREE.CylinderGeometry(.9,1.15,.45,8);
  const roofGeometry = new THREE.ConeGeometry(.85,1.1,7);
  const boxGeometry = new THREE.BoxGeometry(1,1,1);
  const towerGeometry = new THREE.CylinderGeometry(.42,.48,1,10);
  const domeGeometry = new THREE.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI/2);
  const nodeGeometry = new THREE.CylinderGeometry(.8,.9,.33,12);
  const stone = material('#93877c');
  const copper = material('#9b825b');
  const organic = material('#6a6252');
  const basalt = material('#777b7d');
  const alloy = material('#8798a6',.42);
  const cool = material('#bcc9d6',.35);
  // 38.6c: deliberately non-emissive high-contrast engineering finishes.
  // Shared across every authorized colonial site to bound GPU allocations.
  const colonyHull = material('#637888',.45);
  const colonyDark = material('#344753',.40);
  const colonyPanel = material('#96a9af',.28);
  const colonyAccent = material('#c6a775',.36);
  const colonyDome = material('#819eae',.22);
  const colonyMastGeometry = new THREE.CylinderGeometry(.18,.21,1,8);
  const colonyPadGeometry = new THREE.CylinderGeometry(.5,.55,1,12);
  // Tiny self-luminous lamps; NO THREE.Light, shadow spill or star reflections.
  const colonyLampGeometry = colonialNightIndicators386c3
    ? new THREE.SphereGeometry(1,8,6) : null;
  resources.push(simpleGeometry,roofGeometry,boxGeometry,towerGeometry,domeGeometry,nodeGeometry,
    stone,copper,organic,basalt,alloy,cool,
    colonyHull,colonyDark,colonyPanel,colonyAccent,colonyDome,colonyMastGeometry,colonyPadGeometry);
  if(colonyLampGeometry) resources.push(colonyLampGeometry);

  // 38.6c2: sample the actual MINOR_IRREGULAR render geometry. Small moons
  // cannot use the spherical proxy: that was why 38.6 omitted them entirely.
  // Reuse a material already owned by this visual and never dispose the moon
  // geometry (its original renderer owns it). Sampling is performed once per
  // reconstructed site/part, not each animation frame.
  const validIrregularSurface = irregularMoonSurface !== null &&
    Number.isFinite(irregularMoonSurface.geometryScale) && irregularMoonSurface.geometryScale > 0 &&
    irregularMoonSurface.geometry.getAttribute('position') !== undefined;
  const sampleMesh = validIrregularSurface && irregularMoonSurface !== null
    ? new THREE.Mesh(irregularMoonSurface.geometry, colonyHull) : null;
  if (sampleMesh && irregularMoonSurface) {
    sampleMesh.scale.setScalar(irregularMoonSurface.geometryScale);
    sampleMesh.updateMatrixWorld(true);
  }
  const moonRaycaster = sampleMesh ? new THREE.Raycaster() : null;
  const rayOrigin = new THREE.Vector3(), rayDirection = new THREE.Vector3();
  function surfaceRadiusAt(direction: THREE.Vector3): number {
    if (!sampleMesh || !moonRaycaster) return bodyRadiusScene;
    rayOrigin.copy(direction).multiplyScalar(bodyRadiusScene * 2.5);
    rayDirection.copy(direction).negate();
    moonRaycaster.set(rayOrigin, rayDirection);
    moonRaycaster.near = 0;
    moonRaycaster.far = bodyRadiusScene * 2.5;
    const hit = moonRaycaster.intersectObject(sampleMesh, false)[0];
    if (!hit) return bodyRadiusScene;
    const radius = hit.point.length();
    return Number.isFinite(radius) && radius > bodyRadiusScene * .5 && radius < bodyRadiusScene * 1.5
      ? radius : bodyRadiusScene;
  }
  const colonyMoonScale = validIrregularSurface && irregularMoonSurface !== null
    ? vida38SmallMoonColonyOpticalScale386c2(irregularMoonSurface.radiusEarth) : 1;

  function mesh(container: THREE.Group, geometry: THREE.BufferGeometry,
    mat: THREE.Material, x: number,y: number,z: number,
    sx:number,sy:number,sz:number): void {
    const item = new THREE.Mesh(geometry,mat);
    item.position.set(x,y,z);item.scale.set(sx,sy,sz);
    item.castShadow = false; item.receiveShadow = true;
    container.add(item);
  }
  function instances(container: THREE.Group, geometry: THREE.BufferGeometry,
    mat: THREE.Material, positions: readonly Readonly<{x:number;z:number;height:number;width:number}>[]):void {
    if (positions.length === 0) return;
    const inst = new THREE.InstancedMesh(geometry,mat,positions.length);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    geometry.computeBoundingBox();
    const minY = geometry.boundingBox?.min.y ?? -0.5;
    positions.forEach((p,i)=>{
      position.set(p.x,-minY*p.height,p.z);
      scale.set(p.width,p.height,p.width);
      matrix.compose(position,rotation,scale);inst.setMatrixAt(i,matrix);
    });
    inst.instanceMatrix.needsUpdate=true;
    inst.frustumCulled=false; // Surface group is culled at the parent-body LOD layer.
    container.add(inst);
  }

  /** 38.6c — the original site pivot never moves: parts alone are grounded
   * independently against the sphere within its local tangent frame.
   * All complex parts are instanced by geometry+material+LOD, with no light map
   * edits or scientific changes. */
  function colonyComplex(container:THREE.Group,
    parts:readonly Vida38ColonyVisualPart386c[], visualSize:number,
    siteSurfaceRadius: number, siteNormal: THREE.Vector3, siteOrientation: THREE.Quaternion):void {
    const geometryOf=(shape:Vida38ColonyVisualPart386c['shape']):THREE.BufferGeometry=>
      shape==='BOX'?boxGeometry:shape==='DOME'?domeGeometry:
      shape==='MAST'?colonyMastGeometry:colonyPadGeometry;
    const materialOf=(finish:Vida38ColonyVisualPart386c['finish']):THREE.Material=>
      finish==='HULL'?colonyHull:finish==='DARK'?colonyDark:
      finish==='PANEL'?colonyPanel:finish==='ACCENT'?colonyAccent:colonyDome;
    const buckets=new Map<string,{geometry:THREE.BufferGeometry;mat:THREE.Material;
      matrices:THREE.Matrix4[];roles:Set<string>}>();
    const tilt=new THREE.Quaternion(),yawRotation=new THREE.Quaternion();
    const position=new THREE.Vector3(); const radialUp=new THREE.Vector3();
    const tangentPosition=new THREE.Vector3(), partDirection=new THREE.Vector3();
    const scale=new THREE.Vector3(); const transform=new THREE.Matrix4();
    const siteOffset=bodyRadiusScene*.0007;
    for(const part of parts){
      const x=part.x*visualSize,z=part.z*visualSize;
      const radial2=x*x+z*z;
      if(radial2>=bodyRadiusScene*bodyRadiusScene*.1)continue;
      // The target radius is sampled along the exact angular footprint on the
      // displaced moon mesh, rather than intersecting an imaginary sphere.
      // This matters for small irregular icy moons with a colony on a ridge.
      const surfaceRadius = sampleMesh
        ? surfaceRadiusAt(partDirection.copy(siteNormal).multiplyScalar(siteSurfaceRadius)
            .add(tangentPosition.set(x,0,z).applyQuaternion(siteOrientation)).normalize())
        : bodyRadiusScene;
      const surfaceY=Math.sqrt(Math.max(0,surfaceRadius*surfaceRadius-radial2))-siteSurfaceRadius;
      radialUp.set(x/siteSurfaceRadius,Math.sqrt(Math.max(0,1-radial2/(siteSurfaceRadius*siteSurfaceRadius))),z/siteSurfaceRadius);
      const geo=geometryOf(part.shape),mat=materialOf(part.finish);
      geo.computeBoundingBox();
      const minY=geo.boundingBox?.min.y??-.5;
      const sy=part.height*visualSize;
      position.set(x,surfaceY-siteOffset,z).addScaledVector(radialUp,
        (-minY*sy)+(part.lift*visualSize)+bodyRadiusScene*.00004);
      tilt.setFromUnitVectors(UP,radialUp);
      yawRotation.setFromAxisAngle(UP,part.yaw);
      tilt.multiply(yawRotation);
      scale.set(part.width*visualSize,sy,part.depth*visualSize);
      transform.compose(position,tilt,scale);
      const key=part.shape+'|'+part.finish;
      let bucket=buckets.get(key);
      if(!bucket){bucket={geometry:geo,mat,matrices:[],roles:new Set<string>()};buckets.set(key,bucket);}
      bucket.matrices.push(transform.clone());bucket.roles.add(part.role);
    }
    for(const [key,bucket] of buckets){
      const inst=new THREE.InstancedMesh(bucket.geometry,bucket.mat,bucket.matrices.length);
      inst.name='VIDA.38.6c colony '+key;
      bucket.matrices.forEach((matrix,i)=>inst.setMatrixAt(i,matrix));
      inst.instanceMatrix.needsUpdate=true;
      inst.frustumCulled=false;
      inst.castShadow=false;inst.receiveShadow=true;
      inst.userData={colonialVisual386c:true,elementRoles:[...bucket.roles]};
      container.add(inst);
      resources.push(inst); // Instance buffers must also be released on teardown.
    }
  }


  /** A few illuminated equipment indicators distributed across the SAME
   * deterministic complex footprint. They are local mesh geometry, never a
   * moon-wide light map or an orbital station. Ray-sampled ground contact for
   * irregular moons matches the 38.6c2 structures under them. */
  function addColonialLamps386c3(
    container: THREE.Group, parts:readonly Vida38ColonyVisualPart386c[],
    visualSize:number, siteSurfaceRadius:number, siteNormal:THREE.Vector3,
    siteOrientation:THREE.Quaternion, mat:THREE.MeshBasicMaterial, limit:number,
    distant=false,
  ):void {
    if (!colonyLampGeometry) return;
    const candidates = parts.filter(p=>
      (p.role==='MAIN_MODULE' && p.finish==='HULL') ||
      (p.role==='ACCESS' && p.finish==='DARK') ||
      (p.role==='ANTENNA' && p.finish==='HULL') ||
      (p.role==='AUXILIARY' && p.finish==='HULL') ||
      p.role==='PRESSURIZED_DOME');
    const selected=candidates.slice(0,limit);
    if(!selected.length) return;
    const inst = new THREE.InstancedMesh(colonyLampGeometry,mat,selected.length);
    inst.name='VIDA.38.6c3 artificial colony lamps (no emitted terrain light)';
    inst.userData={colonialNightIndicators386c3:true};
    const matrix=new THREE.Matrix4();
    const position=new THREE.Vector3(), tangent=new THREE.Vector3(), sampledDirection=new THREE.Vector3();
    const radialUp=new THREE.Vector3();
    const scale=new THREE.Vector3(), rotation=new THREE.Quaternion();
    const siteOffset=bodyRadiusScene*.0007;
    for(let j=0;j<selected.length;j++) {
      const part=selected[j]!;
      const x=part.x*visualSize,z=part.z*visualSize;
      const radial2=x*x+z*z;
      const sampleRadius=sampleMesh
        ? surfaceRadiusAt(sampledDirection.copy(siteNormal).multiplyScalar(siteSurfaceRadius)
          .add(tangent.set(x,0,z).applyQuaternion(siteOrientation)).normalize())
        : bodyRadiusScene;
      const surfaceY=Math.sqrt(Math.max(0,sampleRadius*sampleRadius-radial2))-siteSurfaceRadius;
      radialUp.set(x/siteSurfaceRadius,
        Math.sqrt(Math.max(0,1-radial2/(siteSurfaceRadius*siteSurfaceRadius))),z/siteSurfaceRadius);
      const height=(part.height+part.lift+.26)*visualSize;
      position.set(x,surfaceY-siteOffset,z).addScaledVector(radialUp,height);
      const dotSize=visualSize*(distant?.58:.24);
      scale.setScalar(dotSize);
      matrix.compose(position,rotation,scale);
      inst.setMatrixAt(j,matrix);
    }
    inst.instanceMatrix.needsUpdate=true;
    inst.frustumCulled=false;
    inst.renderOrder=1; // transparent lamps draw after the opaque lunar surface
    container.add(inst);
    resources.push(inst);
  }

  for (let i=0;i<maxSites;i++) {
    const plan = plans[i]!;
    if (!Number.isFinite(plan.latitudeRadians) || !Number.isFinite(plan.longitudeRadians) ||
        plan.locationStatus !== 'RECONSTRUCTED_NOT_OBSERVED') continue;
    const lat=plan.latitudeRadians,lon=plan.longitudeRadians;
    const normal=new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon));
    const siteMedium = new THREE.Group(); const siteHigh = new THREE.Group();
    const colonial = plan.provenance === 'VIDA8_COLONIAL_SETTLEMENT';
    // Latitude/longitude remain exactly those of the immutable 38.6 plan.
    // Only the radial contact height is corrected to the mesh actually shown.
    const siteSurfaceRadius = colonial ? surfaceRadiusAt(normal) : bodyRadiusScene;
    for (const site of [siteMedium,siteHigh]) {
      site.position.copy(normal).multiplyScalar(siteSurfaceRadius+bodyRadiusScene*.0007);
      site.quaternion.setFromUnitVectors(UP,normal);
      site.rotateY(fraction(plan.seedUint32,7)*Math.PI*2);
    }
    medium.add(siteMedium);high.add(siteHigh);
    const size = base * (plan.scale === 'LARGE'||plan.scale === 'NETWORK'||plan.scale === 'CITY' ? 1.3 :
      plan.scale === 'SMALL'||plan.scale === 'OUTPOST' ? .76 : 1);
    const primitive = plan.tier === 'PRIMITIVE';
    const veryAdvanced = plan.tier === 'VERY_ADVANCED';
    const mat=primitive
      ? plan.lineage==='INSECTOID'?organic:plan.lineage==='REPTILIAN'?basalt:stone
      : veryAdvanced?cool:alloy;
    // 38.6c: only authorized colonial plans get the expanded surface station.
    // The main procedural anchor is unchanged, and all new volumes remain
    // within its local region. No added colonies or scientific installations.
    if(colonial){
      const layout=vida38ColonialComplexLayout386c(plan);
      if(layout){
        siteMedium.name='VIDA.38.6c colonial complex MEDIUM';
        siteHigh.name='VIDA.38.6c colonial complex HIGH';
        const visualSize=size*layout.visualScaleMultiplier*colonyMoonScale;
        colonyComplex(siteMedium,layout.medium,visualSize,siteSurfaceRadius,normal,siteMedium.quaternion);
        colonyComplex(siteHigh,layout.high,visualSize,siteSurfaceRadius,normal,siteHigh.quaternion);
        // Reuse the exact medium-LOD geometry as a real, surface-anchored
        // distant silhouette, not an overlay sprite or another colony.
        // Matching the medium LOD at 200px prevents visual teleportation.
        const siteDistant = new THREE.Group();
        siteDistant.name = 'VIDA.38.6c1 distant colonial site';
        siteDistant.position.copy(siteMedium.position);
        siteDistant.quaternion.copy(siteMedium.quaternion);
        colonyComplex(siteDistant,layout.medium,visualSize,siteSurfaceRadius,normal,siteDistant.quaternion);
        if (colonialNightIndicators386c3 && colonyLampGeometry) {
          // One independent material per real colony; shared by its 3 LODs.
          // Opacity follows aggregate stellar illumination, including B/C stars.
          const lampMaterial = new THREE.MeshBasicMaterial({
            color:'#d1ecff',toneMapped:false,transparent:true,opacity:1,
            depthTest:true,depthWrite:false,
          });
          resources.push(lampMaterial);
          addColonialLamps386c3(siteMedium,layout.medium,visualSize,siteSurfaceRadius,normal,siteMedium.quaternion,lampMaterial,2);
          addColonialLamps386c3(siteHigh,layout.high,visualSize,siteSurfaceRadius,normal,siteHigh.quaternion,lampMaterial,5);
          addColonialLamps386c3(siteDistant,layout.medium,visualSize,siteSurfaceRadius,normal,siteDistant.quaternion,lampMaterial,1,true);
          colonialLampBindings.push({site:siteHigh,material:lampMaterial});
        }
        distantColonies.add(siteDistant);
        distantColonySites.push(siteDistant);
      }
    } else {
      // Existing 38.6 primitive/advanced/very advanced settlements are frozen.
      mesh(siteMedium,simpleGeometry,mat,0,size*.15,0,
        size*1.7,size*.65,size*1.7);
    }
    const detailCount=primitive?9:veryAdvanced?15:11;
    if (!colonial && primitive){
      const huts=[];
      for(let j=0;j<detailCount;j++){
        const a=2*Math.PI*j/detailCount;
        huts.push({x:size*Math.cos(a)*2.2,z:size*Math.sin(a)*2.2,
          width:size*(.52+.22*fraction(plan.seedUint32,j+31)),
          height:size*(.70+.2*fraction(plan.seedUint32,j+51))});
      }
      if(plan.form==='WETLAND_PLATFORM'){
        // Raised deck and visible piers; never a speculative modern roadway.
        mesh(siteHigh,boxGeometry,organic,0,size*.80,0,size*5.4,size*.25,size*5.4);
        instances(siteHigh,towerGeometry,mat,huts.map(h=>({...h,height:size*.8,width:size*.18})));
        mesh(siteHigh,roofGeometry,copper,0,size*1.1,0,size*1.25,size*1.7,size*1.25);
      } else if(plan.form==='CANOPY_NEST'){
        instances(siteHigh,towerGeometry,organic,huts.map(h=>({...h,height:size*2.1,width:size*.18})));
        mesh(siteHigh,nodeGeometry,copper,0,size*2.2,0,size*2.25,size*.26,size*2.25);
        mesh(siteHigh,roofGeometry,organic,0,size*2.45,0,size*1.9,size*.6,size*1.9);
      } else if(plan.form==='ROCK_TERRACE'){
        instances(siteHigh,boxGeometry,basalt,huts.map(h=>({...h,height:size*.48,width:h.width*1.45})));
        mesh(siteHigh,nodeGeometry,basalt,0,size*.09,0,size*2.25,size*.55,size*2.25);
        mesh(siteHigh,nodeGeometry,stone,0,size*.24,0,size*1.3,size*.36,size*1.3);
      } else if(plan.form==='COLONY_MOUND' || plan.lineage==='INSECTOID'){
        instances(siteHigh,towerGeometry,organic,huts.map(h=>({...h,height:size*1.3,width:h.width*1.1})));
        mesh(siteHigh,domeGeometry,organic,0,size*.05,0,size*2.05,size*1.4,size*2.05);
      } else {
        instances(siteHigh,simpleGeometry,mat,huts);
        mesh(siteHigh,roofGeometry,copper,0,size*.9,0,size*1.8,size*1.6,size*1.8);
      }
    } else if(!colonial) {
      const modules=[];
      for(let j=0;j<detailCount;j++){
        const ring=j%2===0?2.7:1.4;
        const a=2*Math.PI*j/detailCount;
        modules.push({x:size*Math.cos(a)*ring,z:size*Math.sin(a)*ring,
          width:size*(.44+.23*fraction(plan.seedUint32,j+59)),
          height:size*(veryAdvanced?1.8:1.0)*(0.7+1.3*fraction(plan.seedUint32,j+61))});
      }
      instances(siteHigh,plan.form==='INTEGRATED_HABITAT' || plan.lineage==='INSECTOID'
        ? towerGeometry:boxGeometry,mat,modules);
      mesh(siteHigh,veryAdvanced?towerGeometry:boxGeometry,alloy,0,size*(veryAdvanced?1.5:1.0),0,
        size*(veryAdvanced?1.35:1.5),size*(veryAdvanced?3:2),size*(veryAdvanced?1.35:1.5));
      if(veryAdvanced){
        mesh(siteHigh,domeGeometry,cool,0,size*3,0,size*1.3,size*.48,size*1.3);
      } else if (plan.form==='WETLAND_PLATFORM' || plan.form==='CANOPY_NEST') {
        mesh(siteHigh,boxGeometry,alloy,0,size*.26,0,size*3.3,size*.18,size*3.3);
      }
    }
  }
  // 38.6a: extra non-emissive buildings are derived from the same VISCIV
  // texture already in the planet material. This preserves the original 38.6
  // settlements, all colony geometries, lights, satellites and orbital limits.
  const dayUrban = createVida38DayUrbanSurface386a(plans,bodyRadiusScene,canonicalNightLights);
  medium.add(dayUrban.medium);
  high.add(dayUrban.high);
  resources.push(...dayUrban.resources);
  // Preserve the first two children [medium, high] for the existing 38.6
  // contracts; append the distant representation only if a real colonial
  // plan was authorized and accepted by the 38.6c layout.
  if(distantColonySites.length>0)group.add(distantColonies);
  let selected = -2;
  const setLevel = (diameter:number):void=>{
    const valid = Number.isFinite(diameter) && diameter > 0;
    const next = !valid ? -1 : diameter<200 ? 0 : diameter<380 ? 1 : 2;
    if (next!==selected){
      selected=next;
      medium.visible=next===1;
      high.visible=next===2;
      distantColonies.visible=next===0;
    }
    if (next===0) {
      // Geometry remains visible on the exposed hemisphere at distant zoom.
      // A bounded sublinear optical gain prevents it collapsing to a pixel;
      // its apparent size STILL increases monotonically when zooming in.
      // No coordinates, scientific dimensions, or visibility permissions change.
      const scale = vida38ColonialDistantScale386c1(diameter);
      for(const site of distantColonySites)site.scale.setScalar(scale);
    }
  };
  setLevel(0);
  return Object.freeze({group,resources:Object.freeze(resources),siteCount:maxSites,colonialBodyCenterView386c4,
    dayClusterCount:dayUrban.plan?.clusters.length ?? 0,
    updateProjectedDiameterPixels:setLevel,updateColonialNightLighting386c3});
}
