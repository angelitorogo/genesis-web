import * as THREE from 'three';
import { type Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';

export type SystemSceneArtificialSatelliteTierV1 =
  | 'ADVANCED'
  | 'VERY_ADVANCED';

export interface SystemSceneArtificialSatellitePlanV1 {
  readonly orbitRadiusPlanetRadii: number;
  readonly inclinationRadians: number;
  readonly ascendingNodeRadians: number;
  readonly phaseRadians: number;
  readonly angularSpeedRadiansPerDay: number;
  readonly pointColorHex: string;
  readonly lineColorHex: string;
  readonly pointScaleScene: number;
  readonly lineOpacity01: number;
}

export interface SystemSceneArtificialSatelliteVisualV1 {
  readonly group: THREE.Group;
  readonly materials: readonly SystemSceneArtificialSatelliteMaterialBindingV1[];
  readonly resources: readonly { dispose(): void }[];
}

export interface SystemSceneArtificialSatelliteMaterialBindingV1 {
  readonly material: THREE.MeshBasicMaterial;
  readonly baseColor: THREE.Color;
  readonly role: 'body' | 'panel' | 'accent';
}

export function supportsSystemSceneArtificialSatellitesV1(
  tier: Vida7CivilizationTier | null | undefined,
): tier is SystemSceneArtificialSatelliteTierV1 {
  return tier === 'ADVANCED' || tier === 'VERY_ADVANCED';
}

export function buildSystemSceneArtificialSatellitePlansV1(
  seedUint32: number,
  tier: SystemSceneArtificialSatelliteTierV1,
  planetRadiusScene: number,
): readonly SystemSceneArtificialSatellitePlanV1[] {
  const baseCount = tier === 'ADVANCED' ? 3 : 6;
  const extra = Math.floor(rand(seedUint32, 0x1001) * (tier === 'ADVANCED' ? 3 : 4));
  const count = baseCount + extra;
  const plans: SystemSceneArtificialSatellitePlanV1[] = [];
  const minRadius = tier === 'ADVANCED' ? 1.45 : 1.38;
  const maxRadius = tier === 'ADVANCED' ? 2.12 : 2.34;
  for (let i = 0; i < count; i++) {
    const shell01 = count <= 1 ? 0.5 : i / Math.max(1, count - 1);
    const shellNoise = rand(seedUint32, 0x1100 + i * 17);
    const radiusPlanetRadii = minRadius + (maxRadius - minRadius) * (0.18 + 0.82 * shell01) + 0.04 * (shellNoise - 0.5);
    const inclination = (0.03 + 0.18 * rand(seedUint32, 0x1200 + i * 17)) * Math.PI;
    const node = rand(seedUint32, 0x1201 + i * 17) * Math.PI * 2;
    const phase = rand(seedUint32, 0x1202 + i * 17) * Math.PI * 2;
    const direction = rand(seedUint32, 0x1203 + i * 17) < 0.82 ? 1 : -1;
    const angularSpeed = direction * (0.7 + 1.1 * rand(seedUint32, 0x1204 + i * 17)) / Math.max(1.1, radiusPlanetRadii * radiusPlanetRadii);
    const warmNetwork = tier === 'ADVANCED' && rand(seedUint32, 0x1300 + i * 13) < 0.34;
    const colorHex = warmNetwork
      ? (rand(seedUint32, 0x1301 + i * 13) < 0.5 ? '#ffd59a' : '#ffedc0')
      : (tier === 'VERY_ADVANCED'
          ? (rand(seedUint32, 0x1302 + i * 13) < 0.58 ? '#eaf6ff' : '#b9d9ff')
          : (rand(seedUint32, 0x1303 + i * 13) < 0.55 ? '#edf7ff' : '#c6e0ff'));
    const sceneRadius = radiusPlanetRadii * planetRadiusScene;
    const pointScaleScene = Math.max(sceneRadius * 0.018, planetRadiusScene * (tier === 'VERY_ADVANCED' ? 0.048 : 0.042));
    const lineOpacity01 = tier === 'VERY_ADVANCED' ? 0.26 : 0.18;
    plans.push(Object.freeze({
      orbitRadiusPlanetRadii: radiusPlanetRadii,
      inclinationRadians: inclination,
      ascendingNodeRadians: node,
      phaseRadians: phase,
      angularSpeedRadiansPerDay: angularSpeed,
      pointColorHex: colorHex,
      lineColorHex: colorHex,
      pointScaleScene,
      lineOpacity01,
    }));
  }
  return Object.freeze(plans);
}

export function createSystemSceneArtificialSatelliteVisualV1(
  plan: SystemSceneArtificialSatellitePlanV1,
  seedUint32: number,
): SystemSceneArtificialSatelliteVisualV1 {
  const group = new THREE.Group();
  const materials: SystemSceneArtificialSatelliteMaterialBindingV1[] = [];
  const resources: Array<{ dispose(): void }> = [];

  const panelColor = new THREE.Color(0x5e86b8);
  const bodyColor = new THREE.Color(0xdfe4ec);
  const accentColor = new THREE.Color(plan.pointColorHex);
  const baseScale = plan.pointScaleScene;
  const busWidth = baseScale * lerp(0.92, 1.14, rand(seedUint32, 0x2001));
  const busHeight = baseScale * lerp(0.42, 0.56, rand(seedUint32, 0x2002));
  const busDepth = baseScale * lerp(0.34, 0.46, rand(seedUint32, 0x2003));
  const panelHalfSpan = baseScale * lerp(1.05, 1.48, rand(seedUint32, 0x2004));
  const panelWidth = baseScale * lerp(0.78, 1.18, rand(seedUint32, 0x2005));
  const panelHeight = baseScale * lerp(0.22, 0.30, rand(seedUint32, 0x2006));
  const mastHeight = baseScale * lerp(0.48, 0.72, rand(seedUint32, 0x2007));
  const mastThickness = baseScale * 0.08;
  const bodyGeometry = new THREE.BoxGeometry(busWidth, busHeight, busDepth);
  const bodyMaterial = new THREE.MeshBasicMaterial({
    color: bodyColor,
    toneMapped: false,
  });
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(bodyMesh);
  resources.push(bodyGeometry, bodyMaterial);
  materials.push(Object.freeze({ material: bodyMaterial, baseColor: bodyColor.clone(), role: 'body' }));

  const panelGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, baseScale * 0.06);
  const panelMaterial = new THREE.MeshBasicMaterial({
    color: panelColor,
    toneMapped: false,
  });
  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  leftPanel.position.set(-panelHalfSpan, 0, 0);
  const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  rightPanel.position.set(panelHalfSpan, 0, 0);
  group.add(leftPanel, rightPanel);
  resources.push(panelGeometry, panelMaterial);
  materials.push(Object.freeze({ material: panelMaterial, baseColor: panelColor.clone(), role: 'panel' }));

  const mastGeometry = new THREE.BoxGeometry(mastThickness, mastHeight, mastThickness);
  const mastMaterial = new THREE.MeshBasicMaterial({
    color: accentColor,
    toneMapped: false,
  });
  const mast = new THREE.Mesh(mastGeometry, mastMaterial);
  mast.position.set(0, busHeight * 0.5 + mastHeight * 0.36, 0);
  group.add(mast);
  resources.push(mastGeometry, mastMaterial);
  materials.push(Object.freeze({ material: mastMaterial, baseColor: accentColor.clone(), role: 'accent' }));

  const wingRoll = (rand(seedUint32, 0x2010) - 0.5) * 0.22;
  leftPanel.rotation.z = wingRoll;
  rightPanel.rotation.z = wingRoll;
  group.rotation.z = rand(seedUint32, 0x2011) * Math.PI * 2;
  group.rotation.y = (rand(seedUint32, 0x2012) - 0.5) * 0.35;

  return Object.freeze({
    group,
    materials: Object.freeze(materials),
    resources: Object.freeze(resources),
  });
}

function rand(seed: number, salt: number): number {
  return mix(seed ^ Math.imul((salt + 1) >>> 0, 0x85ebca6b)) / 4294967295;
}

function mix(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}


function lerp(min: number, max: number, amount01: number): number {
  return min + (max - min) * amount01;
}
