import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import * as THREE from 'three';

import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';
import {
  neutronStarLaboratoryModel,
  type NeutronStarLaboratoryRenderModel,
} from './neutron-star-laboratory-render-model';
import {
  type XrayBinaryLaboratoryRenderModel,
} from './xray-binary-laboratory-render-model';
import {
  blackHoleLaboratoryModel,
  type BlackHoleLaboratoryRenderModel,
} from './black-hole-laboratory-render-model';
import {
  extremeLaboratoryCameraPreset,
  extremeLaboratoryScalePolicy,
  type ExtremeLaboratoryDetailStage,
} from './extreme-laboratory-render-infrastructure';

interface LaboratoryStellarSnapshot {
  readonly id: string;
  readonly label: string;
  readonly colorHex: string;
  readonly radiusScene: number;
  readonly opticalRadiusScene?: number;
  readonly lightIntensity: number;
  readonly position: Readonly<{ x: number; y: number; z: number }>;
}

export type XrayBinaryRenderDetailStage = ExtremeLaboratoryDetailStage;

@Component({
  selector: 'app-xray-binary-laboratory-render',
  standalone: true,
  templateUrl: './xray-binary-laboratory-render.html',
  styleUrl: './xray-binary-laboratory-render.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XrayBinaryLaboratoryRender implements AfterViewInit, OnChanges, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('renderCanvas') private renderCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('renderHost') private renderHost?: ElementRef<HTMLElement>;

  @Input({ required: true }) model!: XrayBinaryLaboratoryRenderModel;
  @Input() animationEnabled = true;
  @Input() detailStage: XrayBinaryRenderDetailStage | string = 'CONFIRMED';
  @Input() publishIdentity = true;

  readonly renderUnavailable = signal(false);

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrame: number | null = null;
  private lastFrameMs = 0;

  private readonly neutronSurfaceShaderMaterials: THREE.ShaderMaterial[] = [];
  private readonly primaryDiskShaderMaterials: THREE.ShaderMaterial[] = [];
  private readonly streamShaderMaterials: THREE.ShaderMaterial[] = [];
  private readonly jetShaderMaterials: THREE.ShaderMaterial[] = [];
  private readonly persistentDisposables: Array<THREE.Texture | THREE.Material> = [];

  private compactRoot: THREE.Group | null = null;
  private compactSpinGroup: THREE.Group | null = null;
  private donorGroup: THREE.Group | null = null;
  private orbitalGuideRoot: THREE.Group | null = null;
  private donorPivot: THREE.Group | null = null;
  private compactPivot: THREE.Group | null = null;
  private starHaloTexture: THREE.CanvasTexture | null = null;
  private starBloomTexture: THREE.CanvasTexture | null = null;
  private starGlareTexture: THREE.CanvasTexture | null = null;
  private primaryDiskGroup: THREE.Group | null = null;
  private streamGroup: THREE.Group | null = null;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initializeThree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['model'] || changes['animationEnabled'] || changes['detailStage']) &&
      this.renderer !== null
    ) {
      this.rebuildScene();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animationFrame);
    }
    this.resizeObserver?.disconnect();
    this.disposeSceneObjects();
    for (const disposable of this.persistentDisposables) {
      disposable.dispose();
    }
    this.persistentDisposables.length = 0;
    this.renderer?.dispose();
    this.renderer = null;
  }

  sampleTitle(): string {
    return `${this.model.label} · muestra ${this.model.sampleLabel}`;
  }

  presentationTitle(): string {
    if (this.publishIdentity) {
      return this.sampleTitle();
    }

    return this.detailStage === 'DETECTED'
      ? `Fuente extrema · muestra ${this.model.sampleLabel}`
      : `Sistema compacto en caracterización · muestra ${this.model.sampleLabel}`;
  }

  presentationCode(): string {
    return this.publishIdentity
      ? this.model.type
      : 'EXTREME_SOURCE';
  }

  private initializeThree(): void {
    const canvas = this.renderCanvas?.nativeElement;
    const host = this.renderHost?.nativeElement;
    if (canvas === undefined || host === undefined) return;

    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      context = canvas.getContext('webgl2', { alpha: true, antialias: true }) ??
        canvas.getContext('webgl', { alpha: true, antialias: true });
    } catch {
      context = null;
    }
    if (context === null) {
      this.renderUnavailable.set(true);
      return;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        context: context as WebGLRenderingContext,
        antialias: true,
        alpha: true,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x01040a, 1);
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x01040a);
      const cameraPreset = extremeLaboratoryCameraPreset(this.model.type);
      this.camera = new THREE.PerspectiveCamera(
        cameraPreset.fovDegrees,
        1,
        cameraPreset.near,
        cameraPreset.far,
      );
      this.camera.position.set(
        cameraPreset.position.x,
        cameraPreset.position.y,
        cameraPreset.position.z,
      );
      this.camera.lookAt(
        cameraPreset.target.x,
        cameraPreset.target.y,
        cameraPreset.target.z,
      );

      this.starHaloTexture = createRadialGlowTexture('broad');
      this.starBloomTexture = createRadialGlowTexture('compact');
      this.starGlareTexture = createStellarGlareTexture();
      this.persistentDisposables.push(
        this.starHaloTexture,
        this.starBloomTexture,
        this.starGlareTexture,
      );

      this.rebuildScene();
      this.resize();
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(host);
      }
      this.animate(0);
    } catch {
      this.renderUnavailable.set(true);
      this.renderer?.dispose();
      this.renderer = null;
    }
  }

  private applySharedCameraPreset(): void {
    if (this.camera === null || this.model === undefined) return;
    const cameraPreset = extremeLaboratoryCameraPreset(this.model.type);
    this.camera.fov = cameraPreset.fovDegrees;
    this.camera.near = cameraPreset.near;
    this.camera.far = cameraPreset.far;
    this.camera.position.set(
      cameraPreset.position.x,
      cameraPreset.position.y,
      cameraPreset.position.z,
    );
    this.camera.lookAt(
      cameraPreset.target.x,
      cameraPreset.target.y,
      cameraPreset.target.z,
    );
    this.camera.updateProjectionMatrix();
  }

  private rebuildScene(): void {
    if (this.scene === null || this.camera === null || this.model === undefined) return;
    this.disposeSceneObjects();
    this.scene.clear();
    this.applySharedCameraPreset();

    if (this.detailStage === 'DETECTED') {
      this.buildDetectedSchematicScene();
      return;
    }

    if (this.detailStage === 'DISCOVERED') {
      this.buildDiscoveredSimplifiedScene();
      return;
    }

    this.scene.add(new THREE.AmbientLight(0x8ebfe2, 0.48));

    const donorKey = new THREE.PointLight(0xa8d8ff, 5.8, 50, 1.55);
    donorKey.position.set(-5.6, 2.2, 7.2);
    this.scene.add(donorKey);

    const compactKey = new THREE.PointLight(0x62d9ff, 4.4, 28, 1.7);
    compactKey.position.set(3.8, 1.9, 4.8);
    this.scene.add(compactKey);

    const fill = new THREE.PointLight(0x3a6ca6, 1.5, 34, 2);
    fill.position.set(0, -3.5, 4.4);
    this.scene.add(fill);

    const compactRoot = new THREE.Group();
    const scalePolicy = extremeLaboratoryScalePolicy(this.model.type);
    compactRoot.scale.setScalar(scalePolicy.apparentScale);
    this.scene.add(compactRoot);
    this.compactRoot = compactRoot;


    const donorPivot = new THREE.Group();
    donorPivot.position.set(-3.0, 0, 0);
    compactRoot.add(donorPivot);
    this.donorPivot = donorPivot;

    const compactPivot = new THREE.Group();
    compactPivot.position.set(3.0, 0, 0);
    compactRoot.add(compactPivot);
    this.compactPivot = compactPivot;

    const donor = this.createDonorStarSnapshot();
    this.addStar(donor, donorPivot);
    this.donorGroup = donorPivot;

    const compactSpinGroup = new THREE.Group();
    compactSpinGroup.rotation.z = THREE.MathUtils.degToRad(9);
    compactSpinGroup.scale.setScalar(0.25);
    compactPivot.add(compactSpinGroup);
    this.compactSpinGroup = compactSpinGroup;

    const neutronModel = this.compactModel();
    const blackHoleDiskModel = this.blackHoleDiskModel();
    const isMicroquasar = this.model.type === ExtremeType.MICROQUASAR;
    const isUlx = this.model.type === ExtremeType.ULX;
    const isBlackHoleBinary = this.model.type === ExtremeType.X_RAY_BINARY_BH || isMicroquasar || isUlx;

    if (isBlackHoleBinary) {
      this.addCompleteCompactBlackHole(compactPivot, blackHoleDiskModel);
      this.addMatterTransferPlume(compactRoot, donor, blackHoleDiskModel);
      if (isMicroquasar) this.addMicroquasarJets(compactPivot, blackHoleDiskModel);
      if (isUlx) {
        this.addUlxSupercriticalAccretion(compactPivot, blackHoleDiskModel);
        this.addUlxRadiativeWinds(compactPivot, blackHoleDiskModel);
      }
      this.compactSpinGroup = null;
      compactPivot.remove(compactSpinGroup);
    } else {
      this.addBlackHoleMainAccretionDisk(compactPivot, blackHoleDiskModel, 0.329);
      this.addMatterTransferPlume(compactRoot, donor, blackHoleDiskModel);
      this.addDetailedNeutronStar(compactSpinGroup, neutronModel);
      const magneticGroup = new THREE.Group();
      magneticGroup.rotation.z = THREE.MathUtils.degToRad(neutronModel.magneticInclinationDegrees ?? 0);
      compactSpinGroup.add(magneticGroup);
      this.addMagneticField(magneticGroup, neutronModel);
    }

    this.scene.add(this.createBackgroundStars());
  }

  private buildDetectedSchematicScene(): void {
    if (this.scene === null) return;

    const schematicRoot = new THREE.Group();
    schematicRoot.name = 'X-ray binary detected schematic';
    this.scene.add(schematicRoot);

    const donorColor = new THREE.Color(this.model.donorColor).multiplyScalar(0.72);
    const accentColor = new THREE.Color(this.model.diskOuterColor);
    const donorRadius = 1.02;
    const donor = new THREE.Mesh(
      new THREE.SphereGeometry(donorRadius, 32, 24),
      new THREE.MeshBasicMaterial({
        color: donorColor,
        transparent: true,
        opacity: 0.32,
        wireframe: true,
      }),
    );
    donor.position.set(-3, 0, 0);
    schematicRoot.add(donor);

    const donorCore = new THREE.Mesh(
      new THREE.SphereGeometry(donorRadius * 0.88, 24, 18),
      new THREE.MeshBasicMaterial({
        color: donorColor,
        transparent: true,
        opacity: 0.16,
      }),
    );
    donorCore.position.copy(donor.position);
    schematicRoot.add(donorCore);

    const streamCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-1.96, 0.05, 0),
      new THREE.Vector3(-0.70, 0.32, 0),
      new THREE.Vector3(1.30, 0.13, 0),
      new THREE.Vector3(2.62, 0.02, 0),
    );
    const stream = new THREE.Mesh(
      new THREE.TubeGeometry(streamCurve, 56, 0.025, 6, false),
      new THREE.MeshBasicMaterial({
        color: 0xa9e9ff,
        transparent: true,
        opacity: 0.54,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    schematicRoot.add(stream);

    const disk = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.70, 96, 1),
      new THREE.MeshBasicMaterial({
        color: accentColor,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    disk.position.set(3, 0, 0);
    disk.scale.y = 0.22;
    schematicRoot.add(disk);

    const isNeutronStar = this.model.type === ExtremeType.X_RAY_BINARY_NS;
    const compact = new THREE.Mesh(
      new THREE.SphereGeometry(isNeutronStar ? 0.16 : 0.22, 40, 28),
      new THREE.MeshBasicMaterial({
        color: isNeutronStar ? 0x8fe9ff : 0x000000,
        transparent: true,
        opacity: isNeutronStar ? 0.58 : 1,
      }),
    );
    compact.position.set(3, 0, 0.015);
    compact.renderOrder = 3;
    schematicRoot.add(compact);

    const compactSignal = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.34, 96, 1),
      new THREE.MeshBasicMaterial({
        color: isNeutronStar ? 0x86e9ff : 0xffb45d,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
      }),
    );
    compactSignal.position.set(3, 0, 0.02);
    schematicRoot.add(compactSignal);

    if (this.model.type === ExtremeType.MICROQUASAR) {
      this.addDetectedSchematicOutflows(schematicRoot, false);
    }
    if (this.model.type === ExtremeType.ULX) {
      this.addDetectedSchematicOutflows(schematicRoot, true);
    }

    const baseline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-4.7, -1.65, -0.02),
        new THREE.Vector3(4.7, -1.65, -0.02),
      ]),
      new THREE.LineDashedMaterial({
        color: 0x2d6c91,
        transparent: true,
        opacity: 0.23,
        dashSize: 0.10,
        gapSize: 0.12,
      }),
    );
    baseline.computeLineDistances();
    schematicRoot.add(baseline);
  }

  private addDetectedSchematicOutflows(parent: THREE.Group, broad: boolean): void {
    const color = broad ? 0x58bfe8 : 0x72ddff;
    const material = new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity: broad ? 0.34 : 0.54,
      dashSize: broad ? 0.18 : 0.12,
      gapSize: broad ? 0.12 : 0.10,
    });

    for (const direction of [-1, 1] as const) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(3, 0.14 * direction, 0),
        new THREE.Vector3(3.08, (broad ? 2.55 : 3.00) * direction, 0),
      ]);
      const line = new THREE.Line(geometry, material.clone());
      line.computeLineDistances();
      parent.add(line);

      if (broad) {
        const sideMaterial = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.18,
        });
        const left = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(2.84, 0.18 * direction, 0),
            new THREE.Vector3(2.36, 2.05 * direction, 0),
          ]),
          sideMaterial,
        );
        const right = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(3.16, 0.18 * direction, 0),
            new THREE.Vector3(3.64, 2.05 * direction, 0),
          ]),
          sideMaterial.clone(),
        );
        parent.add(left, right);
      }
    }
  }

  private buildDiscoveredSimplifiedScene(): void {
    if (this.scene === null) return;

    this.scene.add(new THREE.AmbientLight(0x799cbc, 0.34));
    const donorLight = new THREE.PointLight(0xa7d9ff, 2.1, 28, 1.7);
    donorLight.position.set(-3.2, 1.3, 4.0);
    this.scene.add(donorLight);

    const root = new THREE.Group();
    root.name = 'X-ray binary discovered simplified scene';
    this.scene.add(root);

    const donorRadius = 0.98 + THREE.MathUtils.clamp(this.model.donorScale, 0.55, 1.95) * 0.22;
    const donor = new THREE.Mesh(
      new THREE.SphereGeometry(donorRadius, 48, 32),
      new THREE.MeshPhongMaterial({
        color: new THREE.Color(this.model.donorColor),
        emissive: new THREE.Color(this.model.donorColor).multiplyScalar(0.18),
        emissiveIntensity: 0.85,
        shininess: 28,
      }),
    );
    donor.position.set(-3, 0, 0);
    root.add(donor);

    if (this.starHaloTexture !== null) {
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.starHaloTexture,
          color: new THREE.Color(this.model.donorColor),
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      halo.position.copy(donor.position);
      halo.scale.setScalar(donorRadius * 3.0);
      root.add(halo);
    }

    const diskModel = this.blackHoleDiskModel();
    const disk = new THREE.Mesh(
      new THREE.RingGeometry(0.20, 0.86, 128, 1),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(diskModel.diskColorMid),
        transparent: true,
        opacity: 0.58,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    disk.position.set(3, 0, 0);
    disk.scale.y = 0.23;
    root.add(disk);

    const hotInner = new THREE.Mesh(
      new THREE.RingGeometry(0.20, 0.44, 128, 1),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(diskModel.diskColorInner),
        transparent: true,
        opacity: 0.68,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    hotInner.position.set(3, 0, 0.01);
    hotInner.scale.y = 0.21;
    root.add(hotInner);

    const streamCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-1.78, 0.04, 0),
      new THREE.Vector3(-0.60, 0.30, 0),
      new THREE.Vector3(1.45, 0.10, 0),
      new THREE.Vector3(2.48, 0.01, 0),
    );
    const stream = new THREE.Mesh(
      new THREE.TubeGeometry(streamCurve, 76, 0.055, 8, false),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.model.streamColor),
        transparent: true,
        opacity: 0.40,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    root.add(stream);

    if (this.model.type === ExtremeType.X_RAY_BINARY_NS) {
      const neutron = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 56, 36),
        new THREE.MeshBasicMaterial({
          color: 0x9beaff,
        }),
      );
      neutron.position.set(3, 0, 0.025);
      neutron.renderOrder = 4;
      root.add(neutron);
    } else {
      const blackHole = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 64, 40),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
        }),
      );
      blackHole.position.set(3, 0, 0.028);
      blackHole.renderOrder = 4;
      root.add(blackHole);
    }

    if (this.model.type === ExtremeType.MICROQUASAR) {
      this.addDiscoveredBipolarOutflow(root, diskModel, false);
    }
    if (this.model.type === ExtremeType.ULX) {
      this.addDiscoveredBipolarOutflow(root, diskModel, true);
      const supercriticalDisk = new THREE.Mesh(
        new THREE.RingGeometry(0.23, 1.02, 128, 1),
        new THREE.MeshBasicMaterial({
          color: 0xdaf9ff,
          transparent: true,
          opacity: 0.26,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      supercriticalDisk.position.set(3, 0, -0.01);
      supercriticalDisk.scale.y = 0.30;
      root.add(supercriticalDisk);
    }

    this.scene.add(this.createBackgroundStars());
  }

  private addDiscoveredBipolarOutflow(
    parent: THREE.Group,
    diskModel: BlackHoleLaboratoryRenderModel,
    broad: boolean,
  ): void {
    const diskRotation = new THREE.Euler(
      THREE.MathUtils.degToRad(90 - diskModel.inclinationDegrees),
      0,
      THREE.MathUtils.degToRad(6),
      'XYZ',
    );
    const axis = new THREE.Vector3(0, 0, 1).applyEuler(diskRotation).normalize();
    const length = broad ? 2.55 : 3.15;
    const startRadius = broad ? 0.18 : 0.06;
    const endRadius = broad ? 0.58 : 0.14;

    for (const sign of [-1, 1] as const) {
      const direction = axis.clone().multiplyScalar(sign);
      const geometry = new THREE.CylinderGeometry(
        endRadius,
        startRadius,
        length,
        32,
        1,
        true,
      );
      const material = new THREE.MeshBasicMaterial({
        color: broad ? 0x67c5eb : 0x8ae7ff,
        transparent: true,
        opacity: broad ? 0.13 : 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const outflow = new THREE.Mesh(geometry, material);
      outflow.position
        .set(3, 0, 0)
        .add(direction.clone().multiplyScalar(length * 0.5));
      outflow.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction,
      );
      parent.add(outflow);
    }
  }

  private compactModel(): NeutronStarLaboratoryRenderModel {
    const sampleIndex = Math.max(0, Math.min(7, this.model.sampleLabel.charCodeAt(0) - 65));
    return neutronStarLaboratoryModel(ExtremeType.NEUTRON_STAR, sampleIndex);
  }

  private blackHoleDiskModel(): BlackHoleLaboratoryRenderModel {
    const sampleIndex = Math.max(0, Math.min(7, this.model.sampleLabel.charCodeAt(0) - 65));
    return blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, sampleIndex);
  }

  private createDonorStarSnapshot(): LaboratoryStellarSnapshot {
    // Amplify donor-star size variation so the compact-binary families do not only
    // change in color/temperature: the left-hand star should also read clearly as
    // physically larger or smaller from sample to sample.
    const donorScale = THREE.MathUtils.clamp(this.model.donorScale, 0.55, 1.95);
    const donorRadius = 0.72 + donorScale * 0.56;
    const opticalRadius = donorRadius * 1.08;
    return Object.freeze({
      id: `xrb-donor-${this.model.sampleLabel}`,
      label: `${this.model.donorLabel}`,
      colorHex: this.model.donorColor,
      radiusScene: donorRadius,
      opticalRadiusScene: opticalRadius,
      lightIntensity: 1.9 + donorScale * 1.0,
      position: Object.freeze({ x: 0, y: 0, z: 0 }),
    });
  }

  private addOrbitalGuides(_group: THREE.Group): void {
    // Deliberately disabled for the X-ray binary laboratory view.
  }

  private addStar(star: LaboratoryStellarSnapshot, parent: THREE.Object3D): void {
    if (this.starHaloTexture === null || this.starBloomTexture === null || this.starGlareTexture === null) {
      return;
    }

    const group = new THREE.Group();
    group.name = `Star ${star.label}`;
    group.position.set(star.position.x, star.position.y, star.position.z);

    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: star.colorHex,
      toneMapped: false,
    });

    const photosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 48),
      sphereMaterial,
    );
    photosphere.scale.setScalar(star.radiusScene);
    photosphere.name = `${star.label} photosphere`;

    const optics = stellarOpticalProfile(star);
    const opticalRadiusScene = star.opticalRadiusScene ?? star.radiusScene;

    const coronaMaterial = stellarSpriteMaterial(
      this.starHaloTexture,
      star.colorHex,
      optics.coronaOpacity,
    );
    const corona = new THREE.Sprite(coronaMaterial);
    const coronaDiameter = opticalRadiusScene * optics.coronaDiameterScale;
    corona.scale.set(coronaDiameter, coronaDiameter, 1);
    corona.name = `${star.label} corona`;

    const bloomMaterial = stellarSpriteMaterial(
      this.starBloomTexture,
      star.colorHex,
      optics.bloomOpacity,
    );
    const bloom = new THREE.Sprite(bloomMaterial);
    const bloomDiameter = opticalRadiusScene * optics.bloomDiameterScale;
    bloom.scale.set(bloomDiameter, bloomDiameter, 1);
    bloom.name = `${star.label} bloom`;

    const aureoleMaterial = stellarSpriteMaterial(
      this.starBloomTexture,
      star.colorHex,
      optics.aureoleOpacity,
    );
    const aureole = new THREE.Sprite(aureoleMaterial);
    const aureoleDiameter = opticalRadiusScene * optics.aureoleDiameterScale;
    aureole.scale.set(aureoleDiameter, aureoleDiameter, 1);
    aureole.name = `${star.label} aureole`;

    const glareMaterial = stellarSpriteMaterial(
      this.starGlareTexture,
      stellarDiffractionColor(star.colorHex, optics.energy01),
      optics.glareOpacity,
    );
    const glare = new THREE.Sprite(glareMaterial);
    glare.scale.set(
      opticalRadiusScene * optics.glareDiameterScale,
      opticalRadiusScene * optics.glareDiameterScale,
      1,
    );
    glare.name = `${star.label} diffraction glare`;

    const light = new THREE.PointLight(star.colorHex, star.lightIntensity, 0, 1.45);
    light.name = `${star.label} illumination`;

    group.add(corona, glare, bloom, aureole, photosphere, light);
    parent.add(group);
  }



  private addCompleteCompactBlackHole(
    parent: THREE.Group,
    diskModel: BlackHoleLaboratoryRenderModel,
  ): void {
    const scale = 0.329;

    const blackHoleSystem = new THREE.Group();
    blackHoleSystem.name = 'Compact black hole system';
    blackHoleSystem.scale.setScalar(scale);
    parent.add(blackHoleSystem);

    const inclinedDiskGroup = new THREE.Group();
    blackHoleSystem.add(inclinedDiskGroup);

    const canonicalGroup = new THREE.Group();
    canonicalGroup.rotation.z = THREE.MathUtils.degToRad(6);
    blackHoleSystem.add(canonicalGroup);

    this.addBlackHoleMainAccretionDisk(inclinedDiskGroup, diskModel, 1.0);
    this.addCompactBlackHoleShadow(canonicalGroup);
    this.addCompactBlackHolePhotonRing(canonicalGroup, diskModel);
    this.addCompactBlackHoleLensedDiskImages(canonicalGroup, diskModel);
    this.addCompactBlackHoleUpperShadowHemisphere(canonicalGroup);
    this.addCompactBlackHoleContourWrap(canonicalGroup, diskModel);
  }

  private addCompactBlackHoleShadow(group: THREE.Group): void {
    const shadow = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 96, 64),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 1,
        blending: THREE.NormalBlending,
        depthTest: false,
        depthWrite: false,
      }),
    );
    shadow.renderOrder = 4;
    group.add(shadow);
  }

  private addCompactBlackHolePhotonRing(
    group: THREE.Group,
    diskModel: BlackHoleLaboratoryRenderModel,
  ): void {
    const photonRing = new THREE.Mesh(
      new THREE.RingGeometry(0.93, 1.03, 224, 1),
      this.createBlackHoleDiskFlowMaterial(diskModel, {
        brightness: diskModel.diskBrightness * 1.18,
        opacity: 0.42 + 0.16 * diskModel.lensingStrength,
        innerCut: 0.0,
        outerCut: 1.0,
        bandScale: 72.0,
        flowRate: 1.25,
        frontMask: false,
        innerGlowBoost: 1.38,
      }),
    );
    photonRing.scale.y = 0.22;
    photonRing.position.z = 0.010;
    photonRing.renderOrder = 2;
    group.add(photonRing);
  }

  private addCompactBlackHoleUpperShadowHemisphere(group: THREE.Group): void {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying float vRelativeViewY;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vec4 viewCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vRelativeViewY = viewPosition.y - viewCenter.y;
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vRelativeViewY;
        void main() {
          if (vRelativeViewY < 0.0) discard;
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
    });

    const upperHemisphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 96, 64),
      material,
    );
    upperHemisphere.renderOrder = 20;
    group.add(upperHemisphere);
  }

  private addCompactBlackHoleContourWrap(
    group: THREE.Group,
    diskModel: BlackHoleLaboratoryRenderModel,
  ): void {
    const contourWrap = new THREE.Mesh(
      new THREE.RingGeometry(0.84, 0.96, 256, 1),
      this.createBlackHoleDiskFlowMaterial(diskModel, {
        brightness: diskModel.diskBrightness * 1.42,
        opacity: 0.60 + 0.20 * diskModel.lensingStrength,
        innerCut: 0.0,
        outerCut: 1.0,
        bandScale: 68.0,
        flowRate: 1.08,
        frontMask: false,
        innerGlowBoost: 1.18,
      }),
    );
    contourWrap.scale.y = 0.95;
    contourWrap.position.z = 0.018;
    contourWrap.renderOrder = 19.2;
    group.add(contourWrap);
  }

  private upperLensedBandThicknessScale(): number {
    return 0.60;
  }

  private addCompactBlackHoleLensedDiskImages(
    group: THREE.Group,
    diskModel: BlackHoleLaboratoryRenderModel,
  ): void {
    const upperBandThicknessScale = this.upperLensedBandThicknessScale();
    const topBandHalo = this.createCompactBlackHoleLensedDiskBand(diskModel, {
      yOffset: 0.30,
      zOffset: 0.018,
      bend: 1.03,
      leftWidth: 1.14,
      rightWidth: 1.24,
      height: 1.10,
      thickness: 0.16,
      brightness: diskModel.diskBrightness * 0.80,
      opacity: 0.20,
      flowRate: 0.98,
      invertFlow: false,
      thicknessScale: upperBandThicknessScale,
    });
    const topBand = this.createCompactBlackHoleLensedDiskBand(diskModel, {
      yOffset: 0.28,
      zOffset: 0.028,
      bend: 0.99,
      leftWidth: 1.04,
      rightWidth: 1.14,
      height: 1.04,
      thickness: 0.14,
      brightness: diskModel.diskBrightness * 0.98,
      opacity: 0.64,
      flowRate: 1.02,
      invertFlow: false,
      thicknessScale: upperBandThicknessScale,
    });

    const leftJoinHalo = this.createCompactBlackHoleLensedJoinBand(diskModel, -1, true);
    const leftJoin = this.createCompactBlackHoleLensedJoinBand(diskModel, -1, false);
    const rightJoinHalo = this.createCompactBlackHoleLensedJoinBand(diskModel, 1, true);
    const rightJoin = this.createCompactBlackHoleLensedJoinBand(diskModel, 1, false);

    topBandHalo.renderOrder = 8.1;
    topBand.renderOrder = 8.2;
    leftJoinHalo.renderOrder = 8.05;
    leftJoin.renderOrder = 8.15;
    rightJoinHalo.renderOrder = 8.05;
    rightJoin.renderOrder = 8.15;

    group.add(topBandHalo);
    group.add(leftJoinHalo);
    group.add(rightJoinHalo);
    group.add(topBand);
    group.add(leftJoin);
    group.add(rightJoin);
  }

  private createCompactBlackHoleLensedDiskBand(
    diskModel: BlackHoleLaboratoryRenderModel,
    config: {
      yOffset: number;
      zOffset: number;
      bend: number;
      leftWidth: number;
      rightWidth: number;
      height: number;
      thickness: number;
      brightness: number;
      opacity: number;
      flowRate: number;
      invertFlow: boolean;
      thicknessScale: number;
    },
  ): THREE.Mesh {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: new THREE.Color(diskModel.diskColorInner) },
        uMid: { value: new THREE.Color(diskModel.diskColorMid) },
        uOuter: { value: new THREE.Color(diskModel.diskColorOuter) },
        uBrightness: { value: config.brightness },
        uOpacity: { value: config.opacity },
        uYOffset: { value: config.yOffset },
        uZOffset: { value: config.zOffset },
        uLeftWidth: { value: config.leftWidth },
        uRightWidth: { value: config.rightWidth },
        uHeight: { value: config.height },
        uThickness: { value: config.thickness },
        uBend: { value: config.bend },
        uFlowRate: { value: config.flowRate },
        uInvertFlow: { value: config.invertFlow ? 1.0 : 0.0 },
        uThicknessScale: { value: config.thicknessScale },
        uSpin: { value: diskModel.spinDimensionless },
        uTurbulenceScale: { value: diskModel.turbulenceScale },
        uTurbulenceStrength: { value: diskModel.turbulenceStrength },
      },
      vertexShader: `
        uniform float uYOffset;
        uniform float uZOffset;
        uniform float uLeftWidth;
        uniform float uRightWidth;
        uniform float uHeight;
        varying vec2 vUv;
        varying vec2 vLocal;
        void main() {
          vUv = uv;
          float x = mix(-uLeftWidth, uRightWidth, uv.x);
          float y = (uYOffset - 0.26) + uv.y * uHeight;
          vLocal = vec2(x, y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, uZOffset, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uInner;
        uniform vec3 uMid;
        uniform vec3 uOuter;
        uniform float uBrightness;
        uniform float uOpacity;
        uniform float uBend;
        uniform float uFlowRate;
        uniform float uInvertFlow;
        uniform float uThicknessScale;
        uniform float uLeftWidth;
        uniform float uRightWidth;
        uniform float uHeight;
        uniform float uSpin;
        uniform float uTurbulenceScale;
        uniform float uTurbulenceStrength;
        varying vec2 vUv;
        varying vec2 vLocal;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          float x = vLocal.x;
          float y = vLocal.y;
          float ax = abs(x);

          float shadowRadius = 0.82;
          float contourY = sqrt(max(0.0, shadowRadius * shadowRadius - x * x));
          float insideShadowBlend = 1.0 - smoothstep(shadowRadius - 0.12, shadowRadius + 0.12, ax);

          float maxHalfWidth = max(uLeftWidth, uRightWidth);
          float sideT = clamp((ax - shadowRadius) / (maxHalfWidth - shadowRadius), 0.0, 1.0);
          float sideEase = sideT * sideT * (3.0 - 2.0 * sideT);
          float sideLower = mix(0.18, 0.12, sideEase);
          float contourClearance = mix(0.018, 0.024, insideShadowBlend);
          float lowerEnvelope = mix(sideLower, contourY + contourClearance, insideShadowBlend);

          float centerNorm = clamp(ax / shadowRadius, 0.0, 1.0);
          float dome = pow(1.0 - centerNorm * centerNorm, 0.78);
          float centralThickness = 0.16 + 0.05 * dome;
          float sideThickness = mix(0.19, 0.10, sideEase);
          float thickness = mix(sideThickness, centralThickness, insideShadowBlend);
          thickness *= 0.95 + 0.05 * uBend;
          thickness *= uThicknessScale;
          thickness = max(thickness, mix(0.10, 0.14, insideShadowBlend) * uThicknessScale);

          float upperEnvelope = lowerEnvelope + thickness;

          float lowerMask = smoothstep(lowerEnvelope - 0.014, lowerEnvelope + 0.024, y);
          float upperMask = 1.0 - smoothstep(upperEnvelope - 0.028, upperEnvelope + 0.012, y);
          float sideMask = 1.0 - smoothstep(maxHalfWidth - 0.20, maxHalfWidth, ax);
          float silhouette = (x * x + y * y) / (shadowRadius * shadowRadius);
          float outsideShadow = smoothstep(1.020, 1.060, silhouette);
          float contourGuard = mix(
            smoothstep(contourY + contourClearance - 0.004, contourY + contourClearance + 0.024, y),
            1.0,
            smoothstep(shadowRadius - 0.02, shadowRadius + 0.08, ax)
          );
          float mask = lowerMask * upperMask * sideMask * outsideShadow * contourGuard;
          if (mask <= 0.001) discard;

          float bandHeight = max(upperEnvelope - lowerEnvelope, 0.001);
          float bandCoord = clamp((y - lowerEnvelope) / bandHeight, 0.0, 1.0);
          float direction = mix(1.0, -1.0, uInvertFlow);
          float timePhase = uTime * uFlowRate * direction * (0.22 + uSpin * 0.22);
          float angle = atan(y - 0.18, x);
          float flow = noise(vec2(angle * 4.6 + timePhase * 1.25, bandCoord * uTurbulenceScale * 2.1));
          float bands = 0.5 + 0.5 * sin(angle * 15.0 - timePhase * 3.0 + bandCoord * 12.0 + flow * 4.4);
          float streaks = 0.5 + 0.5 * sin(angle * 27.0 + bandCoord * 20.0 - timePhase * 4.2);
          float shear = 0.5 + 0.5 * sin(angle * 4.2 - timePhase * 1.5 + bandCoord * 13.0);
          float heat = clamp(1.0 - bandCoord * 0.88 + (bands - 0.5) * 0.16, 0.0, 1.0);

          vec3 color = mix(uOuter, uMid, smoothstep(0.05, 0.80, heat));
          color = mix(color, uInner, pow(heat, 1.85) * (0.76 + 0.24 * streaks));
          color = mix(color, uOuter, (1.0 - heat) * 0.16 + (0.5 - bands) * 0.05);

          float textureBoost = 0.93
            + (flow - 0.5) * uTurbulenceStrength * 0.88
            + (bands - 0.5) * 0.24
            + (streaks - 0.5) * 0.14
            + (shear - 0.5) * 0.08;
          float edgeFade = smoothstep(0.02, 0.13, vUv.x) * (1.0 - smoothstep(0.88, 0.995, vUv.x));
          float shoulderBlendIn = smoothstep(0.68, 0.86, ax);
          float shoulderBlendOut = 1.0 - smoothstep(maxHalfWidth - 0.26, maxHalfWidth, ax);
          float shoulderWindow = shoulderBlendIn * shoulderBlendOut;
          float shoulderVerticalIn = smoothstep(0.16, 0.40, bandCoord);
          float shoulderVerticalOut = 1.0 - smoothstep(0.82, 1.0, bandCoord);
          float shoulderVerticalWindow = shoulderVerticalIn * shoulderVerticalOut;
          float lateralIntegrationFade = 1.0 - shoulderWindow * shoulderVerticalWindow * 0.80;
          float innerGlow = smoothstep(lowerEnvelope, lowerEnvelope + 0.040, y) * (1.0 - smoothstep(lowerEnvelope + 0.060, lowerEnvelope + 0.16, y));
          float nearShadowBoost = 1.0 + innerGlow * 1.05;
          color = mix(color, uInner, innerGlow * 0.28);
          float alpha = mask * edgeFade * lateralIntegrationFade * (0.84 + innerGlow * 0.16);
          gl_FragColor = vec4(color * uBrightness * textureBoost * nearShadowBoost, alpha * uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.primaryDiskShaderMaterials.push(material);
    return new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0, 96, 96), material);
  }

  private createCompactBlackHoleLensedJoinBand(
    diskModel: BlackHoleLaboratoryRenderModel,
    side: -1 | 1,
    halo: boolean,
  ): THREE.Mesh {
    const inclinationFactor = THREE.MathUtils.clamp((diskModel.inclinationDegrees - 22) / (72 - 22), 0, 1);
    const tailReachBoost = side > 0 ? 0.46 : 0.18;
    const tailDrop = side > 0 ? 0.12 : 0.06;
    const bandSpaceMaskBlend = 1.0;
    const leftTailDropExtra = diskModel.sampleLabel === 'D' ? 0.02 : 0.11;
    const leftRotationOffset = THREE.MathUtils.lerp(0.052, 0.020, inclinationFactor);
    const rightTailLift = diskModel.sampleLabel === 'D' ? 0.06 : 0.15;
    const rightRotationOffset = THREE.MathUtils.lerp(0.052, 0.020, inclinationFactor);
    const leftTerminalFadeStrength = diskModel.sampleLabel === 'D' ? 0.20 : 0.38;
    const leftEntryFadeStrength = diskModel.sampleLabel === 'D' ? 0.20 : 0.34;
    const rightEntryFadeStrength = diskModel.sampleLabel === 'D' ? 0.16 : 0.24;
    const rightTerminalFadeStrength = diskModel.sampleLabel === 'D' ? 0.48 : 0.76;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: new THREE.Color(diskModel.diskColorInner) },
        uMid: { value: new THREE.Color(diskModel.diskColorMid) },
        uOuter: { value: new THREE.Color(diskModel.diskColorOuter) },
        uBrightness: { value: diskModel.diskBrightness * (halo ? 0.80 : 1.00) },
        uOpacity: { value: halo ? 0.22 : 0.70 },
        uSide: { value: side },
        uSpin: { value: diskModel.spinDimensionless },
        uTurbulenceScale: { value: diskModel.turbulenceScale },
        uTurbulenceStrength: { value: diskModel.turbulenceStrength },
        uInclinationFactor: { value: inclinationFactor },
        uRotationAngle: { value: THREE.MathUtils.lerp(-0.20, -0.12, inclinationFactor) },
        uTailReachBoost: { value: tailReachBoost },
        uTailDrop: { value: tailDrop },
        uBandSpaceMaskBlend: { value: bandSpaceMaskBlend },
        uLeftTailDropExtra: { value: leftTailDropExtra },
        uLeftRotationOffset: { value: leftRotationOffset },
        uRightTailLift: { value: rightTailLift },
        uRightRotationOffset: { value: rightRotationOffset },
        uLeftTerminalFadeStrength: { value: leftTerminalFadeStrength },
        uLeftEntryFadeStrength: { value: leftEntryFadeStrength },
        uRightEntryFadeStrength: { value: rightEntryFadeStrength },
        uRightTerminalFadeStrength: { value: rightTerminalFadeStrength },
      },
      vertexShader: `
        uniform float uSide;
        uniform float uInclinationFactor;
        uniform float uRotationAngle;
        uniform float uTailReachBoost;
        uniform float uTailDrop;
        uniform float uLeftTailDropExtra;
        uniform float uLeftRotationOffset;
        uniform float uRightTailLift;
        uniform float uRightRotationOffset;
        varying vec2 vUv;
        varying vec2 vBandLocal;
        varying vec2 vTransformedLocal;
        void main() {
          vUv = uv;
          float t = uv.x;
          float tailT = smoothstep(0.56, 1.0, t);
          float tailEase = tailT * tailT;
          float outerReach = mix(2.18, 2.24, uInclinationFactor);
          float verticalReach = mix(0.84, 0.88, uInclinationFactor);

          float bandX = uSide * mix(0.50, outerReach, t);
          float bandY = 0.01 + uv.y * verticalReach;
          vBandLocal = vec2(bandX, bandY);

          float leftSide = step(uSide, 0.0);
          float rightSide = step(0.0, uSide);
          float baseX = bandX + uSide * tailT * uTailReachBoost;
          float baseY = bandY - tailT * uTailDrop;
          baseY -= leftSide * tailEase * uLeftTailDropExtra;
          baseY += rightSide * tailEase * uRightTailLift;

          float pivotX = uSide * 0.74;
          float pivotY = 0.62;
          float rotationAngle = uRotationAngle + rightSide * uRightRotationOffset + leftSide * uLeftRotationOffset;
          float s = sin(rotationAngle);
          float c = cos(rotationAngle);
          float dx = baseX - pivotX;
          float dy = baseY - pivotY;
          float x = pivotX + dx * c - dy * s;
          float y = pivotY + dx * s + dy * c;
          vTransformedLocal = vec2(x, y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, 0.024, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uInner;
        uniform vec3 uMid;
        uniform vec3 uOuter;
        uniform float uBrightness;
        uniform float uOpacity;
        uniform float uSide;
        uniform float uSpin;
        uniform float uTurbulenceScale;
        uniform float uTurbulenceStrength;
        uniform float uInclinationFactor;
        uniform float uRotationAngle;
        uniform float uTailReachBoost;
        uniform float uTailDrop;
        uniform float uBandSpaceMaskBlend;
        uniform float uLeftTerminalFadeStrength;
        uniform float uRightTerminalFadeStrength;
        uniform float uLeftEntryFadeStrength;
        uniform float uRightEntryFadeStrength;
        varying vec2 vUv;
        varying vec2 vBandLocal;
        varying vec2 vTransformedLocal;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          float transformedX = vTransformedLocal.x;
          float transformedY = vTransformedLocal.y;
          float maskX = mix(transformedX, vBandLocal.x, uBandSpaceMaskBlend);
          float maskY = mix(transformedY, vBandLocal.y, uBandSpaceMaskBlend);
          float ax = abs(maskX);
          float shadowRadius = 0.82;
          float outerReach = mix(2.18, 2.24, uInclinationFactor) + (1.0 - uBandSpaceMaskBlend) * uTailReachBoost;
          float t = clamp((ax - 0.50) / max(outerReach - 0.50, 0.001), 0.0, 1.0);
          float ease = t * t * (3.0 - 2.0 * t);

          float lower = mix(0.15, mix(0.024, 0.012, uInclinationFactor), pow(ease, 0.94));
          float upper = mix(0.74, mix(0.16, 0.10, uInclinationFactor), pow(ease, mix(0.84, 0.78, uInclinationFactor)));

          float lowerMask = smoothstep(lower - 0.014, lower + 0.022, maskY);
          float upperMask = 1.0 - smoothstep(upper - 0.024, upper + 0.012, maskY);
          float sideMask = smoothstep(0.46, 0.58, ax) * (1.0 - smoothstep(outerReach - 0.14, outerReach + 0.05, ax));
          float silhouette = (transformedX * transformedX + transformedY * transformedY) / (shadowRadius * shadowRadius);
          float outsideShadow = smoothstep(1.020, 1.060, silhouette);
          float mask = lowerMask * upperMask * sideMask * outsideShadow;
          if (mask <= 0.001) discard;

          float bandCoord = clamp((maskY - lower) / max(upper - lower, 0.001), 0.0, 1.0);
          float timePhase = uTime * (0.22 + uSpin * 0.22) * uSide;
          float flow = noise(vec2(t * 5.0 + timePhase * 1.25, bandCoord * uTurbulenceScale * 2.0));
          float bands = 0.5 + 0.5 * sin(t * 26.0 - timePhase * 3.1 + bandCoord * 12.0 + flow * 4.2);
          float streaks = 0.5 + 0.5 * sin(t * 42.0 + bandCoord * 19.0 - timePhase * 4.4);
          float heat = clamp(1.0 - bandCoord * (0.86 - (1.0 - uInclinationFactor) * 0.06) + (bands - 0.5) * 0.16, 0.0, 1.0);

          vec3 color = mix(uOuter, uMid, smoothstep(0.05, 0.80, heat));
          color = mix(color, uInner, pow(heat, 1.84) * (0.76 + 0.24 * streaks));
          float textureBoost = 0.94
            + (flow - 0.5) * uTurbulenceStrength * 0.88
            + (bands - 0.5) * 0.22
            + (streaks - 0.5) * 0.14;
          float edgeFade = 1.0 - smoothstep(0.86, 1.0, vUv.x);
          float summitHorizontal = 1.0 - smoothstep(0.56, 0.86, ax);
          float summitVerticalIn = smoothstep(0.24, 0.54, bandCoord);
          float summitVerticalOut = 1.0 - smoothstep(0.90, 1.0, bandCoord);
          float summitWindow = summitHorizontal * summitVerticalIn * summitVerticalOut;
          float bandIntegrationFade = 1.0 - summitWindow * 0.80;
          float rightSide = step(0.0, uSide);
          float leftSide = 1.0 - rightSide;
          float entryWindow = smoothstep(0.56, 0.90, vUv.x) * (1.0 - smoothstep(0.42, 0.78, bandCoord));
          float leftEntryFade = 1.0 - leftSide * entryWindow * uLeftEntryFadeStrength;
          float rightEntryFade = 1.0 - rightSide * entryWindow * uRightEntryFadeStrength;
          float rightTerminalFade = 1.0 - smoothstep(0.60, 0.92, vUv.x) * uRightTerminalFadeStrength;
          float leftTerminalFade = 1.0 - smoothstep(0.74, 0.98, vUv.x) * uLeftTerminalFadeStrength;
          float terminalFade = mix(leftTerminalFade, rightTerminalFade, rightSide);
          float contourGlow = (1.0 - smoothstep(0.04, 0.34, bandCoord)) * (1.0 - smoothstep(0.56, 1.06, ax));
          float contourBoost = 1.0 + contourGlow * 0.96;
          color = mix(color, uInner, contourGlow * 0.24);
          gl_FragColor = vec4(color * uBrightness * textureBoost * contourBoost, mask * edgeFade * bandIntegrationFade * leftEntryFade * rightEntryFade * terminalFade * uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.primaryDiskShaderMaterials.push(material);
    return new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0, 96, 48), material);
  }

  private addBlackHoleMainAccretionDisk(
    parent: THREE.Group,
    diskModel: BlackHoleLaboratoryRenderModel,
    scale = 0.329,
  ): void {
    const diskGroup = new THREE.Group();
    diskGroup.rotation.x = THREE.MathUtils.degToRad(90 - diskModel.inclinationDegrees);
    diskGroup.rotation.z = THREE.MathUtils.degToRad(6);
    parent.add(diskGroup);
    this.primaryDiskGroup = diskGroup;

    const backMaterial = this.createBlackHoleDiskFlowMaterial(diskModel, {
      brightness: diskModel.diskBrightness,
      opacity: 0.86,
      innerCut: 0.20,
      outerCut: 1.0,
      bandScale: 52.0,
      flowRate: 1.0,
      frontMask: false,
      innerGlowBoost: 3.10,
    });

    const frontMaterial = this.createBlackHoleDiskFlowMaterial(diskModel, {
      brightness: diskModel.diskBrightness * 1.06,
      opacity: 0.96,
      innerCut: 0.18,
      outerCut: 1.0,
      bandScale: 54.0,
      flowRate: 1.0,
      frontMask: true,
      innerGlowBoost: 3.85,
    });

    const foregroundRimMaterial = this.createBlackHoleDiskFlowMaterial(diskModel, {
      brightness: diskModel.diskBrightness * 1.12,
      opacity: 0.42,
      innerCut: 0.0,
      outerCut: 1.0,
      bandScale: 70.0,
      flowRate: 0.86,
      frontMask: true,
      innerGlowBoost: 4.35,
    });

    frontMaterial.depthTest = false;
    foregroundRimMaterial.depthTest = false;

    const diskBack = new THREE.Mesh(
      new THREE.RingGeometry(0.80 * scale, 3.55 * scale, 224, 1),
      backMaterial,
    );
    const diskFront = new THREE.Mesh(
      new THREE.RingGeometry(0.80 * scale, 3.55 * scale, 224, 1),
      frontMaterial,
    );
    const foregroundRim = new THREE.Mesh(
      new THREE.RingGeometry(0.78 * scale, 1.18 * scale, 224, 1),
      foregroundRimMaterial,
    );

    const verticalScale = Math.max(0.05, diskModel.diskThickness * 1.65);
    diskBack.scale.y = verticalScale;
    diskFront.scale.y = verticalScale;
    foregroundRim.scale.y = Math.max(0.09, verticalScale * 0.78);
    diskBack.position.z = -0.035 * scale;
    diskFront.position.z = 0.040 * scale;
    foregroundRim.position.z = 0.048 * scale;
    diskBack.renderOrder = 1;
    diskFront.renderOrder = 5;
    foregroundRim.renderOrder = 6;

    diskGroup.add(diskBack);
    diskGroup.add(diskFront);
    diskGroup.add(foregroundRim);
  }

  private addMatterTransferPlume(
    parent: THREE.Group,
    donor: LaboratoryStellarSnapshot,
    diskModel: BlackHoleLaboratoryRenderModel,
  ): void {
    const streamGroup = new THREE.Group();
    streamGroup.name = 'Matter transfer plume';
    parent.add(streamGroup);
    this.streamGroup = streamGroup;

    const donorCenterX = -3.0;
    const donorSurface = new THREE.Vector3(donorCenterX + donor.radiusScene * 0.98, 0.00, 0.01);

    const hemispherePoint = (normalizedY: number, z: number): THREE.Vector3 => {
      const y = donor.radiusScene * normalizedY;
      const radialX = Math.sqrt(Math.max(0, donor.radiusScene * donor.radiusScene - y * y));
      return new THREE.Vector3(donorCenterX + radialX * 0.98, y, z);
    };

    // Extreme hemisphere-wide mouth: anchor the transfer stream from almost the
    // whole facing stellar hemisphere, spanning from near the upper rim to the
    // lower rim so the gas does not appear to emerge from a narrow local strip.
    const donorSourceUpper = hemispherePoint(0.995, 0.09);
    const donorSourceLower = hemispherePoint(-0.995, -0.09);
    const donorSourceUpperMid = hemispherePoint(0.82, 0.07);
    const donorSourceLowerMid = hemispherePoint(-0.82, -0.07);
    const donorSourceEquator = hemispherePoint(0.00, 0.02);
    const impactPoint = new THREE.Vector3(2.34, 0.004, 0.012);
    const curve = new THREE.CatmullRomCurve3(
      [
        donorSurface,
        new THREE.Vector3(-1.62, 0.24, 0.05),
        new THREE.Vector3(-0.18, 0.36, 0.08),
        new THREE.Vector3(1.16, 0.24, 0.065),
        new THREE.Vector3(1.98, 0.07, 0.030),
        impactPoint,
      ],
      false,
      'catmullrom',
      0.48,
    );

    const donorColor = new THREE.Color(donor.colorHex).lerp(new THREE.Color(0xffffff), 0.34);
    const streamColor = parseCssColor(this.model.streamColor, '#ffd3ad');
    const diskWarm = new THREE.Color(diskModel.diskColorMid).lerp(new THREE.Color(diskModel.diskColorInner), 0.38);
    const hotColor = new THREE.Color(0xfffbf2);

    const layers = [
      {
        widthStart: 6.90,
        widthMid: 1.05,
        widthEnd: 0.032,
        opacity: 0.12,
        speed: 0.78,
        filamentScale: 18.0,
        turbulence: 0.72,
        startColor: donorColor.clone().lerp(streamColor, 0.18),
        endColor: diskWarm.clone().lerp(hotColor, 0.08),
        zOffset: -0.035,
        blending: THREE.NormalBlending,
        renderOrder: 4.10,
      },
      {
        widthStart: 5.25,
        widthMid: 0.74,
        widthEnd: 0.032,
        opacity: 0.27,
        speed: 1.08,
        filamentScale: 26.0,
        turbulence: 0.84,
        startColor: donorColor.clone().lerp(streamColor, 0.34),
        endColor: diskWarm.clone().lerp(hotColor, 0.20),
        zOffset: 0.0,
        blending: THREE.AdditiveBlending,
        renderOrder: 4.24,
      },
      {
        widthStart: 3.45,
        widthMid: 0.46,
        widthEnd: 0.018,
        opacity: 0.40,
        speed: 1.46,
        filamentScale: 34.0,
        turbulence: 0.94,
        startColor: donorColor.clone().lerp(hotColor, 0.26),
        endColor: hotColor.clone().lerp(diskWarm, 0.22),
        zOffset: 0.025,
        blending: THREE.AdditiveBlending,
        renderOrder: 4.38,
      },
    ] as const;

    for (const layer of layers) {
      const geometry = createAccretionRibbonGeometry(
        curve,
        180,
        layer.widthStart,
        layer.widthMid,
        layer.widthEnd,
        layer.zOffset,
        {
          sourceUpper: donorSourceUpper,
          sourceLower: donorSourceLower,
          sourceBlendEnd: 0.70,
          widthRampStart: 0.0,
          widthRampEnd: 0.82,
        },
      );
      const material = this.createAccretionRibbonMaterial({
        startColor: layer.startColor,
        endColor: layer.endColor,
        opacity: layer.opacity,
        speed: layer.speed,
        filamentScale: layer.filamentScale,
        turbulence: layer.turbulence,
        blending: layer.blending,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = layer.renderOrder;
      streamGroup.add(mesh);
    }

    const wisps = [
      { phase: 0.2, width: 0.020, opacity: 0.14, y: 0.22, z: 0.11, start: donorSourceUpper.clone() },
      { phase: 0.9, width: 0.018, opacity: 0.13, y: 0.12, z: 0.08, start: donorSourceUpperMid.clone() },
      { phase: 1.6, width: 0.013, opacity: 0.12, y: 0.00, z: 0.00, start: donorSourceEquator.clone() },
      { phase: 2.3, width: 0.014, opacity: 0.11, y: -0.12, z: -0.08, start: donorSourceLowerMid.clone() },
      { phase: 3.0, width: 0.012, opacity: 0.10, y: -0.22, z: -0.11, start: donorSourceLower.clone() },
    ] as const;

    for (const wisp of wisps) {
      const wispCurve = new THREE.CatmullRomCurve3(
        [
          wisp.start.clone(),
          new THREE.Vector3(-1.42, 0.24 + wisp.y, 0.04 + wisp.z),
          new THREE.Vector3(-0.12, 0.36 + wisp.y * 0.65, 0.07 + wisp.z * 0.72),
          new THREE.Vector3(1.34, 0.17 + wisp.y * 0.22, 0.040 + wisp.z * 0.38),
          new THREE.Vector3(2.02, 0.045 + wisp.y * 0.05, 0.018 + wisp.z * 0.10),
          impactPoint.clone(),
        ],
        false,
        'catmullrom',
        0.42,
      );
      const wispGeometry = new THREE.TubeGeometry(wispCurve, 140, wisp.width, 8, false);
      const wispMaterial = this.createAccretionWispMaterial({
        startColor: donorColor,
        endColor: diskWarm.clone().lerp(hotColor, 0.18),
        opacity: wisp.opacity,
        speed: 1.25 + wisp.phase * 0.12,
        phase: wisp.phase,
      });
      const mesh = new THREE.Mesh(wispGeometry, wispMaterial);
      mesh.renderOrder = 4.32 + wisp.phase * 0.02;
      streamGroup.add(mesh);
    }

    if (this.starBloomTexture !== null) {
      const impactGlow = new THREE.Sprite(
        stellarSpriteMaterial(
          this.starBloomTexture,
          hotColor.clone().lerp(diskWarm, 0.20),
          0.18,
        ),
      );
      impactGlow.position.copy(impactPoint);
      impactGlow.scale.set(0.50, 0.28, 1);
      (impactGlow.material as THREE.SpriteMaterial).rotation = THREE.MathUtils.degToRad(diskModel.inclinationDegrees * 0.55);
      impactGlow.renderOrder = 4.72;
      streamGroup.add(impactGlow);
    }

  }

  private createAccretionRibbonMaterial(config: {
    startColor: THREE.Color;
    endColor: THREE.Color;
    opacity: number;
    speed: number;
    filamentScale: number;
    turbulence: number;
    blending: THREE.Blending;
  }): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStart: { value: config.startColor },
        uEnd: { value: config.endColor },
        uOpacity: { value: config.opacity },
        uSpeed: { value: config.speed },
        uFilamentScale: { value: config.filamentScale },
        uTurbulence: { value: config.turbulence },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uStart;
        uniform vec3 uEnd;
        uniform float uOpacity;
        uniform float uSpeed;
        uniform float uFilamentScale;
        uniform float uTurbulence;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          float along = vUv.x;
          float across = abs(vUv.y - 0.5) * 2.0;
          float edge = 1.0 - smoothstep(0.42, 1.0, across);
          float flow = uTime * uSpeed;

          float broadNoise = noise(vec2(along * 8.0 - flow * 0.52, across * 3.0 + 1.7));
          float fineNoise = noise(vec2(along * 18.0 - flow * 1.15, across * 8.0 + 4.1));
          float filamentA = 0.5 + 0.5 * sin(along * uFilamentScale - flow * 7.2 + across * 7.0 + broadNoise * 4.0);
          float filamentB = 0.5 + 0.5 * sin(along * (uFilamentScale * 0.72) - flow * 4.6 - across * 12.0 + fineNoise * 5.2);
          float knots = 0.5 + 0.5 * sin(along * 42.0 - flow * 10.5 + broadNoise * 5.0);

          float density = 0.34
            + broadNoise * 0.26 * uTurbulence
            + fineNoise * 0.18 * uTurbulence
            + filamentA * 0.20
            + filamentB * 0.14;
          density *= 0.78 + knots * 0.28;
          density = clamp(density, 0.0, 1.0);

          float startFade = smoothstep(0.06, 0.28, along);
          float endFade = 1.0 - smoothstep(0.985, 1.0, along);
          float mouthSoftening = smoothstep(0.03, 0.12, along);
          float taper = startFade * endFade * mouthSoftening;

          float heating = smoothstep(0.58, 1.0, along);
          vec3 color = mix(uStart, uEnd, pow(along, 0.78));
          color = mix(color, vec3(1.0, 0.985, 0.94), heating * (0.18 + 0.22 * knots));

          float alpha = edge * taper * density * uOpacity;
          alpha *= 0.74 + 0.26 * (1.0 - across);
          if (alpha < 0.008) discard;

          float emissive = 0.92 + filamentA * 0.20 + filamentB * 0.14 + knots * 0.18 + heating * 0.22;
          gl_FragColor = vec4(color * emissive, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: config.blending,
      depthWrite: false,
      depthTest: true,
    });
    this.streamShaderMaterials.push(material);
    return material;
  }

  private createAccretionWispMaterial(config: {
    startColor: THREE.Color;
    endColor: THREE.Color;
    opacity: number;
    speed: number;
    phase: number;
  }): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uStart: { value: config.startColor },
        uEnd: { value: config.endColor },
        uOpacity: { value: config.opacity },
        uSpeed: { value: config.speed },
        uPhase: { value: config.phase },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uStart;
        uniform vec3 uEnd;
        uniform float uOpacity;
        uniform float uSpeed;
        uniform float uPhase;
        varying vec2 vUv;

        void main() {
          float along = vUv.x;
          float across = abs(vUv.y - 0.5) * 2.0;
          float core = pow(max(0.0, 1.0 - across), 1.8);
          float flow = uTime * uSpeed;
          float pulse = 0.42 + 0.58 * (0.5 + 0.5 * sin(along * 34.0 - flow * 9.0 + uPhase));
          float flicker = 0.72 + 0.28 * (0.5 + 0.5 * sin(along * 17.0 - flow * 4.8 + uPhase * 1.7));
          float heating = smoothstep(0.62, 1.0, along);
          vec3 color = mix(uStart, uEnd, along);
          color = mix(color, vec3(1.0, 0.98, 0.94), heating * 0.28);
          float alpha = core * pulse * flicker * uOpacity;
          alpha *= smoothstep(0.08, 0.18, along) * (1.0 - smoothstep(0.95, 1.0, along));
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(color * (1.0 + pulse * 0.22 + heating * 0.18), alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.streamShaderMaterials.push(material);
    return material;
  }

  private createBlackHoleDiskFlowMaterial(
    diskModel: BlackHoleLaboratoryRenderModel,
    config: {
      brightness: number;
      opacity: number;
      innerCut: number;
      outerCut: number;
      bandScale: number;
      flowRate: number;
      frontMask: boolean;
      innerGlowBoost: number;
    },
  ): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: new THREE.Color(diskModel.diskColorInner) },
        uMid: { value: new THREE.Color(diskModel.diskColorMid) },
        uOuter: { value: new THREE.Color(diskModel.diskColorOuter) },
        uBrightness: { value: config.brightness },
        uOpacity: { value: config.opacity },
        uInnerCut: { value: config.innerCut },
        uOuterCut: { value: config.outerCut },
        uBandScale: { value: config.bandScale },
        uFlowRate: { value: config.flowRate },
        uFrontMask: { value: config.frontMask ? 1.0 : 0.0 },
        uInnerGlowBoost: { value: config.innerGlowBoost },
        uTurbulenceScale: { value: diskModel.turbulenceScale },
        uTurbulenceStrength: { value: diskModel.turbulenceStrength },
        uSpin: { value: diskModel.spinDimensionless },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uInner;
        uniform vec3 uMid;
        uniform vec3 uOuter;
        uniform float uBrightness;
        uniform float uOpacity;
        uniform float uInnerCut;
        uniform float uOuterCut;
        uniform float uBandScale;
        uniform float uFlowRate;
        uniform float uTurbulenceScale;
        uniform float uTurbulenceStrength;
        uniform float uSpin;
        uniform float uFrontMask;
        uniform float uInnerGlowBoost;
        varying vec2 vUv;
        varying vec3 vPosition;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          vec2 p = vUv - 0.5;
          float r = length(p) * 2.0;
          if (r < uInnerCut || r > uOuterCut) discard;

          float angle = atan(p.y, p.x);
          float timePhase = uTime * uFlowRate * (0.22 + uSpin * 0.22);
          float flow = noise(vec2(angle * 4.6 + timePhase * 1.3, r * uTurbulenceScale - uTime * 0.16 * uFlowRate));
          float bands = 0.5 + 0.5 * sin(r * uBandScale + angle * 10.0 + flow * 5.0 - timePhase * 2.8);
          float streaks = 0.5 + 0.5 * sin(angle * 18.0 - timePhase * 4.6 + r * 20.0);
          float shear = 0.5 + 0.5 * sin(angle * 2.6 - timePhase * 1.8 + r * 14.0);
          float heat = pow(clamp(1.0 - smoothstep(uInnerCut, uOuterCut, r), 0.0, 1.0), 0.46);
          vec3 color = mix(uOuter, uMid, smoothstep(0.06, 0.76, heat));
          color = mix(color, uInner, pow(heat, 1.95) * (0.78 + 0.22 * streaks));
          color = mix(color, uOuter, (1.0 - heat) * 0.18 * (0.55 + 0.45 * bands));

          float approaching = 0.70 + 0.60 * (0.5 + 0.5 * cos(angle - 0.52));
          float textureBoost = 0.88
            + (flow - 0.5) * uTurbulenceStrength * 1.45
            + (bands - 0.5) * 0.34
            + (streaks - 0.5) * 0.18
            + (shear - 0.5) * 0.12;
          float alpha = smoothstep(uInnerCut, min(uInnerCut + 0.05, uOuterCut), r)
            * (1.0 - smoothstep(max(uOuterCut - 0.08, uInnerCut), uOuterCut, r));
          alpha *= 0.90 + (bands - 0.5) * 0.16;
          if (uFrontMask > 0.5) {
            float frontBand = 1.0 - smoothstep(-0.22, 0.02, p.y);
            frontBand *= smoothstep(0.12, 0.28, r);
            alpha *= frontBand;
          }

          float innerGlowEnd = mix(uInnerCut, uOuterCut, 0.58);
          float innerGlow = 1.0 - smoothstep(uInnerCut + 0.015, innerGlowEnd, r);
          innerGlow = pow(clamp(innerGlow, 0.0, 1.0), 1.12);
          float innerRadianceBoost = 1.0 + innerGlow * uInnerGlowBoost;

          float hotCoreMix = innerGlow * 0.58 * clamp(uInnerGlowBoost / 3.0, 0.0, 1.0);
          vec3 hotCore = mix(uInner, vec3(1.0), 0.38);
          color = mix(color, hotCore, hotCoreMix);

          gl_FragColor = vec4(
            color * uBrightness * textureBoost * approaching * innerRadianceBoost,
            alpha * uOpacity
          );
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.primaryDiskShaderMaterials.push(material);
    return material;
  }

  private addUlxSupercriticalAccretion(
    parent: THREE.Group,
    diskModel: BlackHoleLaboratoryRenderModel,
  ): void {
    const ulxDiskModel: BlackHoleLaboratoryRenderModel = Object.freeze({
      ...diskModel,
      diskColorInner: 0xffffff,
      diskColorMid: 0xb7ecff,
      diskColorOuter: 0x4a7ee8,
      diskBrightness: diskModel.diskBrightness * 1.78,
      diskThickness: Math.max(0.22, diskModel.diskThickness * 2.35),
      turbulenceScale: diskModel.turbulenceScale * 0.88,
      turbulenceStrength: Math.min(1.35, diskModel.turbulenceStrength * 1.18),
    });

    // Supercritical ULX disks are visually broader and puffed up. The canonical
    // compact-object disk remains beneath this layer, while this larger hot layer
    // provides the bright, optically thick funnel/wind-launching structure.
    this.addBlackHoleMainAccretionDisk(parent, ulxDiskModel, 0.43);

    const funnelGlowMaterial = this.createBlackHoleDiskFlowMaterial(ulxDiskModel, {
      brightness: ulxDiskModel.diskBrightness * 1.08,
      opacity: 0.34,
      innerCut: 0.08,
      outerCut: 1.0,
      bandScale: 34.0,
      flowRate: 0.62,
      frontMask: false,
      innerGlowBoost: 5.2,
    });
    funnelGlowMaterial.depthTest = false;

    const funnelGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.33, 1.72, 224, 1),
      funnelGlowMaterial,
    );
    funnelGlow.rotation.x = THREE.MathUtils.degToRad(90 - diskModel.inclinationDegrees);
    funnelGlow.rotation.z = THREE.MathUtils.degToRad(6);
    funnelGlow.scale.y = 0.22;
    funnelGlow.position.z = 0.055;
    funnelGlow.renderOrder = 6.35;
    parent.add(funnelGlow);
  }

  private addUlxRadiativeWinds(
    parent: THREE.Group,
    diskModel: BlackHoleLaboratoryRenderModel,
  ): void {
    const sampleIndex = Math.max(0, Math.min(7, this.model.sampleLabel.charCodeAt(0) - 65));
    const t = sampleIndex / 7;
    const wave = (Math.sin((sampleIndex + 1) * 1.913) + 1) / 2;

    const diskRotation = new THREE.Euler(
      THREE.MathUtils.degToRad(90 - diskModel.inclinationDegrees),
      0,
      THREE.MathUtils.degToRad(6),
      'XYZ',
    );
    const axis = new THREE.Vector3(0, 0, 1).applyEuler(diskRotation).normalize();
    const length = 2.55 + 1.05 * (0.35 * t + 0.65 * wave);
    const opening = 0.22 + 0.10 * (0.42 * t + 0.58 * wave);

    const windGroup = new THREE.Group();
    windGroup.name = 'ULX supercritical radiative winds';
    parent.add(windGroup);

    const directions = [axis.clone(), axis.clone().multiplyScalar(-1)] as const;
    directions.forEach((direction, index) => {
      const normalizedDirection = direction.clone().normalize();
      const seed = sampleIndex * 0.71 + index * 1.91 + 0.43;
      const localLength = length * (index === 0 ? 1.0 : 0.92 + 0.06 * wave);

      const innerWind = this.createMicroquasarJetLayer(
        normalizedDirection,
        localLength,
        opening * 0.42,
        opening * 1.45,
        0.22,
        0xf7fdff,
        0x8fdcff,
        2.62 + index * 0.02,
        seed,
      );
      const outerWind = this.createMicroquasarJetLayer(
        normalizedDirection,
        localLength * 1.08,
        opening * 0.78,
        opening * 2.30,
        0.085,
        0xb7eaff,
        0x315dc9,
        2.42 + index * 0.02,
        seed + 1.1,
      );
      windGroup.add(outerWind, innerWind);
    });
  }

  private addMicroquasarJets(
    parent: THREE.Group,
    diskModel: BlackHoleLaboratoryRenderModel,
  ): void {
    const sampleIndex = Math.max(0, Math.min(7, this.model.sampleLabel.charCodeAt(0) - 65));
    const t = sampleIndex / 7;
    const wave = (Math.sin((sampleIndex + 1) * 1.913) + 1) / 2;

    const diskRotation = new THREE.Euler(
      THREE.MathUtils.degToRad(90 - diskModel.inclinationDegrees),
      0,
      THREE.MathUtils.degToRad(6),
      'XYZ',
    );
    const axis = new THREE.Vector3(0, 0, 1).applyEuler(diskRotation).normalize();

    const jetLength = 3.25 + 1.45 * (0.35 * t + 0.65 * wave);
    const opening = 0.105 + 0.075 * (0.42 * t + 0.58 * wave);
    const asymmetry = 0.82 + 0.28 * wave;

    const jetGroup = new THREE.Group();
    jetGroup.name = 'Microquasar bipolar jets';
    parent.add(jetGroup);

    const directions: readonly [THREE.Vector3, number][] = [
      [axis.clone(), asymmetry],
      [axis.clone().multiplyScalar(-1), 2.0 - asymmetry],
    ];

    directions.forEach(([direction, brightness], index) => {
      const normalizedDirection = direction.clone().normalize();
      const length = jetLength * (index === 0 ? 1.0 : 0.93 + 0.08 * t);
      const seed = sampleIndex * 0.61 + index * 1.37 + 0.19;
      const core = this.createMicroquasarJetLayer(
        normalizedDirection,
        length,
        opening * 0.070,
        opening * 0.135,
        0.82 * brightness,
        0xfbfeff,
        0xb8f3ff,
        3.20 + index * 0.02,
        seed,
      );
      const sheath = this.createMicroquasarJetLayer(
        normalizedDirection,
        length * 1.04,
        opening * 0.14,
        opening * 0.27,
        0.34 * brightness,
        0xd4f8ff,
        0x67cbff,
        3.04 + index * 0.02,
        seed + 0.8,
      );
      const cocoon = this.createMicroquasarJetLayer(
        normalizedDirection,
        length * 1.08,
        opening * 0.23,
        opening * 0.43,
        0.18 * brightness,
        0x9ee7ff,
        0x2e7fe0,
        2.92 + index * 0.02,
        seed + 1.3,
      );
      const halo = this.createMicroquasarJetLayer(
        normalizedDirection,
        length * 1.12,
        opening * 0.34,
        opening * 0.62,
        0.08 * brightness,
        0x82d8ff,
        0x1c4aa4,
        2.78 + index * 0.02,
        seed + 1.9,
      );
      jetGroup.add(halo, cocoon, sheath, core);
    });
  }

  private createMicroquasarJetLayer(
    direction: THREE.Vector3,
    length: number,
    startRadius: number,
    endRadius: number,
    opacity: number,
    innerColor: number,
    outerColor: number,
    renderOrder: number,
    seed: number,
  ): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(1, 1, length, 40, 72, true);
    const material = this.createMicroquasarJetFlowMaterial({
      startRadius,
      endRadius,
      opacity,
      innerColor,
      outerColor,
      glowPower: 1.08 + opacity * 0.60,
      flowSpeed: 0.85 + opacity * 4.8,
      filamentDensity: 12.0 + opacity * 30.0,
      bendAmplitude: startRadius * 0.42,
      turbulence: 0.76 + opacity * 0.60,
      seed,
    });
    const jet = new THREE.Mesh(geometry, material);
    jet.position.copy(direction).multiplyScalar(length * 0.5);
    jet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    jet.renderOrder = renderOrder;
    return jet;
  }

  private createMicroquasarJetFlowMaterial(config: {
    startRadius: number;
    endRadius: number;
    opacity: number;
    innerColor: number;
    outerColor: number;
    glowPower: number;
    flowSpeed: number;
    filamentDensity: number;
    bendAmplitude: number;
    turbulence: number;
    seed: number;
  }): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInnerColor: { value: new THREE.Color(config.innerColor) },
        uOuterColor: { value: new THREE.Color(config.outerColor) },
        uOpacity: { value: config.opacity },
        uStartRadius: { value: config.startRadius },
        uEndRadius: { value: config.endRadius },
        uGlowPower: { value: config.glowPower },
        uFlowSpeed: { value: config.flowSpeed },
        uFilamentDensity: { value: config.filamentDensity },
        uBendAmplitude: { value: config.bendAmplitude },
        uTurbulence: { value: config.turbulence },
        uJetSeed: { value: config.seed },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uStartRadius;
        uniform float uEndRadius;
        uniform float uBendAmplitude;
        uniform float uTurbulence;
        uniform float uJetSeed;
        varying vec2 vUv;
        varying float vRadiusNorm;
        varying float vAxial;
        varying float vAzimuth;
        varying float vJetNoise;
        void main() {
          vUv = uv;
          float axial = clamp(uv.y, 0.0, 1.0);
          vAxial = axial;
          float azimuth = atan(position.z, position.x);
          vAzimuth = azimuth;

          float taper = mix(uStartRadius, uEndRadius, pow(axial, 0.90));
          float swirl = sin(azimuth * 7.0 + axial * 18.0 - uTime * 4.8 + uJetSeed) * 0.08;
          float ripples = sin(azimuth * 13.0 - axial * 26.0 + uTime * 6.2 + uJetSeed * 1.7) * 0.05;
          float radialWarp = 1.0 + uTurbulence * (swirl + ripples);

          vec3 displaced = position;
          displaced.xz *= taper * radialWarp;

          float bendGrow = pow(axial, 1.35);
          float bendPhase = axial * 6.2 + uJetSeed * 2.3;
          displaced.x += sin(bendPhase + uTime * 0.95) * uBendAmplitude * bendGrow;
          displaced.z += cos(bendPhase * 0.82 - uTime * 0.78) * uBendAmplitude * 0.28 * bendGrow;

          vRadiusNorm = length(displaced.xz) / max(taper * 1.25, 0.0001);
          vJetNoise = swirl + ripples;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uInnerColor;
        uniform vec3 uOuterColor;
        uniform float uOpacity;
        uniform float uGlowPower;
        uniform float uFlowSpeed;
        uniform float uFilamentDensity;
        varying vec2 vUv;
        varying float vRadiusNorm;
        varying float vAxial;
        varying float vAzimuth;
        varying float vJetNoise;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          float axial = clamp(vAxial, 0.0, 1.0);
          float radial = clamp(vRadiusNorm, 0.0, 1.4);

          float launchFade = smoothstep(0.0, 0.025, axial);
          float headFade = 1.0 - smoothstep(0.92, 1.0, axial);
          float envelope = launchFade * headFade;
          float edgeFade = 1.0 - smoothstep(0.70, 1.14, radial);
          float core = pow(clamp(1.0 - radial, 0.0, 1.0), 1.55);

          float filament1 = 0.5 + 0.5 * sin(vAzimuth * uFilamentDensity + axial * 26.0 - uTime * uFlowSpeed * 4.8);
          float filament2 = 0.5 + 0.5 * sin(vAzimuth * (uFilamentDensity * 1.61) - axial * 34.0 + uTime * uFlowSpeed * 6.6);
          float filament3 = 0.5 + 0.5 * sin(vAzimuth * (uFilamentDensity * 0.72) + axial * 18.0 - uTime * uFlowSpeed * 3.2);
          float filamentNoise = noise(vec2(vAzimuth * 1.15, axial * 12.0 - uTime * uFlowSpeed * 1.9));
          float filaments = pow(clamp(0.28 * filament1 + 0.26 * filament2 + 0.18 * filament3 + 0.28 * filamentNoise, 0.0, 1.0), 1.18);

          float pulses = 0.72 + 0.28 * sin(axial * 38.0 - uTime * uFlowSpeed * 8.9 + vJetNoise * 4.5);
          float shock = smoothstep(0.14, 0.96, axial) * (1.0 - smoothstep(0.76, 1.0, axial));
          shock *= 0.52 + 0.48 * noise(vec2(axial * 18.0 - uTime * uFlowSpeed * 2.1, vAzimuth * 0.42));
          float knots = smoothstep(0.18, 0.94, axial) * (1.0 - smoothstep(0.32, 0.98, radial));
          knots *= 0.45 + 0.55 * sin(axial * 22.0 - uTime * uFlowSpeed * 5.2 + filamentNoise * 6.2831);

          vec3 color = mix(uOuterColor, uInnerColor, core);
          color = mix(color, uInnerColor, 0.38 * filaments * pulses);
          color += uInnerColor * (0.18 * shock + 0.16 * filaments + 0.22 * knots) * (0.58 + 0.42 * core);

          float alpha = envelope * edgeFade * uOpacity;
          alpha *= mix(0.50, 1.04, filaments);
          alpha *= mix(0.68, 1.26, core);
          alpha *= (0.86 + 0.14 * pulses);
          alpha *= 0.90 + 0.22 * shock + 0.16 * knots;

          gl_FragColor = vec4(color * uGlowPower, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    this.jetShaderMaterials.push(material);
    return material;
  }

  private addDetailedNeutronStar(group: THREE.Group, model: NeutronStarLaboratoryRenderModel): void {
    const seed = Math.max(1, model.sampleLabel.charCodeAt(0) - 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: seed * 0.731 },
        uBase: { value: new THREE.Color(model.surfaceColor) },
        uDeep: { value: new THREE.Color(model.deepSurfaceColor) },
        uHot: { value: new THREE.Color(model.hotSurfaceColor) },
        uNoiseScale: { value: model.surfaceNoiseScale },
        uDetailScale: { value: model.surfaceDetailScale },
        uFineScale: { value: model.surfaceFineScale },
        uHotThreshold: { value: model.surfaceHotThreshold },
        uHotIntensity: { value: model.surfaceHotIntensity },
        uContrast: { value: model.surfaceContrast },
        uBrightness: { value: model.surfaceBrightness },
        uFresnelStrength: { value: model.surfaceFresnelStrength },
        uActivityRate: { value: model.activityRate },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vPositionW = worldPosition.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vObjectPosition = position;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uSeed;
        uniform vec3 uBase;
        uniform vec3 uDeep;
        uniform vec3 uHot;
        uniform float uNoiseScale;
        uniform float uDetailScale;
        uniform float uFineScale;
        uniform float uHotThreshold;
        uniform float uHotIntensity;
        uniform float uContrast;
        uniform float uBrightness;
        uniform float uFresnelStrength;
        uniform float uActivityRate;
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;

        float hash31(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }

        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float n000 = hash31(i + vec3(0.0,0.0,0.0));
          float n100 = hash31(i + vec3(1.0,0.0,0.0));
          float n010 = hash31(i + vec3(0.0,1.0,0.0));
          float n110 = hash31(i + vec3(1.0,1.0,0.0));
          float n001 = hash31(i + vec3(0.0,0.0,1.0));
          float n101 = hash31(i + vec3(1.0,0.0,1.0));
          float n011 = hash31(i + vec3(0.0,1.0,1.0));
          float n111 = hash31(i + vec3(1.0,1.0,1.0));
          return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
                     mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
        }

        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.56;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise3(p);
            p = p * 2.03 + vec3(3.17, 1.91, 2.71);
            amplitude *= 0.48;
          }
          return value;
        }

        void main() {
          vec3 n = normalize(vNormalW);
          vec3 viewDir = normalize(cameraPosition - vPositionW);
          float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.25);
          vec3 p = normalize(vObjectPosition);
          float t = uTime * 0.028 * uActivityRate;
          float broad = fbm(p * uNoiseScale + vec3(t, -t * 0.55, uSeed));
          float medium = fbm(p * uDetailScale + vec3(-t * 0.7, t * 0.35, uSeed * 1.7));
          float fine = fbm(p * uFineScale + vec3(t * 0.45, uSeed, -t * 0.8));
          float cellular = smoothstep(0.46, 0.80, medium + 0.22 * fine);
          float hotField = medium + 0.30 * broad + 0.12 * fine;
          float hotVeins = pow(smoothstep(uHotThreshold, min(0.98, uHotThreshold + 0.22), hotField), 1.65);
          float micro = smoothstep(0.67, 0.93, fine);
          float baseMix = clamp(0.20 + broad * 0.82, 0.0, 1.0);
          baseMix = clamp((baseMix - 0.5) * uContrast + 0.5, 0.0, 1.0);
          vec3 color = mix(uDeep, uBase, baseMix);
          float hotMix = clamp(hotVeins * uHotIntensity + micro * 0.12 * uHotIntensity, 0.0, 0.92);
          color = mix(color, uHot, hotMix);
          color += uBase * cellular * 0.12;
          color += uHot * fresnel * uFresnelStrength;
          float intensity = uBrightness * (0.90 + hotVeins * (0.56 + uHotIntensity * 0.40) + micro * 0.12 + fresnel * 0.46);
          gl_FragColor = vec4(color * intensity, 1.0);
        }
      `,
      depthWrite: true,
    });
    this.neutronSurfaceShaderMaterials.push(material);

    const star = new THREE.Mesh(new THREE.SphereGeometry(1.08, 112, 80), material);
    star.renderOrder = 4;
    group.add(star);

    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.13, 72, 48),
      new THREE.MeshBasicMaterial({
        color: model.hotSurfaceColor,
        transparent: true,
        opacity: Math.min(0.16, 0.055 + model.surfaceFresnelStrength * 0.08),
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    innerGlow.renderOrder = 3.5;
    group.add(innerGlow);

    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(model.coronaRadius, 72, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          uGlow: { value: new THREE.Color(model.glowColor) },
          uOpacity: { value: model.coronaOpacity },
          uSeed: { value: seed * 1.113 },
        },
        vertexShader: `
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vPositionW = worldPosition.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uGlow;
          uniform float uOpacity;
          uniform float uSeed;
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vPositionW);
            float rim = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), 2.7);
            float azimuth = atan(vNormalW.y, vNormalW.x);
            float irregular = 0.74 + 0.26 * sin(azimuth * 5.0 + uSeed * 6.28318) * sin(vNormalW.z * 7.0 + uSeed);
            float alpha = rim * uOpacity * irregular;
            gl_FragColor = vec4(uGlow * (1.15 + rim * 0.85), alpha);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    corona.renderOrder = 4.5;
    group.add(corona);

    this.addNeutronStarWisps(group, model, seed);
  }

  private addNeutronStarWisps(group: THREE.Group, model: NeutronStarLaboratoryRenderModel, seed: number): void {
    const count = model.wispCount;
    for (let i = 0; i < count; i += 1) {
      const phase = pseudo(seed * 17 + i * 9) * Math.PI * 2;
      const tilt = (pseudo(seed * 31 + i * 7) - 0.5) * 1.25;
      const radiusX = (1.32 + pseudo(seed * 13 + i * 5) * 0.76) * model.wispSpread;
      const radiusY = (0.58 + pseudo(seed * 23 + i * 11) * 0.44) * (0.84 + model.wispSpread * 0.16);
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 64; step += 1) {
        const a = (step / 64) * Math.PI * 2;
        const ripple = 1.0 + 0.035 * Math.sin(a * 5.0 + phase * 1.7);
        const point = new THREE.Vector3(
          Math.cos(a + phase) * radiusX * ripple,
          Math.sin(a + phase) * radiusY,
          0.16 * Math.sin(a * 2.0 + phase),
        );
        point.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
        point.applyAxisAngle(new THREE.Vector3(0, 1, 0), phase * 0.35);
        points.push(point);
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? model.accentColor : model.glowColor,
        transparent: true,
        opacity: model.wispOpacity * (0.65 + pseudo(seed * 41 + i) * 0.70),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      line.renderOrder = 7;
      group.add(line);
    }
  }

  private addMagneticField(group: THREE.Group, model: NeutronStarLaboratoryRenderModel): void {
    const material = new THREE.LineBasicMaterial({
      color: 0x77d8ff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
    });
    const count = Math.max(1, model.fieldLineCount);
    for (let i = 0; i < count; i += 1) {
      const phase = (i / count) * Math.PI;
      const extent = model.fieldExtent * (0.76 + 0.24 * ((i % 3) / 2));
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 90; step += 1) {
        const theta = (step / 90) * Math.PI * 2;
        const x = Math.cos(theta) * extent;
        const y = Math.sin(theta) * (extent * 0.54);
        const z = Math.sin(theta) * 0.16 * Math.sin(phase * 2) + Math.cos(theta) * 0.13;
        points.push(new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), phase));
      }
      const fieldLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material.clone());
      fieldLine.renderOrder = 8;
      group.add(fieldLine);
    }
  }

  private createBackgroundStars(): THREE.Points {
    const positions: number[] = [];
    for (let i = 0; i < 220; i += 1) {
      const a = pseudo(i * 3 + 1) * Math.PI * 2;
      const u = pseudo(i * 3 + 2) * 2 - 1;
      const r = 8 + pseudo(i * 3 + 3) * 9;
      const s = Math.sqrt(1 - u * u);
      positions.push(r * s * Math.cos(a), r * u, r * s * Math.sin(a));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xb8d7e7, size: 0.028, transparent: true, opacity: 0.62 }),
    );
  }

  private animate = (timeMs: number): void => {
    if (this.renderer === null || this.scene === null || this.camera === null) return;
    const delta = this.lastFrameMs === 0 ? 0 : Math.min(0.05, (timeMs - this.lastFrameMs) / 1000);
    this.lastFrameMs = timeMs;
    if (this.animationEnabled) {
      for (const material of this.neutronSurfaceShaderMaterials) {
        material.uniforms['uTime'].value += delta;
      }
      for (const material of this.primaryDiskShaderMaterials) {
        material.uniforms['uTime'].value += delta;
      }
      for (const material of this.streamShaderMaterials) {
        material.uniforms['uTime'].value += delta;
      }
      for (const material of this.jetShaderMaterials) {
        material.uniforms['uTime'].value += delta;
      }
      if (this.compactSpinGroup !== null) {
        this.compactSpinGroup.rotation.y += delta * Math.PI * 2 / 9.8;
      }
      // Keep the donor star, compact object, glow and matter-transfer plume
      // statically anchored in the scene. We preserve only the local/internal
      // animations (surface and gas flow shaders, plus compact spin) and remove
      // the previous whole-system bobbing/tilting motion.
      if (this.compactPivot !== null) {
        this.compactPivot.rotation.z = 0;
        this.compactPivot.position.y = 0;
      }
      if (this.compactRoot !== null) {
        this.compactRoot.rotation.z = 0;
      }
      if (this.donorPivot !== null) {
        this.donorPivot.position.y = 0;
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private resize(): void {
    const host = this.renderHost?.nativeElement;
    if (host === undefined || this.renderer === null || this.camera === null) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(320, Math.min(660, Math.round(width * 0.56)));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private disposeSceneObjects(): void {
    this.scene?.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry && typeof mesh.geometry.dispose === 'function') mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach(item => item.dispose());
      else material?.dispose();
    });
    this.neutronSurfaceShaderMaterials.length = 0;
    this.primaryDiskShaderMaterials.length = 0;
    this.streamShaderMaterials.length = 0;
    this.jetShaderMaterials.length = 0;
    this.compactRoot = null;
    this.compactSpinGroup = null;
    this.donorGroup = null;
    this.orbitalGuideRoot = null;
    this.donorPivot = null;
    this.compactPivot = null;
    this.primaryDiskGroup = null;
    this.streamGroup = null;
  }
}

