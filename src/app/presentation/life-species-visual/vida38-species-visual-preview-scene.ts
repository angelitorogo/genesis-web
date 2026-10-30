import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { buildVida38HumanoidRawMesh, deriveVida38HumanoidAnatomy, type Vida38HumanoidQuality } from './vida38-humanoid-organic-field-38-2e';
import { createVida38HumanoidSkinV1, createVida38HumanoidOcularDetailsV1 } from './vida38-humanoid-organic-material-38-2e';

export const VIDA38_SPECIES_VISUAL_PREVIEW_REVISION = 'VIDA.38.2/species-visual-preview/v1' as const;

export type Vida38SpeciesRenderFamilyV1 =
  | 'MICROBIAL_COLONY'
  | 'FUNGAL_CLUSTER'
  | 'PLANT_FORM'
  | 'INSECT_BODY'
  | 'QUADRUPED_BODY'
  | 'AVIAN_BODY'
  | 'BIPED_BODY';

export interface Vida38SpeciesPreviewDescriptorV1 {
  readonly revision: typeof VIDA38_SPECIES_VISUAL_PREVIEW_REVISION;
  readonly speciesId: string;
  readonly family: Vida38SpeciesRenderFamilyV1;
  readonly sceneHint: 'STUDIO_SAMPLE';
  readonly habitatCue: 'ROCK' | 'SOIL' | 'WET' | 'CANOPY' | 'AIR' | 'SUBSURFACE_WATER';
  readonly bodyScaleClass: 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';
  readonly locomotion: Vida38SpeciesVisualContract['locomotion'];
  readonly primaryColorHex: string;
  readonly secondaryColorHex: string;
  readonly bioluminescent: boolean;
  readonly appendagePairs: number;
  readonly adaptationTags: readonly string[];
  readonly focusDistance: number;
  readonly verticalOffset: number;
  readonly specialistIntelligenceDeferred: boolean;
}

export interface Vida38SpeciesPreviewModelV1 {
  readonly revision: typeof VIDA38_SPECIES_VISUAL_PREVIEW_REVISION;
  readonly descriptor: Vida38SpeciesPreviewDescriptorV1;
  readonly root: THREE.Group;
  readonly subject: THREE.Group;
  readonly animation: (elapsedSeconds: number) => void;
  readonly dispose: () => void;
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619) >>> 0;
  }
  return hash >>> 0;
}

class Rng {
  constructor(private state: number) {}
  next(): number {
    let x = this.state || 0x12345678;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state / 0xffffffff;
  }
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
  pick<T>(values: readonly T[]): T {
    return values[Math.min(values.length - 1, Math.floor(this.next() * values.length))]!;
  }
}

function familyFrom(contract: Vida38SpeciesVisualContract): Vida38SpeciesRenderFamilyV1 {
  switch (contract.morphology.group) {
    case 'MICROORGANISMS': return 'MICROBIAL_COLONY';
    case 'FUNGI': return 'FUNGAL_CLUSTER';
    case 'PLANTS_TREES': return 'PLANT_FORM';
    case 'INSECTS': return 'INSECT_BODY';
    case 'BIRDS': return 'AVIAN_BODY';
    case 'HUMANOIDS': return 'BIPED_BODY';
    case 'REPTILES':
    case 'MAMMALS':
      return contract.morphology.bodyPlan === 'BIPED' ? 'BIPED_BODY' : 'QUADRUPED_BODY';
    default:
      return contract.morphology.bodyPlan === 'WINGED' ? 'AVIAN_BODY' : 'QUADRUPED_BODY';
  }
}

function habitatCueFrom(contract: Vida38SpeciesVisualContract): Vida38SpeciesPreviewDescriptorV1['habitatCue'] {
  switch (contract.ecology.habitat) {
    case 'SURFACE_ROCK_SHELTER': return 'ROCK';
    case 'SURFACE_WET_MARGIN': return 'WET';
    case 'SURFACE_CANOPY': return 'CANOPY';
    case 'SURFACE_AIR': return 'AIR';
    case 'AQUIFER':
    case 'PROTECTED_SEEP':
    case 'SUBSURFACE_CAVERN':
      return 'SUBSURFACE_WATER';
    default:
      return 'SOIL';
  }
}

function sizeClass(lengthMeters: number): Vida38SpeciesPreviewDescriptorV1['bodyScaleClass'] {
  if (lengthMeters < 0.01) return 'MICRO';
  if (lengthMeters < 0.5) return 'SMALL';
  if (lengthMeters < 1.5) return 'MEDIUM';
  return 'LARGE';
}

export function describeVida38SpeciesPreviewV1(contract: Vida38SpeciesVisualContract): Vida38SpeciesPreviewDescriptorV1 {
  const family = familyFrom(contract);
  const bodyScaleClass = sizeClass(contract.bodyLengthMeters);
  const focusDistance = family === 'MICROBIAL_COLONY' ? 2.9 : family === 'PLANT_FORM' ? 4.8 : contract.bodyLengthMeters >= 1.5 ? 4.6 : 3.9;
  const verticalOffset = family === 'MICROBIAL_COLONY' ? 0.05 : family === 'PLANT_FORM' ? 0.7 : family === 'AVIAN_BODY' ? 0.4 : 0.6;
  const specialistIntelligenceDeferred = contract.intelligence !== null && (
    contract.intelligence.lineage === 'HUMANOID' ||
    contract.intelligence.lineage === 'REPTILIAN' ||
    contract.intelligence.lineage === 'INSECTOID'
  );
  return Object.freeze({
    revision: VIDA38_SPECIES_VISUAL_PREVIEW_REVISION,
    speciesId: contract.speciesId,
    family,
    sceneHint: 'STUDIO_SAMPLE',
    habitatCue: habitatCueFrom(contract),
    bodyScaleClass,
    locomotion: contract.locomotion,
    primaryColorHex: contract.pigmentation.primaryColorHex,
    secondaryColorHex: contract.pigmentation.secondaryColorHex,
    bioluminescent: contract.pigmentation.bioluminescent,
    appendagePairs: contract.morphology.appendagePairs,
    adaptationTags: Object.freeze([...contract.adaptations]),
    focusDistance,
    verticalOffset,
    specialistIntelligenceDeferred,
  });
}

function color(hex: string): THREE.Color { return new THREE.Color(hex); }

