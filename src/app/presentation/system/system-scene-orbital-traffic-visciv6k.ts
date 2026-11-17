import { slowOrbitalVisualSpeedVISCIV6l } from './system-scene-orbital-tempo-visciv6l';
import * as THREE from 'three';
import type { SystemSceneOrbitalRingPlanV1 } from './system-scene-artificial-satellites-visciv2';

/** VISCIV.6k: procedural VISUAL traffic, not additional VIDA/CT-0 spacecraft. */
export type OrbitalTrafficRoleVISCIV6k = 'CONVOY' | 'SHUTTLE' | 'TERMINAL';

export interface OrbitalTrafficVehiclePlanVISCIV6k {
  readonly role: OrbitalTrafficRoleVISCIV6k;
  readonly id: number;
  readonly phase01: number;
  readonly direction: 1 | -1;
  readonly speedCyclesPerDay: number;
  readonly laneRadiusPlanetRadii: number;
  readonly heightPlanetRadii: number;
  /** For terminal hops: the start/end node on this ring's own hub network. */
  readonly nodeIndex: number;
  readonly nodeCount: number;
}

export interface OrbitalTrafficBatchVISCIV6k {
  readonly role: OrbitalTrafficRoleVISCIV6k;
  readonly mesh: THREE.InstancedMesh;
  readonly vehicles: readonly OrbitalTrafficVehiclePlanVISCIV6k[];
}

export interface OrbitalTrafficVisualVISCIV6k {
  readonly group: THREE.Group;
  readonly batches: readonly OrbitalTrafficBatchVISCIV6k[];
  readonly resources: readonly { dispose(): void }[];
  readonly planetRadiusScene: number;
  readonly radiusPlanetRadii: number;
  readonly scratch: THREE.Object3D;
}

function hash32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

function seeded01(seed: number, salt: number): number {
  return hash32(seed ^ Math.imul(salt + 1, 0x9e3779b1)) / 4294967296;
}

function ringVisualSeed(plan: SystemSceneOrbitalRingPlanV1): number {
  return (Math.round(plan.orbitRadiusPlanetRadii * 65536)
    ^ Math.round(plan.ascendingNodeRadians * 8192)
    ^ Math.round(plan.inclinationRadians * 4096)
    ^ (plan.ringKind === 'HABITAT' ? 0x1339 : plan.ringKind === 'INDUSTRIAL' ? 0x28af : 0x3bcc)) >>> 0;
}

/** All paths lie on the same ring's orbital plane, inside the allocated radial band. */
export function buildOrbitalTrafficPlansVISCIV6k(
  plan: SystemSceneOrbitalRingPlanV1,
): readonly OrbitalTrafficVehiclePlanVISCIV6k[] {
  const seed = ringVisualSeed(plan);
  const width = plan.bandWidthPlanetRadii ?? 0.13;
  const nodeCount = plan.ringKind === 'HABITAT' ? 8 : plan.ringKind === 'INDUSTRIAL' ? 10 : 6;
  const counts = plan.ringKind === 'HABITAT' ? [10, 5, 8] as const
    : plan.ringKind === 'INDUSTRIAL' ? [8, 7, 10] as const
      : [14, 7, 12] as const;
  const roles: readonly OrbitalTrafficRoleVISCIV6k[] = ['CONVOY', 'SHUTTLE', 'TERMINAL'];
  const vehicles: OrbitalTrafficVehiclePlanVISCIV6k[] = [];
  for (let family = 0; family < roles.length; family += 1) {
    const role = roles[family]!;
    const count = counts[family]!;
    for (let id = 0; id < count; id += 1) {
      const direction: 1 | -1 = id % 3 === 0 ? -1 : 1;
      // VISCIV.6l: scale only the visual playback velocity. Identical
      // seeds, lanes, vehicle phases and travel directions as VISCIV.6k.
      const baseSpeedCyclesPerDay = role === 'CONVOY'
        ? 0.035 + 0.016 * seeded01(seed, 0x1010 + id)
        : role === 'SHUTTLE'
          ? 0.052 + 0.022 * seeded01(seed, 0x2020 + id)
          : 0.12 + 0.048 * seeded01(seed, 0x3030 + id);
      const speedCyclesPerDay = slowOrbitalVisualSpeedVISCIV6l(baseSpeedCyclesPerDay, role);
      const offset = role === 'CONVOY'
        ? (id % 2 === 0 ? -0.27 : 0.27) * width
        : role === 'SHUTTLE'
          ? (0.56 + 0.10 * seeded01(seed, 0x4000 + id)) * width
          : (id % 2 === 0 ? 0.48 : -0.48) * width;
      // Decks extend to +0.14 R in INDUSTRIAL (6i.a): traffic stays in
      // circulation gaps or flies safely above the superstructure.
      const baseHeight = role === 'CONVOY' ? (plan.ringKind === 'TRANSPORT' ? 0.048 : 0.075)
        : role === 'SHUTTLE' ? 0.20 : 0.092;
      const vehicle = Object.freeze({
        role, id,
        phase01: role === 'TERMINAL' ? seeded01(seed, 0x5000 + id)
          : (id + seeded01(seed, 0x5100 + id) * 0.22) / count,
        direction,
        speedCyclesPerDay,
        laneRadiusPlanetRadii: plan.orbitRadiusPlanetRadii + offset,
        heightPlanetRadii: baseHeight,
        nodeIndex: id % nodeCount,
        nodeCount,
      });
      vehicles.push(vehicle);
    }
  }
  return Object.freeze(vehicles);
}

