import * as THREE from 'three';
import { VIDA38_INSECTOID_WARDROBE_REVISION_38Q2 } from './vida38-civilized-insectoid-wardrobe-38-2q2';
import { describe, expect, it } from 'vitest';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import {
  createVida38CivilizedInsectoidPreview38Q,
  deriveVida38CivilizedInsectoidPlan38Q,
  type Vida38CivilizedInsectoidPlan38Q,
} from './vida38-civilized-insectoid-preview-38-2q';
import {
  buildVida38InsectoidHead38Q1A,
  buildVida38InsectoidWings38Q1A,
  buildVida38InsectoidStinger38Q1A,
  deriveVida38InsectoidAnatomicalStyle38Q1A,
} from './vida38-civilized-insectoid-organic-anatomy-38-2q1a';

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
  if (!chosen) throw new Error('38.2q1a: no se encuentra el ejemplar anatómico para la prueba');
  return chosen;
}

describe('38.2q1a — cabeza, alas y aguijones orgánicos', () => {
  it('combina rasgos deterministas con siete familias cefálicas y varias alas/aguijones', () => {
    const entries = buildVida38InsectoidGallery38Q(24);
    const heads = new Set<string>(), wings = new Set<string>(), stings = new Set<string>();
    for (const entry of entries) {
      const same = deriveVida38CivilizedInsectoidPlan38Q(entry.contract);
      const p = deriveVida38InsectoidAnatomicalStyle38Q1A(entry.plan);
      const q = deriveVida38InsectoidAnatomicalStyle38Q1A(same);
      expect(p).toEqual(q);
      expect(p.signature).toBe(q.signature);
      heads.add(p.head);
      if (entry.plan.wingPairs > 0) wings.add(p.wing);
      if (entry.plan.stinger !== 'NONE') stings.add(p.stinger);
    }
    expect(heads.size).toBeGreaterThanOrEqual(7);
    expect(wings.size).toBeGreaterThanOrEqual(3);
    expect(stings.size).toBeGreaterThanOrEqual(2);
  });

  it('reemplaza la esfera cefálica por una malla esculpida con clípeo, suturas y relieve', () => {
    const specimens = buildVida38InsectoidGallery38Q(24);
    const morphs = [
      firstMatch(specimens, p => p.archetype === 'MANTID_SENTINEL'),
      firstMatch(specimens, p => p.archetype === 'BEETLE_BASTION'),
      firstMatch(specimens, p => p.archetype === 'CICADA_ARCHIVIST'),
    ];
    const ratios: number[] = [];
    for (const specimen of morphs) {
      const meshParts = buildVida38InsectoidHead38Q1A(specimen.plan, 'LOW');
      try {
        const head = meshParts.find(item => item.part === 'HEAD')?.mesh;
        expect(head).toBeDefined();
        if (!head) continue;
        const vertices = head.geometry.getAttribute('position') as THREE.BufferAttribute;
        expect(vertices.count).toBeGreaterThan(900);
        expect(head.geometry.getAttribute('color')).toBeDefined();
        expect(meshParts.some(item => item.part === 'FACE_PLATE')).toBe(true);
        expect(meshParts.filter(item => item.part === 'HEAD_RIDGE').length).toBeGreaterThanOrEqual(5);
        const bb = new THREE.Box3().setFromBufferAttribute(vertices);
        ratios.push((bb.max.x - bb.min.x) / (bb.max.y - bb.min.y));
      } finally {
        dispose(meshParts.map(item => item.mesh));
      }
    }
    expect(new Set(ratios.map(value => value.toFixed(2))).size).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('genera alas con membrana subdividida, venación, raíz y distintas formas', () => {
    const entries = buildVida38InsectoidGallery38Q(24);
    const winged = entries.filter(entry => entry.plan.wingPairs > 0).slice(0, 3);
    expect(winged.length).toBe(3);
    for (const entry of winged) {
      const parts = buildVida38InsectoidWings38Q1A(entry.plan, 'LOW');
      try {
        const membranes = parts.filter(item => item.part === 'WING');
        const veins = parts.filter(item => item.part === 'WING_VEIN');
        expect(membranes.length).toBe(entry.plan.wingPairs * 2);
        expect(veins.length).toBeGreaterThanOrEqual(entry.plan.wingPairs * 2 * 5);
        expect(parts.filter(item => item.part === 'WING_ROOT').length).toBe(entry.plan.wingPairs * 2);
        for (const part of membranes) {
          expect(part.mesh.geometry.index?.count ?? 0).toBeGreaterThan(800);
          expect(part.mesh.geometry.getAttribute('color')).toBeDefined();
          const pos = part.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
          const bounds = new THREE.Box3().setFromBufferAttribute(pos);
          expect(bounds.max.z - bounds.min.z).toBeGreaterThan(.20);
          expect(bounds.max.x - bounds.min.x).toBeGreaterThan(.17);
        }
      } finally {
        dispose(parts.map(item => item.mesh));
      }
    }
  }, 60_000);

  it('integra el aguijón con bulbo abdominal, segmentos y punta variable', () => {
    const entries = buildVida38InsectoidGallery38Q(24);
    const stinging = firstMatch(entries, plan => plan.stinger !== 'NONE');
    const parts = buildVida38InsectoidStinger38Q1A(stinging.plan);
    try {
      expect(parts.some(item => item.part === 'STINGER_SHEATH')).toBe(true);
      expect(parts.some(item => item.part === 'STINGER')).toBe(true);
      expect(parts.filter(item => item.part === 'STINGER_GUARD').length).toBeGreaterThanOrEqual(2);
      const base = parts.find(item => item.part === 'STINGER_SHEATH')!.mesh;
      const bb = new THREE.Box3().setFromObject(base);
      expect(bb.min.y).toBeGreaterThan(.80);
      expect(bb.max.y).toBeLessThan(1.20);
      expect(bb.min.z).toBeLessThan(-.24);
    } finally {
      dispose(parts.map(item => item.mesh));
    }
  }, 60_000);

  it('integra el renderer especializado sin alterar brazos, ojos o vestuario existentes', () => {
    const entry = firstMatch(buildVida38InsectoidGallery38Q(24), plan => plan.wingPairs > 0 && plan.stinger !== 'NONE' && plan.extraEyes > 0);
    const subject = new THREE.Group();
    const objects = createVida38CivilizedInsectoidPreview38Q(subject, entry.contract, 'LOW');
    try {
      expect(String(subject.userData['vida38CivilInsectoidOrganicRevision38Q1B'] ?? '')).toContain('38.2q1b');
      expect(objects.filter(item => item.userData['civInsectoidPart38Q'] === 'HEAD').length).toBe(1);
      expect(objects.filter(item => item.userData['civInsectoidPart38Q'] === 'FACE_PLATE').length).toBeGreaterThanOrEqual(1);
      expect(objects.filter(item => item.userData['civInsectoidPart38Q'] === 'WING').length).toBe(entry.plan.wingPairs * 2);
      expect(objects.filter(item => item.userData['civInsectoidPart38Q'] === 'ARM').length).toBe(entry.plan.armCount * 2);
      expect(objects.filter(item => item.userData['civInsectoidPart38Q'] === 'AUX_EYE').length).toBe(entry.plan.extraEyes);
      // El aguijón se audita como malla en el test anatómico anterior (Q1A/Q1C).
      // Aquí se comprueba que la integración conserva el contrato procedural
      // de la identidad, sin exigir un objeto suelto después de su fusión.
      expect(subject.userData['vida38CivilInsectoidStinger38Q']).toBe(entry.plan.stinger);
      // Tras 38.2q2 el atuendo se compone de prendas continuas; ACCESSORY y MANTLE
      // ya no están garantizados para todas las identidades, aunque sí la ropa real.
      expect(subject.userData['vida38InsectoidWardrobeRevision38Q2']).toBe(VIDA38_INSECTOID_WARDROBE_REVISION_38Q2);
      const wardrobePieces = objects.filter(item =>
        item.userData['vida38WardrobeRevision38Q2'] === VIDA38_INSECTOID_WARDROBE_REVISION_38Q2);
      expect(wardrobePieces.length).toBeGreaterThan(0);
      expect(wardrobePieces.some(item => item.userData['vida38WardrobeContinuous38Q2'] === true)).toBe(true);
    } finally {
      dispose(objects);
    }
  }, 60_000);
});
