import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import {
  createVida38CivilizedInsectoidPreview38Q,
  deriveVida38CivilizedInsectoidPlan38Q,
  type Vida38CivilizedInsectoidPlan38Q,
} from './vida38-civilized-insectoid-preview-38-2q';
import {
  VIDA38_INSECTOID_ORGANIC_REVISION_38Q1B,
  buildVida38InsectoidHead38Q1B,
  buildVida38InsectoidWings38Q1B,
  buildVida38InsectoidStinger38Q1B,
  deriveVida38InsectoidAnatomicalStyle38Q1B,
  deriveVida38InsectoidWingRootAnchor38Q1B,
} from './vida38-civilized-insectoid-organic-anatomy-38-2q1b';

function dispose(objects: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const obj of objects) {
    if (!(obj instanceof THREE.Mesh)) continue;
    geometries.add(obj.geometry);
    const mm = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mm) materials.add(m);
  }
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
}

function firstMatch(
  entries: ReturnType<typeof buildVida38InsectoidGallery38Q>,
  predicate: (plan: Vida38CivilizedInsectoidPlan38Q) => boolean,
): typeof entries[number] {
  const chosen = entries.find(entry => predicate(entry.plan));
  if (!chosen) throw new Error('38.2q1b: no se encuentra el ejemplar anatómico para la prueba');
  return chosen;
}