function material(colorHex: string, roughness: number, metalness: number, emissive = 0x000000, opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: color(colorHex),
    roughness,
    metalness,
    emissive: new THREE.Color(emissive),
    emissiveIntensity: emissive === 0 ? 0 : 0.45,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
  });
}

function physicalMaterial(colorHex: string, roughness: number, transmission: number, opacity: number, clearcoat = 0.25): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: color(colorHex),
    roughness,
    metalness: 0.02,
    transmission,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
    clearcoat,
    thickness: 0.22,
  });
}

function mixHex(a: string, b: string, factor: number): string {
  const ca = color(a);
  const cb = color(b);
  return `#${ca.clone().lerp(cb, factor).getHexString()}`;
}

function materialProfile(contract: Vida38SpeciesVisualContract): { roughness: number; metalness: number } {
  switch (contract.morphology.covering) {
    case 'MEMBRANE': return { roughness: 0.28, metalness: 0.01 };
    case 'CHITINOUS': return { roughness: 0.34, metalness: 0.16 };
    case 'SCALES': return { roughness: 0.46, metalness: 0.08 };
    case 'FEATHERS': return { roughness: 0.82, metalness: 0.02 };
    case 'FUR': return { roughness: 0.92, metalness: 0.01 };
    case 'FIBROUS': return { roughness: 0.88, metalness: 0.01 };
    case 'LEATHERY': return { roughness: 0.62, metalness: 0.03 };
    default: return { roughness: 0.74, metalness: 0.03 };
  }
}

function collectDisposables(root: THREE.Object3D): Array<{ dispose: () => void }> {
  const disposables: Array<{ dispose: () => void }> = [];
  const seen = new Set<{ dispose: () => void }>();
  const collect = (resource: { dispose: () => void } | null | undefined) => {
    if (resource && !seen.has(resource)) { seen.add(resource); disposables.push(resource); }
  };
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    const geometry = (mesh as { geometry?: THREE.BufferGeometry }).geometry;
    collect(geometry);
    const meshMaterial = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    const materials = Array.isArray(meshMaterial) ? meshMaterial : meshMaterial ? [meshMaterial] : [];
    for (const m of materials) {
      const mapped = m as THREE.MeshPhysicalMaterial;
      collect(mapped.map);
      collect(mapped.normalMap);
      collect(mapped.roughnessMap);
      collect(mapped.bumpMap);
      collect(mapped.displacementMap);
      collect(m);
    }
  });
  return disposables;
}

function addBaseCue(container: THREE.Group, descriptor: Vida38SpeciesPreviewDescriptorV1, rng: Rng): void {
  const base = new THREE.Group();
  container.add(base);
  if (descriptor.habitatCue !== 'AIR') {
    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.16, 48, 1),
      material('#102131', 0.95, 0.06),
    );
    disk.receiveShadow = true;
    disk.position.y = -0.82;
    base.add(disk);
  }
  if (descriptor.habitatCue === 'ROCK') {
    for (let i = 0; i < 4; i++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rng.range(0.13, 0.26), 0),
        material(mixHex('#56646e', descriptor.secondaryColorHex, 0.12), 0.98, 0.02),
      );
      rock.position.set(rng.range(-0.65, 0.65), -0.68 + rng.range(-0.03, 0.02), rng.range(-0.42, 0.42));
      rock.rotation.set(rng.range(-0.4, 0.4), rng.range(0, Math.PI), rng.range(-0.5, 0.5));
      base.add(rock);
    }
  } else if (descriptor.habitatCue === 'WET') {
    const pool = new THREE.Mesh(
      new THREE.CylinderGeometry(1.16, 1.28, 0.04, 44, 1),
      new THREE.MeshPhysicalMaterial({
        color: color('#1a3646'), roughness: 0.16, metalness: 0, transmission: 0.18,
        transparent: true, opacity: 0.86, clearcoat: 0.75,
      }),
    );
    pool.position.y = -0.73;
    base.add(pool);
  } else if (descriptor.habitatCue === 'CANOPY') {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.14, 1.95, 16, 1),
      material('#685346', 0.96, 0.03),
    );
    branch.rotation.z = 0.55;
    branch.position.set(-0.15, -0.32, 0);
    base.add(branch);
  } else if (descriptor.habitatCue === 'SUBSURFACE_WATER') {
    const plume = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 32, 24),
      new THREE.MeshPhysicalMaterial({
        color: color('#284659'), roughness: 0.18, metalness: 0, transmission: 0.14,
        transparent: true, opacity: 0.22,
      }),
    );
    plume.scale.set(1.1, 0.7, 1.1);
    plume.position.y = -0.18;
    base.add(plume);
  }
}

function addOverlay(parent: THREE.Object3D | null | undefined, mesh: THREE.Mesh): void {
  if (parent) parent.add(mesh);
}

function applyPattern(meshes: readonly THREE.Mesh[], contract: Vida38SpeciesVisualContract, rng: Rng): void {
  const accentHex = contract.pigmentation.secondaryColorHex;
  const primaryHex = contract.pigmentation.primaryColorHex;
  const darkHex = mixHex(primaryHex, '#0a1015', 0.35);
  for (const mesh of meshes) {
    const baseMaterial = mesh.material;
    if (!(baseMaterial instanceof THREE.MeshStandardMaterial)) continue;
    if (contract.pigmentation.pattern === 'SOLID') continue;
    if (contract.pigmentation.pattern === 'BANDS') {
      const band = new THREE.Mesh(
        mesh.geometry.clone(),
        material(accentHex, Math.max(baseMaterial.roughness - 0.06, 0.18), baseMaterial.metalness),
      );
      band.scale.copy(mesh.scale).multiplyScalar(1.01);
      band.position.copy(mesh.position);
      band.rotation.copy(mesh.rotation);
      band.scale.y *= 0.38;
      addOverlay(mesh.parent, band);
    } else if (contract.pigmentation.pattern === 'SPOTS' || contract.pigmentation.pattern === 'MOTTLED') {
      const count = contract.pigmentation.pattern === 'SPOTS' ? 8 : 16;
      const parent = mesh.parent;
      for (let i = 0; i < count; i++) {
        const spot = new THREE.Mesh(
          new THREE.SphereGeometry(rng.range(0.015, 0.045), 10, 8),
          material(i % 3 === 0 ? accentHex : darkHex, 0.55, 0.08),
        );
        const direction = new THREE.Vector3(rng.range(-1, 1), rng.range(-0.7, 0.8), rng.range(-1, 1)).normalize();
        const radius = 0.34 + rng.range(-0.06, 0.1);
        spot.position.copy(mesh.position).add(direction.multiplyScalar(radius));
        spot.scale.set(1.2, rng.range(0.55, 1.4), 0.9);
        parent?.add(spot);
      }
    }
  }
}

