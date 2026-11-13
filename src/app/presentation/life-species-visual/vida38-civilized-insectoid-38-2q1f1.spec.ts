import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { createVida38CivilizedInsectoidPreview38Q } from './vida38-civilized-insectoid-preview-38-2q';
import { buildVida38InsectoidHead38Q1B } from './vida38-civilized-insectoid-organic-anatomy-38-2q1b';
import {
  VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F,
  deriveVida38InsectoidOcularPlan38Q1F,
  createVida38InsectoidDiversePrimaryEye38Q1F,
  buildVida38InsectoidSpecialEyes38Q1F,
  findVida38InsectoidFrontalCraniumPoint38Q1F,
} from './vida38-civilized-insectoid-ocular-diversity-38-2q1f';

function dispose(objects: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const object of objects) {
    if (!(object instanceof THREE.Mesh)) continue;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  }
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

describe('38.2q1f1/38.2q1f2 — visibilidad y tamaño equilibrado de ojos compuestos', () => {
  const gallery = buildVida38InsectoidGallery38Q(24);

  it('conserva seis familias con escalas equilibradas y legibles', () => {
    const families = new Set<string>();
    for (const item of gallery) {
      const a = deriveVida38InsectoidOcularPlan38Q1F(item.plan);
      const b = deriveVida38InsectoidOcularPlan38Q1F(item.plan);
      expect(a).toEqual(b);
      families.add(a.family);
      expect(a.lateralScale.x).toBeGreaterThan(.75);
      expect(a.lateralScale.x).toBeLessThan(1.21);
      expect(a.lateralScale.y).toBeGreaterThan(.80);
      expect(a.lateralScale.y).toBeLessThan(1.16);
      expect(a.lateralScale.z).toBeGreaterThan(.77);
      expect(a.lateralScale.z).toBeLessThan(.93);
      expect(a.frontalAnchorFactor).toBeGreaterThan(.85);
      expect(a.frontalAnchorFactor).toBeLessThan(.96);
      expect(a.surfaceEmbedDepth).toBeGreaterThan(.015);
      expect(a.surfaceEmbedDepth).toBeLessThan(.030);
      expect(a.revision).toBe(VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F);
    }
    expect(families.size).toBeGreaterThanOrEqual(5);
  });

  it('sitúa los ojos sobre la superficie real del cráneo en las familias disponibles', () => {
    const unique = new Set<string>();
    for (const item of gallery) {
      const plan = deriveVida38InsectoidOcularPlan38Q1F(item.plan);
      if (unique.has(plan.family)) continue;
      unique.add(plan.family);
      const parts = buildVida38InsectoidHead38Q1B(item.plan, 'LOW');
      const head = parts.find(part => part.part === 'HEAD')!.mesh;
      const root = new THREE.Group(); root.add(head);
      const eyes = ([-1, 1] as const).map(side => createVida38InsectoidDiversePrimaryEye38Q1F(item.plan, side, 'LOW', head));
      try {
        for (const eye of eyes) {
          const surfaceZ = eye.userData['vida38InsectoidEyeSurfaceZ38Q1F1'] as number;
          const protrusion = eye.userData['vida38InsectoidEyeProtrusion38Q1F1'] as number;
          expect(Number.isFinite(surfaceZ)).toBe(true);
          expect(protrusion).toBeGreaterThan(.010);
          expect(protrusion).toBeLessThan(.090);
          expect(eye.scale.x).toBeGreaterThan(.060);
          expect(eye.scale.y).toBeGreaterThan(.070);
          expect(Math.abs(eye.position.x)).toBeGreaterThan(.13 * item.plan.headScale);
          expect(Math.abs(eye.position.x)).toBeLessThan(.38 * item.plan.headScale);
          const hit = findVida38InsectoidFrontalCraniumPoint38Q1F(head, eye.position.x, eye.position.y, -999);
          expect(hit.z).toBeGreaterThan(-.2);
          expect(hit.z).toBeCloseTo(surfaceZ, 4);
        }
      } finally { dispose([...parts.map(part => part.mesh), ...eyes]); }
    }
    expect(unique.size).toBeGreaterThanOrEqual(5);
  }, 15000);

  it('proyecta los grupos de ojos frontales sobre la cabeza sin enterrarlos', () => {
    const families = new Set<string>();
    for (const item of gallery) {
      const ocular = deriveVida38InsectoidOcularPlan38Q1F(item.plan);
      if (ocular.specialEyeCount === 0 || families.has(ocular.family)) continue;
      families.add(ocular.family);
      const parts = buildVida38InsectoidHead38Q1B(item.plan, 'LOW');
      const head = parts.find(part => part.part === 'HEAD')!.mesh;
      const group = new THREE.Group(); group.add(head);
      const special = buildVida38InsectoidSpecialEyes38Q1F(item.plan, head);
      try {
        expect(special).toHaveLength(ocular.specialEyeCount);
        for (const object of special) {
          const eye = object as THREE.Mesh;
          const surface = findVida38InsectoidFrontalCraniumPoint38Q1F(head, eye.position.x, eye.position.y, -999);
          const bound = eye.geometry as THREE.SphereGeometry;
          const radius = bound.parameters.radius * eye.scale.z;
          expect(eye.position.z + radius).toBeGreaterThan(surface.z + .006);
        }
      } finally { dispose([...parts.map(part => part.mesh), ...special]); }
    }
    expect(families.size).toBeGreaterThanOrEqual(2);
  }, 15000);

  it('integra el anclaje en el renderer sin alterar cabeza, caderas ni ojos oscuros', () => {
    const entry = gallery.find(item => deriveVida38InsectoidOcularPlan38Q1F(item.plan).family === 'PSEUDO_ARACHNOID')!;
    const subject = new THREE.Group();
    const created = createVida38CivilizedInsectoidPreview38Q(subject, entry.contract, 'LOW');
    try {
      expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'COMPOUND_EYE')).toHaveLength(2);
      expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'SPECIAL_EYE')).toHaveLength(6);
      expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'PELVIS')).toHaveLength(1);
      expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'COXAL_SCUTE')).toHaveLength(2);
      expect(subject.userData['vida38InsectoidOcularDiversityRevision38Q1F'])
        .toBe(VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F);
      for (const object of created.filter(object => object.userData['civInsectoidPart38Q'] === 'COMPOUND_EYE')) {
        expect(object.userData['vida38InsectoidEyeProtrusion38Q1F1']).toBeGreaterThan(.010);
      }
    } finally { dispose(created); }
  }, 15000);
});
