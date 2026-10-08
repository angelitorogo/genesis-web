import * as THREE from 'three';

import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import {
  blackHoleLaboratoryModel,
  type BlackHoleLaboratoryRenderModel,
} from '../laboratory/galactic-objects/black-hole-laboratory-render-model';
import {
  neutronStarLaboratoryModel,
  type NeutronStarLaboratoryRenderModel,
} from '../laboratory/galactic-objects/neutron-star-laboratory-render-model';

export type SystemSceneCompactHostKind = 'NEUTRON_STAR' | 'STELLAR_BLACK_HOLE';

export interface SystemSceneCompactHostVisual {
  readonly root: THREE.Group;
  readonly kind: SystemSceneCompactHostKind;
  readonly sampleIndex: number;
  readonly visualExtentRadiusScene: number;
  update(activeSeconds: number, cameraWorldQuaternion: THREE.Quaternion): void;
  dispose(): void;
}

const NEUTRON_STAR_CORE_RADIUS_SCENE = 0.0325;
const BLACK_HOLE_SHADOW_RADIUS_SCENE = 0.11;
const NEUTRON_STAR_LAB_RADIUS = 1.08;
const BLACK_HOLE_LAB_SHADOW_RADIUS = 0.82;

export function systemSceneCompactHostSampleIndex(stableId: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < stableId.length; i += 1) {
    hash ^= stableId.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash % 8;
}

export function systemSceneCompactHostVisualExtentRadiusScene(kind: SystemSceneCompactHostKind): number {
  return kind === 'STELLAR_BLACK_HOLE' ? 0.46 : 0.29;
}

export function createSystemSceneCompactHostVisual(
  kind: SystemSceneCompactHostKind,
  stableId: string,
): SystemSceneCompactHostVisual {
  const sampleIndex = systemSceneCompactHostSampleIndex(stableId);
  return kind === 'NEUTRON_STAR'
    ? createNeutronStarVisual(sampleIndex)
    : createBlackHoleVisual(sampleIndex);
}

function createNeutronStarVisual(sampleIndex: number): SystemSceneCompactHostVisual {
  const model = neutronStarLaboratoryModel(ExtremeType.NEUTRON_STAR, sampleIndex);
  const root = new THREE.Group();
  root.name = `System compact neutron star ${model.sampleLabel}`;
  root.userData['compactHostKind'] = 'NEUTRON_STAR';
  root.userData['laboratorySample'] = model.sampleLabel;
  root.userData['canonicalVisualSource'] = 'NEUTRON_STAR_LABORATORY';

  const billboard = new THREE.Group();
  const spin = new THREE.Group();
  spin.rotation.z = THREE.MathUtils.degToRad(9);
  const scale = NEUTRON_STAR_CORE_RADIUS_SCENE / NEUTRON_STAR_LAB_RADIUS;
  spin.scale.setScalar(scale);
  billboard.add(spin);
  root.add(billboard);

  const builder = new SystemSceneNeutronStarVisualBuilder(model);
  builder.build(spin);

  const parentQuaternion = new THREE.Quaternion();
  return {
    root,
    kind: 'NEUTRON_STAR',
    sampleIndex,
    visualExtentRadiusScene: systemSceneCompactHostVisualExtentRadiusScene('NEUTRON_STAR'),
    update(activeSeconds, cameraWorldQuaternion) {
      faceCamera(billboard, cameraWorldQuaternion, parentQuaternion);
      spin.rotation.y = activeSeconds * Math.PI * 2 / Math.max(1, model.visualRotationSeconds);
      builder.setTime(activeSeconds);
    },
    dispose() { disposeObjectTree(root); },
  };
}

function createBlackHoleVisual(sampleIndex: number): SystemSceneCompactHostVisual {
  const model = blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, sampleIndex);
  const root = new THREE.Group();
  root.name = `System compact black hole ${model.sampleLabel}`;
  root.userData['compactHostKind'] = 'STELLAR_BLACK_HOLE';
  root.userData['laboratorySample'] = model.sampleLabel;
  root.userData['canonicalVisualSource'] = 'BLACK_HOLE_LABORATORY';

  const billboard = new THREE.Group();
  const scale = BLACK_HOLE_SHADOW_RADIUS_SCENE / BLACK_HOLE_LAB_SHADOW_RADIUS;
  billboard.scale.setScalar(scale);
  root.add(billboard);

  const builder = new SystemSceneBlackHoleVisualBuilder(model);
  builder.build(billboard);

  const parentQuaternion = new THREE.Quaternion();
  return {
    root,
    kind: 'STELLAR_BLACK_HOLE',
    sampleIndex,
    visualExtentRadiusScene: systemSceneCompactHostVisualExtentRadiusScene('STELLAR_BLACK_HOLE'),
    update(activeSeconds, cameraWorldQuaternion) {
      faceCamera(billboard, cameraWorldQuaternion, parentQuaternion);
      builder.setTime(activeSeconds);
    },
    dispose() { disposeObjectTree(root); },
  };
}