/**
 * 38.2e: reemplazo COMPLETO del render humanoide tipo maniquí.
 * Una superficie implícita continua abarca cráneo, cara, torso, pelvis,
 * articulaciones, brazos, manos, dedos, piernas y pies.
 */
function createHumanoidSpecialized(subject: THREE.Group, contract: Vida38SpeciesVisualContract, _rng: Rng, quality: Vida38HumanoidQuality): THREE.Object3D[] {
  const anatomy = deriveVida38HumanoidAnatomy(contract);
  const raw = buildVida38HumanoidRawMesh(anatomy, quality);
  const skin = createVida38HumanoidSkinV1(raw, contract);
  subject.add(skin);
  const objects: THREE.Object3D[] = [skin];
  for (const eye of createVida38HumanoidOcularDetailsV1(anatomy, contract)) {
    subject.add(eye);
    objects.push(eye);
  }
  subject.userData['vida38ReconstructionRevision'] = '38.2f';
  subject.userData['vida38MorphologyFingerprint'] = anatomy.morphology.anatomyFingerprint;
  subject.userData['vida38MorphologyProvenance'] = anatomy.morphology.provenance;
  subject.userData['vida38BodyLengthMeters'] = contract.bodyLengthMeters;
  subject.userData['vida38ScientificObservedImage'] = false;
  return objects;
}

function addClawFan(subject: THREE.Group, position: THREE.Vector3, side: number, baseRotationZ: number, colorHex: string): THREE.Mesh[] {
  const created: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const claw = new THREE.Mesh(
      new THREE.ConeGeometry(0.016 - i * 0.002, 0.08 + i * 0.01, 8),
      material(colorHex, 0.34, 0.12),
    );
    claw.position.copy(position).add(new THREE.Vector3(side * (i - 1) * 0.03, 0, 0));
    claw.rotation.z = baseRotationZ + side * (i - 1) * 0.08;
    claw.rotation.x = Math.PI / 2;
    subject.add(claw);
    created.push(claw);
  }
  return created;
}

function addSegmentRidge(subject: THREE.Group, from: THREE.Vector3, to: THREE.Vector3, count: number, colorHex: string): THREE.Mesh[] {
  const created: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const ridge = new THREE.Mesh(
      new THREE.ConeGeometry(0.03 * (1 - t * 0.35), 0.12 * (1 - t * 0.2), 8),
      material(colorHex, 0.56, 0.08),
    );
    ridge.position.lerpVectors(from, to, t);
    ridge.rotation.x = -Math.PI / 2;
    subject.add(ridge);
    created.push(ridge);
  }
  return created;
}

function addNostrilPair(subject: THREE.Group, position: THREE.Vector3, colorHex: string): THREE.Mesh[] {
  const created: THREE.Mesh[] = [];
  for (let side = -1; side <= 1; side += 2) {
    const nostril = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 6),
      material(colorHex, 0.18, 0.06),
    );
    nostril.scale.set(0.9, 0.55, 0.75);
    nostril.position.copy(position).add(new THREE.Vector3(side * 0.04, 0, 0));
    subject.add(nostril);
    created.push(nostril);
  }
  return created;
}

function addFeatherVanes(subject: THREE.Group, origin: THREE.Vector3, side: number, colorHex: string, count: number): THREE.Mesh[] {
  const created: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const vane = new THREE.Mesh(
      new THREE.ConeGeometry(0.04 + i * 0.005, 0.18 + i * 0.04, 10),
      material(colorHex, 0.82, 0.02),
    );
    vane.position.copy(origin).add(new THREE.Vector3(side * (0.12 + i * 0.07), 0.02 - i * 0.01, -0.04 - i * 0.015));
    vane.rotation.z = side > 0 ? -Math.PI / 2 - 0.2 - i * 0.05 : Math.PI / 2 + 0.2 + i * 0.05;
    vane.rotation.x = 0.08;
    subject.add(vane);
    created.push(vane);
  }
  return created;
}

function addLeafFronds(subject: THREE.Group, rng: Rng, colorHex: string, count: number, radiusMin: number, radiusMax: number): THREE.Mesh[] {
  const leaves: THREE.Mesh[] = [];
  const geometry = new THREE.SphereGeometry(0.2, 18, 12);
  for (let i = 0; i < count; i++) {
    const leaf = new THREE.Mesh(geometry, material(colorHex, 0.72, 0.02));
    const level = i / Math.max(1, count - 1);
    leaf.scale.set(rng.range(0.18, 0.34), rng.range(1.5, 2.8), rng.range(0.55, 0.9));
    leaf.position.set(
      Math.sin(level * Math.PI * 2 + rng.range(-0.6, 0.6)) * rng.range(radiusMin, radiusMax),
      rng.range(0.24, 1.25),
      Math.cos(level * Math.PI * 2 + rng.range(-0.6, 0.6)) * rng.range(radiusMin, radiusMax),
    );
    leaf.rotation.set(rng.range(-0.6, 0.6), rng.range(0, Math.PI * 2), rng.range(-1.0, 1.0));
    subject.add(leaf);
    leaves.push(leaf);
  }
  return leaves;
}

