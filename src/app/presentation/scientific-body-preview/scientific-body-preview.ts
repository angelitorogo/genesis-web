import {
  isPlatformBrowser,
} from '@angular/common';

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import * as THREE from 'three';
import { genesisVisualTrace388, type GenesisVisualSubjectKind388 } from '../visual-provenance/genesis-visual-provenance-38-8';
import { GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C } from '../system/system-scene-giant-atmosphere-geometry-viscatm1c';
import { scientificMoonDaysPerRealSecondV3 } from '../system/system-scene-secondary-motion';
import { scientificPreviewDaylightCameraT7s } from './scientific-preview-daylight-camera-t7s';
import { viscorbPreviewStellarSourcesV1 } from './viscorb-preview-stellar-illumination';
import { viscorbLocalOrbitLayoutV1, viscorbPresentedMoonRadiusV1 } from '../system/viscorb-local-orbit-projection';
import { colvis3ColonyOrbitOffsetT7n } from '../infrastructure/colvis3-colony-orbit-camera-t7n';
import { attachColvis3ColonyGroundContactT7o, type Colvis3ColonyGroundContactT7o } from '../infrastructure/colvis3-colony-ground-contact-t7o';
import { COLVIS3_MAX_INSPECTION_ZOOM_T7E } from '../infrastructure/colvis3-colony-camera-t7e';
import { colvis3ColonyOpticalFramingT7m } from '../infrastructure/colvis3-colony-optical-zoom-t7m';
import { attachColvis3NativeTerrainT7i, type Colvis3NativeTerrainT7i } from '../infrastructure/colvis3-native-terrain-t7i';
import { colvis3IsColonyClickT7c, type Colvis3ColonyDetailsT7c } from '../infrastructure/colvis3-colony-visibility-t7c';
import { createVida38InfrastructureSurfaceVisual386, vida38MoonVisibleInfrastructurePlans386c2, type Vida38InfrastructureVisual386 } from '../infrastructure/vida38-infrastructure-render-38-6';
import type { SystemScenePlanetLightBindingV1 } from '../system/system-scene-atmosphere-material';
import { updatePreviewStellarLightBindingVISSURF6 } from './scientific-body-preview-stellar-binding-vissurf6';

import {
  createSystemScenePlanetAppearanceV1,
  type SystemScenePlanetTextureDimensionsV1,
} from '../system/system-scene';

import {
  createSystemSceneRingRenderableV1,
} from '../system/system-scene-ring-renderable';

import {
  systemSceneBodyAxialTiltRadians,
} from '../system/system-scene-body-render-state';

import {
  systemSceneMoonDisplaySpinRadiansV2,
} from '../system/system-scene-moon-spin-presentation';

import {
  scientificBodyPreviewPlanetSpinRadians38bisT5,
} from './scientific-body-preview-planet-spin-38bis-t5';

import {
  systemSceneBodyLodSegmentsV1,
} from '../system/system-scene-lod';

import {
  SystemOrbitalMotionEngine,
  type SystemOrbitalMotionDefinition,
} from '../../simulation/orbital/system-orbital-motion-engine';

import {
  type ScientificAsteroidPreviewVisual,
  type ScientificBodyPreviewModel,
  ScientificBodyPreviewKind,
  type ScientificCometActivityPreviewVisual,
  type ScientificCometPreviewVisual,
  type ScientificMoonPreviewVisual,
  type ScientificPlanetPreviewVisual,
  type ScientificTransNeptunianPreviewVisual,
  SCIENTIFIC_COMET_PREVIEW_RADIUS_SCENE,
} from '../scientific/scientific-body-preview';

import {
  createSystemSceneMoonRenderableV1,
} from '../system/system-scene-moon-renderable';
import {
  createSystemSceneArtificialSatelliteVisualV1,
  createSystemSceneOrbitalRingVisualV1,
  updateOrbitalRingNightLightsVISCIV6g,
  updateOrbitalRingTrafficVISCIV6k,
  type SystemSceneOrbitalRingVisualV1,
  createSystemSceneOrbitalStationVisualV1,
  supportsSystemSceneArtificialSatellitesV1,
  type SystemSceneArtificialSatelliteMaterialBindingV1,
} from '../system/system-scene-artificial-satellites-visciv2';
import { buildSystemSceneOrbitalInfrastructureManifestVISCIV6e } from '../system/system-scene-orbital-infrastructure-visciv6e';
import {
  installOrbitalSurfaceShadowVISCIV6n,
  type OrbitalSurfaceShadowBindingVISCIV6n,
  type OrbitalSurfaceShadowRingVISCIV6n,
} from '../system/system-scene-orbital-surface-shadow-visciv6n';

import {
  type SystemSceneMoonPresentationV1,
} from '../system/system-scene-moon-presentation';

import {
  type SystemSceneAsteroidPresentationV1,
} from '../system/system-scene-asteroid-presentation';

import {
  type SystemSceneCometActivityPresentationV1,
  type SystemSceneCometPresentationV1,
} from '../system/system-scene-comet-presentation';

import {
  type SystemScenePlanetRingPresentationV1,
} from '../system/system-scene-planet-special-presentation';

import {
  createSystemSceneAsteroidRenderableV1,
} from '../system/system-scene-asteroid-geometry';

import { createSystemSceneTnoRenderableV1 } from '../system/system-scene-tno-renderable';
import { createSystemSceneCapturedRenderableV1 } from '../system/system-scene-captured-renderable';

import {
  SCIENTIFIC_BODY_TEXTURE_VIS3D2E,
  attachScientificMinorBodyAtlasVis3d2e,
} from './scientific-minor-body-texture-vis3d2e';

import {
  applySystemSceneCometActivityVisualV1,
  createSystemSceneCometRenderableV1,
} from '../system/system-scene-comet-renderable';

export type ScientificBodyPreviewRenderState =
  | 'initializing'
  | 'ready'
  | 'unavailable'
  | 'error';

const MAX_DEVICE_PIXEL_RATIO =
  2;

const MIN_CAMERA_DISTANCE =
  2.35;

const MAX_CAMERA_DISTANCE =
  18;

const LOCAL_OUTERMOST_ORBIT_RADIUS =
  4.35;

const LOCAL_ORBIT_SEGMENT_COUNT =
  160;

const ISOLATED_NON_BODY_AUTOROTATE_CYCLE_SECONDS =
  48;

const MINOR_BODY_INSPECTION_FILL_INTENSITY =
  0.90;

/** VIS-3D.2d: 1024×512 atlas for both solid surface and cloud layer. */
const SCIENTIFIC_PREVIEW_PLANET_TEXTURE_BALANCED: SystemScenePlanetTextureDimensionsV1 = Object.freeze({
  width: 1024,
  height: 512,
});


/**
 * Explain transient modeled liquid in an inspection preview without changing
 * the D.4d texture, physical coverage or persistence state. Only the planet's
 * own characterized surface qualifies (not a moon's host-planet context).
 */
export function scientificBodyPreviewTransientWaterNoteV1(
  model: ScientificBodyPreviewModel,
): string | null {
  if (model.kind !== ScientificBodyPreviewKind.PLANET) {
    return null;
  }
  const surface = model.primary.surface;
  if (!surface || !surface.solidSurfaceAvailable ||
      surface.hasPersistentSurfaceLiquidWater !== false ||
      (surface.surfaceLiquidWaterCoverageFraction01 ?? 0) <= 0) {
    return null;
  }
  return 'Agua superficial transitoria (escenario) · Las regiones azules no implican océanos permanentes.';
}

export function scientificBodyPreviewMoonSelectionHaloV1(
  selectedMoonOrdinal:
    number | null,

  moonOrdinal:
    number,
): boolean {
  return selectedMoonOrdinal !==
      null &&
    selectedMoonOrdinal ===
      moonOrdinal;
}

export interface ScientificBodyPreviewAnimationStepInputV1 {
  readonly autoAnimate:
    boolean;

  readonly pointerActive:
    boolean;

  readonly elapsedRealSeconds:
    number;

  readonly hasLocalOrbits:
    boolean;

  readonly hasBodySpin:
    boolean;

  readonly orbitalDaysPerRealSecond:
    number;

  readonly spinDaysPerRealSecond:
    number;
}

export interface ScientificBodyPreviewAnimationStepV1 {
  readonly orbitalDayDelta:
    number;

  readonly spinDayDelta:
    number;

  readonly rootYawDeltaRadians:
    number;
}

/**
 * Presentation-only frame clock. Pointer interaction affects only the camera/root
 * orientation; it never pauses scientific orbit or body-spin progression.
 */
export function scientificBodyPreviewAnimationStepV1(
  input:
    ScientificBodyPreviewAnimationStepInputV1,
): ScientificBodyPreviewAnimationStepV1 {

  if (
    !Number.isFinite(
      input.elapsedRealSeconds,
    ) ||
    input.elapsedRealSeconds <
      0 ||
    !Number.isFinite(
      input.orbitalDaysPerRealSecond,
    ) ||
    input.orbitalDaysPerRealSecond <
      0 ||
    !Number.isFinite(
      input.spinDaysPerRealSecond,
    ) ||
    input.spinDaysPerRealSecond <
      0
  ) {
    throw new RangeError(
      'Scientific preview animation rates must be finite and non-negative.',
    );
  }

  if (
    !input.autoAnimate
  ) {
    return Object.freeze({
      orbitalDayDelta:
        0,
      spinDayDelta:
        0,
      rootYawDeltaRadians:
        0,
    });
  }

  return Object.freeze({
    orbitalDayDelta:
      input.hasLocalOrbits
        ? input.elapsedRealSeconds *
          input.orbitalDaysPerRealSecond
        : 0,
    spinDayDelta:
      input.hasBodySpin
        ? input.elapsedRealSeconds *
          input.spinDaysPerRealSecond
        : 0,
    rootYawDeltaRadians:
      !input.hasLocalOrbits &&
      !input.hasBodySpin &&
      !input.pointerActive
        ? input.elapsedRealSeconds *
          Math.PI *
          2 /
          ISOLATED_NON_BODY_AUTOROTATE_CYCLE_SECONDS
        : 0,
  });
}

export function scientificCometPreviewCameraDistanceV1(
  activity:
    ScientificCometActivityPreviewVisual,
): number {

  const longestTail =
    Math.max(
      activity.hasDustTail
        ? activity.presentationDustTailLengthScene
        : 0,
      activity.hasIonTail
        ? activity.presentationIonTailLengthScene
        : 0,
    );

  return clamp(
    3.05 +
      Math.min(
        longestTail,
        5,
      ) *
        0.18,
    3.05,
    4.95,
  );
}

interface LocalScientificMoonBinding {
  readonly moon:
    ScientificMoonPreviewVisual;

  readonly motion:
    SystemOrbitalMotionDefinition;

  readonly axialPivot:
    THREE.Group;

  readonly spinPivot:
    THREE.Group;