describe('38.2q1b — integración torácica, abdomen terminal y patas insectoides', () => {
  it('mantiene la diversidad determinista de familias cefálicas, alas y aguijones', () => {
    const entries = buildVida38InsectoidGallery38Q(24);
    const heads = new Set<string>(), wings = new Set<string>(), stings = new Set<string>();
    for (const entry of entries) {
      const same = deriveVida38CivilizedInsectoidPlan38Q(entry.contract);
      const p = deriveVida38InsectoidAnatomicalStyle38Q1B(entry.plan);
      const q = deriveVida38InsectoidAnatomicalStyle38Q1B(same);
      expect(p.signature).toBe(q.signature);
      heads.add(p.head);
      if (entry.plan.wingPairs > 0) wings.add(p.wing);
      if (entry.plan.stinger !== 'NONE') stings.add(p.stinger);
    }
    expect(heads.size).toBeGreaterThanOrEqual(7);
    expect(wings.size).toBeGreaterThanOrEqual(3);
    expect(stings.size).toBeGreaterThanOrEqual(2);
  });

  it('conserva el cráneo esculpido con clípeo y suturas', () => {
    const specimens = buildVida38InsectoidGallery38Q(24);
    const morphs = [
      firstMatch(specimens, p => p.archetype === 'MANTID_SENTINEL'),
      firstMatch(specimens, p => p.archetype === 'BEETLE_BASTION'),
      firstMatch(specimens, p => p.archetype === 'CICADA_ARCHIVIST'),
    ];
    const ratios: number[] = [];
    for (const specimen of morphs) {
      const meshParts = buildVida38InsectoidHead38Q1B(specimen.plan, 'LOW');
      try {
        const head = meshParts.find(item => item.part === 'HEAD')?.mesh;
        expect(head).toBeDefined();
        if (!head) continue;
        const vertices = head.geometry.getAttribute('position') as THREE.BufferAttribute;
        expect(vertices.count).toBeGreaterThan(900);
        expect(meshParts.some(item => item.part === 'FACE_PLATE')).toBe(true);
        expect(meshParts.filter(item => item.part === 'HEAD_RIDGE').length).toBeGreaterThanOrEqual(5);
        const bb = new THREE.Box3().setFromBufferAttribute(vertices);
        ratios.push((bb.max.x - bb.min.x) / (bb.max.y - bb.min.y));
      } finally {
        dispose(meshParts.map(item => item.mesh));
      }
    }
    expect(new Set(ratios.map(value => value.toFixed(2))).size).toBeGreaterThanOrEqual(3);
  }, 15000);

  it('ancla las alas al tórax con raíces, placas y membranas próximas al cuerpo', () => {
    const entries = buildVida38InsectoidGallery38Q(24);
    const winged = entries.filter(entry => entry.plan.wingPairs > 0).slice(0, 3);
    expect(winged.length).toBe(3);
    for (const entry of winged) {
      const parts = buildVida38InsectoidWings38Q1B(entry.plan, 'LOW');
      try {
        const membranes = parts.filter(item => item.part === 'WING');
        const roots = parts.filter(item => item.part === 'WING_ROOT');
        const veins = parts.filter(item => item.part === 'WING_VEIN');
        expect(membranes.length).toBe(entry.plan.wingPairs * 2);
        expect(roots.length).toBe(entry.plan.wingPairs * 2 * 2);
        expect(veins.length).toBeGreaterThanOrEqual(entry.plan.wingPairs * 2 * 5);
        for (let pair = 0; pair < entry.plan.wingPairs; pair++) {
          for (const side of [-1, 1] as const) {
            const anchor = deriveVida38InsectoidWingRootAnchor38Q1B(entry.plan, side, pair);
            expect(Math.abs(anchor.root.x)).toBeLessThan(.30);
            expect(anchor.root.y).toBeGreaterThan(1.45);
            expect(anchor.root.z).toBeLessThan(.02);
          }
        }
        for (const part of membranes) {
          expect(part.mesh.geometry.index?.count ?? 0).toBeGreaterThan(800);
          const pos = part.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
          const bounds = new THREE.Box3().setFromBufferAttribute(pos);
          expect(bounds.max.z - bounds.min.z).toBeGreaterThan(.16);
          expect(bounds.max.x - bounds.min.x).toBeGreaterThan(.17);
          expect(Math.abs(bounds.min.x)).toBeLessThan(1.6);
        }
      } finally {
        dispose(parts.map(item => item.mesh));
      }
    }
  }, 15000);

  it('integra el aguijón como continuación abdominal sin anillos mecánicos', () => {
    const entries = buildVida38InsectoidGallery38Q(24);
    const stinging = firstMatch(entries, plan => plan.stinger !== 'NONE');
    const parts = buildVida38InsectoidStinger38Q1B(stinging.plan);
    try {
      expect(parts.some(item => item.part === 'STINGER_SHEATH')).toBe(true);
      expect(parts.some(item => item.part === 'STINGER')).toBe(true);
      expect(parts.filter(item => item.part === 'STINGER_GUARD').length).toBeGreaterThanOrEqual(2);
      const base = parts.find(item => item.part === 'STINGER_SHEATH')!.mesh;
      const bb = new THREE.Box3().setFromObject(base);
      expect(bb.min.y).toBeGreaterThan(.94);
      expect(bb.max.y).toBeLessThan(1.18);
      expect(bb.min.z).toBeLessThan(-.27);
    } finally {
      dispose(parts.map(item => item.mesh));
    }
  }, 15000);

  it('reconstruye las piernas con coxa, fémur, nudo de rodilla, tibia, tarso y garras', () => {
    const entry = firstMatch(buildVida38InsectoidGallery38Q(24), plan => plan.wingPairs > 0 && plan.stinger !== 'NONE' && plan.extraEyes > 0);
    const subject = new THREE.Group();
    const objects = createVida38CivilizedInsectoidPreview38Q(subject, entry.contract, 'LOW');
    try {
      expect(subject.userData['vida38CivilInsectoidOrganicRevision38Q1B']).toBe(VIDA38_INSECTOID_ORGANIC_REVISION_38Q1B);
      const legs = objects.filter(item => item.userData['civInsectoidPart38Q'] === 'LEG');
      const boots = objects.filter(item => item.userData['civInsectoidPart38Q'] === 'BOOT');
      const claws = objects.filter(item => item.userData['civInsectoidPart38Q'] === 'CLAW');
      expect(legs.length).toBeGreaterThanOrEqual(8);
      expect(boots.length).toBe(2);
      expect(claws.length).toBe(6);
      expect(objects.filter(item => item.userData['civInsectoidPart38Q'] === 'WING').length).toBe(entry.plan.wingPairs * 2);
      expect(objects.filter(item => item.userData['civInsectoidPart38Q'] === 'ARM').length).toBe(entry.plan.armCount * 2);
      expect(objects.some(item => item.userData['civInsectoidPart38Q'] === 'STINGER')).toBe(true);
    } finally {
      dispose(objects);
    }
  }, 15000);
});