function createMicrobialColony(subject: THREE.Group, contract: Vida38SpeciesVisualContract, rng: Rng): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const membrane = new THREE.Mesh(
    new THREE.SphereGeometry(0.98, 42, 32),
    physicalMaterial(mixHex(contract.pigmentation.primaryColorHex, '#ebf6ff', 0.28), 0.18, 0.26, 0.24, 0.6),
  );
  membrane.scale.set(1.08, 0.72, 0.96);
  subject.add(membrane); created.push(membrane);

  const innerGel = new THREE.Mesh(
    new THREE.SphereGeometry(0.84, 34, 24),
    physicalMaterial(mixHex(contract.pigmentation.primaryColorHex, contract.pigmentation.secondaryColorHex, 0.18), 0.22, 0.08, 0.42, 0.35),
  );
  innerGel.scale.set(1.02, 0.62, 0.9);
  innerGel.position.y = -0.02;
  subject.add(innerGel); created.push(innerGel);

  const mat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.96, 1.05, 0.12, 40, 1),
    material(mixHex(contract.pigmentation.primaryColorHex, '#12212b', 0.18), 0.38, 0.02),
  );
  mat.position.y = -0.2;
  mat.scale.set(1, 0.7, 1);
  subject.add(mat); created.push(mat);

  const cellMeshes: THREE.Mesh[] = [];
  const colonyCount = 24 + Math.round(rng.range(0, 14));
  for (let i = 0; i < colonyCount; i++) {
    const cell = new THREE.Mesh(
      new THREE.SphereGeometry(rng.range(0.06, 0.15), 18, 16),
      material(i % 3 === 0 ? contract.pigmentation.secondaryColorHex : contract.pigmentation.primaryColorHex, 0.26, 0.02),
    );
    cell.position.set(rng.range(-0.64, 0.64), rng.range(-0.16, 0.28), rng.range(-0.54, 0.54));
    cell.scale.set(rng.range(0.7, 1.7), rng.range(0.7, 1.5), rng.range(0.7, 1.5));
    subject.add(cell); created.push(cell); cellMeshes.push(cell);

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(rng.range(0.018, 0.045), 10, 8),
      material(mixHex(contract.pigmentation.secondaryColorHex, '#f7fbff', 0.22), 0.18, 0.02),
    );
    nucleus.position.copy(cell.position).add(new THREE.Vector3(rng.range(-0.03, 0.03), rng.range(-0.02, 0.03), rng.range(-0.03, 0.03)));
    subject.add(nucleus); created.push(nucleus);

    if (rng.next() > 0.46) {
      const bud = new THREE.Mesh(
        new THREE.SphereGeometry(rng.range(0.022, 0.06), 12, 10),
        material(mixHex(contract.pigmentation.secondaryColorHex, '#eff6ff', 0.08), 0.3, 0.02),
      );
      bud.position.copy(cell.position).add(new THREE.Vector3(rng.range(-0.1, 0.1), rng.range(0.03, 0.1), rng.range(-0.1, 0.1)));
      subject.add(bud); created.push(bud);
    }
  }
  for (let i = 0; i < 12; i++) {
    const points = [new THREE.Vector3(rng.range(-0.22, 0.22), rng.range(-0.14, 0.05), rng.range(-0.18, 0.18))];
    for (let j = 0; j < 5; j++) {
      points.push(new THREE.Vector3(rng.range(-0.82, 0.82), rng.range(-0.28, 0.34), rng.range(-0.78, 0.78)));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const filament = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 44, rng.range(0.008, 0.018), 8, false),
      material(mixHex(contract.pigmentation.secondaryColorHex, '#f3f9ff', 0.2), 0.28, 0.01),
    );
    subject.add(filament); created.push(filament);
  }
  applyPattern(cellMeshes, contract, rng);
  return created;
}
function createFungalCluster(subject: THREE.Group, contract: Vida38SpeciesVisualContract, rng: Rng): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const capColor = mixHex(contract.pigmentation.secondaryColorHex, '#d6cab8', 0.22);
  const stemColor = mixHex(contract.pigmentation.primaryColorHex, '#dbe5de', 0.42);
  const stems: THREE.Mesh[] = [];
  const count = 5 + Math.round(rng.range(0, 5));
  for (let i = 0; i < count; i++) {
    const height = rng.range(0.72, 1.54);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(rng.range(0.045, 0.07), rng.range(0.07, 0.1), height, 16, 5),
      material(stemColor, 0.8, 0.01),
    );
    stem.position.set(rng.range(-0.45, 0.45), -0.32 + height / 2, rng.range(-0.4, 0.4));
    stem.rotation.z = rng.range(-0.18, 0.18);
    subject.add(stem); created.push(stem); stems.push(stem);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(rng.range(0.22, 0.4), 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.72),
      material(capColor, 0.56, 0.02),
    );
    cap.scale.set(rng.range(1.25, 2.05), rng.range(0.48, 0.82), rng.range(1.25, 1.95));
    cap.position.set(stem.position.x, stem.position.y + height / 2 - 0.03, stem.position.z);
    subject.add(cap); created.push(cap);

    const gills = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 0.06, 20, 1, true),
      material(mixHex('#f3eee2', capColor, 0.2), 0.54, 0.01),
    );
    gills.position.set(cap.position.x, cap.position.y - 0.08, cap.position.z);
    gills.scale.set(cap.scale.x * 0.82, 1, cap.scale.z * 0.82);
    subject.add(gills); created.push(gills);

    for (let j = 0; j < 6; j++) {
      const lamella = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.05, cap.scale.z * 0.22),
        material(mixHex('#faf7eb', capColor, 0.18), 0.5, 0.01),
      );
      lamella.position.set(cap.position.x, cap.position.y - 0.08, cap.position.z);
      lamella.rotation.y = (Math.PI / 6) * j;
      subject.add(lamella); created.push(lamella);
    }
  }
  for (let i = 0; i < 18; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(rng.range(-0.15, 0.15), -0.72, rng.range(-0.12, 0.12)),
      new THREE.Vector3(rng.range(-0.35, 0.35), -0.66, rng.range(-0.32, 0.32)),
      new THREE.Vector3(rng.range(-0.72, 0.72), -0.58, rng.range(-0.58, 0.58)),
    ]);
    const hypha = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, 0.012, 6, false),
      material(mixHex(stemColor, '#faf7eb', 0.12), 0.9, 0.01),
    );
    subject.add(hypha); created.push(hypha);
  }
  applyPattern(stems, contract, rng);
  return created;
}
function createPlant(subject: THREE.Group, contract: Vida38SpeciesVisualContract, rng: Rng): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const barkColor = mixHex(contract.pigmentation.secondaryColorHex, '#654f3d', 0.45);
  const foliageColor = mixHex(contract.pigmentation.primaryColorHex, '#6a9a74', 0.18);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.22, 2.0, 20, 5),
    material(barkColor, 0.92, 0.02),
  );
  trunk.position.y = 0.08;
  subject.add(trunk); created.push(trunk);

  const rootFlare = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.22, 18, 1), material(mixHex(barkColor, '#3b2f25', 0.15), 0.96, 0.02));
  rootFlare.position.y = -0.86;
  subject.add(rootFlare); created.push(rootFlare);

  const crownMeshes: THREE.Mesh[] = [];
  const bodyPlan = contract.morphology.bodyPlan;
  if (bodyPlan === 'FROND') {
    for (const leaf of addLeafFronds(subject, rng, foliageColor, 16, 0.18, 0.68)) {
      created.push(leaf);
      crownMeshes.push(leaf);
      const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.42, 8, 1), material(mixHex(foliageColor, '#e6efdd', 0.08), 0.62, 0.01));
      vein.position.copy(leaf.position);
      vein.rotation.copy(leaf.rotation);
      subject.add(vein); created.push(vein);
    }
  } else {
    for (let i = 0; i < 10; i++) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.055, rng.range(0.52, 0.96), 10, 1),
        material(mixHex(barkColor, '#7b664d', 0.3), 0.94, 0.02),
      );
      branch.position.set(rng.range(-0.12, 0.12), rng.range(0.28, 1.02), rng.range(-0.12, 0.12));
      branch.rotation.z = rng.range(-1.15, 1.15);
      branch.rotation.x = rng.range(-0.65, 0.65);
      subject.add(branch); created.push(branch);
      const cluster = new THREE.Mesh(
        new THREE.SphereGeometry(rng.range(0.22, 0.34), 18, 14),
        material(foliageColor, 0.76, 0.02),
      );
      cluster.scale.set(rng.range(0.85, 1.3), rng.range(1.2, 1.9), rng.range(0.8, 1.25));
      cluster.position.copy(branch.position).add(new THREE.Vector3(
        Math.sin(branch.rotation.z) * rng.range(0.32, 0.54),
        rng.range(0.1, 0.28),
        Math.sin(branch.rotation.x) * rng.range(0.15, 0.32),
      ));
      subject.add(cluster); created.push(cluster); crownMeshes.push(cluster);
      for (let k = 0; k < 3; k++) {
        const leaflet = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), material(mixHex(foliageColor, contract.pigmentation.secondaryColorHex, 0.12), 0.76, 0.02));
        leaflet.scale.set(0.7, 1.8, 0.28);
        leaflet.position.copy(cluster.position).add(new THREE.Vector3(rng.range(-0.18, 0.18), rng.range(-0.08, 0.1), rng.range(-0.18, 0.18)));
        leaflet.rotation.set(rng.range(-0.6, 0.6), rng.range(0, Math.PI * 2), rng.range(-0.8, 0.8));
        subject.add(leaflet); created.push(leaflet); crownMeshes.push(leaflet);
      }
    }
  }

  if (contract.adaptations.includes('HUMIDITY_TOLERANCE')) {
    for (let i = 0; i < 6; i++) {
      const pod = new THREE.Mesh(
        new THREE.SphereGeometry(rng.range(0.08, 0.14), 14, 12),
        material(mixHex(contract.pigmentation.secondaryColorHex, '#d9c0b2', 0.25), 0.68, 0.02),
      );
      pod.position.set(rng.range(-0.45, 0.45), rng.range(0.55, 1.18), rng.range(-0.35, 0.35));
      pod.scale.y = rng.range(1.2, 1.8);
      subject.add(pod); created.push(pod); crownMeshes.push(pod);
    }
  }
  applyPattern(crownMeshes, contract, rng);
  return created;
}
function createInsect(subject: THREE.Group, contract: Vida38SpeciesVisualContract, rng: Rng): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const profile = materialProfile(contract);
  const shell = mixHex(contract.pigmentation.primaryColorHex, '#1f252d', 0.1);
  const accent = mixHex(contract.pigmentation.secondaryColorHex, '#d4e0e8', 0.06);
  const abdomen = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.52, 8, 16), material(shell, profile.roughness, 0.18));
  abdomen.rotation.x = Math.PI / 2;
  abdomen.position.set(0, 0.0, -0.22);
  abdomen.scale.set(1.18, 1.0, 1.24);
  const thorax = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.36, 8, 16), material(accent, profile.roughness, 0.14));
  thorax.rotation.x = Math.PI / 2;
  thorax.position.set(0, 0.02, 0.18);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 22, 18), material(shell, profile.roughness * 0.88, 0.18));
  head.scale.set(1.0, 0.9, 0.86);
  head.position.set(0, 0.12, 0.55);
  for (const mesh of [abdomen, thorax, head]) { subject.add(mesh); created.push(mesh); }
  created.push(...addSegmentRidge(subject, new THREE.Vector3(0, 0.1, 0.05), new THREE.Vector3(0, 0.08, -0.5), 6, mixHex(accent, '#0f151b', 0.25)));
  const eyeColor = mixHex(contract.pigmentation.secondaryColorHex, '#eff7ff', 0.36);
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), material(eyeColor, 0.08, 0.12));
    eye.position.set(side * 0.12, 0.16, 0.62);
    eye.scale.set(0.9, 1.15, 0.8);
    subject.add(eye); created.push(eye);
    const mandible = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.24, 8, 1), material(shell, 0.32, 0.12));
    mandible.position.set(side * 0.055, -0.02, 0.7);
    mandible.rotation.z = side * 0.48;
    mandible.rotation.x = 0.78;
    subject.add(mandible); created.push(mandible);
  }
  const legPairs = Math.max(3, contract.morphology.appendagePairs);
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < legPairs; i++) {
      const anchorZ = 0.28 - i * 0.22;
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.3, 8, 1), material(shell, 0.34, 0.12));
      upper.position.set(side * 0.18, -0.02 - i * 0.03, anchorZ);
      upper.rotation.z = side * (0.9 + i * 0.08);
      upper.rotation.x = rng.range(-0.15, 0.15);
      subject.add(upper); created.push(upper);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 0.32, 8, 1), material(shell, 0.32, 0.12));
      lower.position.set(side * (0.34 + 0.04 * i), -0.18 - i * 0.04, anchorZ - 0.03);
      lower.rotation.z = side * (1.18 + i * 0.06);
      lower.rotation.x = rng.range(-0.2, 0.2);
      subject.add(lower); created.push(lower);
      created.push(...addClawFan(subject, new THREE.Vector3(side * (0.48 + 0.04 * i), -0.32 - i * 0.04, anchorZ - 0.06), side, side * 0.2, mixHex(shell, '#f0ead2', 0.14)));
    }
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.006, 0.52, 8, 1), material(accent, 0.26, 0.12));
    antenna.position.set(side * 0.09, 0.2, 0.72);
    antenna.rotation.z = side * 0.4;
    antenna.rotation.x = -0.62;
    subject.add(antenna); created.push(antenna);
  }
  if (contract.locomotion === 'FLYING') {
    for (let side = -1; side <= 1; side += 2) {
      const foreWing = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 20, 12),
        physicalMaterial(mixHex('#dfe9f2', contract.pigmentation.secondaryColorHex, 0.1), 0.16, 0.18, 0.28, 0.65),
      );
      foreWing.scale.set(1.8, 0.05, 0.96);
      foreWing.position.set(side * 0.34, 0.18, 0.08);
      foreWing.rotation.y = side * 0.18;
      foreWing.rotation.z = side * 0.28;
      subject.add(foreWing); created.push(foreWing);
      for (let v = 0; v < 4; v++) {
        const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.42 - v * 0.05, 6, 1), material(mixHex(contract.pigmentation.secondaryColorHex, '#f0f7fd', 0.2), 0.22, 0.04));
        vein.position.copy(foreWing.position).add(new THREE.Vector3(side * (0.08 + v * 0.1), 0, 0));
        vein.rotation.z = side * (0.3 + v * 0.08);
        vein.rotation.x = Math.PI / 2;
        subject.add(vein); created.push(vein);
      }
      const hindWing = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 10),
        physicalMaterial(mixHex('#dfe9f2', contract.pigmentation.primaryColorHex, 0.06), 0.18, 0.16, 0.24, 0.4),
      );
      hindWing.scale.set(1.5, 0.05, 0.74);
      hindWing.position.set(side * 0.28, 0.16, -0.02);
      hindWing.rotation.y = side * 0.12;
      hindWing.rotation.z = side * 0.18;
      subject.add(hindWing); created.push(hindWing);
    }
  }
  applyPattern([abdomen, thorax, head], contract, rng);
  return created;
}
function createQuadruped(subject: THREE.Group, contract: Vida38SpeciesVisualContract, rng: Rng): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const profile = materialProfile(contract);
  const bodyColor = contract.pigmentation.primaryColorHex;
  const accentColor = contract.pigmentation.secondaryColorHex;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.92, 10, 20), material(bodyColor, profile.roughness, profile.metalness));
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0.08, 0.04);
  body.scale.set(1.38, 1.0, 0.92);
  const barrel = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), material(mixHex(bodyColor, accentColor, 0.06), profile.roughness * 0.98, profile.metalness));
  barrel.position.set(0, 0.06, 0.02);
  barrel.scale.set(1.7, 1.15, 1.0);
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 16), material(mixHex(bodyColor, accentColor, 0.1), profile.roughness, profile.metalness * 0.8));
  hips.position.set(0, 0.02, -0.5);
  hips.scale.set(1.08, 0.92, 0.9);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 16), material(mixHex(bodyColor, accentColor, 0.05), profile.roughness * 0.92, profile.metalness));
  shoulders.position.set(0, 0.12, 0.5);
  shoulders.scale.set(1.12, 1.0, 0.92);
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.36, 6, 12), material(bodyColor, profile.roughness * 0.95, profile.metalness));
  neck.position.set(0, 0.26, 0.84);
  neck.rotation.x = 0.82;
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.36, 8, 16), material(accentColor, Math.max(0.38, profile.roughness * 0.92), profile.metalness));
  head.position.set(0, 0.3, 1.14);
  head.rotation.x = 1.34;
  head.scale.set(0.96, 1.0, 1.22);
  const muzzle = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.18, 6, 12), material(mixHex(accentColor, '#d9d5c5', 0.25), profile.roughness * 0.9, 0.02));
  muzzle.position.set(0, 0.26, 1.42);
  muzzle.rotation.x = 1.34;
  muzzle.scale.set(0.86, 0.82, 1.15);
  for (const mesh of [body, barrel, hips, shoulders, neck, head, muzzle]) { subject.add(mesh); created.push(mesh); }
  created.push(...addNostrilPair(subject, new THREE.Vector3(0, 0.25, 1.56), mixHex(accentColor, '#171b1f', 0.22)));

  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), material(mixHex('#1b2127', accentColor, 0.18), 0.18, 0.06));
    eye.position.set(side * 0.11, 0.42, 1.18);
    subject.add(eye); created.push(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), material(mixHex(bodyColor, '#1a1f24', 0.1), 0.68, 0.02));
    brow.position.set(side * 0.1, 0.48, 1.15);
    brow.rotation.z = side * 0.12;
    subject.add(brow); created.push(brow);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 10), material(mixHex(accentColor, '#eadbc7', 0.2), profile.roughness, 0.03));
    ear.position.set(side * 0.14, 0.6, 1.02);
    ear.rotation.z = side * -0.28;
    ear.rotation.x = -0.18;
    subject.add(ear); created.push(ear);

    for (const z of [0.44, -0.42]) {
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.44, 12, 1), material(mixHex(bodyColor, '#10151a', 0.08), Math.min(0.9, profile.roughness + 0.05), 0.02));
      upper.position.set(side * 0.29, -0.12, z);
      upper.rotation.z = side * 0.05;
      subject.add(upper); created.push(upper);
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), material(mixHex(bodyColor, accentColor, 0.1), 0.64, 0.02));
      knee.position.set(side * 0.29, -0.34, z + 0.01);
      subject.add(knee); created.push(knee);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.5, 12, 1), material(mixHex(bodyColor, '#0f1216', 0.12), Math.min(0.92, profile.roughness + 0.08), 0.02));
      lower.position.set(side * 0.29, -0.64, z + 0.05);
      lower.rotation.z = side * 0.02;
      subject.add(lower); created.push(lower);
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), material(mixHex(accentColor, '#161a1f', 0.18), 0.56, 0.02));
      paw.position.set(side * 0.29, -0.92, z + 0.08);
      paw.scale.set(1.2, 0.5, 1.6);
      subject.add(paw); created.push(paw);
      created.push(...addClawFan(subject, new THREE.Vector3(side * 0.29, -0.95, z + 0.16), side, 0, mixHex(accentColor, '#f0ead2', 0.16)));
    }
  }

  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, contract.morphology.covering === 'SCALES' ? 0.8 : 0.58, 6, 10), material(bodyColor, profile.roughness, profile.metalness * 0.8));
  tail.position.set(0, 0.1, -1.08);
  tail.rotation.x = -0.8;
  subject.add(tail); created.push(tail);

  if (contract.adaptations.includes('EXTERNAL_ARMOR')) {
    created.push(...addSegmentRidge(subject, new THREE.Vector3(0, 0.54, -0.4), new THREE.Vector3(0, 0.48, 0.62), 8, mixHex(accentColor, '#dbe9f4', 0.08)));
  }
  applyPattern([body, barrel, shoulders, hips, head], contract, rng);
  return created;
}
function createBird(subject: THREE.Group, contract: Vida38SpeciesVisualContract, rng: Rng): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.5, 8, 16), material(contract.pigmentation.primaryColorHex, 0.84, 0.02));
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.06, 0.02);
  body.scale.set(1.0, 1.12, 1.18);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), material(mixHex(contract.pigmentation.primaryColorHex, '#e9f1ed', 0.1), 0.86, 0.02));
  chest.position.set(0, 0.02, 0.18);
  chest.scale.set(1.0, 1.2, 0.92);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.34, 10, 1), material(contract.pigmentation.primaryColorHex, 0.78, 0.02));
  neck.position.set(0, 0.26, 0.28);
  neck.rotation.x = 0.68;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), material(contract.pigmentation.secondaryColorHex, 0.74, 0.02));
  head.position.set(0, 0.44, 0.48);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 10), material(mixHex('#ddb98f', contract.pigmentation.secondaryColorHex, 0.15), 0.48, 0.04));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.4, 0.68);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 10), material(contract.pigmentation.secondaryColorHex, 0.78, 0.02));
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 0.12, -0.52);
  for (const mesh of [body, chest, neck, head, beak, tail]) { subject.add(mesh); created.push(mesh); }
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), material('#12161a', 0.18, 0.06));
    eye.position.set(side * 0.06, 0.46, 0.59);
    subject.add(eye); created.push(eye);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 12), material(contract.pigmentation.primaryColorHex, 0.82, 0.02));
    wing.scale.set(1.95, 0.14, 0.92);
    wing.position.set(side * 0.38, 0.08, 0.02);
    wing.rotation.z = side * 0.35;
    wing.rotation.y = side * 0.18;
    subject.add(wing); created.push(wing);
    created.push(...addFeatherVanes(subject, wing.position.clone(), side, mixHex(contract.pigmentation.primaryColorHex, contract.pigmentation.secondaryColorHex, 0.12), 4));
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.013, 0.52, 8, 1), material('#927553', 0.54, 0.06));
    leg.position.set(side * 0.08, -0.46, 0.06);
    subject.add(leg); created.push(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.12), material('#9c7e5d', 0.54, 0.06));
    foot.position.set(side * 0.08, -0.72, 0.1);
    subject.add(foot); created.push(foot);
    created.push(...addClawFan(subject, new THREE.Vector3(side * 0.08, -0.74, 0.14), side, 0, '#c8a784'));
  }
  if (contract.adaptations.includes('AERIAL_STABILITY')) {
    const stabilizer = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10), material(mixHex(contract.pigmentation.secondaryColorHex, '#e6eef7', 0.14), 0.82, 0.02));
    stabilizer.scale.set(1.75, 0.06, 0.66);
    stabilizer.position.set(0, 0.15, -0.24);
    subject.add(stabilizer); created.push(stabilizer);
  }
  applyPattern([body, chest, head], contract, rng);
  return created;
}
function createGenericBiped(subject: THREE.Group, contract: Vida38SpeciesVisualContract, rng: Rng): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const profile = materialProfile(contract);
  const baseColor = contract.pigmentation.primaryColorHex;
  const accent = contract.pigmentation.secondaryColorHex;
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), material(mixHex(baseColor, accent, 0.12), 0.8, 0.03));
  pelvis.position.y = -0.38;
  const abdomen = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.22, 8, 12), material(mixHex(baseColor, accent, 0.04), profile.roughness, profile.metalness));
  abdomen.position.set(0, -0.02, 0);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.66, 10, 18), material(baseColor, profile.roughness, profile.metalness));
  torso.position.set(0, 0.28, 0);
  torso.scale.set(1.12, 1.0, 0.86);
  const shoulderMass = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), material(mixHex(baseColor, accent, 0.06), profile.roughness * 0.94, profile.metalness));
  shoulderMass.position.set(0, 0.62, 0.02);
  shoulderMass.scale.set(1.7, 0.72, 0.82);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.18, 10, 1), material(baseColor, profile.roughness * 0.9, profile.metalness));
  neck.position.y = 0.92;
  const jaw = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.06, 6, 12), material(accent, Math.max(0.42, profile.roughness * 0.92), profile.metalness * 0.8));
  jaw.position.set(0, 1.02, 0.06);
  jaw.scale.set(0.92, 0.74, 1.18);
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), material(accent, Math.max(0.42, profile.roughness * 0.92), profile.metalness * 0.8));
  cranium.position.set(0, 1.12, -0.02);
  cranium.scale.set(0.92, 1.08, 0.92);
  for (const mesh of [pelvis, abdomen, torso, shoulderMass, neck, jaw, cranium]) { subject.add(mesh); created.push(mesh); }

  if (contract.morphology.covering === 'SCALES' || contract.morphology.covering === 'LEATHERY') {
    created.push(...addSegmentRidge(subject, new THREE.Vector3(0, 1.28, -0.18), new THREE.Vector3(0, 0.96, -0.06), 4, mixHex(accent, '#eed3cb', 0.08)));
  }
  created.push(...addNostrilPair(subject, new THREE.Vector3(0, 1.0, 0.18), mixHex(accent, '#171b1f', 0.22)));

  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), material('#12161a', 0.18, 0.06));
    eye.position.set(side * 0.08, 1.08, 0.14);
    subject.add(eye); created.push(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.025, 0.03), material(mixHex(baseColor, '#1a1f24', 0.06), 0.62, 0.02));
    brow.position.set(side * 0.08, 1.14, 0.12);
    brow.rotation.z = side * 0.06;
    subject.add(brow); created.push(brow);

    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28, 6, 10), material(baseColor, profile.roughness, profile.metalness));
    upperArm.position.set(side * 0.36, 0.42, 0.02);
    upperArm.rotation.z = side * 0.2;
    subject.add(upperArm); created.push(upperArm);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), material(mixHex(baseColor, accent, 0.08), 0.64, 0.02));
    elbow.position.set(side * 0.44, 0.15, 0.04);
    subject.add(elbow); created.push(elbow);
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.28, 6, 10), material(baseColor, profile.roughness * 0.98, profile.metalness));
    forearm.position.set(side * 0.5, -0.08, 0.04);
    forearm.rotation.z = side * 0.12;
    subject.add(forearm); created.push(forearm);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.16), material(mixHex(baseColor, accent, 0.22), 0.66, 0.04));
    hand.position.set(side * 0.56, -0.34, 0.08);
    hand.rotation.z = side * 0.12;
    subject.add(hand); created.push(hand);
    created.push(...addClawFan(subject, new THREE.Vector3(side * 0.62, -0.34, 0.14), side, side * 0.2, mixHex(accent, '#efe4d8', 0.14)));

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.32, 6, 10), material(baseColor, profile.roughness, profile.metalness));
    thigh.position.set(side * 0.15, -0.76, 0.02);
    subject.add(thigh); created.push(thigh);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), material(mixHex(baseColor, accent, 0.1), 0.66, 0.02));
    knee.position.set(side * 0.15, -1.02, 0.04);
    subject.add(knee); created.push(knee);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 6, 10), material(baseColor, profile.roughness * 0.98, profile.metalness));
    shin.position.set(side * 0.15, -1.28, 0.04);
    subject.add(shin); created.push(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.28), material(mixHex(accent, '#22272e', 0.1), 0.6, 0.04));
    foot.position.set(side * 0.15, -1.58, 0.12);
    subject.add(foot); created.push(foot);
  }
  applyPattern([torso, pelvis, cranium, jaw], contract, rng);
  return created;
}

