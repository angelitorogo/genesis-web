import * as THREE from 'three';
import type { SystemSceneOrbitalRingPlanV1 } from './system-scene-artificial-satellites-visciv2';

/** VISCIV.6j: purely visual, deterministic architectural illumination. No physics, CT-0 or persistence. */
export type OrbitalLightRoleVISCIV6j = 'URBAN_WINDOWS' | 'URBAN_BOULEVARDS'
  | 'SHIPYARD_ACTIVITY' | 'GANTRY_SIGNALS' | 'TRANSPORT_LANES' | 'TRANSPORT_TERMINALS' | 'MAJOR_NODES';

export interface OrbitalLightLayerVISCIV6j {
  readonly role: OrbitalLightRoleVISCIV6j;
  readonly mesh: THREE.InstancedMesh;
  /** Local unit vector from the centre to each lit segment. */
  readonly radialDirections: readonly THREE.Vector3[];
  readonly colors: readonly THREE.Color[];
  readonly brightness: readonly number[];
  readonly nighttimeIntensity: number;
}

export interface OrbitalArchitecturalLightsVISCIV6j {
  readonly group: THREE.Group;
  readonly layers: readonly OrbitalLightLayerVISCIV6j[];
  readonly resources: readonly { dispose(): void }[];
}

interface LightSpecVISCIV6j {
  readonly angle: number;
  readonly orbitalRadius: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly length: number;
  readonly tint: string;
  readonly brightness: number;
}