  readonly orbitalDaysPerRealSecond: number;
}

interface LocalScientificSpinBinding {
  readonly kind:
    'planet' | 'moon';

  readonly spin:
    ScientificMoonPreviewVisual['spin'] | ScientificPlanetPreviewVisual['spin'];

  readonly spinPivot:
    THREE.Group;
}

interface ScientificArtificialSatelliteBindingV1 {
  readonly orbitPivot:
    THREE.Group;
  readonly basePhaseRadians:
    number;
  readonly angularSpeedRadiansPerDay:
    number;
  readonly materials:
    readonly SystemSceneArtificialSatelliteMaterialBindingV1[];
  readonly orbitMaterial:
    THREE.LineBasicMaterial | null;
  readonly baseLineOpacity01:
    number;
  readonly ringVisualVISCIV6g?: SystemSceneOrbitalRingVisualV1;
}

@Component({
  selector:
    'app-scientific-body-preview',

  standalone:
    true,

  templateUrl:
    './scientific-body-preview.html',

  styleUrl:
    './scientific-body-preview.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ScientificBodyPreview
  implements AfterViewInit, OnChanges, OnDestroy {

  @Input({ required: true })
  model!:
    ScientificBodyPreviewModel;

  /** Temporary QA panel enabled by &debugOrbital=1 in the planet URL. */
  @Input()
  orbitalInfrastructureDebug = false;

  @ViewChild(
    'canvas',
    {
      static:
        true,
    },
  )
  private readonly canvasRef!:
    ElementRef<HTMLCanvasElement>;

  transientSurfaceWaterNote(): string | null {
    return scientificBodyPreviewTransientWaterNoteV1(this.model);
  }

  readonly renderState =
    signal<ScientificBodyPreviewRenderState>(
      'initializing',
    );

  readonly contextEnabled =
    signal(false);

  readonly autoRotate =
    signal(true);

  readonly artificialSatellitesVisible =
    signal(false);

  /** COLVIS.2: null = original body framing; index = verified colony close-up. */
  readonly colonyInspectionIndexCOLVIS2=signal<number|null>(null);
  private colonyInspectionZoomCOLVIS2=1;
  /** T7n: cámara orbital alrededor de la colonia, sin rotar el cuerpo ni sus luces. */
  private colonyOrbitAzimuthT7n=0;
  private colonyOrbitElevationT7n=Math.atan2(.68,.73);
  private colonySurfaceContextT7e:Colvis3NativeTerrainT7i|null=null;
  private colonyGroundContactT7o:Colvis3ColonyGroundContactT7o|null=null;
  private previousBodyOverflowT7d:string|null=null;
  private previousHtmlOverflowT7d:string|null=null;

  colonyInspectionChoicesCOLVIS2():readonly number[]{
    const total=this.infrastructureVisuals.reduce((sum,item)=>sum+item.visual.colonialSitesCOLVIS2.length,0);
    return Array.from({length:total},(_,i)=>i);
  }

  colonyInspectionDetailsT7c():Colvis3ColonyDetailsT7c|null{
    const index=this.colonyInspectionIndexCOLVIS2();
    return index===null?null:this.infrastructureVisuals.flatMap(entry=>entry.visual.colonialSitesCOLVIS2)[index]?.details??null;
  }

  colonyHostBodyLabelT7d():string{
    return this.model.accessibleLabel
      .replace(/\.?\s*Representación tridimensional con paridad visual SystemScene\.?/gu,'')
      .replace(/\.?\s*Puede activarse el planeta anfitrión y las demás lunas relevantes\.?/gu,'')
      .replace(/\s{2,}/gu,' ')
      .replace(/\s+([.,;:])/gu,'$1')
      .trim();
  }

  /** Solo geometría COLVIS.2 confirmada; no abre fichas de colonias privadas. */
  @HostListener('document:keydown.escape')
  onColonyEscapeT7c():void{
    if(this.colonyInspectionIndexCOLVIS2()!==null)this.exitColonyInspectionCOLVIS2();
  }

  chooseColonyInspectionCOLVIS2(value:string):void{
    if(value==='-1'){this.exitColonyInspectionCOLVIS2();return;}
    this.inspectColonyCOLVIS2(Number(value));
  }

  /** T7i: project detail on the host body's native material, never on a
   * separate curved PlaneGeometry (source of T7h's visible grey wedges). */
  private attachColonySurfaceContextT7e(index:number):void{
    this.detachColonySurfaceContextT7e();
    let currentIndex=0;
    for(const entry of this.infrastructureVisuals){
      for(const colony of entry.visual.colonialSitesCOLVIS2){
        if(currentIndex++!==index)continue;
        const seed=Array.from(colony.id).reduce((hash,char)=>
          Math.imul(hash^char.charCodeAt(0),16777619)>>>0,2166136261);
        this.scene?.updateMatrixWorld(true);
        this.colonySurfaceContextT7e=attachColvis3NativeTerrainT7i(
          entry.surfaceMesh,colony.site,seed,colony.details.destination==='MOON',
          colony.footprintScene,entry.radius);
        return;
      }
    }
  }

  private detachColonySurfaceContextT7e():void{
    this.colonyGroundContactT7o?.dispose();
    this.colonyGroundContactT7o=null;
    this.colonySurfaceContextT7e?.dispose();
    this.colonySurfaceContextT7e=null;
  }

  inspectColonyCOLVIS2(index:number):void{
    const choices=this.colonyInspectionChoicesCOLVIS2();
    if(!Number.isInteger(index)||!choices.includes(index))return;
    this.colonyInspectionIndexCOLVIS2.set(index);
    this.colonyInspectionZoomCOLVIS2=1;
    this.colonyOrbitAzimuthT7n=0;
    this.colonyOrbitElevationT7n=Math.atan2(.68,.73);
    this.autoRotate.set(false);
    this.lockBackgroundScrollT7d();
    this.attachColonySurfaceContextT7e(index);
    for(const {visual} of this.infrastructureVisuals){
      visual.setColonialInspectionActiveCOLVIS2(true);
      visual.updateProjectedDiameterPixels(1200);
    }
    // T7o: contacto por geometría realmente renderizada, una sola vez al abrir.
    // El raycast no crea mallas ni modifica las instancias de SystemScene.
    let indexT7o=0;
    for(const entry of this.infrastructureVisuals){
      for(const colony of entry.visual.colonialSitesCOLVIS2){
        if(indexT7o++!==index)continue;
        this.scene?.updateMatrixWorld(true);
        this.colonyGroundContactT7o=attachColvis3ColonyGroundContactT7o(
          entry.surfaceMesh,colony.site,colony.footprintScene);
      }
    }
    this.updateColonyInspectionCameraCOLVIS2();
    // El mismo WebGL y la misma geometría se amplían: no se crea otro visor.
    if(isPlatformBrowser(this.platformId))this.canvasRef.nativeElement.focus();
  }

  exitColonyInspectionCOLVIS2():void{
    this.detachColonySurfaceContextT7e();
    this.colonyInspectionIndexCOLVIS2.set(null);
    this.colonyInspectionZoomCOLVIS2=1;
    this.unlockBackgroundScrollT7d();
    for(const {visual} of this.infrastructureVisuals)visual.setColonialInspectionActiveCOLVIS2(false);
    if(this.camera){this.camera.up.set(0,1,0);this.camera.zoom=1;this.camera.near=.01;this.camera.far=80;this.camera.updateProjectionMatrix();}
    this.fitCurrentModelCamera();
    this.resize();
  }

  private lockBackgroundScrollT7d():void{
    if(!isPlatformBrowser(this.platformId))return;
    const body=document.body;
    const html=document.documentElement;
    if(this.previousBodyOverflowT7d===null)this.previousBodyOverflowT7d=body.style.overflow;
    if(this.previousHtmlOverflowT7d===null)this.previousHtmlOverflowT7d=html.style.overflow;
    body.style.overflow='hidden';
    html.style.overflow='hidden';
  }

  private unlockBackgroundScrollT7d():void{
    if(!isPlatformBrowser(this.platformId))return;
    const body=document.body;
    const html=document.documentElement;
    body.style.overflow=this.previousBodyOverflowT7d??'';
    html.style.overflow=this.previousHtmlOverflowT7d??'';
    this.previousBodyOverflowT7d=null;
    this.previousHtmlOverflowT7d=null;
  }

  private updateColonyInspectionCameraCOLVIS2():void{
    const index=this.colonyInspectionIndexCOLVIS2();
    const camera=this.camera;if(index===null||!camera)return;
    const entry=this.infrastructureVisuals.flatMap(item=>item.visual.colonialSitesCOLVIS2)[index];
    if(!entry){this.exitColonyInspectionCOLVIS2();return;}
    this.scene?.updateMatrixWorld(true);
    const position=entry.site.getWorldPosition(new THREE.Vector3());
    const bodyCentre=entry.site.parent?.parent?.getWorldPosition(new THREE.Vector3())??
      position.clone().add(new THREE.Vector3(0,-entry.bodyRadiusScene,0));
    // The infrastructure parent is the body-relative LOD group. Its world
    // position is exactly the host body's centre (independent of spin/tilt).
    const siteRotation=entry.site.getWorldQuaternion(new THREE.Quaternion());
    const normal=new THREE.Vector3(0,1,0).applyQuaternion(siteRotation).normalize();
    const tangent=new THREE.Vector3(0,0,1).applyQuaternion(siteRotation).normalize();
    const optical=colvis3ColonyOpticalFramingT7m(
      entry.footprintScene,entry.bodyRadiusScene,this.colonyInspectionZoomCOLVIS2);
    if(!optical)return;
    const framing=optical.framing;
    const groundTarget=position.clone().addScaledVector(normal,entry.footprintScene*.12);
    const target=groundTarget.lerp(bodyCentre,framing.bodyCentreBlend);
    // T7f keeps the inspection local: terrain detail covers the visible field
    // instead of transitioning to a more distant whole-globe presentation.
    // T7h: solo variar opacidad por LOD. No tocar bumpScale ni recompilar
    // materiales durante el zoom: el terreno queda detrás de los edificios.
    this.colonySurfaceContextT7e?.setZoom(this.colonyInspectionZoomCOLVIS2);
    camera.up.copy(normal);
    const orbitOffset=colvis3ColonyOrbitOffsetT7n(normal,tangent,
      this.colonyOrbitAzimuthT7n,this.colonyOrbitElevationT7n,framing.distanceScene);
    camera.position.copy(target).add(orbitOffset);
    camera.lookAt(target);
    // T7m: NO desplazar la cámara en función de la rueda. Cambiar solo la
    // proyección amplía edificios y accidentes del suelo con el mismo factor.
    camera.zoom=optical.cameraZoom;
    camera.near=framing.nearScene;
    camera.far=framing.farScene;
    camera.updateProjectionMatrix();
    // T7l: recalculate terrain coordinates in exactly the same camera frame
    // used to render the colony, including tiny or irregular host moons.
    this.colonySurfaceContextT7e?.updateFrame(camera);
  }

  private readonly platformId =
    inject(
      PLATFORM_ID,
    );

  private renderer:
    THREE.WebGLRenderer | null =
      null;

  private scene:
    THREE.Scene | null =
      null;

  private camera:
    THREE.PerspectiveCamera | null =
      null;

  private root:
    THREE.Group | null =
      null;

  private animationFrameId:
    number | null =
      null;

  private resizeObserver:
    ResizeObserver | null =
      null;

  private resources:
    { dispose(): void }[] =
      [];

  private localMoonBindings:
    LocalScientificMoonBinding[] =
      [];

  private localSpinBindings:
    LocalScientificSpinBinding[] =
      [];

  private infrastructureVisuals: Array<{visual:Vida38InfrastructureVisual386;radius:number;surfaceMesh:THREE.Mesh}> = [];

  private stellarLightBinding: SystemScenePlanetLightBindingV1 | null = null;

  /** Owned preview-only lighting; disposed/rebuilt when the inspected body changes. */
  private readonly previewSceneLights: THREE.Light[] = [];

  private orbitalSurfaceShadowVISCIV6n: OrbitalSurfaceShadowBindingVISCIV6n | null = null;

  private artificialSatelliteBindings:
    ScientificArtificialSatelliteBindingV1[] =
      [];

  private readonly artificialSatellitePlanetWorldPosition =
    new THREE.Vector3();

  private readonly artificialSatelliteCameraDirection =
    new THREE.Vector3();

  private readonly artificialSatelliteLightDirection =
    new THREE.Vector3();

  private localSimulationDay =
    0;

  /** Baseline epoch; localSimulationDay advances as a real-second clock for moons. */
  private localOrbitEpochSimulationDay =
    0;

  private localSpinSimulationDay =
    0;

  private localDaysPerRealSecond =
    0;

  private lastAnimationTimestampMs:
    number | null =
      null;

  private cameraDistance =
    4;

  private pointerId:
    number | null =
      null;

  private pointerX =
    0;

  private pointerY =
    0;

  private pointerStartXT7c=0;
  private pointerStartYT7c=0;
  private pointerDraggedT7c=false;

  private readonly visibilityHandler =
    () => {
      if (
        document.visibilityState ===
          'hidden'
      ) {
        this.stopAnimation();
        return;
      }

      this.startAnimation();
    };

  ngAfterViewInit():
    void {

    if (
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      this.renderState
        .set(
          'unavailable',
        );
      return;
    }

    try {
      const canvas =
        this.canvasRef
          .nativeElement;

      const context =
        canvas.getContext(
          'webgl2',
          {
            antialias:
              true,
            alpha:
              true,
            powerPreference:
              'high-performance',
          },
        );

      if (
        context ===
          null
      ) {
        this.renderState
          .set(
            'unavailable',
          );
        return;
      }

      this.renderer =
        new THREE.WebGLRenderer({
          canvas,
          context,
          antialias:
            true,
          alpha:
            true,
        });

      this.renderer
        .setClearColor(
          0x000000,
          0,
        );

      this.renderer
        .outputColorSpace =
        THREE.SRGBColorSpace;

      this.scene =
        new THREE.Scene();

      this.camera =
        new THREE.PerspectiveCamera(
          38,
          1,
          0.01,
          80,
        );

      this.addLighting();
      this.configureMotionPreference();
      this.rebuildScene();
      this.resize();

      this.resizeObserver =
        new ResizeObserver(
          () =>
            this.resize(),
        );

      this.resizeObserver
        .observe(
          canvas,
        );

      document
        .addEventListener(
          'visibilitychange',
          this.visibilityHandler,
        );

      this.renderState
        .set(
          'ready',
        );

      this.startAnimation();
    } catch {
      this.renderState
        .set(
          'error',
        );
    }
  }

  ngOnChanges(
    changes:
      SimpleChanges,
  ): void {

    if (
      changes['model'] !==
        undefined &&
      this.renderer !==
        null
    ) {
      this.detachColonySurfaceContextT7e();
      this.colonyInspectionIndexCOLVIS2.set(null);
      this.unlockBackgroundScrollT7d();
      this.contextEnabled
        .set(false);
      this.artificialSatellitesVisible
        .set(false);
      // Do not leave the previous planet's lights attached to a reused canvas.
      this.addLighting();
      this.rebuildScene();
    }
  }

  ngOnDestroy():
    void {

    this.stopAnimation();
    this.detachColonySurfaceContextT7e();
    this.unlockBackgroundScrollT7d();

    if (
      isPlatformBrowser(
        this.platformId,
      )
    ) {
      document
        .removeEventListener(
          'visibilitychange',
          this.visibilityHandler,
        );
    }

    this.resizeObserver
      ?.disconnect();

    this.disposeSceneResources();
    this.previewSceneLights.length = 0;

    this.renderer
      ?.dispose();

    this.renderer =
      null;
    this.scene =
      null;
    this.camera =
      null;
    this.root =
      null;
  }

  contextAvailable():
    boolean {

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.PLANET
    ) {
      return this.model.moons.length >
        0;
    }

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.MOON
    ) {
      return this.model.hostPlanet !==
        null;
    }

    return false;
  }

  contextActionLabel():
    string {

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.PLANET
    ) {
      return this.contextEnabled()
        ? 'MOSTRAR SOLO PLANETA'
        : 'MOSTRAR LUNAS';
    }

    return this.contextEnabled()
      ? 'MOSTRAR SOLO LUNA'
      : 'MOSTRAR SISTEMA LOCAL';
  }

  orbitalInfrastructureDiagnosticVISCIV6e() {
    if (!this.orbitalInfrastructureDebug || this.model.kind !== ScientificBodyPreviewKind.PLANET) return null;
    const planet = this.model.primary;
    const manifest = buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(
      planet.surfaceVisualVariantUint32, planet.nightCivilizationTier ?? null, 1,
    );
    return Object.freeze({
      tier: manifest.tier ?? 'SIN TIER VISUAL',
      satellites: manifest.satelliteCount,
      stations: manifest.stationCount,
      rings: manifest.ringCount,
    });
  }

  artificialSatellitesAvailable():
    boolean {
    return this.model.kind === ScientificBodyPreviewKind.PLANET && supportsSystemSceneArtificialSatellitesV1(
      this.model.primary.nightCivilizationTier ?? null,
    );
  }

  artificialSatellitesActionLabel():
    string {
    const veryAdvanced = this.model.kind === ScientificBodyPreviewKind.PLANET &&
      this.model.primary.nightCivilizationTier === 'VERY_ADVANCED';
    if (veryAdvanced) return this.artificialSatellitesVisible()
      ? 'OCULTAR INFRAESTRUCTURA ORBITAL'
      : 'MOSTRAR INFRAESTRUCTURA ORBITAL';
    return this.artificialSatellitesVisible()
      ? 'OCULTAR SATÉLITES'
      : 'MOSTRAR SATÉLITES';
  }

  toggleArtificialSatellites():
    void {

    if (
      !this.artificialSatellitesAvailable()
    ) {
      return;
    }

    this.artificialSatellitesVisible.update(
      value => !value,
    );
    this.applyArtificialSatelliteVisibility();
  }

  toggleContext():
    void {

    if (
      !this.contextAvailable()
    ) {
      return;
    }

    this.contextEnabled
      .update(
        value =>
          !value,
      );

    this.colonyInspectionIndexCOLVIS2.set(null);
    this.rebuildScene();
  }

  toggleAutoRotate():
    void {

    this.autoRotate
      .update(
        value =>
          !value,
      );
  }

  resetView():
    void {

    if(this.colonyInspectionIndexCOLVIS2()!==null){this.exitColonyInspectionCOLVIS2();return;}

    if (
      this.root ===
        null
    ) {
      return;
    }

    this.root
      .rotation
      .set(-0.14, 0.42, 0);

    this.fitCurrentModelCamera();
  }

  onPointerDown(
    event:
      PointerEvent,
  ): void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    this.pointerId =
      event.pointerId;
    this.pointerX =
      event.clientX;
    this.pointerY =
      event.clientY;
    this.pointerStartXT7c=event.clientX;
    this.pointerStartYT7c=event.clientY;
    this.pointerDraggedT7c=false;

    this.canvasRef
      .nativeElement
      .setPointerCapture(
        event.pointerId,
      );
  }

  onPointerMove(
    event:
      PointerEvent,
  ): void {

    if (
      this.pointerId !==
        event.pointerId ||
      this.root ===
        null
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      this.pointerX;
    const deltaY =
      event.clientY -
      this.pointerY;

    this.pointerX =
      event.clientX;
    this.pointerY =
      event.clientY;
    if(Math.hypot(event.clientX-this.pointerStartXT7c,
      event.clientY-this.pointerStartYT7c)>7)this.pointerDraggedT7c=true;

    if(this.colonyInspectionIndexCOLVIS2()!==null){
      // Vista orbital: el terreno, la colonia y la iluminación permanecen inmóviles.
      this.colonyOrbitAzimuthT7n += deltaX*.008;
      this.colonyOrbitElevationT7n=clamp(
        this.colonyOrbitElevationT7n+deltaY*.006,.20,1.48);
      this.updateColonyInspectionCameraCOLVIS2();
      return;
    }

    this.root.rotation.y +=
      deltaX *
      0.008;

    this.root.rotation.x =
      clamp(
        this.root.rotation.x +
          deltaY *
            0.006,
        -1.15,
        1.15,
      );
  }

  onPointerUp(
    event:
      PointerEvent,
  ): void {

    if (
      this.pointerId !==
        event.pointerId
    ) {
      return;
    }

    this.pointerId =
      null;

    if (
      this.canvasRef
        .nativeElement
        .hasPointerCapture(
          event.pointerId,
        )
    ) {
      this.canvasRef
        .nativeElement
        .releasePointerCapture(
          event.pointerId,
        );
    }
    if(event.type==='pointerup'&&!this.pointerDraggedT7c &&
       Math.hypot(event.clientX-this.pointerStartXT7c,event.clientY-this.pointerStartYT7c)<=7 &&
       this.colonyInspectionIndexCOLVIS2()===null){
      this.pickVerifiedColonyT7c(event.clientX,event.clientY,
        Math.hypot(event.clientX-this.pointerStartXT7c,event.clientY-this.pointerStartYT7c));
    }
  }

  /** Proyección y prueba de hemisferio: un marcador detrás del planeta NO
   * se selecciona por tener las mismas coordenadas de pantalla. */
  private pickVerifiedColonyT7c(clientX:number,clientY:number,pointerTravel:number):void {
    const camera=this.camera,scene=this.scene;
    if(!camera||!scene)return;
    const rect=this.canvasRef.nativeElement.getBoundingClientRect();
    if(rect.width<=0||rect.height<=0)return;
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const cameraPosition=camera.getWorldPosition(new THREE.Vector3());
    let closest=24,found:number|null=null,index=0;
    for(const {visual} of this.infrastructureVisuals){
      const centre=visual.group.getWorldPosition(new THREE.Vector3());
      for(const {site,bodyRadiusScene} of visual.colonialSitesCOLVIS2){
        const position=site.getWorldPosition(new THREE.Vector3());
        const outward=position.clone().sub(centre);
        const visible=outward.dot(cameraPosition.clone().sub(position))>-(bodyRadiusScene*bodyRadiusScene*.008);
        const projected=position.clone().project(camera);
        const x=rect.left+(projected.x+1)*rect.width*.5;
        const y=rect.top+(1-projected.y)*rect.height*.5;
        const distance=Math.hypot(clientX-x,clientY-y);
        if(projected.z>=-1 && projected.z<=1 && distance<closest &&
          colvis3IsColonyClickT7c(pointerTravel,distance,visible)){
          closest=distance;found=index;
        }
        index++;
      }
    }
    if(found!==null)this.inspectColonyCOLVIS2(found);
  }

  onWheel(
    event:
      WheelEvent,
  ): void {

    event.preventDefault();
    if(this.colonyInspectionIndexCOLVIS2()!==null){
      this.colonyInspectionZoomCOLVIS2=clamp(this.colonyInspectionZoomCOLVIS2*(event.deltaY>0?1.24:.81),.32,COLVIS3_MAX_INSPECTION_ZOOM_T7E);
      this.updateColonyInspectionCameraCOLVIS2();return;
    }

    const direction =
      Math.sign(
        event.deltaY,
      );

    this.cameraDistance =
      clamp(
        this.cameraDistance *
          (
            direction >
              0
              ? 1.10
              : 0.91
          ),
        MIN_CAMERA_DISTANCE,
        MAX_CAMERA_DISTANCE,
      );

    this.applyCameraDistance();
  }

  onKeyDown(
    event:
      KeyboardEvent,
  ): void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    if(this.colonyInspectionIndexCOLVIS2()!==null &&
       ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      if(event.key==='ArrowLeft')this.colonyOrbitAzimuthT7n-=.10;
      if(event.key==='ArrowRight')this.colonyOrbitAzimuthT7n+=.10;
      if(event.key==='ArrowUp')this.colonyOrbitElevationT7n=clamp(this.colonyOrbitElevationT7n-.08,.20,1.48);
      if(event.key==='ArrowDown')this.colonyOrbitElevationT7n=clamp(this.colonyOrbitElevationT7n+.08,.20,1.48);
      this.updateColonyInspectionCameraCOLVIS2();
      event.preventDefault();return;
    }

    switch (
      event.key
    ) {
      case 'ArrowLeft':
        this.root.rotation.y -=
          0.10;
        break;

      case 'ArrowRight':
        this.root.rotation.y +=
          0.10;
        break;

      case 'ArrowUp':
        this.root.rotation.x =
          clamp(
            this.root.rotation.x -
              0.08,
            -1.15,
            1.15,
          );
        break;

      case 'ArrowDown':
        this.root.rotation.x =
          clamp(
            this.root.rotation.x +
              0.08,
            -1.15,
            1.15,
          );
        break;

      case '+':
      case '=':
        if(this.colonyInspectionIndexCOLVIS2()!==null){
          this.colonyInspectionZoomCOLVIS2=clamp(this.colonyInspectionZoomCOLVIS2*.81,.32,COLVIS3_MAX_INSPECTION_ZOOM_T7E);
          this.updateColonyInspectionCameraCOLVIS2();break;
        }
        this.cameraDistance =
          clamp(
            this.cameraDistance *
              0.91,
            MIN_CAMERA_DISTANCE,
            MAX_CAMERA_DISTANCE,
          );
        this.applyCameraDistance();
        break;

      case '-':
      case '_':
        if(this.colonyInspectionIndexCOLVIS2()!==null){
          this.colonyInspectionZoomCOLVIS2=clamp(this.colonyInspectionZoomCOLVIS2*1.24,.32,COLVIS3_MAX_INSPECTION_ZOOM_T7E);
          this.updateColonyInspectionCameraCOLVIS2();break;
        }
        this.cameraDistance =
          clamp(
            this.cameraDistance *
              1.10,
            MIN_CAMERA_DISTANCE,
            MAX_CAMERA_DISTANCE,
          );
        this.applyCameraDistance();
        break;

      case 'Home':
        this.resetView();
        break;

      default:
        return;
    }

    event.preventDefault();
  }

  private configureMotionPreference():
    void {

    const reduced =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      );

    if (
      reduced.matches
    ) {
      this.autoRotate
        .set(false);
    }
  }

  private previewStellarSources() {
    return viscorbPreviewStellarSourcesV1(this.model);
  }

  private addLighting():
    void {

    if (this.scene === null) return;
    for (const light of this.previewSceneLights) this.scene.remove(light);
    this.previewSceneLights.length = 0;

    const sources = this.previewStellarSources();

    const ambient = new THREE.HemisphereLight(
      0xbcd9f3,
      0x111318,
      sources?.length ? 0.28 : 1.10,
    );
    this.scene.add(ambient);
    this.previewSceneLights.push(ambient);

    if (sources && sources.length > 0) {
      for (const source of sources) {
        const stellar = new THREE.DirectionalLight(0xffffff, 2.35 * source.weight01);
        stellar.position.set(source.x * 5, source.y * 5, source.z * 5);
        this.scene.add(stellar);
        this.previewSceneLights.push(stellar);
      }
      return;
    }

    const key = new THREE.DirectionalLight(0xffffff, 2.15);
    key.position.set(4.5, 3.0, 5.0);
    const rim = new THREE.DirectionalLight(0x78cfff, 0.75);
    rim.position.set(-4.0, 1.0, -3.0);
    this.scene.add(key, rim);
    this.previewSceneLights.push(key, rim);
  }

  private rebuildScene():
    void {

    if (
      this.scene ===
        null
    ) {
      return;
    }

    // Restore the body-scale camera after any COLVIS.2 close inspection.
    // Model/context switches must never inherit microscopic near/far planes.
    this.detachColonySurfaceContextT7e();
    this.colonyInspectionIndexCOLVIS2.set(null);
    this.unlockBackgroundScrollT7d();
    if(this.camera){this.camera.up.set(0,1,0);this.camera.zoom=1;this.camera.near=.01;this.camera.far=80;this.camera.updateProjectionMatrix();}
    this.disposeSceneResources();

    if (
      this.root !==
        null
    ) {
      this.scene
        .remove(
          this.root,
        );
    }

    const root =
      new THREE.Group();
    root.name =
      'GENESIS scientific body preview';
    // 38.8: trace the *already authorized* model; never reinterpret science.
    const visualKind388: GenesisVisualSubjectKind388 =
      this.model.kind === ScientificBodyPreviewKind.PLANET ? 'PLANET' :
      this.model.kind === ScientificBodyPreviewKind.MOON ? 'MOON' :
      this.model.kind === ScientificBodyPreviewKind.ASTEROID ? 'ASTEROID' :
      this.model.kind === ScientificBodyPreviewKind.COMET ? 'COMET' :
      this.model.kind === ScientificBodyPreviewKind.TRANS_NEPTUNIAN_OBJECT
        ? 'TRANS_NEPTUNIAN_OBJECT' : 'CAPTURED_EXTRASOLAR_OBJECT';
    root.userData['genesisVisualTrace38_8'] = genesisVisualTrace388(
      visualKind388, this.model.accessibleLabel,
    );
    root.rotation
      .set(
        -0.14,
        0.42,
        0,
      );

    this.root =
      root;
    this.scene
      .add(
        root,
      );

    this.localSimulationDay =
      this.model.kind ===
          ScientificBodyPreviewKind.PLANET ||
        this.model.kind ===
          ScientificBodyPreviewKind.MOON
        ? this.model.epochSimulationDay
        : 0;

    this.localOrbitEpochSimulationDay =
      this.localSimulationDay;

    this.localSpinSimulationDay =
      this.localSimulationDay;

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.PLANET
    ) {
      if (
        this.contextEnabled() &&
        this.model.moons.length >
          0
      ) {
        this.buildPlanetaryContext(
          this.model.primary,
          this.model.moons,
          null,
        );
      } else {
        this.addPlanet(
          this.model.primary,
          1,
          new THREE.Vector3(),
        );
      }
    } else if (
      this.model.kind ===
        ScientificBodyPreviewKind.MOON
    ) {
      if (
        this.contextEnabled() &&
        this.model.hostPlanet !==
          null
      ) {
        this.buildPlanetaryContext(
          this.model.hostPlanet,
          this.model.moons,
          this.model.primary.moonOrdinal,
        );
      } else {
        this.addMoon(
          this.model.primary,
          1,
          new THREE.Vector3(),
          false,
        );
      }
    } else if (
      this.model.kind ===
        ScientificBodyPreviewKind.ASTEROID
    ) {
      this.addMinorBodyInspectionFill();
      this.addAsteroid(
        this.model.primary,
      );
    } else if (
      this.model.kind ===
        ScientificBodyPreviewKind.COMET
    ) {
      this.addMinorBodyInspectionFill();
      this.addComet(
        this.model.primary,
        this.model.activity,
      );
    } else {
      this.addMinorBodyInspectionFill();
      this.addTransNeptunianObject(
        this.model.primary,
      );
    }

    this.fitCurrentModelCamera();
  }

  private buildPlanetaryContext(
    planet:
      ScientificPlanetPreviewVisual,

    moons:
      readonly ScientificMoonPreviewVisual[],

    selectedMoonOrdinal:
      number | null,
  ): void {

    if (
      moons.length ===
        0
    ) {
      this.addPlanet(
        planet,
        1,
        new THREE.Vector3(),
      );
      return;
    }

    const localLayout = viscorbLocalOrbitLayoutV1(
      moons.map(moon => ({
        periapsisPlanetRadii: moon.orbit.periapsisPlanetRadii,
        apoapsisPlanetRadii: moon.orbit.apoapsisPlanetRadii,
        radiusEarth: moon.radiusEarth,
      })),
      planet.ring?.outerRadiusPlanetRadii ?? 1,
    );
    if (localLayout === null) return;

    const localScenePerPlanetRadius = localLayout.scenePerPlanetRadius;
    this.addPlanet(planet, localLayout.planetRadius, new THREE.Vector3());

    // MOONCAD.3: each moon uses a host-relative, radius-aware slow cadence.
    // Large outer orbits take longer than 120 s rather than sweeping rapidly.
    this.localDaysPerRealSecond = 1;
    const moonAxes = moons.map(moon => moon.orbit.semiMajorAxisPlanetRadii);

    for (
      const moon
      of moons
    ) {
      const motion =
        localScientificMoonMotion(
          moon,
          localScenePerPlanetRadius,
        );

      this.addOrbitGuide(
        motion,
      );

      const initialPosition =
        SystemOrbitalMotionEngine
          .positionAtSimulationDay(
            motion,
            this.localSimulationDay,
          );

      const moonRadius = viscorbPresentedMoonRadiusV1(
        localLayout,
        moon.radiusEarth,
      );

      const runtime =
        this.addMoon(
          moon,
          moonRadius,
          new THREE.Vector3(
            initialPosition.xAu,
            initialPosition.yAu,
            initialPosition.zAu,
          ),
          scientificBodyPreviewMoonSelectionHaloV1(
            selectedMoonOrdinal,
            moon.moonOrdinal,
          ),
        );

      if (
        runtime !==
          null
      ) {
        this.localMoonBindings
          .push({
            moon,
            motion,
            axialPivot:
              runtime.axialPivot,
            spinPivot:
              runtime.spinPivot,
            orbitalDaysPerRealSecond: scientificMoonDaysPerRealSecondV3(
              moon.orbit.orbitalPeriodDays,
              moon.orbit.semiMajorAxisPlanetRadii,
              moonAxes,
              moon.orbit.eccentricity,
            ),
          });
      }
    }
  }

  private addPlanet(
    planet:
      ScientificPlanetPreviewVisual,

    radius:
      number,

    position:
      THREE.Vector3,
  ): void {

    if (this.root === null) {
      return;
    }

    const body = Object.freeze({
      id: planet.planetId,
      kind: 'planet' as const,
      label: planet.title,
      title: planet.title,
      colorHex: planet.baseColorHex,
      radiusScene: radius,
      position: Object.freeze({ x: 0, y: 0, z: 0 }),
      orbitId: null,
      motionContributions: Object.freeze([]),
      surfaceStyle: planet.surfaceStyle,
      lightIntensity: 0,
      sourceLuminositySolar: null,
      opticalSurfaceGravityMetersPerSecondSquared:
        planet.opticalSurfaceGravityMetersPerSecondSquared ?? null,
      opticalReferenceInsolationEarth:
        planet.opticalReferenceInsolationEarth ?? null,
      spin: planet.spin,
      surfaceEnvironment: planet.surface,
      giantAtmosphere: planet.giantAtmosphere,
      specialPresentation: null,
      visualVegetationProfile:
        planet.vegetationProfile ?? null,
      visualCivilizationTier:
        planet.nightCivilizationTier ?? null,
    });

    const appearance =
      createSystemScenePlanetAppearanceV1(
        body,
        'SCIENTIFIC-PREVIEW',
        null,
        {
          planetTextureSeedUint32: planet.albedoVisualVariantUint32,
          surfaceTextureSeedUint32: planet.surfaceVisualVariantUint32,
          giantAtmosphereTextureSeedUint32: planet.giantAtmosphereVisualVariantUint32,
        },
        false,
        planet.opticalPhotosphereTemperatureKelvin ?? null,
        SCIENTIFIC_PREVIEW_PLANET_TEXTURE_BALANCED,
      );

    // Stellar day/night is physical; do not gate it on native civilization.
    this.stellarLightBinding = appearance.lightBinding;

    const segments = planet.giantAtmosphere !== null
      ? GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C
      : systemSceneBodyLodSegmentsV1('planet', 'HIGH');
    const geometry =
      new THREE.SphereGeometry(
        1,
        segments.widthSegments,
        segments.heightSegments,
      );

    const axialPivot = new THREE.Group();
    axialPivot.position.copy(position);
    axialPivot.rotation.z =
      systemSceneBodyAxialTiltRadians(
        body.spin,
      );

    const spinPivot = new THREE.Group();
    spinPivot.rotation.y =
      this.displaySpinRadians(
        'planet',
        planet.spin,
      );

    const sphere = new THREE.Mesh(
      geometry,
      appearance.material,
    );
    sphere.scale.setScalar(radius);
    spinPivot.add(sphere);
    if (planet.infrastructurePlans?.length && planet.surfaceStyle !== 'gaseous') {
      const infra = createVida38InfrastructureSurfaceVisual386(planet.infrastructurePlans,radius,appearance.nightLightsTexture,null,true,planet.radiusEarth,{
        temperatureKelvin:planet.surface?.meanSurfaceTemperatureKelvin??null,
        pressurePascal:planet.surface?.retainedSurfacePressurePascal??null,
        iceCoverage01:planet.surface?.surfaceIceCoverageFraction01??null},true);
      spinPivot.add(infra.group);
      this.resources.push(...infra.resources);
      this.infrastructureVisuals.push({visual:infra,radius,surfaceMesh:sphere});
    }

    for (const overlay of appearance.overlays) {
      spinPivot.add(overlay);
    }

    if (
      Math.abs(planet.equatorialScale - 1) > 1e-9 ||
      Math.abs(planet.polarScale - 1) > 1e-9
    ) {
      spinPivot.scale.set(
        planet.equatorialScale,
        planet.polarScale,
        planet.equatorialScale,
      );
    }

    axialPivot.add(spinPivot);

    this.localSpinBindings
      .push({
        kind:
          'planet',
        spin:
          planet.spin,
        spinPivot,
      });

    const ringPresentation =
      planet.ring === null
        ? null
        : scientificRingPresentation(planet.ring);

    const rings =
      ringPresentation === null
        ? null
        : createSystemSceneRingRenderableV1(
            radius,
            ringPresentation,
          );
    if (rings !== null) {
      axialPivot.add(rings.group);
    }

    const artificialSatellites = this.createArtificialSatellites(
      planet,
      radius,
    );

    if (artificialSatellites !== null) {
      axialPivot.add(
        artificialSatellites.group,
      );
      this.artificialSatelliteBindings.push(
        ...artificialSatellites.bindings,
      );
      this.resources.push(
        ...artificialSatellites.resources,
      );
      if (artificialSatellites.ringShadowRingsVISCIV6n.length > 0) {
        this.orbitalSurfaceShadowVISCIV6n = installOrbitalSurfaceShadowVISCIV6n(
          appearance.material, sphere,
          artificialSatellites.ringShadowRingsVISCIV6n, radius,
        );
      }
    }

    this.root.add(axialPivot);
    this.resources.push(
      geometry,
      appearance.material,
      ...appearance.resources,
      ...(rings?.resources ?? []),
    );
    this.applyArtificialSatelliteVisibility();
  }

  private createArtificialSatellites(
    planet:
      ScientificPlanetPreviewVisual,
    radius:
      number,
  ):
    Readonly<{
      group:
        THREE.Group;
      bindings:
        readonly ScientificArtificialSatelliteBindingV1[];
      resources:
        readonly ({ dispose(): void })[];
      ringShadowRingsVISCIV6n: readonly OrbitalSurfaceShadowRingVISCIV6n[];
    }> | null {

    const tier = planet.nightCivilizationTier ?? null;
    if (
      !supportsSystemSceneArtificialSatellitesV1(tier)
    ) {
      return null;
    }

    // VISCIV.6e: procedural visual infrastructure for CONFIRMED civilizations,
    // not an assertion that specific stations/rings were observed.
    const manifest = buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(
      planet.surfaceVisualVariantUint32, tier, radius,
    );
    const plans = manifest.satellites;
    const stationPlans = manifest.stations;
    const ringPlans = manifest.rings;
    const group = new THREE.Group();
    group.name = `${planet.title} orbital infrastructure`;
    const bindings: ScientificArtificialSatelliteBindingV1[] = [];
    const resources: { dispose(): void }[] = [];
    const ringShadowRingsVISCIV6n: OrbitalSurfaceShadowRingVISCIV6n[] = [];

    const appendOrbitalAsset = (
      orbitRadiusPlanetRadii: number,
      inclinationRadians: number,
      ascendingNodeRadians: number,
      phaseRadians: number,
      angularSpeedRadiansPerDay: number,
      orbitColorHex: string,
      orbitOpacity01: number,
      assetVisual: Readonly<{
        group: THREE.Group;
        materials: readonly SystemSceneArtificialSatelliteMaterialBindingV1[];
        resources: readonly ({ dispose(): void })[];
      }>,
    ): void => {
      const orbitPlane = new THREE.Group();
      orbitPlane.rotation.z = ascendingNodeRadians;
      orbitPlane.rotation.x = inclinationRadians;

      const orbitPivot = new THREE.Group();
      orbitPivot.rotation.y = phaseRadians;

      const orbitRadiusScene = radius * orbitRadiusPlanetRadii;
      const vertices = new Float32Array(LOCAL_ORBIT_SEGMENT_COUNT * 3);
      for (let i = 0; i < LOCAL_ORBIT_SEGMENT_COUNT; i += 1) {
        const angle = i / LOCAL_ORBIT_SEGMENT_COUNT * Math.PI * 2;
        vertices[i * 3] = Math.cos(angle) * orbitRadiusScene;
        vertices[i * 3 + 1] = 0;
        vertices[i * 3 + 2] = Math.sin(angle) * orbitRadiusScene;
      }
      const orbitGeometry = new THREE.BufferGeometry();
      orbitGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(vertices, 3),
      );
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: orbitColorHex,
        transparent: true,
        opacity: orbitOpacity01,
        depthWrite: false,
        toneMapped: false,
      });
      const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);

      assetVisual.group.position.set(orbitRadiusScene, 0, 0);

      orbitPivot.add(assetVisual.group);
      orbitPlane.add(orbit);
      orbitPlane.add(orbitPivot);
      group.add(orbitPlane);

      bindings.push(Object.freeze({
        orbitPivot,
        basePhaseRadians: phaseRadians,
        angularSpeedRadiansPerDay,
        materials: assetVisual.materials,
        orbitMaterial,
        baseLineOpacity01: orbitOpacity01,
      }));
      resources.push(orbitGeometry, orbitMaterial, ...assetVisual.resources);
    };

    let assetIndex = 0;

    for (const plan of plans) {
      const satelliteVisual = createSystemSceneArtificialSatelliteVisualV1(
        plan,
        planet.surfaceVisualVariantUint32 + assetIndex * 131,
      );
      appendOrbitalAsset(
        plan.orbitRadiusPlanetRadii,
        plan.inclinationRadians,
        plan.ascendingNodeRadians,
        plan.phaseRadians,
        plan.angularSpeedRadiansPerDay,
        plan.lineColorHex,
        plan.lineOpacity01,
        satelliteVisual,
      );
      assetIndex += 1;
    }

    for (const plan of stationPlans) {
      const stationVisual = createSystemSceneOrbitalStationVisualV1(
        plan,
        planet.surfaceVisualVariantUint32 + 10000 + assetIndex * 173,
      );
      appendOrbitalAsset(
        plan.orbitRadiusPlanetRadii,
        plan.inclinationRadians,
        plan.ascendingNodeRadians,
        plan.phaseRadians,
        plan.angularSpeedRadiansPerDay,
        plan.lineColorHex,
        plan.lineOpacity01,
        stationVisual,
      );
      assetIndex += 1;
    }

    for (const plan of ringPlans) {
      const ringVisual = createSystemSceneOrbitalRingVisualV1(plan, radius);
      ringVisual.rotationPivot.rotation.y = plan.phaseRadians;
      group.add(ringVisual.group);
      ringShadowRingsVISCIV6n.push({
        root: ringVisual.group, rotor: ringVisual.rotationPivot, plan,
      });
      resources.push(...ringVisual.resources);
      bindings.push(Object.freeze({
        orbitPivot: ringVisual.rotationPivot,
        basePhaseRadians: plan.phaseRadians,
        angularSpeedRadiansPerDay: plan.angularSpeedRadiansPerDay,
        materials: ringVisual.materials,
        orbitMaterial: null,
        baseLineOpacity01: 0,
        ringVisualVISCIV6g: ringVisual,
      }));
    }

    return Object.freeze({
      group,
      bindings: Object.freeze(bindings),
      resources: Object.freeze(resources),
      ringShadowRingsVISCIV6n: Object.freeze(ringShadowRingsVISCIV6n),
    });
  }

  private addMoon(
    moon:
      ScientificMoonPreviewVisual,

    radius:
      number,

    position:
      THREE.Vector3,

    selectedInContext:
      boolean,
  ): Readonly<{
    axialPivot:
      THREE.Group;
    spinPivot:
      THREE.Group;
  }> | null {

    if (
      this.root ===
        null
    ) {
      return null;
    }

    const renderable =
      createSystemSceneMoonRenderableV1(
        moonPresentation(moon),
        null,
        null,
        this.model.kind === ScientificBodyPreviewKind.MOON &&
          this.model.primary.moonOrdinal === moon.moonOrdinal
          ? SCIENTIFIC_BODY_TEXTURE_VIS3D2E
          : null,
      );

    const presentationRadius =
      Math.max(
        moon.presentationRadiusScene,
        1e-6,
      );

    renderable.root.scale
      .setScalar(
        radius /
          presentationRadius,
      );

    const axialPivot =
      new THREE.Group();
    axialPivot.position
      .copy(
        position,
      );
    axialPivot.rotation.z =
      systemSceneBodyAxialTiltRadians(
        moon.spin,
      );

    const spinPivot =
      new THREE.Group();
    spinPivot.rotation.y =
      this.displaySpinRadians(
        'moon',
        moon.spin,
      );
    spinPivot.add(
      renderable.root,
    );
    // 38.6c2: the MINOR_IRREGULAR gate used to discard valid VIDA.8 colonies.
    // Keep their native/civilization semantics unchanged, but support verified
    // colonies on tiny moons using the same deformed mesh as the moon visual.
    const moonInfrastructure = vida38MoonVisibleInfrastructurePlans386c2(
      moon.infrastructurePlans,moon.shapeClass==='MINOR_IRREGULAR');
    if (moonInfrastructure.length) {
      const irregularSurface = moon.shapeClass === 'MINOR_IRREGULAR'
        ? {geometry:renderable.surfaceMesh.geometry,
           geometryScale:radius/presentationRadius,radiusEarth:moon.radiusEarth}
        : null;
      const infra = createVida38InfrastructureSurfaceVisual386(moonInfrastructure,radius,null,irregularSurface,true,moon.radiusEarth,{
        temperatureKelvin:moon.sourceMoonPresentation?.sourceEstimatedSurfaceTemperatureKelvin??null,
        pressurePascal:null,iceCoverage01:moon.presentationIceCoverage01},true);
      spinPivot.add(infra.group);
      this.resources.push(...infra.resources);
      this.infrastructureVisuals.push({visual:infra,radius,surfaceMesh:renderable.surfaceMesh});
    }
    axialPivot.add(
      spinPivot,
    );

    if (
      selectedInContext
    ) {
      const haloGeometry =
        new THREE.TorusGeometry(
          radius *
            1.34,
          Math.max(
            0.008,
            radius *
              0.032,
          ),
          8,
          48,
        );

      const haloMaterial =
        new THREE.MeshBasicMaterial({
          color:
            0x73d7ff,
          transparent:
            true,
          opacity:
            0.78,
          depthWrite:
            false,
          toneMapped:
            false,
        });

      const halo =
        new THREE.Mesh(
          haloGeometry,
          haloMaterial,
        );
      halo.name =
        'GENESIS selected moon scientific context halo';

      axialPivot.add(
        halo,
      );

      this.resources.push(
        haloGeometry,
        haloMaterial,
      );
    }

    this.root.add(
      axialPivot,
    );

    this.resources
      .push(
        ...renderable.resources,
      );

    this.localSpinBindings
      .push({
        kind:
          'moon',
        spin:
          moon.spin,
        spinPivot,
      });

    return Object.freeze({
      axialPivot,
      spinPivot,
    });
  }

  private addOrbitGuide(
    motion:
      SystemOrbitalMotionDefinition,
  ): void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    const points:
      THREE.Vector3[] =
      [];

    for (
      let index = 0;
      index <
        LOCAL_ORBIT_SEGMENT_COUNT;
      index +=
        1
    ) {
      const sample =
        SystemOrbitalMotionEngine
          .positionAtSimulationDay(
            motion,
            motion.periodDays *
            index /
            LOCAL_ORBIT_SEGMENT_COUNT,
          );

      points.push(
        new THREE.Vector3(
          sample.xAu,
          sample.yAu,
          sample.zAu,
        ),
      );
    }

    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints(
          points,
        );

    const material =
      new THREE.LineBasicMaterial({
        color:
          0x6d8396,
        transparent:
          true,
        opacity:
          0.36,
      });

    this.root.add(
      new THREE.LineLoop(
        geometry,
        material,
      ),
    );

    this.resources
      .push(
        geometry,
        material,
      );
  }

  private addAsteroid(
    asteroid:
      ScientificAsteroidPreviewVisual,
  ): void {

    if (this.root === null) {
      return;
    }

    const presentation = asteroidPresentation(asteroid);
    const renderable = createSystemSceneAsteroidRenderableV1(1, presentation);
    const surfaces = renderable.object.children.filter(
      (child): child is THREE.Mesh => child instanceof THREE.Mesh,
    );
    const atlas = attachScientificMinorBodyAtlasVis3d2e(
      surfaces, 'ASTEROID', presentation.shapeSeedUint32,
    );

    this.root.add(renderable.object);
    this.resources.push(...renderable.resources, atlas);
  }

  private addComet(
    comet:
      ScientificCometPreviewVisual,

    activity:
      ScientificCometActivityPreviewVisual,
  ): void {

    if (this.root === null) {
      return;
    }

    const presentation = cometPresentation(comet);
    const renderable = createSystemSceneCometRenderableV1(
      SCIENTIFIC_COMET_PREVIEW_RADIUS_SCENE, presentation,
    );
    // Only the nucleus has a regolith map: the coma and both tails keep
    // their original lightweight translucent materials and activity model.
    const nucleus = renderable.object.children[0];
    if (!(nucleus instanceof THREE.Mesh)) {
      throw new Error('Expected comet nucleus surface in VIS3D.2e preview.');
    }
    const atlas = attachScientificMinorBodyAtlasVis3d2e(
      [nucleus], 'COMET', presentation.shapeSeedUint32,
    );

    applySystemSceneCometActivityVisualV1(
      renderable.binding,
      cometActivityPresentation(activity),
      new THREE.Vector3(1, 0.08, 0),
    );

    this.root.add(renderable.object);
    this.resources.push(...renderable.resources, atlas);
  }

  private addTransNeptunianObject(object: ScientificTransNeptunianPreviewVisual): void {
    if (this.root === null) return;
    if (object.presentation !== undefined) {
      const renderable = object.presentation.source === 'CAP_R1_PROCEDURAL'
        ? createSystemSceneCapturedRenderableV1(1, object.presentation)
        : createSystemSceneTnoRenderableV1(1, object.presentation);
      const atlas = attachScientificMinorBodyAtlasVis3d2e(
        [renderable.surface],
        object.presentation.source === 'CAP_R1_PROCEDURAL' ? 'CAPTURED' : 'TNO',
        object.presentation.variantUint32,
      );
      this.root.add(renderable.object);
      this.resources.push(...renderable.resources, atlas);
      return;
    }
    // Legacy synthetic fixtures without a physical TNO projection.
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({color:object.colorHex,roughness:0.92,metalness:0.02});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `GENESIS legacy scientific TNO ${object.title}`;
    mesh.scale.setScalar(0.90);
    this.root.add(mesh);
    this.resources.push(geometry, material);
  }

  private addMinorBodyInspectionFill():
    void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    const fill =
      new THREE.AmbientLight(
        0xffffff,
        MINOR_BODY_INSPECTION_FILL_INTENSITY,
      );
    fill.name =
      'GENESIS scientific minor-body inspection fill';

    this.root.add(
      fill,
    );
  }

  private updateLocalOrbitalDynamics():
    void {

    for (
      const binding
      of this.localMoonBindings
    ) {
      const position =
        SystemOrbitalMotionEngine
          .positionAtSimulationDay(
            binding.motion,
            this.localOrbitEpochSimulationDay +
              (this.localSimulationDay - this.localOrbitEpochSimulationDay) *
              binding.orbitalDaysPerRealSecond,
          );

      binding.axialPivot.position
        .set(
          position.xAu,
          position.yAu,
          position.zAu,
        );
    }
  }

  private updateLocalSpinDynamics():
    void {

    for (
      const binding
      of this.localSpinBindings
    ) {
      binding.spinPivot.rotation.y =
        this.displaySpinRadians(
          binding.kind,
          binding.spin,
        );
    }
  }

  private displaySpinRadians(
    kind:
      'planet' | 'moon',

    spin:
      ScientificMoonPreviewVisual['spin'] | ScientificPlanetPreviewVisual['spin'],
  ): number {

    if (
      this.model.kind !==
          ScientificBodyPreviewKind.PLANET &&
      this.model.kind !==
          ScientificBodyPreviewKind.MOON
    ) {
      return 0;
    }

    const timing =
      {
        epochSimulationDay:
          this.model.epochSimulationDay,
        playbackDaysPerRealSecond:
          this.model.spinPlaybackDaysPerRealSecond,
      };

    return kind ===
        'moon'
      ? systemSceneMoonDisplaySpinRadiansV2(
          spin,
          this.localSpinSimulationDay,
          timing,
        )
      : scientificBodyPreviewPlanetSpinRadians38bisT5(
          spin,
          this.localSpinSimulationDay,
          timing,
        );
  }

  private fitCurrentModelCamera():
    void {

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.COMET
    ) {
      this.fitCameraToCometNucleus(
        this.model.activity,
      );
      return;
    }

    this.fitCameraToRoot();
  }

  private fitCameraToCometNucleus(
    activity:
      ScientificCometActivityPreviewVisual,
  ): void {

    if (
      this.root ===
        null ||
      this.camera ===
        null
    ) {
      return;
    }

    // Keep the physical nucleus at the optical centre. Tails remain visible in
    // the positive-X field instead of dragging the camera target towards their
    // much larger bounding box.
    this.root.position.set(
      0,
      0,
      0,
    );

    this.cameraDistance =
      scientificCometPreviewCameraDistanceV1(
        activity,
      );

    this.applyCameraDistance();
  }

  private fitCameraToRoot():
    void {

    if (
      this.root ===
        null ||
      this.camera ===
        null
    ) {
      return;
    }

    this.root
      .updateMatrixWorld(
        true,
      );

    const bounds =
      new THREE.Box3()
        .setFromObject(
          this.root,
        );

    if (
      bounds.isEmpty()
    ) {
      this.cameraDistance =
        4;
      this.applyCameraDistance();
      return;
    }

    const center =
      bounds
        .getCenter(
          new THREE.Vector3(),
        );

    this.root.position
      .sub(
        center,
      );

    this.root
      .updateMatrixWorld(
        true,
      );

    const centeredBounds =
      new THREE.Box3()
        .setFromObject(
          this.root,
        );

    const sphere =
      centeredBounds
        .getBoundingSphere(
          new THREE.Sphere(),
        );

    const radius =
      Math.max(
        0.72,
        sphere.radius,
      );

    const halfFov =
      THREE.MathUtils
        .degToRad(
          this.camera.fov *
          0.5,
        );

    this.cameraDistance =
      clamp(
        radius /
          Math.tan(
            halfFov,
          ) *
          1.22,
        MIN_CAMERA_DISTANCE,
        MAX_CAMERA_DISTANCE,
      );

    this.applyCameraDistance();
  }

  private applyCameraDistance():
    void {

    if (
      this.camera ===
        null
    ) {
      return;
    }

    // T7s reparado: orientar la *cámara* de la ficha planetaria hacia la
    // iluminación real del preview. Girar la esfera no cambia qué hemisferio
    // ilumina una luz direccional fija. No alterar SystemScene ni el modal.
    const daylight =
      (this.model.kind === ScientificBodyPreviewKind.PLANET ||
       this.model.kind === ScientificBodyPreviewKind.MOON) &&
      this.colonyInspectionIndexCOLVIS2() === null
        ? scientificPreviewDaylightCameraT7s(this.previewStellarSources())
        : null;

    if (daylight !== null) {
      this.camera.position.set(
        daylight.x * this.cameraDistance,
        daylight.y * this.cameraDistance,
        daylight.z * this.cameraDistance,
      );
      // Evitar la singularidad lookAt si la luz está sobre uno de los polos.
      this.camera.up.set(
        0,
        Math.abs(daylight.y) > 0.985 ? 0 : 1,
        Math.abs(daylight.y) > 0.985 ? -1 : 0,
      );
    } else {
      this.camera.position.set(
        0,
        this.cameraDistance * 0.08,
        this.cameraDistance,
      );
      this.camera.up.set(0, 1, 0);
    }

    this.camera.lookAt(0, 0, 0);
  }

  private resize():
    void {

    if (
      this.renderer ===
        null ||
      this.camera ===
        null
    ) {
      return;
    }

    const canvas =
      this.canvasRef
        .nativeElement;

    const width =
      Math.max(
        1,
        canvas.clientWidth,
      );

    const height =
      Math.max(
        1,
        canvas.clientHeight,
      );

    this.renderer
      .setPixelRatio(
        Math.min(
          window.devicePixelRatio ||
            1,
          MAX_DEVICE_PIXEL_RATIO,
        ),
      );

    this.renderer
      .setSize(
        width,
        height,
        false,
      );

    this.camera.aspect =
      width /
      height;

    this.camera
      .updateProjectionMatrix();
  }

  private startAnimation():
    void {

    if (
      this.animationFrameId !==
        null ||
      this.renderer ===
        null ||
      this.scene ===
        null ||
      this.camera ===
        null ||
      document.visibilityState ===
        'hidden'
    ) {
      return;
    }

    this.lastAnimationTimestampMs =
      null;

    const frame =
      (
        timestampMs:
          number,
      ) => {
        if (
          this.renderer ===
            null ||
          this.scene ===
            null ||
          this.camera ===
            null
        ) {
          this.animationFrameId =
            null;
          return;
        }

        const previousTimestampMs =
          this.lastAnimationTimestampMs;

        this.lastAnimationTimestampMs =
          timestampMs;

        const elapsedRealSeconds =
          previousTimestampMs ===
            null
            ? 0
            : clamp(
                (
                  timestampMs -
                  previousTimestampMs
                ) /
                  1000,
                0,
                0.1,
              );

        const isPlanetaryPreview =
          this.model.kind ===
              ScientificBodyPreviewKind.PLANET ||
            this.model.kind ===
              ScientificBodyPreviewKind.MOON;

        let spinPlaybackDaysPerRealSecond =
          0;

        if (
          this.model.kind ===
              ScientificBodyPreviewKind.PLANET ||
          this.model.kind ===
              ScientificBodyPreviewKind.MOON
        ) {
          spinPlaybackDaysPerRealSecond =
            this.model.spinPlaybackDaysPerRealSecond;
        }

        const step =
          scientificBodyPreviewAnimationStepV1({
            autoAnimate:
              this.autoRotate(),
            pointerActive:
              this.pointerId !==
                null,
            elapsedRealSeconds,
            hasLocalOrbits:
              this.localMoonBindings.length >
                0 &&
              this.localDaysPerRealSecond >
                0,
            hasBodySpin:
              isPlanetaryPreview &&
              this.localSpinBindings.length >
                0,
            orbitalDaysPerRealSecond:
              this.localDaysPerRealSecond,
            spinDaysPerRealSecond:
              spinPlaybackDaysPerRealSecond,
          });

        if (
          step.orbitalDayDelta >
            0
        ) {
          this.localSimulationDay +=
            step.orbitalDayDelta;
          this.updateLocalOrbitalDynamics();
        }

        if (
          step.spinDayDelta >
            0
        ) {
          this.localSpinSimulationDay +=
            step.spinDayDelta;
          this.updateLocalSpinDynamics();
        }

        if (
          this.root !==
            null &&
          step.rootYawDeltaRadians !==
            0
        ) {
          this.root.rotation.y +=
            step.rootYawDeltaRadians;
        }

        this.updateStellarLightBinding();
        this.updateColonyNightLightsT7c();
        this.updateArtificialSatelliteBinding();
        this.orbitalSurfaceShadowVISCIV6n?.update(
          this.camera, this.artificialSatellitesVisible(),
        );
        this.updateInfrastructureLod386();
        this.updateColonyInspectionCameraCOLVIS2();
        this.renderer
          .render(
            this.scene,
            this.camera,
          );

        this.animationFrameId =
          window.requestAnimationFrame(
            frame,
          );
      };

    this.animationFrameId =
      window.requestAnimationFrame(
        frame,
      );
  }

  /** Fichas: misma iluminación multiestrrella que la escena 3D.
   * Son puntos MeshBasicMaterial (sin focos planetarios ni iluminación inventada).
   * La función de encendido combina las contribuciones de las estrellas.
   */
  private updateColonyNightLightsT7c():void{
    if(!this.camera||this.infrastructureVisuals.length===0)return;
    this.camera.updateMatrixWorld(true);
    this.scene?.updateMatrixWorld(true);
    const sources=this.previewStellarSources();
    const directions:THREE.Vector3[]=[];
    const weights=new THREE.Vector3();
    if(sources?.length){
      for(const source of sources.slice(0,3)){
        const d=new THREE.Vector3(source.x,source.y,source.z);
        if(d.lengthSq()<=1e-12)continue;
        directions.push(d.normalize().transformDirection(this.camera.matrixWorldInverse));
        weights.setComponent(directions.length-1,Math.max(0,Math.min(1,source.weight01)));
      }
    }
    if(directions.length===0){
      directions.push(new THREE.Vector3(4.5,3,5).normalize()
        .transformDirection(this.camera.matrixWorldInverse));
      weights.x=1;
    }
    for(const {visual} of this.infrastructureVisuals){
      visual.updateColonialNightLighting386c3(directions,weights,this.camera.matrixWorldInverse);
    }
  }

  private updateInfrastructureLod386(): void {
    if (!this.camera || this.infrastructureVisuals.length === 0) return;
    this.scene?.updateMatrixWorld(true);
    const height = this.canvasRef.nativeElement.clientHeight || 500;
    const cameraPosition = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPosition);
    const center = new THREE.Vector3();
    for (const {visual,radius} of this.infrastructureVisuals) {
      visual.group.getWorldPosition(center);
      const distance = Math.max(radius*1.05,cameraPosition.distanceTo(center));
      const pixels = 2*radius*height/(2*distance*Math.tan(this.camera.fov*Math.PI/360));
      visual.updateProjectedDiameterPixels(pixels);
    }
  }

  /** Keep the emissive-night mask aligned with the actual preview's stellar lights. */
  private updateStellarLightBinding(): void {
    const binding = this.stellarLightBinding;
    const camera = this.camera;
    if (binding === null || camera === null ||
        this.model.kind !== ScientificBodyPreviewKind.PLANET) return;
    camera.updateMatrixWorld();
    updatePreviewStellarLightBindingVISSURF6(
      binding,
      this.previewStellarSources() ?? [],
      camera.matrixWorldInverse,
    );
  }

  private applyArtificialSatelliteVisibility():
    void {
    const visible = this.artificialSatellitesVisible();
    for (const binding of this.artificialSatelliteBindings) {
      binding.orbitPivot.parent!.visible = visible;
    }
  }

  private updateArtificialSatelliteBinding(): void {
    if (
      !this.artificialSatellitesVisible() ||
      this.camera === null ||
      this.root === null ||
      this.model.kind !== ScientificBodyPreviewKind.PLANET
    ) {
      return;
    }
    this.root.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    this.camera.getWorldPosition(this.cameraWorldPositionScratch());
    this.artificialSatellitePlanetWorldPosition.setFromMatrixPosition(this.root.matrixWorld);
    this.artificialSatelliteCameraDirection
      .subVectors(this.cameraWorldPositionScratch(), this.artificialSatellitePlanetWorldPosition)
      .normalize();
    const sources = this.previewStellarSources() ?? [];
    let weightedNight = 0;
    let totalWeight = 0;
    for (const source of sources) {
      this.artificialSatelliteLightDirection.set(source.x, source.y, source.z).normalize();
      const viewDot = this.artificialSatelliteCameraDirection.dot(this.artificialSatelliteLightDirection);
      const nightFactor = THREE.MathUtils.clamp((-viewDot + 0.15) / 1.15, 0, 1);
      const weight = Math.max(source.weight01, 0.001);
      weightedNight += nightFactor * weight;
      totalWeight += weight;
    }
    const visibility = totalWeight <= 0 ? 0.34 : 0.12 + 0.88 * THREE.MathUtils.clamp(weightedNight / totalWeight, 0, 1);
    const ringStellarSourcesVISCIV6g = sources.map(source => ({
      direction: new THREE.Vector3(source.x, source.y, source.z),
      weight: source.weight01,
    }));
    for (const binding of this.artificialSatelliteBindings) {
      binding.orbitPivot.rotation.y = binding.basePhaseRadians + binding.angularSpeedRadiansPerDay * this.localSpinSimulationDay;
      if (binding.ringVisualVISCIV6g) {
        updateOrbitalRingTrafficVISCIV6k(binding.ringVisualVISCIV6g, this.localSpinSimulationDay);
      }
      const brightness = 0.24 + 0.76 * visibility;
      for (const materialBinding of binding.materials) {
        const roleGain = materialBinding.role === 'panel'
          ? 0.78
          : materialBinding.role === 'accent'
            ? 1
            : 0.88;
        materialBinding.material.color.copy(materialBinding.baseColor).multiplyScalar(
          Math.max(0.22, brightness * roleGain),
        );
      }
      if (binding.orbitMaterial !== null) {
        binding.orbitMaterial.opacity = binding.baseLineOpacity01 * visibility;
      }
      if (binding.ringVisualVISCIV6g) {
        updateOrbitalRingNightLightsVISCIV6g(
          binding.ringVisualVISCIV6g, ringStellarSourcesVISCIV6g,
        );
      }
    }
  }

  private readonly previewCameraWorldPosition =
    new THREE.Vector3();

  private cameraWorldPositionScratch(): THREE.Vector3 {
    return this.previewCameraWorldPosition;
  }

  private stopAnimation():
    void {

    if (
      this.animationFrameId ===
        null ||
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      return;
    }

    window.cancelAnimationFrame(
      this.animationFrameId,
    );

    this.animationFrameId =
      null;
    this.lastAnimationTimestampMs =
      null;
  }

  private disposeSceneResources():
    void {

    for (
      const resource of
      this.resources
    ) {
      resource.dispose();
    }

    this.resources =
      [];
    this.localMoonBindings =
      [];
    this.localSpinBindings =
      [];
    this.infrastructureVisuals = [];
    this.colonyInspectionIndexCOLVIS2.set(null);
    this.stellarLightBinding = null;
    this.orbitalSurfaceShadowVISCIV6n = null;
    this.artificialSatelliteBindings =
      [];
    this.localDaysPerRealSecond =
      0;
  }
}