function createBiped(subject: THREE.Group, contract: Vida38SpeciesVisualContract, rng: Rng, quality: Vida38HumanoidQuality): THREE.Object3D[] {
  const specializedHumanoid = contract.morphology.group === 'HUMANOIDS' || contract.intelligence?.lineage === 'HUMANOID';
  return specializedHumanoid
    ? createHumanoidSpecialized(subject, contract, rng, quality)
    : createGenericBiped(subject, contract, rng);
}
function normalizeSubject(subject: THREE.Group): void {
  const bounds = new THREE.Box3().setFromObject(subject);
  const size = bounds.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.0001);
  const center = bounds.getCenter(new THREE.Vector3());
  subject.position.sub(center);
  const scale = 1.95 / maxDim;
  subject.scale.setScalar(scale);
  const shiftedBounds = new THREE.Box3().setFromObject(subject);
  const minY = shiftedBounds.min.y;
  subject.position.y += -minY - 0.66;
}

export function createVida38SpeciesPreviewModelV1(contract: Vida38SpeciesVisualContract, options: { readonly humanoidQuality?: Vida38HumanoidQuality } = {}): Vida38SpeciesPreviewModelV1 {
  const descriptor = describeVida38SpeciesPreviewV1(contract);
  const root = new THREE.Group();
  const subject = new THREE.Group();
  root.add(subject);
  const rng = new Rng(hash32(`${contract.variantSeedUint32}|${contract.appearanceFingerprint}|38.2`));
  addBaseCue(root, descriptor, rng);

  switch (descriptor.family) {
    case 'MICROBIAL_COLONY': createMicrobialColony(subject, contract, rng); break;
    case 'FUNGAL_CLUSTER': createFungalCluster(subject, contract, rng); break;
    case 'PLANT_FORM': createPlant(subject, contract, rng); break;
    case 'INSECT_BODY': createInsect(subject, contract, rng); break;
    case 'AVIAN_BODY': createBird(subject, contract, rng); break;
    case 'BIPED_BODY': createBiped(subject, contract, rng, options.humanoidQuality ?? 'HIGH'); break;
    case 'QUADRUPED_BODY': createQuadruped(subject, contract, rng); break;
  }

  if (descriptor.bioluminescent) {
    const halo = new THREE.PointLight(color(contract.pigmentation.secondaryColorHex), 1.5, 5.5, 2);
    halo.position.set(0.2, 0.8, 0.6);
    subject.add(halo);
  }
  if (contract.adaptations.includes('SENSORY_ORIENTATION') && descriptor.family !== 'INSECT_BODY' && descriptor.family !== 'MICROBIAL_COLONY' && contract.morphology.group !== 'HUMANOIDS') {
    for (let side = -1; side <= 1; side += 2) {
      const sensor = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.36, 8, 1), material(mixHex(contract.pigmentation.secondaryColorHex, '#eff5ff', 0.08), 0.36, 0.06));
      sensor.position.set(side * 0.12, 0.92, 0.16);
      sensor.rotation.z = side * 0.22;
      subject.add(sensor);
    }
  }
  normalizeSubject(subject);

  const pitch = descriptor.family === 'MICROBIAL_COLONY' ? 0.15 : descriptor.family === 'PLANT_FORM' ? 0.05 : 0.08;
  return {
    revision: VIDA38_SPECIES_VISUAL_PREVIEW_REVISION,
    descriptor,
    root,
    subject,
    animation: (elapsedSeconds: number) => {
      subject.rotation.y = elapsedSeconds * 0.18;
      subject.rotation.x = Math.sin(elapsedSeconds * 0.4) * pitch;
      if (descriptor.family === 'MICROBIAL_COLONY') {
        subject.position.y = Math.sin(elapsedSeconds * 0.8) * 0.04;
      } else if (descriptor.family === 'AVIAN_BODY' || descriptor.family === 'INSECT_BODY') {
        subject.position.y = Math.sin(elapsedSeconds * 1.1) * 0.03;
      } else if (descriptor.family === 'PLANT_FORM') {
        subject.rotation.z = Math.sin(elapsedSeconds * 0.25) * 0.03;
      }
    },
    dispose: () => {
      for (const disposable of collectDisposables(root)) {
        disposable.dispose();
      }
      root.clear();
    },
  };
}
