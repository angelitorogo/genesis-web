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

export interface SystemSceneOrbitalStationPlanV1 {
  readonly orbitRadiusPlanetRadii: number;
  readonly inclinationRadians: number;
  readonly ascendingNodeRadians: number;
  readonly phaseRadians: number;
  readonly angularSpeedRadiansPerDay: number;
  readonly hullColorHex: string;
  readonly lineColorHex: string;
  readonly stationScaleScene: number;
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
  readonly role: 'body' | 'panel' | 'accent' | 'truss' | 'window';
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
  const baseCount = tier === 'ADVANCED' ? 3 : 9;
  const extra = Math.floor(rand(seedUint32, 0x1001) * (tier === 'ADVANCED' ? 3 : 6));
  const count = baseCount + extra;
  const plans: SystemSceneArtificialSatellitePlanV1[] = [];
  const minRadius = tier === 'ADVANCED' ? 1.45 : 1.34;
  const maxRadius = tier === 'ADVANCED' ? 2.12 : 2.52;
  for (let i = 0; i < count; i++) {
    const shell01 = count <= 1 ? 0.5 : i / Math.max(1, count - 1);
    const shellNoise = rand(seedUint32, 0x1100 + i * 17);
    const radiusPlanetRadii = minRadius + (maxRadius - minRadius) * (0.16 + 0.84 * shell01) + 0.04 * (shellNoise - 0.5);
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
    const pointScaleScene = Math.max(sceneRadius * 0.018, planetRadiusScene * (tier === 'VERY_ADVANCED' ? 0.044 : 0.039));
    const lineOpacity01 = tier === 'VERY_ADVANCED' ? 0.24 : 0.18;
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

export function buildSystemSceneOrbitalStationPlansV1(
  seedUint32: number,
  tier: SystemSceneArtificialSatelliteTierV1,
  planetRadiusScene: number,
): readonly SystemSceneOrbitalStationPlanV1[] {
  if (tier !== 'VERY_ADVANCED') {
    return Object.freeze([]);
  }

  const count = 1 + Math.floor(rand(seedUint32, 0x3001) * 3);
  const plans: SystemSceneOrbitalStationPlanV1[] = [];
  const minRadius = 2.08;
  const maxRadius = 3.28;

  for (let i = 0; i < count; i += 1) {
    const shell01 = count <= 1 ? 0.5 : i / Math.max(1, count - 1);
    const radiusPlanetRadii = minRadius + (maxRadius - minRadius) * (0.14 + 0.86 * shell01) + 0.06 * (rand(seedUint32, 0x3100 + i * 11) - 0.5);
    const inclination = (0.04 + 0.12 * rand(seedUint32, 0x3200 + i * 11)) * Math.PI;
    const node = rand(seedUint32, 0x3201 + i * 11) * Math.PI * 2;
    const phase = rand(seedUint32, 0x3202 + i * 11) * Math.PI * 2;
    const direction = rand(seedUint32, 0x3203 + i * 11) < 0.9 ? 1 : -1;
    const angularSpeed = direction * (0.24 + 0.42 * rand(seedUint32, 0x3204 + i * 11)) / Math.max(1.4, radiusPlanetRadii * radiusPlanetRadii);
    const hullColorHex = rand(seedUint32, 0x3300 + i * 11) < 0.52 ? '#f0f5ff' : '#d8e0ea';
    const lineColorHex = rand(seedUint32, 0x3301 + i * 11) < 0.5 ? '#a9cdf7' : '#d5ecff';
    const stationScaleScene = Math.max(planetRadiusScene * 0.11, radiusPlanetRadii * planetRadiusScene * 0.028);
    plans.push(Object.freeze({
      orbitRadiusPlanetRadii: radiusPlanetRadii,
      inclinationRadians: inclination,
      ascendingNodeRadians: node,
      phaseRadians: phase,
      angularSpeedRadiansPerDay: angularSpeed,
      hullColorHex,
      lineColorHex,
      stationScaleScene,
      lineOpacity01: 0.28,
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
  const bodyMaterial = createOpaqueMaterial(bodyColor);
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(bodyMesh);
  resources.push(bodyGeometry, bodyMaterial);
  materials.push(Object.freeze({ material: bodyMaterial, baseColor: bodyColor.clone(), role: 'body' }));

  const panelGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, baseScale * 0.06);
  const panelMaterial = createOpaqueMaterial(panelColor);
  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  leftPanel.position.set(-panelHalfSpan, 0, 0);
  const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  rightPanel.position.set(panelHalfSpan, 0, 0);
  group.add(leftPanel, rightPanel);
  resources.push(panelGeometry, panelMaterial);
  materials.push(Object.freeze({ material: panelMaterial, baseColor: panelColor.clone(), role: 'panel' }));

  const mastGeometry = new THREE.BoxGeometry(mastThickness, mastHeight, mastThickness);
  const mastMaterial = createOpaqueMaterial(accentColor);
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

export function createSystemSceneOrbitalStationVisualV1(
  plan: SystemSceneOrbitalStationPlanV1,
  seedUint32: number,
): SystemSceneArtificialSatelliteVisualV1 {
  const group = new THREE.Group();
  const materials: SystemSceneArtificialSatelliteMaterialBindingV1[] = [];
  const resources: Array<{ dispose(): void }> = [];

  const baseScale = plan.stationScaleScene;
  const hullColor = new THREE.Color(plan.hullColorHex);
  const trussColor = new THREE.Color('#97a8bf');
  const panelColor = new THREE.Color('#496c9d');
  const windowColor = new THREE.Color('#dff4ff');
  const accentColor = new THREE.Color('#ffdca8');

  const spineLength = baseScale * lerp(2.6, 3.3, rand(seedUint32, 0x4001));
  const spineHeight = baseScale * lerp(0.34, 0.48, rand(seedUint32, 0x4002));
  const spineDepth = baseScale * lerp(0.26, 0.38, rand(seedUint32, 0x4003));
  const spineGeometry = new THREE.BoxGeometry(spineLength, spineHeight, spineDepth);
  const spineMaterial = createOpaqueMaterial(hullColor);
  const spine = new THREE.Mesh(spineGeometry, spineMaterial);
  group.add(spine);
  resources.push(spineGeometry, spineMaterial);
  materials.push(Object.freeze({ material: spineMaterial, baseColor: hullColor.clone(), role: 'body' }));

  const hubWidth = baseScale * lerp(0.72, 0.94, rand(seedUint32, 0x4004));
  const hubHeight = baseScale * lerp(0.56, 0.74, rand(seedUint32, 0x4005));
  const hubDepth = baseScale * lerp(0.44, 0.60, rand(seedUint32, 0x4006));
  const hubGeometry = new THREE.BoxGeometry(hubWidth, hubHeight, hubDepth);
  const hubMaterial = createOpaqueMaterial(hullColor.clone().multiplyScalar(0.96));
  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
  hub.position.set(0, 0, 0);
  group.add(hub);
  resources.push(hubGeometry, hubMaterial);
  materials.push(Object.freeze({ material: hubMaterial, baseColor: hubMaterial.color.clone(), role: 'body' }));

  const armLength = baseScale * lerp(1.15, 1.48, rand(seedUint32, 0x4007));
  const armThickness = baseScale * 0.10;
  const armGeometry = new THREE.BoxGeometry(armThickness, armLength, armThickness);
  const armMaterial = createOpaqueMaterial(trussColor);
  const armLeft = new THREE.Mesh(armGeometry, armMaterial);
  armLeft.position.set(-spineLength * 0.18, 0, 0);
  const armRight = new THREE.Mesh(armGeometry, armMaterial);
  armRight.position.set(spineLength * 0.18, 0, 0);
  group.add(armLeft, armRight);
  resources.push(armGeometry, armMaterial);
  materials.push(Object.freeze({ material: armMaterial, baseColor: trussColor.clone(), role: 'truss' }));

  const dockWidth = baseScale * lerp(0.72, 0.92, rand(seedUint32, 0x4008));
  const dockHeight = baseScale * lerp(0.22, 0.30, rand(seedUint32, 0x4009));
  const dockDepth = baseScale * lerp(0.22, 0.30, rand(seedUint32, 0x4010));
  const dockGeometry = new THREE.BoxGeometry(dockWidth, dockHeight, dockDepth);
  const dockMaterial = createOpaqueMaterial(accentColor);
  const dockTop = new THREE.Mesh(dockGeometry, dockMaterial);
  dockTop.position.set(-spineLength * 0.18, armLength * 0.54, 0);
  const dockBottom = new THREE.Mesh(dockGeometry, dockMaterial);
  dockBottom.position.set(spineLength * 0.18, -armLength * 0.54, 0);
  group.add(dockTop, dockBottom);
  resources.push(dockGeometry, dockMaterial);
  materials.push(Object.freeze({ material: dockMaterial, baseColor: accentColor.clone(), role: 'accent' }));

  const panelGeometry = new THREE.BoxGeometry(baseScale * 0.92, baseScale * 0.18, baseScale * 0.06);
  const panelMaterial = createOpaqueMaterial(panelColor);
  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  leftPanel.position.set(-spineLength * 0.52, 0, 0);
  const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  rightPanel.position.set(spineLength * 0.52, 0, 0);
  group.add(leftPanel, rightPanel);
  resources.push(panelGeometry, panelMaterial);
  materials.push(Object.freeze({ material: panelMaterial, baseColor: panelColor.clone(), role: 'panel' }));

  const windowGeometry = new THREE.BoxGeometry(baseScale * 0.48, baseScale * 0.10, baseScale * 0.03);
  const windowMaterial = createOpaqueMaterial(windowColor);
  const windows = new THREE.Mesh(windowGeometry, windowMaterial);
  windows.position.set(0, spineHeight * 0.08, hubDepth * 0.55);
  group.add(windows);
  resources.push(windowGeometry, windowMaterial);
  materials.push(Object.freeze({ material: windowMaterial, baseColor: windowColor.clone(), role: 'window' }));

  group.rotation.z = rand(seedUint32, 0x4011) * Math.PI * 2;
  group.rotation.y = (rand(seedUint32, 0x4012) - 0.5) * 0.2;

  return Object.freeze({
    group,
    materials: Object.freeze(materials),
    resources: Object.freeze(resources),
  });
}

function createOpaqueMaterial(
  color: THREE.Color,
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: false,
    opacity: 1,
    toneMapped: false,
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