function moonPresentation(
  moon: ScientificMoonPreviewVisual,
): SystemSceneMoonPresentationV1 {
  // D.3: the scientific fiche must use the exact immutable SystemScene
  // appearance. Reconstructing its scientific inputs with zero placeholders
  // incorrectly erased morphology and atmospheric chemistry.
  if (moon.sourceMoonPresentation !== undefined) {
    // D.3 parity: reconstruct the exact original render contract only here.
    // The fiche's serialized model exposes no procedural seed field name.
    return Object.freeze({
      ...moon.sourceMoonPresentation,
      presentationSeedUint32: moon.visualVariantUint32,
    });
  }
  // Backward-compatible older scientific-preview fixtures.
  return Object.freeze({
    version: 1 as const,
    sourceMoonIdentity: moon.title,
    sourceHostPlanetType: 'SCIENTIFIC_PREVIEW',
    sourceRadiusEarth: moon.radiusEarth,
    sourceMassEarth: 0,
    sourceMeanDensityGramsPerCubicCentimeter: 0,
    sourceSurfaceGravityEarth: 0,
    sourceAtmosphereRetentionIndex01: 0,
    sourceAtmosphereRegime: 'NONE',
    sourceWaterInventoryIndex01: 0,
    sourceInferredIceRichnessIndex01: 0,
    sourceSubsurfaceOceanPotentialIndex01: 0,
    sourceSurfaceLiquidWaterPotentialIndex01: 0,
    sourceWaterRegime: 'NONE',
    sourceEstimatedSurfaceTemperatureKelvin: 0,
    sourceGeologicalActivityIndex01: 0,
    sourceTidalHeatingIndex01: 0,
    sourceGeologyRegime: 'INERT',
    sourceOverallHabitabilityIndex01: 0,
    sourceIsPotentiallyHabitable: false,
    sourceGiantHostSpecialization: false,
    sourceGiantCompositionRegime: 'NOT_APPLICABLE',
    sourceIsLargeGiantMoon: false,
    sourceIsTidallyActiveGiantMoon: false,
    sourceIsOceanBearingGiantMoonCandidate: false,
    shapeClass: moon.shapeClass,
    surfaceStyle: moon.surfaceStyle,
    presentationRadiusScene: moon.presentationRadiusScene,
    presentationIrregularity01: moon.presentationIrregularity01,
    presentationLiquidCoverage01: moon.presentationLiquidCoverage01,
    presentationIceCoverage01: moon.presentationIceCoverage01,
    presentationVolcanicCoverage01: moon.presentationVolcanicCoverage01,
    presentationCloudCoverage01: moon.presentationCloudCoverage01,
    presentationAtmospherePresent: moon.presentationAtmospherePresent,
    presentationAtmosphereStrength01: moon.presentationAtmosphereStrength01,
    presentationAtmosphereShellScale: moon.presentationAtmosphereShellScale,
    presentationBaseColorHex: moon.presentationBaseColorHex,
    presentationAccentColorHex: moon.presentationAccentColorHex,
    presentationAtmosphereColorHex: moon.presentationAtmosphereColorHex,
    presentationSeedUint32: moon.visualVariantUint32,
  });
}

