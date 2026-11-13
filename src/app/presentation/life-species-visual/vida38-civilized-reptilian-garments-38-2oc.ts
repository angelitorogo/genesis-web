import * as THREE from 'three';
import type { Vida38ReptilianHumanoidMorphology38OC, Vida38Rng38OC } from './vida38-civilized-reptilian-morphology-38-2oc';

function material(colorHex: string, roughness: number, metalness: number, opacity = 1): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex), roughness, metalness, opacity,
    transparent: opacity < 1, depthWrite: opacity >= 1,
    clearcoat: 0.16, thickness: 0.18, sheen: 0.04,
  });
}
function mixHex(a: string, b: string, factor: number): string {
  return `#${new THREE.Color(a).clone().lerp(new THREE.Color(b), factor).getHexString()}`;
}
function add(subject: THREE.Group, created: THREE.Object3D[], mesh: THREE.Mesh): void {
  mesh.name = 'VIDA38_2OC_REPTILIAN_GARMENT';
  subject.add(mesh); created.push(mesh);
}

export function createVida38ReptilianGarments38OC(subject: THREE.Group, created: THREE.Object3D[], morphology: Vida38ReptilianHumanoidMorphology38OC, rng: Vida38Rng38OC): void {
  const base = morphology.garmentBaseHex;
  const accent = morphology.accentColorHex;
  if (morphology.level === 'PRIMITIVE') {
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 18), material(mixHex(base, accent, 0.36), 0.84, 0.02));
    belt.rotation.x = Math.PI / 2; belt.scale.set(1.08, 0.86, 0.92); belt.position.set(0, -0.08, 0); add(subject, created, belt);
    for (let i = 0; i < 5; i++) {
      const flap = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.28 + i * 0.02, 4, 8), material(mixHex(base, '#c6a179', 0.22), 0.88, 0.01));
      flap.position.set((i - 2) * 0.1, -0.28, 0.2 + rng.range(-0.02, 0.03));
      flap.rotation.x = 0.18 + rng.range(-0.06, 0.08);
      add(subject, created, flap);
    }
    const mantle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 22), material(mixHex(accent, '#eedebd', 0.16), 0.54, 0.02));
    mantle.rotation.x = Math.PI / 2; mantle.position.set(0, 0.88, 0.14); add(subject, created, mantle);
    for (let side = -1; side <= 1; side += 2) {
      const pauldron = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.24, 4, 8), material(mixHex(accent, '#cfb48b', 0.14), 0.82, 0.02));
      pauldron.position.set(side * 0.34, 0.74, 0.06); pauldron.rotation.z = side * -0.28; pauldron.rotation.x = 0.22;
      add(subject, created, pauldron);
    }
    return;
  }

  if (morphology.level === 'ADVANCED') {
    const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.39, 1.02, 16, 1, true), material(mixHex(base, accent, 0.34), 0.38, 0.08, 0.94));
    tunic.position.set(0, 0.16, 0); tunic.scale.set(1.0, 1.0, 0.82); add(subject, created, tunic);
    const cuirass = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.3, 6, 10), material(mixHex(accent, '#d8eaf4', 0.12), 0.26, 0.16));
    cuirass.position.set(0, 0.4, 0.28); cuirass.scale.set(1.7, 1.18, 0.44); add(subject, created, cuirass);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.046, 8, 24), material(mixHex(accent, '#1d2830', 0.14), 0.28, 0.2));
    belt.rotation.x = Math.PI / 2; belt.scale.set(1.08, 0.92, 0.9); belt.position.set(0, -0.06, 0); add(subject, created, belt);
    for (let side = -1; side <= 1; side += 2) {
      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI), material(mixHex(accent, '#dff5ff', 0.08), 0.24, 0.22));
      pauldron.position.set(side * 0.34, 0.78, 0.04); pauldron.rotation.z = side * 0.14; add(subject, created, pauldron);
      const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.22, 10), material(mixHex(accent, '#d9f2ff', 0.08), 0.22, 0.24));
      bracer.position.set(side * 0.54, 0.18, 0.08); bracer.rotation.z = side * 0.16; add(subject, created, bracer);
    }
    return;
  }

  const bodySuit = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.38, 1.08, 18, 1, true), material(mixHex(base, '#15212c', 0.44), 0.18, 0.24, 0.98));
  bodySuit.position.set(0, 0.16, 0); bodySuit.scale.set(1.0, 1.0, 0.84); add(subject, created, bodySuit);
  const harness = new THREE.Mesh(new THREE.TorusKnotGeometry(0.24, 0.028, 56, 10, 2, 3), material(mixHex(accent, '#d9fbff', 0.06), 0.14, 0.34));
  harness.position.set(0, 0.4, 0.16); harness.scale.set(1.12, 1.42, 0.56); add(subject, created, harness);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 8, 26), material(mixHex(accent, '#b8e8ff', 0.08), 0.12, 0.42));
  collar.rotation.x = Math.PI / 2; collar.position.set(0, 0.92, 0.14); add(subject, created, collar);
  for (let side = -1; side <= 1; side += 2) {
    const crest = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.18, 4, 8), material(mixHex(accent, '#d8f3ff', 0.08), 0.12, 0.38));
    crest.position.set(side * 0.28, 0.96, 0.18); crest.rotation.z = side * 0.28; crest.rotation.x = 0.24; add(subject, created, crest);
  }
}