/** One InstancedMesh per lighting family, with fixed placement and seed-based variation. */
export function createOrbitalArchitecturalLightsVISCIV6j(
  plan: SystemSceneOrbitalRingPlanV1,
  planetRadiusScene: number,
): OrbitalArchitecturalLightsVISCIV6j {
  const group = new THREE.Group();
  group.name = 'VISCIV6j architectural night lighting';
  const layers: OrbitalLightLayerVISCIV6j[] = [];
  const resources: { dispose(): void }[] = [];
  const radius = plan.orbitRadiusPlanetRadii * planetRadiusScene;
  const width = (plan.bandWidthPlanetRadii ?? 0.13) * planetRadiusScene;
  const beam = Math.max(planetRadiusScene * 0.012, radius * 0.007)
    * (plan.structuralThicknessFactor ?? 1);
  const seed = (Math.round(plan.orbitRadiusPlanetRadii * 65536)
    ^ Math.round(plan.ascendingNodeRadians * 8192)
    ^ (plan.ringKind === 'HABITAT' ? 0x1620 : plan.ringKind === 'INDUSTRIAL' ? 0x3781 : 0x5982)) >>> 0;

  const addLayer = (role: OrbitalLightRoleVISCIV6j, entries: readonly LightSpecVISCIV6j[],
    nightIntensity: number): void => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, depthWrite: false });
    const mesh = new THREE.InstancedMesh(geometry, material, entries.length);
    mesh.name = `VISCIV6j ${role}`;
    const transform = new THREE.Object3D();
    const radials: THREE.Vector3[] = [];
    const colors: THREE.Color[] = [];
    const brightness: number[] = [];
    entries.forEach((entry, index) => {
      transform.position.set(Math.cos(entry.angle) * entry.orbitalRadius, entry.y,
        Math.sin(entry.angle) * entry.orbitalRadius);
      transform.rotation.set(0, -entry.angle, 0);
      transform.scale.set(entry.width, entry.height, entry.length);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
      const color = new THREE.Color(entry.tint);
      colors.push(color);
      brightness.push(entry.brightness);
      radials.push(new THREE.Vector3(Math.cos(entry.angle), 0, Math.sin(entry.angle)));
      mesh.setColorAt(index, color.clone().multiplyScalar(0.004));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // Large orbital structures rotate with their parent: bounding sphere is static in local coordinates.
    mesh.computeBoundingSphere();
    group.add(mesh);
    resources.push(geometry, material);
    layers.push(Object.freeze({ role, mesh, radialDirections: Object.freeze(radials),
      colors: Object.freeze(colors), brightness: Object.freeze(brightness), nighttimeIntensity: nightIntensity }));
  };

  const nodes = plan.ringKind === 'HABITAT' ? 8 : plan.ringKind === 'INDUSTRIAL' ? 10 : 6;
  const mainNodeColor = plan.ringKind === 'HABITAT' ? '#c8ebff'
    : plan.ringKind === 'INDUSTRIAL' ? '#ffd6a4' : '#b0eeff';
  const nodeEntries: LightSpecVISCIV6j[] = [];
  for (let n = 0; n < nodes; n++) {
    for (let j = 0; j < 4; j++) {
      const angle = (n / nodes) * Math.PI * 2 + (j - 1.5) * 0.012;
      nodeEntries.push({ angle, orbitalRadius: radius + (j % 2 ? 0.29 : -0.29) * width,
        y: beam * (2.35 + (j >> 1) * 0.65),
        width: planetRadiusScene * 0.028, height: planetRadiusScene * 0.017,
        length: planetRadiusScene * 0.042, tint: mainNodeColor,
        brightness: 0.76 + 0.24 * noise(seed, 0x6610, n * 4 + j) });
    }
  }
  addLayer('MAJOR_NODES', nodeEntries, 0.76);

  if (plan.ringKind === 'HABITAT') {
    const windows: LightSpecVISCIV6j[] = [];
    for (let district = 0; district < 28; district++) {
      for (let window = 0; window < 8; window++) {
        const side = window < 4 ? 1 : -1;
        const slot = window % 4;
        windows.push({
          angle: district / 28 * Math.PI * 2 + (slot - 1.5) * 0.012,
          orbitalRadius: radius + side * width * 0.18,
          y: beam * (1.36 + Math.floor(slot / 2) * 0.87),
          width: planetRadiusScene * 0.011,
          height: planetRadiusScene * 0.010,
          length: planetRadiusScene * 0.016,
          tint: noise(seed, 0x6201, district * 8 + window) > 0.73 ? '#ffddb3' : '#b7e5ff',
          // Dark windows remain a fixed, seeded subset, not random flickering.
          brightness: noise(seed, 0x6202, district * 8 + window) < 0.16 ? 0.04
            : 0.42 + noise(seed, 0x6203, district * 8 + window) * 0.58,
        });
      }
    }
    addLayer('URBAN_WINDOWS', windows, 0.62);
    const boulevard: LightSpecVISCIV6j[] = Array.from({ length: 64 }, (_, index) => ({
      angle: index / 64 * Math.PI * 2,
      orbitalRadius: radius + width * 0.35,
      y: beam * 1.15,
      width: planetRadiusScene * 0.009, height: planetRadiusScene * 0.007,
      length: planetRadiusScene * 0.058, tint: '#93bfe7',
      brightness: 0.45 + noise(seed, 0x6204, index) * 0.55,
    }));
    addLayer('URBAN_BOULEVARDS', boulevard, 0.27);
  } else if (plan.ringKind === 'INDUSTRIAL') {
    const workshops: LightSpecVISCIV6j[] = [];
    for (let dock = 0; dock < 16; dock++) {
      for (let point = 0; point < 5; point++) {
        const spot = dock * 5 + point;
        workshops.push({
          angle: dock / 16 * Math.PI * 2 + (point - 2) * 0.012,
          orbitalRadius: radius + (0.50 + point * 0.045) * width,
          y: beam * (1.25 + (point % 3) * 0.38),
          width: planetRadiusScene * 0.019, height: planetRadiusScene * 0.013,
          length: planetRadiusScene * 0.025,
          tint: noise(seed, 0x6301, spot) > 0.80 ? '#a8dfff' : '#ffc37f',
          brightness: 0.38 + noise(seed, 0x6302, spot) * 0.62,
        });
      }
    }
    addLayer('SHIPYARD_ACTIVITY', workshops, 0.70);
    const gantries: LightSpecVISCIV6j[] = Array.from({ length: 32 }, (_, index) => ({
      angle: Math.floor(index / 2) / 16 * Math.PI * 2 + (index % 2 === 0 ? -0.011 : 0.011),
      orbitalRadius: radius + width * 0.72,
      y: beam * (2.10 + (index % 2) * 1.10),
      width: planetRadiusScene * 0.020, height: planetRadiusScene * 0.014,
      length: planetRadiusScene * 0.020, tint: '#ffad69',
      brightness: 0.48 + noise(seed, 0x6303, index) * 0.52,
    }));
    addLayer('GANTRY_SIGNALS', gantries, 0.55);
  } else {
    const lanes: LightSpecVISCIV6j[] = [];
    for (let lane = 0; lane < 2; lane++) {
      for (let i = 0; i < 96; i++) {
        lanes.push({ angle: i / 96 * Math.PI * 2,
          orbitalRadius: radius + width * (lane === 0 ? -0.24 : 0.24),
          y: beam * 1.48,
          width: planetRadiusScene * 0.011,
          height: planetRadiusScene * 0.007,
          length: planetRadiusScene * 0.043,
          tint: lane === 0 ? '#bceaff' : '#8bbdff',
          brightness: 0.51 + noise(seed, 0x6401 + lane, i) * 0.49 });
      }
    }
    addLayer('TRANSPORT_LANES', lanes, 0.33);
    const terminals: LightSpecVISCIV6j[] = [];
    for (let n = 0; n < 12; n++) {
      for (let j = 0; j < 2; j++) {
        terminals.push({ angle: n / 12 * Math.PI * 2 + (j ? 0.014 : -0.014),
          orbitalRadius: radius + (j ? 0.12 : -0.12) * width,
          y: beam * 2.18,
          width: planetRadiusScene * 0.028,
          height: planetRadiusScene * 0.014,
          length: planetRadiusScene * 0.036,
          tint: '#c2e7ff', brightness: 0.6 + noise(seed, 0x6402, n * 2 + j) * 0.4 });
      }
    }
    addLayer('TRANSPORT_TERMINALS', terminals, 0.62);
  }
  return Object.freeze({ group, layers: Object.freeze(layers), resources: Object.freeze(resources) });
}