function scientificRingPresentation(
  ring: import('../scientific/scientific-body-preview').ScientificPlanetRingPreviewVisual,
): SystemScenePlanetRingPresentationV1 {
  return Object.freeze({
    source: 'GIANT_RING_PRESENTATION_PROXY_25_9' as const,
    presenceAuthoritative: false as const,
    sourceMoonCount: 0,
    sourceSatelliteCapacityIndex01: 0,
    sourceMoonRichnessIndex01: 0,
    sourceMoonArchitectureRegime: 'SCIENTIFIC_PREVIEW',
    sourceIceBearingFractionOfSolids01: ring.iceFraction01,
    sourceReferenceBondAlbedo01: 0,
    innerRadiusPlanetRadii: ring.innerRadiusPlanetRadii,
    outerRadiusPlanetRadii: ring.outerRadiusPlanetRadii,
    opticalDepth01: ring.opticalDepth01,
    iceFraction01: ring.iceFraction01,
    dustFraction01: ring.dustFraction01,
    bandCount: ring.bandCount,
    gapCount: ring.gapCount,
    presentationSeedUint32: ring.visualVariantUint32,
    presentationBaseColorHex: ring.presentationBaseColorHex,
    presentationAccentColorHex: ring.presentationAccentColorHex,
  });
}