function faceCamera(
  billboard: THREE.Group,
  cameraWorldQuaternion: THREE.Quaternion,
  parentQuaternion: THREE.Quaternion,
): void {
  const parent = billboard.parent;
  if (parent === null) {
    billboard.quaternion.copy(cameraWorldQuaternion);
    return;
  }
  parent.getWorldQuaternion(parentQuaternion);
  parentQuaternion.invert();
  billboard.quaternion.copy(parentQuaternion.multiply(cameraWorldQuaternion));
}

class SystemSceneNeutronStarVisualBuilder {
  private readonly surfaceShaderMaterials: THREE.ShaderMaterial[] = [];
  constructor(private readonly model: NeutronStarLaboratoryRenderModel) {}
  build(group: THREE.Group): void { this.addDetailedNeutronStar(group); }
  setTime(activeSeconds: number): void {
    for (const material of this.surfaceShaderMaterials) {
      const uniform = material.uniforms['uTime'];
      if (uniform !== undefined) uniform.value = activeSeconds;
    }
  }
  private addDetailedNeutronStar(group: THREE.Group): void {
    const seed = Math.max(1, this.model.sampleLabel.charCodeAt(0) - 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: seed * 0.731 },
        uBase: { value: new THREE.Color(this.model.surfaceColor) },
        uDeep: { value: new THREE.Color(this.model.deepSurfaceColor) },
        uHot: { value: new THREE.Color(this.model.hotSurfaceColor) },
        uNoiseScale: { value: this.model.surfaceNoiseScale },
        uDetailScale: { value: this.model.surfaceDetailScale },
        uFineScale: { value: this.model.surfaceFineScale },
        uHotThreshold: { value: this.model.surfaceHotThreshold },
        uHotIntensity: { value: this.model.surfaceHotIntensity },
        uContrast: { value: this.model.surfaceContrast },
        uBrightness: { value: this.model.surfaceBrightness },
        uFresnelStrength: { value: this.model.surfaceFresnelStrength },
        uActivityRate: { value: this.model.activityRate },
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
    this.surfaceShaderMaterials.push(material);

    const star = new THREE.Mesh(new THREE.SphereGeometry(1.08, 112, 80), material);
    group.add(star);

    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.13, 72, 48),
      new THREE.MeshBasicMaterial({
        color: this.model.hotSurfaceColor,
        transparent: true,
        opacity: Math.min(0.16, 0.055 + this.model.surfaceFresnelStrength * 0.08),
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(innerGlow);

    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(this.model.coronaRadius, 72, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          uGlow: { value: new THREE.Color(this.model.glowColor) },
          uOpacity: { value: this.model.coronaOpacity },
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
    group.add(corona);

    this.addNeutronStarWisps(group, seed);
  }

  private addNeutronStarWisps(group: THREE.Group, seed: number): void {
    const count = this.model.wispCount;
    for (let i = 0; i < count; i += 1) {
      const phase = pseudo(seed * 17 + i * 9) * Math.PI * 2;
      const tilt = (pseudo(seed * 31 + i * 7) - 0.5) * 1.25;
      const radiusX = (1.32 + pseudo(seed * 13 + i * 5) * 0.76) * this.model.wispSpread;
      const radiusY = (0.58 + pseudo(seed * 23 + i * 11) * 0.44) * (0.84 + this.model.wispSpread * 0.16);
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
        color: i % 3 === 0 ? this.model.accentColor : this.model.glowColor,
        transparent: true,
        opacity: this.model.wispOpacity * (0.65 + pseudo(seed * 41 + i) * 0.70),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Line(geometry, material));
    }
  }

}

class SystemSceneBlackHoleVisualBuilder {
  private readonly shaderMaterials: THREE.ShaderMaterial[] = [];
  constructor(private readonly model: BlackHoleLaboratoryRenderModel) {}
  build(group: THREE.Group): void {
    const canonicalGroup = new THREE.Group();
    canonicalGroup.rotation.z = THREE.MathUtils.degToRad(6);
    const inclinedDiskGroup = new THREE.Group();
    inclinedDiskGroup.rotation.x = THREE.MathUtils.degToRad(90 - this.model.inclinationDegrees);
    inclinedDiskGroup.rotation.z = THREE.MathUtils.degToRad(6);
    group.add(inclinedDiskGroup, canonicalGroup);
    this.addAccretionDisk(inclinedDiskGroup);
    this.addShadow(canonicalGroup);
    this.addPhotonRing(canonicalGroup);
    this.addLensedDiskImages(canonicalGroup);
    this.addUpperShadowHemisphere(canonicalGroup);
    this.addContourWrap(canonicalGroup);
  }
  setTime(activeSeconds: number): void {
    for (const material of this.shaderMaterials) {
      const uniform = material.uniforms['uTime'];
      if (uniform !== undefined) uniform.value = activeSeconds;
    }
  }
  private addShadow(
    group: THREE.Group,
    radius = 0.82,
  ): void {
    // Element 5: the black-hole body itself.
    // Important layering for the 3D read:
    // - back disk and upper lensed image must stay behind the hole,
    // - the near-side/front disk must pass in front of the hole.
    // To achieve that, the shadow must live in the transparent queue with
    // full opacity, and render between the rear layers (<= 3) and the front
    // disk/rim (5 and 6).
    const shadow = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 96, 64),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 1,
        blending: THREE.NormalBlending,
        depthTest: true,
        depthWrite: false,
      }),
    );
    shadow.renderOrder = 4;
    group.add(shadow);
  }

  private addUpperShadowHemisphere(group: THREE.Group): void {
    // Immutable visual invariant: the camera-facing upper half of the real
    // sphere must always win over the upper lensed disk and lateral joins.
    // The lower/front accretion disk remains visible because the shader
    // discards the lower half in view space.
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
      depthTest: true,
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

  private addAccretionDisk(group: THREE.Group): void {
    const backMaterial = this.createDiskFlowMaterial({
      brightness: this.model.diskBrightness,
      opacity: 0.86,
      innerCut: 0.20,
      outerCut: 1.0,
      bandScale: 52.0,
      flowRate: 1.0,
      frontMask: false,
      innerGlowBoost: 3.10,
    });

    const frontMaterial = this.createDiskFlowMaterial({
      brightness: this.model.diskBrightness * 1.06,
      opacity: 0.96,
      innerCut: 0.18,
      outerCut: 1.0,
      bandScale: 54.0,
      flowRate: 1.0,
      frontMask: true,
      innerGlowBoost: 3.85,
    });

    const foregroundRimMaterial = this.createDiskFlowMaterial({
      brightness: this.model.diskBrightness * 1.12,
      opacity: 0.42,
      innerCut: 0.0,
      outerCut: 1.0,
      bandScale: 70.0,
      flowRate: 0.86,
      frontMask: true,
      innerGlowBoost: 4.35,
    });


    const diskBack = new THREE.Mesh(new THREE.RingGeometry(0.80, 3.55, 224, 1), backMaterial);
    const diskFront = new THREE.Mesh(new THREE.RingGeometry(0.80, 3.55, 224, 1), frontMaterial);
    const foregroundRim = new THREE.Mesh(new THREE.RingGeometry(0.78, 1.18, 224, 1), foregroundRimMaterial);
    const verticalScale = Math.max(0.05, this.model.diskThickness * 1.65);
    diskBack.scale.y = verticalScale;
    diskFront.scale.y = verticalScale;
    foregroundRim.scale.y = Math.max(0.09, verticalScale * 0.78);
    diskBack.position.z = -0.035;
    diskFront.position.z = 0.040;
    foregroundRim.position.z = 0.048;
    diskBack.renderOrder = 1;
    diskFront.renderOrder = 5;
    foregroundRim.renderOrder = 6;
    group.add(diskBack);
    group.add(diskFront);
    group.add(foregroundRim);
  }

  private addPhotonRing(
    group: THREE.Group,
    options?: {
      brightnessScale?: number;
      opacityBase?: number;
      opacityLensingScale?: number;
      innerGlowBoost?: number;
      verticalScale?: number;
      renderOrder?: number;
      zOffset?: number;
    },
  ): void {
    const photonRing = new THREE.Mesh(
      new THREE.RingGeometry(0.93, 1.03, 224, 1),
      this.createDiskFlowMaterial({
        brightness:
          this.model.diskBrightness *
          1.18 *
          (options?.brightnessScale ?? 1),
        opacity:
          (options?.opacityBase ?? 0.42) +
          (options?.opacityLensingScale ?? 0.16) * this.model.lensingStrength,
        innerCut: 0.0,
        outerCut: 1.0,
        bandScale: 72.0,
        flowRate: 1.25,
        frontMask: false,
        innerGlowBoost: options?.innerGlowBoost ?? 1.38,
      }),
    );
    photonRing.scale.y = options?.verticalScale ?? 0.22;
    photonRing.position.z = options?.zOffset ?? 0.010;
    photonRing.renderOrder = options?.renderOrder ?? 2;
    group.add(photonRing);
  }

  private addQuiescentLensingHalo(group: THREE.Group): void {
    // Broad low-luminosity lensing envelope. This remains much dimmer than
    // the active 28.2F.3 photon ring but is strong enough to make the SMBH read
    // as a real central gravitational engine inside the stellar nucleus.
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1.36, 256, 1),
      this.createDiskFlowMaterial({
        brightness: Math.max(0.22, this.model.diskBrightness * 1.52),
        opacity: 0.20 + 0.09 * this.model.lensingStrength,
        innerCut: 0.0,
        outerCut: 1.0,
        bandScale: 42.0,
        flowRate: 0.44,
        frontMask: false,
        innerGlowBoost: 1.34,
        orbitMotionStrength: 0.92,
        orbitMotionRate: 1.34,
      }),
    );
    halo.scale.y = 1.08;
    halo.position.z = -0.020;
    halo.renderOrder = 1.5;
    group.add(halo);
  }

  private addQuiescentResidualDisk(group: THREE.Group): void {
    // True residual disk/flow: dim, dusty and continuous, with the same
    // occlusion logic as the canonical black-hole renderer. Rendering the rear
    // layer before the shadow and the near-side layer after it prevents the
    // artificial straight line through the black sphere.
    const rearMaterial = this.createDiskFlowMaterial({
      brightness: Math.max(0.26, this.model.diskBrightness * 1.85),
      opacity: 0.16,
      innerCut: 0.0,
      outerCut: 1.0,
      bandScale: 34.0,
      flowRate: 0.42,
      frontMask: false,
      innerGlowBoost: 1.86,
      orbitMotionStrength: 0.74,
      orbitMotionRate: 1.12,
    });

    const frontMaterial = this.createDiskFlowMaterial({
      brightness: Math.max(0.34, this.model.diskBrightness * 2.35),
      opacity: 0.22,
      innerCut: 0.0,
      outerCut: 1.0,
      bandScale: 40.0,
      flowRate: 0.46,
      frontMask: true,
      innerGlowBoost: 2.24,
      orbitMotionStrength: 0.78,
      orbitMotionRate: 1.18,
    });


    const rear = new THREE.Mesh(
      new THREE.RingGeometry(0.80, 2.95, 224, 1),
      rearMaterial,
    );
    const front = new THREE.Mesh(
      new THREE.RingGeometry(0.80, 2.95, 224, 1),
      frontMaterial,
    );

    const verticalScale = 0.115;
    rear.scale.y = verticalScale;
    front.scale.y = verticalScale;

    rear.position.z = -0.040;
    front.position.z = 0.042;

    rear.renderOrder = 1.9;
    front.renderOrder = 5.1;

    group.add(rear);
    group.add(front);
  }

  private addQuiescentContourArc(group: THREE.Group): void {
    // A faint lensed arc hugging the upper/lower silhouette. It is intentionally
    // broad and soft rather than a bright active disk.
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uInner: { value: new THREE.Color(this.model.diskColorInner) },
        uMid: { value: new THREE.Color(this.model.diskColorMid) },
        uBrightness: { value: Math.max(0.24, this.model.diskBrightness * 1.78) },
        uOpacity: { value: 0.18 },
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
        uniform vec3 uInner;
        uniform vec3 uMid;
        uniform float uBrightness;
        uniform float uOpacity;
        varying vec2 vUv;

        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);

          float ring = 1.0 - smoothstep(0.90, 1.05, abs(r - 0.93) + 0.93);
          // cleaner ring mask around the shadow
          float innerEdge = smoothstep(0.80, 0.86, r);
          float outerEdge = 1.0 - smoothstep(1.02, 1.16, r);
          float contour = innerEdge * outerEdge;

          float upper = smoothstep(-0.18, 0.20, p.y);
          float lower = 1.0 - smoothstep(-0.22, 0.16, p.y);
          float verticalWeight = max(upper * 0.92, lower * 0.62);

          float sideFade = 1.0 - smoothstep(0.70, 1.02, abs(p.x));
          float alpha = contour * (0.46 + 0.54 * verticalWeight) * (0.70 + 0.30 * sideFade);

          if (alpha <= 0.002) discard;

          vec3 color = mix(uMid, uInner, 0.66 + verticalWeight * 0.18);
          gl_FragColor = vec4(color * uBrightness, alpha * uOpacity);
        }
      `,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.shaderMaterials.push(material);

    const arc = new THREE.Mesh(
      new THREE.PlaneGeometry(2.20, 2.20, 1, 1),
      material,
    );
    arc.position.z = 0.024;
    arc.renderOrder = 8.4;
    group.add(arc);
  }

  private addContourWrap(
    group: THREE.Group,
    options?: {
      brightnessScale?: number;
      opacityScale?: number;
      flowRateScale?: number;
      verticalScale?: number;
      renderOrder?: number;
      orbitMotionStrength?: number;
      orbitMotionRate?: number;
    },
  ): void {
    // New full-contour lensed wrap: unlike the top band, this is allowed to
    // stay visible around the whole shadow silhouette, including the lower
    // half, so the upper lensed disk reads as surrounding the entire hole.
    const contourWrap = new THREE.Mesh(
      new THREE.RingGeometry(0.84, 0.96, 256, 1),
      this.createDiskFlowMaterial({
        brightness:
          this.model.diskBrightness *
          1.42 *
          (options?.brightnessScale ?? 1),
        opacity:
          (0.60 + 0.20 * this.model.lensingStrength) *
          (options?.opacityScale ?? 1),
        innerCut: 0.0,
        outerCut: 1.0,
        bandScale: 68.0,
        flowRate:
          1.08 *
          (options?.flowRateScale ?? 1),
        frontMask: false,
        innerGlowBoost: 1.18,
        orbitMotionStrength: options?.orbitMotionStrength ?? 0.0,
        orbitMotionRate: options?.orbitMotionRate ?? 1.0,
      }),
    );
    contourWrap.scale.y = options?.verticalScale ?? 0.95;
    contourWrap.position.z = 0.018;
    // Render just before the upper shadow cap: this keeps the wrap visible
    // around the contour and lower half, but prevents it from painting over
    // the top black silhouette.
    contourWrap.renderOrder = options?.renderOrder ?? 19.2;
    group.add(contourWrap);
  }

  private upperLensedBandThicknessScale(): number {
    // Keep the lower edge glued to the black-hole contour, but trim a little
    // from the upper side so the lensed top disk reads slightly thinner.
    return 0.60;
  }

  private addLensedDiskImages(group: THREE.Group): void {
    // Element 2: upper lensed image of the accretion disk.
    const upperBandThicknessScale = this.upperLensedBandThicknessScale();
    const topBandHalo = this.createLensedDiskBand({
      yOffset: 0.30,
      zOffset: 0.018,
      bend: 1.03,
      leftWidth: 1.14,
      rightWidth: 1.24,
      height: 1.10,
      thickness: 0.16,
      brightness: this.model.diskBrightness * 0.80,
      opacity: 0.20,
      flowRate: 0.98,
      invertFlow: false,
      thicknessScale: upperBandThicknessScale,
    });
    const topBand = this.createLensedDiskBand({
      yOffset: 0.28,
      zOffset: 0.028,
      bend: 0.99,
      leftWidth: 1.04,
      rightWidth: 1.14,
      height: 1.04,
      thickness: 0.14,
      brightness: this.model.diskBrightness * 0.98,
      opacity: 0.64,
      flowRate: 1.02,
      invertFlow: false,
      thicknessScale: upperBandThicknessScale,
    });

    // Elements 3 and 4: independent left/right joins. Keeping them separate
    // lets us give them substantially more vertical amplitude without altering
    // the upper disk silhouette.
    const leftJoinHalo = this.createLensedJoinBand(-1, true);
    const leftJoin = this.createLensedJoinBand(-1, false);
    const rightJoinHalo = this.createLensedJoinBand(1, true);
    const rightJoin = this.createLensedJoinBand(1, false);

    // Keep the upper lensed image always visible hugging the upper contour
    // of the black-hole body. It should render after the sphere so it cannot
    // disappear behind it, but still before the near-side/front disk.
    topBandHalo.renderOrder = 8.1;
    topBand.renderOrder = 8.2;
    // Render the lateral join bands after the sphere as well, so they can
    // meet the upper lensed band cleanly at the contour with no visible gap.
    // Their own fragment mask already forbids drawing inside the silhouette.
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

  private createDiskFlowMaterial(config: {
    brightness: number;
    opacity: number;
    innerCut: number;
    outerCut: number;
    bandScale: number;
    flowRate: number;
    frontMask: boolean;
    innerGlowBoost: number;
    orbitMotionStrength?: number;
    orbitMotionRate?: number;
  }): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: new THREE.Color(this.model.diskColorInner) },
        uMid: { value: new THREE.Color(this.model.diskColorMid) },
        uOuter: { value: new THREE.Color(this.model.diskColorOuter) },
        uBrightness: { value: config.brightness },
        uOpacity: { value: config.opacity },
        uInnerCut: { value: config.innerCut },
        uOuterCut: { value: config.outerCut },
        uBandScale: { value: config.bandScale },
        uFlowRate: { value: config.flowRate },
        uFrontMask: { value: config.frontMask ? 1.0 : 0.0 },
        uInnerGlowBoost: { value: config.innerGlowBoost },
        uOrbitMotionStrength: { value: config.orbitMotionStrength ?? 0.0 },
        uOrbitMotionRate: { value: config.orbitMotionRate ?? 1.0 },
        uTurbulenceScale: { value: this.model.turbulenceScale },
        uTurbulenceStrength: { value: this.model.turbulenceStrength },
        uSpin: { value: this.model.spinDimensionless },
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
        uniform float uOrbitMotionStrength;
        uniform float uOrbitMotionRate;
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

          float orbitPhase =
            angle * 5.4 -
            uTime * uOrbitMotionRate * 2.8 +
            r * 8.0 +
            flow * 2.2;

          float orbitingClumps =
            0.5 +
            0.5 * sin(orbitPhase);

          float orbitingArc =
            smoothstep(0.34, 0.82, orbitingClumps);

          float heat = pow(clamp(1.0 - smoothstep(uInnerCut, uOuterCut, r), 0.0, 1.0), 0.46);
          vec3 color = mix(uOuter, uMid, smoothstep(0.06, 0.76, heat));
          color = mix(color, uInner, pow(heat, 1.95) * (0.78 + 0.22 * streaks));
          color = mix(color, uOuter, (1.0 - heat) * 0.18 * (0.55 + 0.45 * bands));

          float approaching = 0.70 + 0.60 * (0.5 + 0.5 * cos(angle - 0.52));
          float textureBoost = 0.88
            + (flow - 0.5) * uTurbulenceStrength * 1.45
            + (bands - 0.5) * 0.34
            + (streaks - 0.5) * 0.18
            + (shear - 0.5) * 0.12
            + (orbitingArc - 0.5) * uOrbitMotionStrength * 0.82;
          float alpha = smoothstep(uInnerCut, min(uInnerCut + 0.05, uOuterCut), r)
            * (1.0 - smoothstep(max(uOuterCut - 0.08, uInnerCut), uOuterCut, r));
          alpha *= 0.90 + (bands - 0.5) * 0.16;
          alpha *= 1.0 + (orbitingArc - 0.5) * uOrbitMotionStrength * 0.30;
          if (uFrontMask > 0.5) {
            float frontBand = 1.0 - smoothstep(-0.22, 0.02, p.y);
            frontBand *= smoothstep(0.12, 0.28, r);
            alpha *= frontBand;
          }

          // Broad, progressive inner-disk radiance: from roughly the middle
          // of the disk inward, luminosity climbs steeply toward the shadow.
          float innerGlowEnd = mix(uInnerCut, uOuterCut, 0.58);
          float innerGlow = 1.0 - smoothstep(uInnerCut + 0.015, innerGlowEnd, r);
          innerGlow = pow(clamp(innerGlow, 0.0, 1.0), 1.12);
          float innerRadianceBoost = 1.0 + innerGlow * uInnerGlowBoost;

          float hotCoreMix = innerGlow * 0.58 * clamp(uInnerGlowBoost / 3.0, 0.0, 1.0);
          vec3 hotCore = mix(uInner, vec3(1.0), 0.38);
          color = mix(color, hotCore, hotCoreMix);

          gl_FragColor = vec4(color * uBrightness * textureBoost * approaching * innerRadianceBoost, alpha * uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shaderMaterials.push(material);
    return material;
  }

  private createLensedDiskBand(config: {
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
  }): THREE.Mesh {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: new THREE.Color(this.model.diskColorInner) },
        uMid: { value: new THREE.Color(this.model.diskColorMid) },
        uOuter: { value: new THREE.Color(this.model.diskColorOuter) },
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
        uSpin: { value: this.model.spinDimensionless },
        uTurbulenceScale: { value: this.model.turbulenceScale },
        uTurbulenceStrength: { value: this.model.turbulenceStrength },
      },
      vertexShader: `
        uniform float uYOffset;
        uniform float uZOffset;
        uniform float uLeftWidth;
        uniform float uRightWidth;
        uniform float uHeight;
        uniform float uThickness;
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
        uniform float uInclinationFactor;
        uniform float uRotationAngle;
        uniform float uTailReachBoost;
        uniform float uTailDrop;
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

          // Force the upper lensed disk to ride just above the sphere contour.
          // This keeps it visible for every inclination while preventing it
          // from ever intruding inside the black-hole silhouette.
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
    this.shaderMaterials.push(material);
    return new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0, 96, 96), material);
  }

  private createLensedJoinBand(side: -1 | 1, halo: boolean): THREE.Mesh {
    const inclinationFactor = THREE.MathUtils.clamp((this.model.inclinationDegrees - 22) / (72 - 22), 0, 1);
    // Canonical join-band geometry for every black-hole family.
    // The previous implementation gated the fully tuned band deformation
    // behind STELLAR_MASS_BLACK_HOLE, leaving IMBH/SMBH on an older geometry.
    // Keep family-dependent colour/physics in the model, but make the visual
    // join-band construction identical across stellar, intermediate and SMBH.
    const tailReachBoost = side > 0 ? 0.46 : 0.18;
    const tailDrop = side > 0 ? 0.12 : 0.06;
    const bandSpaceMaskBlend = 1.0;
    const leftTailDropExtra = this.model.sampleLabel === 'D' ? 0.02 : 0.11;
    const leftRotationOffset = THREE.MathUtils.lerp(0.052, 0.020, inclinationFactor);
    const rightTailLift = this.model.sampleLabel === 'D' ? 0.06 : 0.15;
    const rightRotationOffset = THREE.MathUtils.lerp(0.052, 0.020, inclinationFactor);
    const leftTerminalFadeStrength = this.model.sampleLabel === 'D' ? 0.20 : 0.38;
    const leftEntryFadeStrength = this.model.sampleLabel === 'D' ? 0.20 : 0.34;
    const rightEntryFadeStrength = this.model.sampleLabel === 'D' ? 0.16 : 0.24;
    const rightTerminalFadeStrength = this.model.sampleLabel === 'D' ? 0.48 : 0.76;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: new THREE.Color(this.model.diskColorInner) },
        uMid: { value: new THREE.Color(this.model.diskColorMid) },
        uOuter: { value: new THREE.Color(this.model.diskColorOuter) },
        uBrightness: { value: this.model.diskBrightness * (halo ? 0.80 : 1.00) },
        uOpacity: { value: halo ? 0.22 : 0.70 },
        uSide: { value: side },
        uSpin: { value: this.model.spinDimensionless },
        uTurbulenceScale: { value: this.model.turbulenceScale },
        uTurbulenceStrength: { value: this.model.turbulenceStrength },
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
    this.shaderMaterials.push(material);
    return new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0, 96, 48), material);
  }

}

function disposeObjectTree(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry instanceof THREE.BufferGeometry) geometries.add(mesh.geometry);
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach(value => materials.add(value));
    else if (material instanceof THREE.Material) materials.add(material);
  });
  geometries.forEach(value => value.dispose());
  materials.forEach(value => value.dispose());
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