function createAccretionRibbonGeometry(
  curve: THREE.CatmullRomCurve3,
  samples: number,
  widthStart: number,
  widthMid: number,
  widthEnd: number,
  zOffset: number,
  options?: {
    readonly sourceUpper?: THREE.Vector3;
    readonly sourceLower?: THREE.Vector3;
    readonly sourceBlendEnd?: number;
    readonly widthRampStart?: number;
    readonly widthRampEnd?: number;
  },
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const sourceBlendEnd = options?.sourceBlendEnd ?? 0.0;
  const widthRampStart = options?.widthRampStart ?? 0.0;
  const widthRampEnd = options?.widthRampEnd ?? Math.max(widthRampStart + 0.001, sourceBlendEnd);

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const side = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
    const firstHalf = t <= 0.5
      ? THREE.MathUtils.lerp(widthStart, widthMid, t / 0.5)
      : THREE.MathUtils.lerp(widthMid, widthEnd, (t - 0.5) / 0.5);
    const ripple = 1.0 + 0.08 * Math.sin(t * Math.PI * 6.0);
    const widthGain = THREE.MathUtils.smoothstep(t, widthRampStart, widthRampEnd);
    const halfWidth = firstHalf * ripple * widthGain;

    let left = point.clone().addScaledVector(side, halfWidth);
    let right = point.clone().addScaledVector(side, -halfWidth);

    if (options?.sourceUpper !== undefined && options?.sourceLower !== undefined && sourceBlendEnd > 0 && t <= sourceBlendEnd) {
      const blend = THREE.MathUtils.smoothstep(t / sourceBlendEnd, 0.0, 1.0);
      left = options.sourceUpper.clone().lerp(left, blend);
      right = options.sourceLower.clone().lerp(right, blend);
    }

    const localWave = Math.sin(t * Math.PI * 2.2) * 0.012;
    left.z += zOffset + localWave;
    right.z += zOffset - localWave;

    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(t, 0, t, 1);

    if (i < samples) {
      const base = i * 2;
      indices.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function parseCssColor(
  cssColor: string,
  fallback: string,
): THREE.Color {
  const rgba = cssColor.match(/rgba?\(([^)]+)\)/i);
  if (rgba !== null) {
    const parts = rgba[1].split(',').map(part => Number.parseFloat(part.trim()));
    if (parts.length >= 3 && parts.slice(0, 3).every(value => Number.isFinite(value))) {
      return new THREE.Color(parts[0] / 255, parts[1] / 255, parts[2] / 255);
    }
  }

  try {
    return new THREE.Color(cssColor);
  } catch {
    return new THREE.Color(fallback);
  }
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function createEllipseLine(
  radiusX: number,
  radiusY: number,
  color: number,
  opacity: number,
  zOffset = 0,
): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let step = 0; step <= 160; step += 1) {
    const angle = (step / 160) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radiusX,
      Math.sin(angle) * radiusY,
      zOffset + Math.sin(angle * 2) * 0.06,
    ));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
}