function asteroidPresentation(
  asteroid: ScientificAsteroidPreviewVisual,
): SystemSceneAsteroidPresentationV1 {
  // The exact visual seed stays inside the renderer; no raw procedural ID is
  // exposed through the scientific card. The remaining parameters are the
  // same physical snapshot attributes used in SystemScene (A.6 parity).
  return Object.freeze({
    ...asteroid,
    shapeSeedUint32: asteroid.visualVariantUint32,
    source: 'PHASE_22_4_ASTEROID_TAXONOMY' as const,
    proceduralId: 'SCIENTIFIC-PREVIEW',
    sourceDiameterKilometers: asteroid.diameterKilometers ?? 100,
    carbonaceousFraction01: asteroid.carbonaceousFraction01 ?? 0.25,
    silicateFraction01: asteroid.silicateFraction01 ?? 0.25,
    metalFraction01: asteroid.metalFraction01 ?? 0.25,
    iceFraction01: asteroid.iceFraction01 ?? 0.25,
    porosityIndex01: asteroid.porosityIndex01 ?? 0,
    geometricAlbedo01: asteroid.geometricAlbedo01 ?? 0.1,
    bulkDensityGramsPerCubicCentimeter: 1,
    binaryMassRatio01: null,
    binarySeparationPrimaryRadii: null,
  });
}

