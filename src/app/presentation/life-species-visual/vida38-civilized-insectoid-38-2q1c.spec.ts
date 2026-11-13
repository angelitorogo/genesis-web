import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { createVida38CivilizedInsectoidPreview38Q } from './vida38-civilized-insectoid-preview-38-2q';
import {
  buildVida38InsectoidStinger38Q1B,
  deriveVida38InsectoidShoulderFrame38Q1C,
  deriveVida38InsectoidStingerBase38Q1B,
  deriveVida38InsectoidTorsoSideRadius38Q1C,
} from './vida38-civilized-insectoid-organic-anatomy-38-2q1b';

function dispose(objects: readonly THREE.Object3D[]): void {
  const geo = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const object of objects) {
    if (!(object instanceof THREE.Mesh)) continue;
    geo.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  }
  for (const g of geo) g.dispose();
  for (const m of materials) m.dispose();
}

/** Dot(normal,radio) comprueba visibilidad en todos los azimuts. */
function outwardNormals(mesh: THREE.Mesh, radialSegments: number): { positive: number; total: number } {
  const geometry = mesh.geometry;
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const ringSize = radialSegments + 1;
  const rows = Math.floor(positions.count / ringSize) - 1;
  let positive = 0, total = 0;
  for (const f of [.18, .32, .48, .64, .80]) {
    const j = Math.min(rows - 1, Math.max(1, Math.round(rows * f)));
    const center = new THREE.Vector3();
    for (let k = 0; k < radialSegments; k++) {
      center.add(new THREE.Vector3().fromBufferAttribute(positions, j * ringSize + k));
    }
    center.multiplyScalar(1 / radialSegments);
    for (let k = 0; k < radialSegments; k++) {
      const index = j * ringSize + k;
      const radial = new THREE.Vector3().fromBufferAttribute(positions, index).sub(center);
      const normal = new THREE.Vector3().fromBufferAttribute(normals, index);
      if (radial.lengthSq() > .000001) {
        if (normal.dot(radial) > 0) positive++;
        total++;
      }
    }
  }
  return { positive, total };
}

describe('38.2q1c — corregir aguijón intermitente y huecos en las raíces de brazos', () => {
  const gallery = buildVida38InsectoidGallery38Q(24);

  it('genera un único aguijón continuo con normales exteriores para la cámara 360 grados', () => {
    const entries = gallery.filter(entry => entry.plan.stinger !== 'NONE').slice(0, 4);
    expect(entries.length).toBe(4);
    for (const entry of entries) {
      const parts = buildVida38InsectoidStinger38Q1B(entry.plan);
      try {
        const shaft = parts.filter(item => item.part === 'STINGER');
        expect(shaft.length).toBe(1);
        expect(shaft[0]!.mesh.userData['vida38StingerContinuity38Q1C']).toBe(true);
        const mat = shaft[0]!.mesh.material as THREE.MeshPhysicalMaterial;
        expect(mat.side).toBe(THREE.FrontSide);
        expect(mat.transparent).toBe(false);
        const frontFacing = outwardNormals(shaft[0]!.mesh, 18);
        expect(frontFacing.total).toBeGreaterThan(70);
        expect(frontFacing.positive / frontFacing.total).toBeGreaterThan(.95);
        expect(parts.filter(item => item.part === 'STINGER_GUARD').length).toBe(2);
        expect(parts.filter(item => item.part === 'STINGER_SHEATH').length).toBe(2);
        const origin = deriveVida38InsectoidStingerBase38Q1B(entry.plan);
        expect(origin.z).toBeLessThan(-.15);
        expect(Number.isFinite(origin.z)).toBe(true);
      } finally {
        dispose(parts.map(item => item.mesh));
      }
    }
  }, 15000);

  it('ancla cada hombro por debajo de la piel real del tórax', () => {
    for (const entry of gallery) {
      for (let index = 0; index < entry.plan.armPairs; index++) {
        for (const side of [-1, 1] as const) {
          const frame = deriveVida38InsectoidShoulderFrame38Q1C(entry.plan, index, side);
          const r = deriveVida38InsectoidTorsoSideRadius38Q1C(entry.plan, frame.y);
          expect(frame.torsoRadius).toBeCloseTo(r, 8);
          expect(Math.abs(frame.inside.x)).toBeLessThan(r);
          expect(Math.abs(frame.surface.x)).toBeCloseTo(r, 8);
          expect(Math.abs(frame.outside.x)).toBeGreaterThan(r);
          expect(frame.inside.distanceTo(frame.outside)).toBeLessThan(.16);
          expect(frame.y).toBeGreaterThanOrEqual(1.33);
          expect(frame.y).toBeLessThanOrEqual(1.73);
        }
      }
    }
  });

  it('integra un manguito por brazo sin alterar dedos, ojos, alas ni accesorios', () => {
    for (const entry of gallery.slice(0, 3)) {
      const subject = new THREE.Group();
      const created = createVida38CivilizedInsectoidPreview38Q(subject, entry.contract, 'LOW');
      try {
        expect(subject.userData['vida38InsectoidJointFixRevision38Q1C']).toBe('VIDA.38.2q1c/stinger-shoulder-continuity/v1');
        const shoulders = created.filter(object => object.userData['civInsectoidPart38Q'] === 'SHOULDER');
        expect(shoulders.length).toBe(entry.plan.armCount);
        expect(shoulders.every(object => object.userData['vida38InsectoidShoulderEmbedded38Q1C'] === true)).toBe(true);
        expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'ARM').length).toBe(entry.plan.armCount * 2);
        expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'WING').length).toBe(entry.plan.wingPairs * 2);
        expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'COMPOUND_EYE').length).toBe(2);
      } finally {
        dispose(created);
      }
    }
  }, 15000);
});