function stellarSpriteMaterial(
  texture: THREE.Texture,
  color: THREE.ColorRepresentation,
  opacity: number,
): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

interface StellarOpticalProfile {
  readonly energy01: number;
  readonly coronaDiameterScale: number;
  readonly bloomDiameterScale: number;
  readonly aureoleDiameterScale: number;
  readonly glareDiameterScale: number;
  readonly coronaOpacity: number;
  readonly bloomOpacity: number;
  readonly aureoleOpacity: number;
  readonly glareOpacity: number;
}

function stellarOpticalProfile(star: LaboratoryStellarSnapshot): StellarOpticalProfile {
  const rgb = parseDisplayHexColor(star.colorHex);
  const luminance = (0.2126 * rgb.red + 0.7152 * rgb.green + 0.0722 * rgb.blue) / 255;
  const blueBias = clamp01(0.5 + (rgb.blue - rgb.red) / 510);
  const opticalRadiusScene = star.opticalRadiusScene ?? star.radiusScene;
  const sizeEnergy = clamp01((opticalRadiusScene - 0.16) / (0.46 - 0.16));
  const massEnergy = clamp01((star.lightIntensity - 1.2) / (3.4 - 1.2));
  const energy01 = clamp01(
    0.14 +
    0.24 * luminance +
    0.18 * blueBias +
    0.20 * sizeEnergy +
    0.24 * massEnergy,
  );

  return Object.freeze({
    energy01,
    coronaDiameterScale: 2 * (4.9 + 3.9 * energy01),
    bloomDiameterScale: 2 * (3.05 + 2.05 * energy01),
    aureoleDiameterScale: 2 * (1.95 + 1.05 * energy01),
    glareDiameterScale: 2 * (9.2 + 8.6 * energy01),
    coronaOpacity: 0.16 + 0.16 * energy01,
    bloomOpacity: 0.30 + 0.26 * energy01,
    aureoleOpacity: 0.36 + 0.28 * energy01,
    glareOpacity: 0.58 + 0.22 * energy01,
  });
}

