import * as THREE from 'three';
import { type Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';
import {
  addOrbitalEngineeringDetailV5,
  addOrbitalRingEngineeringDetailV5,
  createOrbitalMetalMaterialV5,
  finishOrbitalMaterialsV5,
} from './system-scene-orbital-detail-visciv5';

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

export type SystemSceneOrbitalInstallationKindV1 = 'INDUSTRIAL' | 'HABITAT' | 'PLATFORM';
export type SystemSceneOrbitalRingKindV1 = 'TRANSPORT' | 'HABITAT';

export interface SystemSceneOrbitalInfrastructureProfileV1 {
  readonly profileId: 'INDUSTRIAL' | 'HABITAT' | 'MIXED' | 'SINGLE_RING' | 'DOUBLE_RING' | 'PLATFORM';
  readonly stationKinds: readonly SystemSceneOrbitalInstallationKindV1[];
  readonly ringKinds: readonly SystemSceneOrbitalRingKindV1[];
}

export interface SystemSceneOrbitalRingPlanV1 {
  readonly orbitRadiusPlanetRadii: number;
  readonly inclinationRadians: number;
  readonly ascendingNodeRadians: number;
  readonly phaseRadians: number;
  readonly angularSpeedRadiansPerDay: number;
  readonly ringKind: SystemSceneOrbitalRingKindV1;
  readonly structureColorHex: string;
  readonly moduleColorHex: string;
  readonly moduleCount: number;
}

export interface SystemSceneOrbitalStationPlanV1 {
  readonly installationKind: SystemSceneOrbitalInstallationKindV1;
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

export interface SystemSceneOrbitalRingVisualV1 extends SystemSceneArtificialSatelliteVisualV1 {
  readonly rotationPivot: THREE.Group;
}

export interface SystemSceneArtificialSatelliteMaterialBindingV1 {
  readonly material: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
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

/** Selection is derived only from the planet's canonical surface seed. */
export function buildSystemSceneOrbitalInfrastructureProfileV1(
  seedUint32: number,
  tier: SystemSceneArtificialSatelliteTierV1,
): SystemSceneOrbitalInfrastructureProfileV1 {
  if (tier !== 'VERY_ADVANCED') {
    return Object.freeze({
      profileId: 'MIXED',
      stationKinds: Object.freeze([]),
      ringKinds: Object.freeze([]),
    });
  }

  const candidates: readonly SystemSceneOrbitalInfrastructureProfileV1[] = [
    { profileId: 'INDUSTRIAL', stationKinds: ['INDUSTRIAL', 'INDUSTRIAL'], ringKinds: [] },
    { profileId: 'HABITAT', stationKinds: ['HABITAT', 'HABITAT', 'HABITAT'], ringKinds: [] },
    { profileId: 'MIXED', stationKinds: ['INDUSTRIAL', 'HABITAT'], ringKinds: [] },
    { profileId: 'SINGLE_RING', stationKinds: ['HABITAT'], ringKinds: ['TRANSPORT'] },
    { profileId: 'DOUBLE_RING', stationKinds: ['HABITAT', 'HABITAT'], ringKinds: ['HABITAT', 'TRANSPORT'] },
    { profileId: 'PLATFORM', stationKinds: ['PLATFORM', 'INDUSTRIAL'], ringKinds: [] },
  ];
  const index = Math.min(
    candidates.length - 1,
    Math.floor(rand(seedUint32, 0x401a) * candidates.length),
  );
  const selected = candidates[index]!;
  return Object.freeze({
    profileId: selected.profileId,
    stationKinds: Object.freeze([...selected.stationKinds]),
    ringKinds: Object.freeze([...selected.ringKinds]),
  });
}

export function buildSystemSceneOrbitalStationPlansV1(
  seedUint32: number,
  tier: SystemSceneArtificialSatelliteTierV1,
  planetRadiusScene: number,
): readonly SystemSceneOrbitalStationPlanV1[] {
  const profile = buildSystemSceneOrbitalInfrastructureProfileV1(seedUint32, tier);
  const plans: SystemSceneOrbitalStationPlanV1[] = [];
  for (let i = 0; i < profile.stationKinds.length; i += 1) {
    const installationKind = profile.stationKinds[i]!;
    const share = (i + 1) / (profile.stationKinds.length + 1);
    const radiusPlanetRadii = 2.08 + share * 1.12 + 0.08 * (rand(seedUint32, 0x3100 + i * 11) - 0.5);
    const inclination = (0.04 + 0.12 * rand(seedUint32, 0x3200 + i * 11)) * Math.PI;
    const node = rand(seedUint32, 0x3201 + i * 11) * Math.PI * 2;
    const phase = rand(seedUint32, 0x3202 + i * 11) * Math.PI * 2;
    const direction = rand(seedUint32, 0x3203 + i * 11) < 0.9 ? 1 : -1;
    const angularSpeed = direction * (0.24 + 0.42 * rand(seedUint32, 0x3204 + i * 11)) / Math.max(1.4, radiusPlanetRadii * radiusPlanetRadii);
    const palette = rand(seedUint32, 0x3300) < 0.5
      ? ['#a3b5c1', '#87aac3'] as const
      : ['#b5aa9c', '#b3a58c'] as const;
    const stationScaleScene = Math.max(planetRadiusScene * 0.105, radiusPlanetRadii * planetRadiusScene * 0.027);
    plans.push(Object.freeze({
      installationKind,
      orbitRadiusPlanetRadii: radiusPlanetRadii,
      inclinationRadians: inclination,
      ascendingNodeRadians: node,
      phaseRadians: phase,
      angularSpeedRadiansPerDay: angularSpeed,
      hullColorHex: palette[0],
      lineColorHex: palette[1],
      stationScaleScene: installationKind === 'PLATFORM' ? stationScaleScene * 0.87 : stationScaleScene,
      lineOpacity01: 0.27,
    }));
  }
  return Object.freeze(plans);
}

export function buildSystemSceneOrbitalRingPlansV1(
  seedUint32: number,
  tier: SystemSceneArtificialSatelliteTierV1,
): readonly SystemSceneOrbitalRingPlanV1[] {
  const profile = buildSystemSceneOrbitalInfrastructureProfileV1(seedUint32, tier);
  const colors = rand(seedUint32, 0x4400) < 0.5
    ? ['#abbfdb', '#d4efff'] as const
    : ['#c5baa5', '#ffdeb4'] as const;
  const planeInclination = (0.08 + 0.06 * rand(seedUint32, 0x4402)) * Math.PI;
  const planeNode = rand(seedUint32, 0x4403) * Math.PI * 2;
  return Object.freeze(profile.ringKinds.map((ringKind, index) => Object.freeze({
    orbitRadiusPlanetRadii: 1.76 + index * 0.54 + 0.10 * rand(seedUint32, 0x4401 + index),
    inclinationRadians: planeInclination,
    ascendingNodeRadians: planeNode,
    phaseRadians: rand(seedUint32, 0x4404 + index) * Math.PI * 2,
    angularSpeedRadiansPerDay: 0.015 + 0.025 * rand(seedUint32, 0x4405 + index),
    ringKind,
    structureColorHex: colors[0],
    moduleColorHex: colors[1],
    moduleCount: ringKind === 'HABITAT' ? 18 : 12,
  })));
}

export function createSystemSceneArtificialSatelliteVisualV1(
  plan: SystemSceneArtificialSatellitePlanV1,
  seedUint32: number,
): SystemSceneArtificialSatelliteVisualV1 {
  const group = new THREE.Group();
  const materials: SystemSceneArtificialSatelliteMaterialBindingV1[] = [];
  const resources: Array<{ dispose(): void }> = [];

  const panelColor = new THREE.Color(0x47698a);
  const bodyColor = new THREE.Color(0xa2b2c2);
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

  addOrbitalEngineeringDetailV5(group, materials, resources, 'SATELLITE', baseScale, seedUint32);
  finishOrbitalMaterialsV5(materials, resources, seedUint32);

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
  if (plan.installationKind === 'HABITAT' || plan.installationKind === 'PLATFORM') {
    return createSpecializedOrbitalStationVisualV1(plan, seedUint32);
  }
  const group = new THREE.Group();
  const materials: SystemSceneArtificialSatelliteMaterialBindingV1[] = [];
  const resources: Array<{ dispose(): void }> = [];

  const baseScale = plan.stationScaleScene;
  const hullColor = new THREE.Color(plan.hullColorHex);
  const trussColor = new THREE.Color('#788c9e');
  const panelColor = new THREE.Color('#496c9d');
  const windowColor = new THREE.Color('#9fc4da');
  const accentColor = new THREE.Color('#a48e77');

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

  addOrbitalEngineeringDetailV5(group, materials, resources, 'INDUSTRIAL', baseScale, seedUint32);
  finishOrbitalMaterialsV5(materials, resources, seedUint32);

  return Object.freeze({
    group,
    materials: Object.freeze(materials),
    resources: Object.freeze(resources),
  });
}

/** Planet-centred orbital ring, distinct from the thin satellite orbit guides. */
export function createSystemSceneOrbitalRingVisualV1(
  plan: SystemSceneOrbitalRingPlanV1,
  planetRadiusScene: number,
): SystemSceneOrbitalRingVisualV1 {
  const root = new THREE.Group();
  root.name = `Artificial ${plan.ringKind.toLowerCase()} ring`;
  root.rotation.z = plan.ascendingNodeRadians;
  root.rotation.x = plan.inclinationRadians;
  const rotor = new THREE.Group();
  rotor.name = 'Artificial ring rotor';
  root.add(rotor);
  const materials: SystemSceneArtificialSatelliteMaterialBindingV1[] = [];
  const resources: { dispose(): void }[] = [];
  const radius = planetRadiusScene * plan.orbitRadiusPlanetRadii;
  const segments = 96;
  const arcLength = (2 * Math.PI * radius) / segments;
  const beamThickness = Math.max(planetRadiusScene * 0.012, radius * 0.007);
  const trussColor = new THREE.Color(plan.structureColorHex);
  const beamMaterial = createOpaqueMaterial(trussColor);
  const beamGeometry = new THREE.BoxGeometry(beamThickness, beamThickness, arcLength * 0.94);
  const beams = new THREE.InstancedMesh(beamGeometry, beamMaterial, segments);
  beams.name = 'Segmented structural ring';
  const temp = new THREE.Object3D();
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    temp.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
    temp.rotation.set(0, -angle, 0);
    temp.updateMatrix();
    beams.setMatrixAt(i, temp.matrix);
  }
  beams.instanceMatrix.needsUpdate = true;
  rotor.add(beams);
  resources.push(beamGeometry, beamMaterial);
  materials.push(Object.freeze({ material: beamMaterial, baseColor: trussColor.clone(), role: 'truss' }));

  const modulesColor = new THREE.Color(plan.moduleColorHex);
  const moduleMaterial = createOpaqueMaterial(modulesColor);
  const moduleWidth = planetRadiusScene * (plan.ringKind === 'HABITAT' ? 0.085 : 0.058);
  const moduleHeight = planetRadiusScene * (plan.ringKind === 'HABITAT' ? 0.055 : 0.036);
  const moduleGeometry = new THREE.BoxGeometry(moduleWidth, moduleHeight, moduleWidth * 1.5);
  const modules = new THREE.InstancedMesh(moduleGeometry, moduleMaterial, plan.moduleCount);
  modules.name = plan.ringKind === 'HABITAT' ? 'Ring residential modules' : 'Ring transfer platforms';
  for (let i = 0; i < plan.moduleCount; i += 1) {
    const angle = (i / plan.moduleCount) * Math.PI * 2;
    temp.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
    temp.rotation.set(0, -angle, 0);
    temp.updateMatrix();
    modules.setMatrixAt(i, temp.matrix);
  }
  modules.instanceMatrix.needsUpdate = true;
  rotor.add(modules);
  resources.push(moduleGeometry, moduleMaterial);
  materials.push(Object.freeze({ material: moduleMaterial, baseColor: modulesColor.clone(), role: plan.ringKind === 'HABITAT' ? 'window' : 'accent' }));

  const ringSeed = Math.round(plan.orbitRadiusPlanetRadii * 65536) ^ Math.round(plan.ascendingNodeRadians * 8192);
  addOrbitalRingEngineeringDetailV5(rotor, materials, resources, radius, beamThickness, ringSeed);
  finishOrbitalMaterialsV5(materials, resources, ringSeed);

  return Object.freeze({ group: root, rotationPivot: rotor, materials: Object.freeze(materials), resources: Object.freeze(resources) });
}

function createSpecializedOrbitalStationVisualV1(
  plan: SystemSceneOrbitalStationPlanV1,
  seedUint32: number,
): SystemSceneArtificialSatelliteVisualV1 {
  const root = new THREE.Group();
  root.name = plan.installationKind === 'PLATFORM' ? 'Industrial mega-platform' : 'Orbital residential station';
  const materials: SystemSceneArtificialSatelliteMaterialBindingV1[] = [];
  const resources: { dispose(): void }[] = [];
  const size = plan.stationScaleScene;
  const isPlatform = plan.installationKind === 'PLATFORM';
  const hull = new THREE.Color(plan.hullColorHex);
  const truss = new THREE.Color('#667e93');
  const panel = new THREE.Color(isPlatform ? '#354b60' : '#456b8b');
  const windows = new THREE.Color(isPlatform ? '#a99173' : '#9bc9e5');
  const assetSeed = seedUint32;

  const addBox = (
    width: number, height: number, depth: number,
    pos: readonly [number, number, number],
    color: THREE.Color,
    role: SystemSceneArtificialSatelliteMaterialBindingV1['role'],
  ): void => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = createOpaqueMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    root.add(mesh);
    resources.push(geometry, material);
    materials.push(Object.freeze({ material, baseColor: color.clone(), role }));
  };

  if (isPlatform) {
    const length = size * (3.5 + 0.45 * rand(assetSeed, 0x5011));
    addBox(length, size * 0.22, size * 1.65, [0, 0, 0], hull, 'body');
    addBox(length * 0.72, size * 0.08, size * 1.38, [0, size * 0.16, 0], truss, 'truss');
    for (let i = 0; i < 4; i += 1) {
      const x = (i - 1.5) * (length / 4.8);
      addBox(size * 0.38, size * 0.38, size * 0.50, [x, size * 0.36, 0], hull, 'body');
      addBox(size * 0.28, size * 0.085, size * 0.54, [x, size * 0.58, 0], windows, 'accent');
    }
    addBox(length * 0.26, size * 0.09, size * 1.4, [0, -size * 0.2, 0], panel, 'panel');
    addBox(size * 0.11, size * 0.95, size * 0.11, [0, size * 0.62, -size * 0.46], truss, 'truss');
  } else {
    const spine = size * (2.3 + 0.3 * rand(assetSeed, 0x5022));
    addBox(spine, size * 0.25, size * 0.30, [0, 0, 0], truss, 'truss');
    addBox(size * 0.65, size * 0.53, size * 0.62, [0, 0, 0], hull, 'body');
    for (let i = -1; i <= 1; i += 2) {
      addBox(size * 0.80, size * 0.51, size * 0.70, [i * spine * 0.42, 0, 0], hull, 'body');
      addBox(size * 0.67, size * 0.12, size * 0.075, [i * spine * 0.42, size * 0.07, size * 0.395], windows, 'window');
      addBox(size * 0.60, size * 0.085, size * 0.80, [i * spine * 0.42, -size * 0.32, 0], panel, 'panel');
    }
    addBox(size * 0.14, size * 0.78, size * 0.14, [0, size * 0.55, 0], truss, 'truss');
    addBox(size * 0.4, size * 0.16, size * 0.25, [0, size * 0.98, 0], windows, 'window');
  }
  root.rotation.z = rand(assetSeed, 0x5030) * Math.PI * 2;
  root.rotation.y = (rand(assetSeed, 0x5031) - 0.5) * 0.18;
  addOrbitalEngineeringDetailV5(root, materials, resources, isPlatform ? 'PLATFORM' : 'HABITAT', size, assetSeed);
  finishOrbitalMaterialsV5(materials, resources, assetSeed);
  return Object.freeze({ group: root, materials: Object.freeze(materials), resources: Object.freeze(resources) });
}

function createOpaqueMaterial(
  color: THREE.Color,
): THREE.MeshStandardMaterial {
  return createOrbitalMetalMaterialV5(color);
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