/** The same multistar/planet-night contract as VISCIV.6g, with no GPU allocations per frame. */
export function updateOrbitalArchitecturalNightLightsVISCIV6j(
  layers: readonly OrbitalLightLayerVISCIV6j[],
  worldQuaternion: THREE.Quaternion,
  stellarSources: readonly Readonly<{ direction: THREE.Vector3; weight: number }>[],
): void {
  const radial = new THREE.Vector3();
  const color = new THREE.Color();
  for (const layer of layers) {
    for (let i = 0; i < layer.radialDirections.length; i++) {
      radial.copy(layer.radialDirections[i]!).applyQuaternion(worldQuaternion);
      let weightedNight = 0;
      let totalWeight = 0;
      for (const star of stellarSources) {
        const lengthSquared = star.direction.lengthSq();
        if (!(star.weight > 0) || lengthSquared < 1e-9) continue;
        const dot = radial.dot(star.direction) / Math.sqrt(lengthSquared);
        weightedNight += star.weight * THREE.MathUtils.clamp((0.12 - dot) / 0.50, 0, 1);
        totalWeight += star.weight;
      }
      const night = totalWeight > 0 ? weightedNight / totalWeight : 0;
      // 0.004 makes urban/industrial structures very faint but still opaque on the lit hemisphere.
      const brightness = layer.brightness[i]! * (0.004 + layer.nighttimeIntensity * night);
      layer.mesh.setColorAt(i, color.copy(layer.colors[i]!).multiplyScalar(brightness));
    }
    if (layer.mesh.instanceColor) layer.mesh.instanceColor.needsUpdate = true;
  }
}

function noise(seed: number, salt: number, index: number): number {
  let value = (seed ^ Math.imul(salt + 1, 0x85ebca6b) ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}