function stellarDiffractionColor(
  stellarColorHex: string,
  energy01: number,
): THREE.Color {
  const stellar = new THREE.Color(stellarColorHex);
  return stellar.lerp(new THREE.Color(0xffffff), 0.34 + 0.18 * energy01);
}

function parseDisplayHexColor(
  colorHex: string,
): { readonly red: number; readonly green: number; readonly blue: number } {
  const normalized = colorHex.startsWith('#') ? colorHex.slice(1) : colorHex;
  if (normalized.length !== 6) {
    return Object.freeze({ red: 255, green: 255, blue: 255 });
  }
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value)) {
    return Object.freeze({ red: 255, green: 255, blue: 255 });
  }
  return Object.freeze({
    red: value >> 16 & 0xff,
    green: value >> 8 & 0xff,
    blue: value & 0xff,
  });
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function createRadialGlowTexture(
  kind: 'broad' | 'compact',
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('Unable to create stellar glow texture.');
  }

  const center = size / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);

  if (kind === 'compact') {
    gradient.addColorStop(0, 'rgba(255,255,255,0.96)');
    gradient.addColorStop(0.12, 'rgba(255,255,255,0.82)');
    gradient.addColorStop(0.30, 'rgba(255,255,255,0.34)');
    gradient.addColorStop(0.58, 'rgba(255,255,255,0.075)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
  } else {
    gradient.addColorStop(0, 'rgba(255,255,255,0.70)');
    gradient.addColorStop(0.16, 'rgba(255,255,255,0.36)');
    gradient.addColorStop(0.40, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(0.72, 'rgba(255,255,255,0.025)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}


function createStellarGlareTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('Unable to create stellar diffraction texture.');
  }

  const center = size / 2;
  const centralGlow = context.createRadialGradient(center, center, 0, center, center, 54);
  centralGlow.addColorStop(0, 'rgba(255,255,255,0.95)');
  centralGlow.addColorStop(0.18, 'rgba(255,255,255,0.42)');
  centralGlow.addColorStop(0.55, 'rgba(255,255,255,0.08)');
  centralGlow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = centralGlow;
  context.fillRect(center - 54, center - 54, 108, 108);

  drawDiffractionBeam(context, center, 0, 158, 5.4, 0.20, 14);
  drawDiffractionBeam(context, center, Math.PI / 2, 226, 5.8, 0.22, 15);
  drawDiffractionBeam(context, center, 0, 172, 1.15, 0.92, 4.5);
  drawDiffractionBeam(context, center, Math.PI / 2, 232, 1.15, 0.96, 4.5);
  drawDiffractionBeam(context, center, Math.PI / 4, 105, 0.95, 0.48, 3.2);
  drawDiffractionBeam(context, center, -Math.PI / 4, 105, 0.95, 0.48, 3.2);
  drawDiffractionBeam(context, center, Math.PI / 8, 72, 0.72, 0.28, 2.4);
  drawDiffractionBeam(context, center, Math.PI / 8 + Math.PI / 2, 72, 0.72, 0.28, 2.4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function drawDiffractionBeam(
  context: CanvasRenderingContext2D,
  center: number,
  angleRadians: number,
  halfLength: number,
  lineWidth: number,
  opacity: number,
  blurPixels: number,
): void {
  context.save();
  context.translate(center, center);
  context.rotate(angleRadians);

  const gradient = context.createLinearGradient(-halfLength, 0, halfLength, 0);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.34, `rgba(255,255,255,${opacity * 0.18})`);
  gradient.addColorStop(0.485, `rgba(255,255,255,${opacity * 0.72})`);
  gradient.addColorStop(0.5, `rgba(255,255,255,${opacity})`);
  gradient.addColorStop(0.515, `rgba(255,255,255,${opacity * 0.72})`);
  gradient.addColorStop(0.66, `rgba(255,255,255,${opacity * 0.18})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  context.strokeStyle = gradient;
  context.lineWidth = lineWidth;
  context.lineCap = 'round';
  context.shadowColor = `rgba(255,255,255,${opacity * 0.72})`;
  context.shadowBlur = blurPixels;
  context.beginPath();
  context.moveTo(-halfLength, 0);
  context.lineTo(halfLength, 0);
  context.stroke();
  context.restore();
}
