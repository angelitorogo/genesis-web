/** 38.6 · Physical, non-emissive surface reconstruction; never a light-map.
 * Shared by fiche previews and SystemScene. No edits to scientific geometry.
 */
import * as THREE from 'three';
import { genesisVisualTrace388 } from '../visual-provenance/genesis-visual-provenance-38-8';
import type { Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';
import { createVida38DayUrbanSurface386a } from './vida38-day-urban-visual-38-6a';
import { vida38ColonialComplexLayout386c, type Vida38ColonyVisualPart386c } from './vida38-colonial-complex-38-6c';
import { vida38ColonialDirectStellarExposure386c3, vida38ColonialLampOpacity386c3 } from './vida38-colonial-night-lighting-38-6c3';
import {colonialNightVisibilityT7r,colonialNightGlowSceneSizeT7r} from './vida38-colonial-night-visibility-38bis-t7r';
import type { Colvis1HostEnvironment } from './colvis1-colonial-architecture';
import { colvis2LayoutFromVerifiedPlan, type Colvis2Layout } from './colvis2-colonial-architecture';
import { colvis2SculptedGeometry, COLVIS2_SCULPTED_SHAPES } from './colvis2-architecture-geometry';
import { colvis3ColonyDetailsFromVerifiedPlanT7c, colvis3MarkerRadiusSceneT7c, type Colvis3ColonyDetailsT7c } from './colvis3-colony-visibility-t7c';

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
  /** Verified colonies actually present in this rendered body, not laboratory fixtures. */
  readonly colonialSitesCOLVIS2: readonly Readonly<{id:string;site:THREE.Group;footprintScene:number;bodyRadiusScene:number;details:Colvis3ColonyDetailsT7c}>[];
  /** T7t: pivotes de TODOS los asentamientos coloniales autorizados,
   * incluidos planes antiguos sin arquitectura COLVIS. No crea indicadores por sí solo. */
  readonly colonialSiteAnchorsT7t?: readonly Readonly<{id:string;site:THREE.Group;markerHex:number}>[];
  /** Conceal optical location markers in physically scaled close-up views. */
  setColonialInspectionActiveCOLVIS2(active:boolean):void;
  updateProjectedDiameterPixels(diameter: number): void;
  /** SystemScene-only: update artificial equipment indicators with its REAL
   * multistellar light binding; never modify surface emission or star flux. */
  updateColonialNightLighting386c3(
    directionsView: readonly THREE.Vector3[], weights: THREE.Vector3,
    cameraMatrixWorldInverse: THREE.Matrix4,
    camera?:THREE.PerspectiveCamera,viewportHeightPixels?:number,
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
  /** Source physical radius, for COLVIS.1 metric geometry only. */
  physicalRadiusEarthCOLVIS1: number | null = null,
  environmentCOLVIS1:Colvis1HostEnvironment | null = null,
  /** Only the fiche's UI locator grows: SystemScene retains COLVIS.2 scale. */
  colonyMarkerEnhancementT7c = false,
  /** T7n: ocultar marcadores de emplazamiento SOLO en SystemScene. */
  showColonyLocationRingsT7n = true,
): Vida38InfrastructureVisual386 {
  const group = new THREE.Group();
  group.name = 'VIDA.38.6 reconstructed surface infrastructure (not observed coordinates)';
  // 38.8: provenance for the VERIFIED existing plans, not newly discovered data.
  // Native and colonial infrastructure retain their distinct VIDA authorities.
  group.userData['genesisVisualTrace38_8'] = Object.freeze(plans.map(plan =>
    genesisVisualTrace388(
      plan.provenance === 'VIDA8_COLONIAL_SETTLEMENT'
        ? 'COLONIAL_INFRASTRUCTURE' : 'CIVILIZATION',
      plan.id, plan.seedUint32,
    )));
  const resources: {dispose():void}[] = [];
  const medium = new THREE.Group();
  const high = new THREE.Group();
  // 38.6c1: only authorized colonial sites receive a distant geometric LOD.
  // Native buildings and 38.6a day-urbanization retain their approved LOD.
  const distantColonies = new THREE.Group();
  distantColonies.name = 'VIDA.38.6c1 distant colonial infrastructure';
  const distantColonySites: THREE.Group[] = [];
  const colonialSitesCOLVIS2:Array<Readonly<{id:string;site:THREE.Group;footprintScene:number;bodyRadiusScene:number;details:Colvis3ColonyDetailsT7c}>>=[];
  const colonialSiteAnchorsT7t:Array<Readonly<{id:string;site:THREE.Group;markerHex:number}>>=[];
  const colonialLocationMarkersCOLVIS2:THREE.Mesh[]=[];
  const distantLocationMarkersT7c=new Set<THREE.Mesh>();
  let colonialInspectionActiveT7p=false;
  const setColonialInspectionActiveCOLVIS2=(active:boolean):void=>{
    colonialInspectionActiveT7p=active;
    for(const marker of colonialLocationMarkersCOLVIS2)marker.visible=!active;
    // Un modal siempre muestra el LOD alto real, sin mezclar copias de
    // distancia/media a consecuencia del zoom óptico o de la cámara orbital.
    if(active)updateProjectedDiameterPixelsT7p(1200);
  };
  let updateProjectedDiameterPixelsT7p:(diameter:number)=>void=()=>{};
  const colonialLampBindings: Array<{site:THREE.Group;material:THREE.MeshBasicMaterial}> = [];
  /** T7r: emisores ópticos visibles a escala del globo (sin contornos UI).
   * Sprites independientes del LOD; el cuerpo celeste sigue ocultando su cara posterior. */
  const colonialNightBeaconsT7r:Array<{site:THREE.Group;material:THREE.SpriteMaterial;
    sprite:THREE.Sprite}> = [];
  let colonialNightGlowTextureT7r:THREE.DataTexture|null=null;
  function nightGlowTextureT7r():THREE.DataTexture{
    if(colonialNightGlowTextureT7r)return colonialNightGlowTextureT7r;
    const n=64,rgba=new Uint8Array(n*n*4);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const dx=(x+.5)/n*2-1,dy=(y+.5)/n*2-1;
      const r2=dx*dx+dy*dy;
      // Punto luminoso suave, sin anillo, base, flecha ni halo de selección.
      const core=Math.exp(-r2*27);
      const halo=Math.exp(-r2*7)*.28;
      const rays=Math.exp(-dx*dx*120)*Math.exp(-dy*dy*2)*.12+
        Math.exp(-dy*dy*120)*Math.exp(-dx*dx*2)*.12;
      const alpha=Math.min(1,core+halo+rays);
      const j=(y*n+x)*4;
      rgba[j]=255;rgba[j+1]=255;rgba[j+2]=255;rgba[j+3]=Math.round(alpha*255);
    }
    const texture=new THREE.DataTexture(rgba,n,n,THREE.RGBAFormat);
    texture.needsUpdate=true;
    texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;
    colonialNightGlowTextureT7r=texture;resources.push(texture);
    return texture;
  }
  /** Moon/planet centre IN VIEW SPACE, independent of each site's pivot.
   * Shared with colonial reflection shaders, refreshed after orbital motion. */
  const colonialBodyCenterView386c4 = new THREE.Vector3();
  const colonialBodyCenterWorld386c4 = new THREE.Vector3();
  const lampWorldQuaternion = new THREE.Quaternion();
  const lampNormalView = new THREE.Vector3();
  const beaconViewPositionT7r=new THREE.Vector3();
  const beaconNormalViewT7r=new THREE.Vector3();
  const beaconToCameraT7r=new THREE.Vector3();
  const beaconWorldQuaternionT7r=new THREE.Quaternion();
  const updateColonialNightLighting386c3 = (
    directionsView: readonly THREE.Vector3[], weights: THREE.Vector3,
    cameraMatrixWorldInverse: THREE.Matrix4,
    camera?:THREE.PerspectiveCamera,viewportHeightPixels?:number,
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
    // T7r: el volumen físico de una luz colonial puede proyectar < 1 píxel.
    // Solo SystemScene aporta cámara para esta ayuda óptica, siempre por detrás
    // de la superficie al estar en el hemisferio oculto (depthTest=true).
    for(const beacon of colonialNightBeaconsT7r){
      const {site,material,sprite}=beacon;
      site.getWorldQuaternion(beaconWorldQuaternionT7r);
      beaconNormalViewT7r.copy(UP).applyQuaternion(beaconWorldQuaternionT7r)
        .transformDirection(cameraMatrixWorldInverse);
      sprite.getWorldPosition(beaconViewPositionT7r).applyMatrix4(cameraMatrixWorldInverse);
      const distance=beaconViewPositionT7r.length();
      beaconToCameraT7r.copy(beaconViewPositionT7r).negate().normalize();
      const facing=beaconNormalViewT7r.dot(beaconToCameraT7r);
      const exposure=vida38ColonialDirectStellarExposure386c3(
        beaconNormalViewT7r,directionsView,weights);
      const heightPixelsT7r=viewportHeightPixels??0;
      if(!camera||heightPixelsT7r<=0){
        material.opacity=0;sprite.visible=false;continue;
      }
      const bodyPixels=bodyRadiusScene*heightPixelsT7r/
        Math.max(distance,1e-8)/Math.tan(camera.fov*Math.PI/360);
      const visibility=colonialNightVisibilityT7r(exposure,facing,bodyPixels);
      material.opacity=visibility.opacity;
      sprite.visible=visibility.opacity>.015;
      if(sprite.visible){
        const size=colonialNightGlowSceneSizeT7r(
          visibility.diameterPixels,distance,camera.fov,heightPixelsT7r);
        sprite.scale.set(size,size,1);
      }
    }
  };
  group.add(medium,high);
  const maxSites = Math.min(plans.length,20);
  const base = bodyRadiusScene * .0056;
  if (!(bodyRadiusScene > 0) || !Number.isFinite(bodyRadiusScene)) {
    return Object.freeze({group,resources:Object.freeze(resources),siteCount:0,dayClusterCount:0,colonialBodyCenterView386c4,
      colonialSitesCOLVIS2:Object.freeze([]),colonialSiteAnchorsT7t:Object.freeze([]),setColonialInspectionActiveCOLVIS2,
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
  const colonyHexGeometry = new THREE.CylinderGeometry(.8,.86,1,6);
  const colonyTaperGeometry = new THREE.CylinderGeometry(.42,.85,1,6);
  const colonyRingGeometry = new THREE.TorusGeometry(.75,.075,6,18);
  colonyRingGeometry.rotateX(-Math.PI/2);
  const colonyBasalt = material('#5d686f',.25);
  const colonyCeramic = material('#b1bdc6',.28);
  const colonyServiceVehicleGeometry = new THREE.BoxGeometry(1,1,1);
  const sculptedCOLVIS2=new Map<Vida38ColonyVisualPart386c['shape'],THREE.BufferGeometry>();
  // Only generate prefab geometry actually used by this body's VERIFIED
  // colonial plans. Native settlements and uncolonized worlds allocate none.
  const neededCOLVIS2=new Set<Vida38ColonyVisualPart386c['shape']>();
  const cachedLayoutsCOLVIS2=new Map<string,Colvis2Layout>();
  if(physicalRadiusEarthCOLVIS1!==null && physicalRadiusEarthCOLVIS1>0){
    for(const plan of plans.slice(0,maxSites)){
      const layout=colvis2LayoutFromVerifiedPlan(plan,environmentCOLVIS1);
      if(layout){cachedLayoutsCOLVIS2.set(plan.id,layout);
        for(const part of layout.high)neededCOLVIS2.add(part.shape);}
    }
  }
  for(const shape of COLVIS2_SCULPTED_SHAPES){
    if(!neededCOLVIS2.has(shape))continue;
    const geometry=colvis2SculptedGeometry(shape);
    sculptedCOLVIS2.set(shape,geometry);resources.push(geometry);
  }
  const hasCOLVIS2=neededCOLVIS2.size>0;
  const humanAlloyCOLVIS2=hasCOLVIS2?material('#92a6b4',.74):colonyHull;
  const humanGlassCOLVIS2=hasCOLVIS2?new THREE.MeshStandardMaterial({color:'#9bb9c7',metalness:.36,roughness:.24}):colonyPanel;
  const reptileScuteCOLVIS2=hasCOLVIS2?new THREE.MeshStandardMaterial({color:'#655c56',metalness:.48,roughness:.63}):colonyBasalt;
  const reptileCoreCOLVIS2=hasCOLVIS2?new THREE.MeshStandardMaterial({color:'#ad8e6e',metalness:.64,roughness:.36}):colonyAccent;
  const insectChitinCOLVIS2=hasCOLVIS2?new THREE.MeshStandardMaterial({color:'#637c70',metalness:.16,roughness:.47}):colonyHull;
  const insectPearlCOLVIS2=hasCOLVIS2?new THREE.MeshStandardMaterial({color:'#b2c9a4',metalness:.23,roughness:.30}):colonyCeramic;
  if(hasCOLVIS2)resources.push(humanAlloyCOLVIS2,humanGlassCOLVIS2,reptileScuteCOLVIS2,reptileCoreCOLVIS2,insectChitinCOLVIS2,insectPearlCOLVIS2);
  // A small outlined SITE LOCATOR is an interface aid, never a physical
  // megastructure. It is hidden when inspecting the actual colony geometry.
  const sculptedFinishesCOLVIS2=new Map<THREE.Material,THREE.Material>();
  // El laboratorio y las fichas conservan sus anillos: SystemScene los desactiva.
  const locationRingCOLVIS2=hasCOLVIS2 && showColonyLocationRingsT7n
    ?new THREE.TorusGeometry(1,.10,8,32):null;
  locationRingCOLVIS2?.rotateX(-Math.PI/2);
  if(locationRingCOLVIS2)resources.push(locationRingCOLVIS2);
  const locatorMaterialsT7c=new Map<number,THREE.MeshBasicMaterial>();
  // El anillo es una ayuda de localización óptica, NO geometría medida.
  // Material compartido por color: a lo sumo unas pocas asignaciones por cuerpo.
  function locationMarkerCOLVIS2(site:THREE.Group,details:Colvis3ColonyDetailsT7c,distant=false):void{
    if(!locationRingCOLVIS2)return;
    const color=colonyMarkerEnhancementT7c?details.markerHex:0xa8e4f0;
    let material=locatorMaterialsT7c.get(color);
    if(!material){
      material=new THREE.MeshBasicMaterial({color,
        transparent:true,opacity:colonyMarkerEnhancementT7c ? .97 : .80,
        depthTest:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
      locatorMaterialsT7c.set(color,material);resources.push(material);
    }
    const marker=new THREE.Mesh(locationRingCOLVIS2,material);
    marker.name='COLVIS.2 confirmed colony location indicator (NOT physical infrastructure)';
    marker.scale.setScalar(bodyRadiusScene*(colonyMarkerEnhancementT7c ? .035 : .014));
    marker.position.y=bodyRadiusScene*.003;
    marker.frustumCulled=false;marker.renderOrder=2;
    site.add(marker);colonialLocationMarkersCOLVIS2.push(marker);
    if(distant)distantLocationMarkersT7c.add(marker);
  }
  resources.push(colonyHexGeometry,colonyTaperGeometry,colonyRingGeometry,
    colonyBasalt,colonyCeramic,colonyServiceVehicleGeometry);
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
    siteSurfaceRadius: number, siteNormal: THREE.Vector3, siteOrientation: THREE.Quaternion,
    verticalSize=visualSize):void {
    const geometryOf=(shape:Vida38ColonyVisualPart386c['shape']):THREE.BufferGeometry=>
      shape==='BOX'?boxGeometry:shape==='DOME'?domeGeometry:
      shape==='MAST'?colonyMastGeometry:shape==='HEX'?colonyHexGeometry:
      shape==='TAPER'?colonyTaperGeometry:shape==='RING'?colonyRingGeometry:
      sculptedCOLVIS2.get(shape)??colonyPadGeometry;
    const materialOf=(finish:Vida38ColonyVisualPart386c['finish']):THREE.Material=>
      finish==='HULL'?colonyHull:finish==='DARK'?colonyDark:
      finish==='PANEL'?colonyPanel:finish==='ACCENT'?colonyAccent:
      finish==='BASALT'?colonyBasalt:finish==='CERAMIC'?colonyCeramic:
      finish==='HUMAN_ALLOY'?humanAlloyCOLVIS2:finish==='HUMAN_GLASS'?humanGlassCOLVIS2:
      finish==='REPTILE_SCUTE'?reptileScuteCOLVIS2:finish==='REPTILE_CORE'?reptileCoreCOLVIS2:
      finish==='INSECT_CHITIN'?insectChitinCOLVIS2:finish==='INSECT_PEARL'?insectPearlCOLVIS2:colonyDome;
    const buckets=new Map<string,{geometry:THREE.BufferGeometry;mat:THREE.Material;
      matrices:THREE.Matrix4[];roles:Set<string>;groundable:boolean[];supportLiftScene:number[]}>();
    const tilt=new THREE.Quaternion(),yawRotation=new THREE.Quaternion();
    const position=new THREE.Vector3(); const radialUp=new THREE.Vector3();
    const tangentPosition=new THREE.Vector3(), partDirection=new THREE.Vector3();
    const scale=new THREE.Vector3(); const transform=new THREE.Matrix4();
    const siteOffset=Math.min(bodyRadiusScene*.0007,verticalSize*.08);
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
      const geo=geometryOf(part.shape);
      let mat=materialOf(part.finish);
      if(sculptedCOLVIS2.has(part.shape)){
        let colored=sculptedFinishesCOLVIS2.get(mat);
        if(!colored){
          const variant=(mat as THREE.MeshStandardMaterial).clone();
          variant.vertexColors=true;variant.needsUpdate=true;
          sculptedFinishesCOLVIS2.set(mat,variant);resources.push(variant);colored=variant;
        }
        mat=colored;
      }
      geo.computeBoundingBox();
      const minY=geo.boundingBox?.min.y??-.5;
      const sy=part.height*verticalSize;
      // Sculpted COLVIS.2 prefabs are authored with a physical ground-contact
      // origin (minY ~= 0). Do not sink them by the legacy foundation inset.
      const groundInset=sculptedCOLVIS2.has(part.shape)?0:siteOffset;
      position.set(x,surfaceY-groundInset,z).addScaledVector(radialUp,
        (-minY*sy)+(part.lift*verticalSize)+Math.min(bodyRadiusScene*.00004,verticalSize*.03));
      tilt.setFromUnitVectors(UP,radialUp);
      yawRotation.setFromAxisAngle(UP,part.yaw);
      tilt.multiply(yawRotation);
      scale.set(part.width*visualSize,sy,part.depth*visualSize);
      transform.compose(position,tilt,scale);
      const key=part.shape+'|'+part.finish;
      let bucket=buckets.get(key);
      if(!bucket){bucket={geometry:geo,mat,matrices:[],roles:new Set<string>(),groundable:[],supportLiftScene:[]};buckets.set(key,bucket);}
      bucket.matrices.push(transform.clone());bucket.roles.add(part.role);
      // T7o: solo elementos cuya elevación arquitectónica sea cero.
      // Puentes, nodos y anillos levantados conservan su altura original.
      bucket.groundable.push(part.lift<=.001);
      // T7p: conserva la elevación proyectada de cada módulo respecto a SU
      // suelo local. El apoyo se reajusta junto al resto de la colonia sin
      // borrar puentes ni cápsulas diseñados para quedar elevados.
      bucket.supportLiftScene.push(Math.max(0,part.lift*verticalSize));
    }
    for(const [key,bucket] of buckets){
      const inst=new THREE.InstancedMesh(bucket.geometry,bucket.mat,bucket.matrices.length);
      inst.name='VIDA.38.6c colony '+key;
      bucket.matrices.forEach((matrix,i)=>inst.setMatrixAt(i,matrix));
      inst.instanceMatrix.needsUpdate=true;
      inst.frustumCulled=false;
      inst.castShadow=false;inst.receiveShadow=true;
      inst.userData={colonialVisual386c:true,elementRoles:[...bucket.roles],
        colvis2GroundEligibleT7o:bucket.groundable,
        colvis2SupportLiftSceneT7p:bucket.supportLiftScene};
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
    distant=false, verticalSize=visualSize,
  ):void {
    if (!colonyLampGeometry) return;
    const candidates = parts.filter(p=>
      (p.role==='MAIN_MODULE' && p.finish==='HULL') ||
      (p.role==='ACCESS' && p.finish==='DARK') ||
      (p.role==='ANTENNA' && p.finish==='HULL') ||
      (p.role==='AUXILIARY' && p.finish==='HULL') ||
      (p.role==='TECH_NODE' && p.finish==='CERAMIC') ||
      (p.role==='BRIDGE' && p.shape==='RING') ||
      p.role==='PRESSURIZED_DOME');
    // COLVIS.2/T7s changed the sculpted part families. Some verified
    // extraction habitats no longer have the old role/finish combinations.
    // Use actual modeled parts as carriers instead of losing all night lights.
    const carriers = candidates.length > 0 ? candidates : parts;
    const selected=carriers.slice(0,limit);
    if(!selected.length) return;
    const inst = new THREE.InstancedMesh(colonyLampGeometry,mat,selected.length);
    inst.name='VIDA.38.6c3 artificial colony lamps (no emitted terrain light)';
    inst.userData={colonialNightIndicators386c3:true};
    const matrix=new THREE.Matrix4();
    const position=new THREE.Vector3(), tangent=new THREE.Vector3(), sampledDirection=new THREE.Vector3();
    const radialUp=new THREE.Vector3();
    const scale=new THREE.Vector3(), rotation=new THREE.Quaternion();
    const siteOffset=Math.min(bodyRadiusScene*.0007,verticalSize*.08);
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
      const height=(part.height+part.lift+.26)*verticalSize;
      // Sculpted COLVIS.2 prefabs are authored with a physical ground-contact
      // origin (minY ~= 0). Do not sink them by the legacy foundation inset.
      const groundInset=sculptedCOLVIS2.has(part.shape)?0:siteOffset;
      position.set(x,surfaceY-groundInset,z).addScaledVector(radialUp,height);
      // T7n: luces puntuales legibles en el hemisferio oscuro; NO son anillos UI.
      const dotSize=visualSize*(distant?.95:(showColonyLocationRingsT7n?.24:.38));
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

  const colvisActivitySites: Array<{vehicle:THREE.Mesh;site:THREE.Group;
    radius:number; altitude:number; phase:number; speed:number}> = [];
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
      site.position.copy(normal).multiplyScalar(siteSurfaceRadius+(plan.colonyArchitectureCOLVIS1 && physicalRadiusEarthCOLVIS1 &&
        physicalRadiusEarthCOLVIS1>0?0:bodyRadiusScene*.0007));
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
      // Un único anclaje por plan confirmado. Reutiliza la misma latitud,
      // longitud y radio visible que los edificios, incluso en lunas irregulares.
      // No depende del LOD ni del tipo de arquitectura COLVIS.
      colonialSiteAnchorsT7t.push(Object.freeze({
        id:plan.id,site:siteHigh,
        markerHex:colvis3ColonyDetailsFromVerifiedPlanT7c(plan)?.markerHex??0xff4fd8,
      }));
      const physicalLayout=cachedLayoutsCOLVIS2.get(plan.id)??null;
      const validPhysicalRadius=Number.isFinite(physicalRadiusEarthCOLVIS1) &&
        physicalRadiusEarthCOLVIS1 !== null && physicalRadiusEarthCOLVIS1 > 0;
      const layout=physicalLayout && validPhysicalRadius
        ? physicalLayout : vida38ColonialComplexLayout386c(plan);
      const verifiedDetailsT7c=physicalLayout && validPhysicalRadius
        ? colvis3ColonyDetailsFromVerifiedPlanT7c(plan):null;
      if(layout){
        siteMedium.name='VIDA.38.6c colonial complex MEDIUM';
        siteHigh.name='VIDA.38.6c colonial complex HIGH';
        // Physical COLVIS geometry: km / (source physical R_E * 6371 km) * render radius.
        // The old 38.6c optical multiplier survives ONLY for old fixture layouts.
        const sourceRadiusKm=physicalRadiusEarthCOLVIS1! * 6371;
        const safeFootprintRadiusKm=physicalLayout && validPhysicalRadius
          ? Math.min(physicalLayout.footprintRadiusKm,sourceRadiusKm*.0075)
          : 0;
        const visualSize=physicalLayout && validPhysicalRadius
          ? bodyRadiusScene*safeFootprintRadiusKm/(sourceRadiusKm*physicalLayout.unitExtent)
          : size*('visualScaleMultiplier' in layout ? layout.visualScaleMultiplier:1)*colonyMoonScale;
        // COLVIS.1 divided the vertical scale by a fixed 4.2 factor, making
        // already tiny buildings even flatter. Use the actual highest part
        // so physical heights remain capped but are no longer unnecessarily lost.
        const highestPart=physicalLayout?Math.max(1,...physicalLayout.high.map(part=>part.height+part.lift)):1;
        const verticalSize=physicalLayout && validPhysicalRadius
          ? Math.min(visualSize, bodyRadiusScene*Math.min(physicalLayout.maximumHeightKm,sourceRadiusKm*.0015)/(sourceRadiusKm*highestPart))
          : visualSize;
        colonyComplex(siteMedium,layout.medium,visualSize,siteSurfaceRadius,normal,siteMedium.quaternion,verticalSize);
        if(physicalLayout && validPhysicalRadius && verifiedDetailsT7c){
          colonialSitesCOLVIS2.push(Object.freeze({id:plan.id,site:siteHigh,
            footprintScene:visualSize*physicalLayout.unitExtent,bodyRadiusScene,details:verifiedDetailsT7c}));
          locationMarkerCOLVIS2(siteMedium,verifiedDetailsT7c);
          locationMarkerCOLVIS2(siteHigh,verifiedDetailsT7c);
        }
        colonyComplex(siteHigh,layout.high,visualSize,siteSurfaceRadius,normal,siteHigh.quaternion,verticalSize);
        // Reuse the exact medium-LOD geometry as a real, surface-anchored
        // distant silhouette, not an overlay sprite or another colony.
        // Matching the medium LOD at 200px prevents visual teleportation.
        const siteDistant = new THREE.Group();
        siteDistant.name = 'VIDA.38.6c1 distant colonial site';
        siteDistant.position.copy(siteMedium.position);
        siteDistant.quaternion.copy(siteMedium.quaternion);
        colonyComplex(siteDistant,layout.medium,visualSize,siteSurfaceRadius,normal,siteDistant.quaternion,verticalSize);
        if(verifiedDetailsT7c)locationMarkerCOLVIS2(siteDistant,verifiedDetailsT7c,true);
        if (colonialNightIndicators386c3 && colonyLampGeometry) {
          // One independent material per real colony; shared by its 3 LODs.
          // Opacity follows aggregate stellar illumination, including B/C stars.
          const lampMaterial = new THREE.MeshBasicMaterial({
            color:verifiedDetailsT7c?.lampHex??0xd1ecff,toneMapped:false,transparent:true,opacity:1,
            depthTest:true,depthWrite:false,
          });
          resources.push(lampMaterial);
          const lampBudget=verifiedDetailsT7c?.lampBudget??5;
          addColonialLamps386c3(siteMedium,layout.medium,visualSize,siteSurfaceRadius,normal,siteMedium.quaternion,lampMaterial,verifiedDetailsT7c?Math.min(7,lampBudget):2,false,verticalSize);
          addColonialLamps386c3(siteHigh,layout.high,visualSize,siteSurfaceRadius,normal,siteHigh.quaternion,lampMaterial,lampBudget,false,verticalSize);
          addColonialLamps386c3(siteDistant,layout.medium,visualSize,siteSurfaceRadius,normal,siteDistant.quaternion,lampMaterial,Math.min(5,lampBudget),true,verticalSize);
          colonialLampBindings.push({site:siteHigh,material:lampMaterial});
          // T7r: pequeños puntos luminosos realmente perceptibles en la cara
          // oscura de SystemScene, sin marcador circular ni falsos PointLight.
          // No dependen del LOD de los edificios ni del botón COLONIAS.
          if(!showColonyLocationRingsT7n){
            const beaconSite=new THREE.Group();
            beaconSite.name='T7r night emission anchors (confirmed colony only)';
            beaconSite.position.copy(siteHigh.position);
            beaconSite.quaternion.copy(siteHigh.quaternion);
            group.add(beaconSite);
            const count=verifiedDetailsT7c?.lampBudget && verifiedDetailsT7c.lampBudget>=8?4:3;
            for(let j=0;j<count;j++){
              const angle=2*Math.PI*fraction(plan.seedUint32,2300+j);
              const radius=j===0?0:visualSize*(.65+.85*fraction(plan.seedUint32,2500+j));
              const lamp=new THREE.SpriteMaterial({
                map:nightGlowTextureT7r(),color:verifiedDetailsT7c?.lampHex??0xd1ecff,
                transparent:true,toneMapped:false,opacity:0,depthTest:true,
                depthWrite:false,blending:THREE.AdditiveBlending,
              });
              const sprite=new THREE.Sprite(lamp);
              sprite.name='T7r colony night equipment point (NOT selection ring)';
              sprite.position.set(
                Math.cos(angle)*radius,
                Math.max(verticalSize*.70,bodyRadiusScene*.000008),
                Math.sin(angle)*radius,
              );
              sprite.visible=false;
              sprite.renderOrder=4;
              beaconSite.add(sprite);
              colonialNightBeaconsT7r.push({site:beaconSite,material:lamp,sprite});
              resources.push(lamp);
            }
          }
        }
        if(physicalLayout && validPhysicalRadius && physicalLayout.habitatTechnology!=='SUBSURFACE_VAULT'){
          // A tiny LOCAL surface service vehicle, not an orbital object or a
          // scientific new asset. Movement is real-time presentation, never CT-0.
          const vehicle=new THREE.Mesh(colonyServiceVehicleGeometry,colonyAccent);
          vehicle.name='COLVIS.1 slow local service traffic';
          vehicle.scale.set(visualSize*.12,verticalSize*.13,visualSize*.20);
          vehicle.castShadow=false;
          siteHigh.add(vehicle);
          colvisActivitySites.push({vehicle,site:siteHigh,radius:visualSize*1.9,
            altitude:verticalSize*.13,phase:fraction(plan.seedUint32,812)*Math.PI*2,
            speed:physicalLayout.founderTier==='VERY_ADVANCED'?.035:.020});
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
  // Bound slow motion to actual elapsed seconds; independent of simulation
  // speed and planetary spin. No allocation, new orbit or physics mutation.
  const initialColvisSeconds=typeof performance!=='undefined'?performance.now()/1000:0;
  const setLevel = (diameter:number):void=>{
    if(colonialInspectionActiveT7p)diameter=1200;
    if(colvisActivitySites.length>0){
      const elapsed=typeof performance!=='undefined' ? Math.max(0,performance.now()/1000-initialColvisSeconds) : 0;
      for(const activity of colvisActivitySites){
        const angle=activity.phase+elapsed*activity.speed;
        activity.vehicle.position.set(Math.cos(angle)*activity.radius,
          activity.altitude,Math.sin(angle)*activity.radius);
        activity.vehicle.rotation.y=-angle;
      }
    }
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
      for(const site of distantColonySites){
        site.scale.setScalar(scale);
        // A location indicator is NOT a physical building and should not
        // inherit the legacy optical gain applied to distant geometry.
        // Los indicadores se actualizan abajo en unidades de pantalla, no de edificios.
      }
    }
    // Compatibility: enlarge only fiches. Preserve SystemScene's marker size.
    const uiRadius=colonyMarkerEnhancementT7c
      ? colvis3MarkerRadiusSceneT7c(bodyRadiusScene,diameter):bodyRadiusScene*.014;
    for(const marker of colonialLocationMarkersCOLVIS2){
      const gain=distantLocationMarkersT7c.has(marker)&&next===0
        ? vida38ColonialDistantScale386c1(diameter):1;
      marker.scale.setScalar(uiRadius/gain);
    }
  };
  updateProjectedDiameterPixelsT7p=setLevel;
  setLevel(0);
  return Object.freeze({group,resources:Object.freeze(resources),siteCount:maxSites,colonialBodyCenterView386c4,
    colonialSitesCOLVIS2:Object.freeze(colonialSitesCOLVIS2),
    colonialSiteAnchorsT7t:Object.freeze(colonialSiteAnchorsT7t),setColonialInspectionActiveCOLVIS2,
    dayClusterCount:dayUrban.plan?.clusters.length ?? 0,
    updateProjectedDiameterPixels:setLevel,updateColonialNightLighting386c3});
}