export function createOrbitalTrafficVisualVISCIV6k(
  plan: SystemSceneOrbitalRingPlanV1,
  planetRadiusScene: number,
): OrbitalTrafficVisualVISCIV6k {
  const group = new THREE.Group();
  group.name = 'VISCIV6k moving orbital traffic';
  const resources: { dispose(): void }[] = [];
  const batches: OrbitalTrafficBatchVISCIV6k[] = [];
  const plans = buildOrbitalTrafficPlansVISCIV6k(plan);
  const sizes: Record<OrbitalTrafficRoleVISCIV6k, readonly [number, number, number]> = {
    CONVOY: [0.045, 0.024, 0.100],
    SHUTTLE: [0.047, 0.022, 0.070],
    TERMINAL: [0.030, 0.018, 0.050],
  };
  const palette = plan.ringKind === 'HABITAT'
    ? ['#b9d5e7', '#8ec6ec', '#d9e5f0'] as const
    : plan.ringKind === 'INDUSTRIAL'
      ? ['#a1aeb9', '#e3b67d', '#d0a178'] as const
      : ['#b1d5ed', '#8bbfe2', '#c5e7f8'] as const;
  const roles: readonly OrbitalTrafficRoleVISCIV6k[] = ['CONVOY', 'SHUTTLE', 'TERMINAL'];
  for (let family = 0; family < roles.length; family += 1) {
    const role = roles[family]!;
    const familyPlans = Object.freeze(plans.filter(item => item.role === role));
    const [width, height, depth] = sizes[role];
    const geometry = role === 'SHUTTLE'
      ? new THREE.ConeGeometry(width * planetRadiusScene * 0.60,
        depth * planetRadiusScene, 6, 1)
      : new THREE.BoxGeometry(width * planetRadiusScene,
        height * planetRadiusScene, depth * planetRadiusScene);
    if (role === 'SHUTTLE') geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({
      color: palette[family]!, metalness: 0.48, roughness: 0.35,
      emissive: new THREE.Color(palette[family]!), emissiveIntensity: 0.065,
      transparent: false, opacity: 1,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, familyPlans.length);
    mesh.name = `VISCIV6k ${role} ${plan.ringKind}`;
    // Vehicle batches move around the entire ring. A static bounding sphere is not valid.
    mesh.frustumCulled = false;
    group.add(mesh);
    resources.push(geometry, material);
    batches.push(Object.freeze({ role, mesh, vehicles: familyPlans }));
  }
  const visual = Object.freeze({ group, batches: Object.freeze(batches),
    resources: Object.freeze(resources), planetRadiusScene,
    radiusPlanetRadii: plan.orbitRadiusPlanetRadii, scratch: new THREE.Object3D() });
  updateOrbitalTrafficVISCIV6k(visual, 0);
  return visual;
}

/** Absolute simulated days (not frame deltas): seeking/reloading produces exactly the same transforms. */
export function updateOrbitalTrafficVISCIV6k(
  visual: OrbitalTrafficVisualVISCIV6k,
  simulationDay: number,
): void {
  if (!Number.isFinite(simulationDay)) return;
  const TWO_PI = Math.PI * 2;
  const transform = visual.scratch;
  const planetRadius = visual.planetRadiusScene;
  for (const batch of visual.batches) {
    for (let i = 0; i < batch.vehicles.length; i += 1) {
      const craft = batch.vehicles[i]!;
      const t = simulationDay * craft.speedCyclesPerDay * craft.direction + craft.phase01;
      const normalized = ((t % 1) + 1) % 1;
      let angle: number;
      let radius = craft.laneRadiusPlanetRadii * planetRadius;
      let y = craft.heightPlanetRadii * planetRadius;
      if (craft.role === 'TERMINAL') {
        // One repeatable shuttle trip from an orbital terminal to the next.
        // Smooth arrival and return, with a small outward manoeuvre mid-flight.
        const progress = (1 - Math.cos(TWO_PI * normalized)) * 0.5;
        const slot = TWO_PI / craft.nodeCount;
        angle = craft.nodeIndex * slot + progress * slot * 0.86;
        radius += planetRadius * 0.012 * Math.sin(Math.PI * progress);
        y += planetRadius * 0.031 * Math.sin(Math.PI * progress);
      } else {
        angle = TWO_PI * normalized;
        if (craft.role === 'SHUTTLE') {
          y += planetRadius * 0.013 * Math.sin(angle * 3 + craft.id);
        }
      }
      transform.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const reversing = craft.role === 'TERMINAL'
        && Math.sin(TWO_PI * normalized) * craft.direction < 0;
      transform.rotation.set(0,
        -angle + (reversing || (craft.role !== 'TERMINAL' && craft.direction < 0) ? Math.PI : 0), 0);
      transform.scale.setScalar(1);
      transform.updateMatrix();
      batch.mesh.setMatrixAt(i, transform.matrix);
    }
    batch.mesh.instanceMatrix.needsUpdate = true;
  }
}