function cometPresentation(
  comet: ScientificCometPreviewVisual,
): SystemSceneCometPresentationV1 {
  return Object.freeze({
    ...comet,
    shapeSeedUint32: comet.visualVariantUint32,
    source: 'PHASE_22_6_COMET_ACTIVITY' as const,
    proceduralId: 'SCIENTIFIC-PREVIEW',
    sourceDiameterKilometers: 1,
    iceFraction01: 0.5,
    dustFraction01: 0.5,
    porosityIndex01: 0.5,
    bulkDensityGramsPerCubicCentimeter: 0.6,
    geometricAlbedo01: 0.04,
    volatileRichnessIndex01: 0.5,
    periodRegime: 'SHORT_PERIOD' as const,
    referenceLuminositySolar: 1,
    semiMajorAxisAu: 1,
    eccentricity: 0,
    periapsisAu: 1,
    apoapsisAu: 1,
    orbitalPeriodYears: 1,
    epochMeanAnomalyDegrees: 0,
    presentationTimeScale: 1,
  });
}

function cometActivityPresentation(
  activity: ScientificCometActivityPreviewVisual,
): SystemSceneCometActivityPresentationV1 {
  return Object.freeze({
    ...activity,
    sourceDistanceAu: 1,
    solarEquivalentDistanceAu: 1,
    incidentFluxEarth: 1,
    equilibriumTemperatureKelvin: 278.33,
    waterIceActivitySupportIndex01: 0,
    supervolatileActivitySupportIndex01: 0,
    activityIndex01: 0,
    presentationDustTailLengthRadii: 0,
    presentationDustTailWidthRadii: 0,
    presentationIonTailLengthRadii: 0,
    presentationIonTailWidthRadii: 0,
  });
}

function localScientificMoonMotion(
  moon:
    ScientificMoonPreviewVisual,

  localScenePerPlanetRadius:
    number,
): SystemOrbitalMotionDefinition {

  return Object.freeze({
    id:
      `scientific-local-moon-${moon.moonOrdinal}`,
    semiMajorAxisAu:
      moon.orbit.semiMajorAxisPlanetRadii *
      localScenePerPlanetRadius,
    eccentricity:
      moon.orbit.eccentricity,
    periodDays:
      moon.orbit.orbitalPeriodDays,
    rotationDegrees:
      moon.orbit.rotationDegrees,
    inclinationDegrees:
      moon.orbit.inclinationDegrees,
    epochMeanAnomalyDegrees:
      moon.orbit.epochMeanAnomalyDegrees,
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
