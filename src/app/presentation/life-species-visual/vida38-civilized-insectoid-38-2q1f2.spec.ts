import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { createVida38CivilizedInsectoidPreview38Q } from './vida38-civilized-insectoid-preview-38-2q';
import { deriveVida38InsectoidEyeAnchor38Q1B, buildVida38InsectoidHead38Q1B } from './vida38-civilized-insectoid-organic-anatomy-38-2q1b';
import { VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D } from './vida38-civilized-insectoid-ocular-coxal-38-2q1d';
import {
  VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F,
  deriveVida38InsectoidOcularPlan38Q1F,
  createVida38InsectoidDiversePrimaryEye38Q1F,
  buildVida38InsectoidSpecialEyes38Q1F,
  findVida38InsectoidFrontalCraniumPoint38Q1F,
} from './vida38-civilized-insectoid-ocular-diversity-38-2q1f';

const PREVIOUS_SIZES: Record<string, readonly [number,number]> = {
  ROUNDED_COMPOUND: [1.12, 1.14],
  OVAL_COMPOUND: [1.04, 1.38],
  ANGULAR_COMPOUND: [1.17, 1.07],
  LATERAL_COMPOUND: [1.44, 1.03],
  PSEUDO_ARACHNOID: [1.00, 1.03],
  REDUCED_COMPOUND_OCELLI: [.95, .95],
};

function dispose(objects: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const object of objects) {
    if (!(object instanceof THREE.Mesh)) continue;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  }
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
}

describe('38.2q1f2 — ojos insectoides equilibrados en tamaño, separación y encastre', () => {
  const gallery = buildVida38InsectoidGallery38Q(24);

  it('reduce todos los ojos frente a q1f1 sin regresar a formas invisibles', () => {
    const families = new Set<string>();
    for (const entry of gallery) {
      const a = deriveVida38InsectoidOcularPlan38Q1F(entry.plan);
      const b = deriveVida38InsectoidOcularPlan38Q1F(entry.plan);
      expect(a).toEqual(b);
      expect(a.revision).toBe(VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F);
      const old = PREVIOUS_SIZES[a.family];
      expect(old).toBeDefined();
      families.add(a.family);
      expect(a.lateralScale.x / old![0]).toBeGreaterThan(.73);
      expect(a.lateralScale.x / old![0]).toBeLessThan(.87);
      expect(a.lateralScale.y / old![1]).toBeGreaterThan(.74);
      expect(a.lateralScale.y / old![1]).toBeLessThan(.91);
      expect(a.frontalAnchorFactor).toBeGreaterThanOrEqual(.86);
      expect(a.frontalAnchorFactor).toBeLessThanOrEqual(.94);
      expect(a.surfaceEmbedDepth).toBeGreaterThan(.015);
      expect(a.surfaceEmbedDepth).toBeLessThan(.03);
    }
    expect(families.size).toBe(6);
  });

  it('mantiene simetría lateral, espacio entre ojos y encastre superficial', () => {
    const families = new Set<string>();
    for (const entry of gallery) {
      const plan = deriveVida38InsectoidOcularPlan38Q1F(entry.plan);
      if (families.has(plan.family)) continue;
      families.add(plan.family);
      const headParts = buildVida38InsectoidHead38Q1B(entry.plan, 'LOW');
      const head = headParts.find(part => part.part === 'HEAD')!.mesh;
      const group = new THREE.Group(); group.add(head);
      const left = createVida38InsectoidDiversePrimaryEye38Q1F(entry.plan, -1, 'LOW', head);
      const right = createVida38InsectoidDiversePrimaryEye38Q1F(entry.plan, 1, 'LOW', head);
      try {
        const eyeObjects = [left,right];
        expect(left.position.x).toBeLessThan(-.13 * entry.plan.headScale);
        expect(right.position.x).toBeGreaterThan(.13 * entry.plan.headScale);
        const bridge = right.position.x - right.scale.x - (left.position.x + left.scale.x);
        expect(bridge).toBeGreaterThan(.040 * entry.plan.headScale);
        for (const [side,eye] of ([-1,1] as const).map((side,index) => [side,eyeObjects[index]!] as const)) {
          const anatomical = deriveVida38InsectoidEyeAnchor38Q1B(entry.plan,side);
          const ratio = Math.abs(eye.position.x / anatomical.position.x);
          expect(ratio).toBeGreaterThan(.78);
          expect(ratio).toBeLessThan(.96);
          const surface = findVida38InsectoidFrontalCraniumPoint38Q1F(head, eye.position.x, eye.position.y, -999);
          expect(surface.z).toBeGreaterThan(-.2);
          const protrusion = eye.userData['vida38InsectoidEyeProtrusion38Q1F1'] as number;
          expect(protrusion).toBeGreaterThan(.009);
          expect(protrusion).toBeLessThan(.090);
          expect(eye.userData['vida38InsectoidEyeSurfaceZ38Q1F1']).toBeCloseTo(surface.z,4);
          expect(VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D)
            .toContain(eye.userData['vida38InsectoidDarkEyeHex38Q1D']);
        }
      } finally {
        dispose([...headParts.map(part => part.mesh),left,right]);
      }
    }
    expect(families.size).toBe(6);
  }, 15000);

  it('reduce los ocelos dominantes sin afectar al número ni a la integración craneal', () => {
    const families = new Set<string>();
    for (const entry of gallery) {
      const plan = deriveVida38InsectoidOcularPlan38Q1F(entry.plan);
      if (families.has(plan.family) || plan.specialEyeCount===0) continue;
      families.add(plan.family);
      const parts = buildVida38InsectoidHead38Q1B(entry.plan,'LOW');
      const head = parts.find(part => part.part==='HEAD')!.mesh;
      const group = new THREE.Group(); group.add(head);
      const special = buildVida38InsectoidSpecialEyes38Q1F(entry.plan,head);
      try {
        expect(special.length).toBe(plan.specialEyeCount);
        expect(plan.specialEyeScale).toBeLessThanOrEqual(.025);
        for (const object of special) {
          const eye = object as THREE.Mesh;
          const surface = findVida38InsectoidFrontalCraniumPoint38Q1F(head,eye.position.x,eye.position.y,-999);
          const radius = (eye.geometry as THREE.SphereGeometry).parameters.radius*eye.scale.z;
          expect(eye.position.z + radius).toBeGreaterThan(surface.z + .006);
        }
      } finally {dispose([...parts.map(part=>part.mesh),...special]);}
    }
    expect(families.size).toBe(2);
  },15000);

  it('mantiene las dos órbitas principales, la cabeza y las caderas originales del renderer', () => {
    const entry = gallery.find(e=>deriveVida38InsectoidOcularPlan38Q1F(e.plan).family==='ROUNDED_COMPOUND') ?? gallery[0]!;
    const root = new THREE.Group();
    const parts = createVida38CivilizedInsectoidPreview38Q(root,entry.contract,'LOW');
    try {
      expect(parts.filter(o=>o.userData['civInsectoidPart38Q']==='COMPOUND_EYE')).toHaveLength(2);
      expect(parts.filter(o=>o.userData['civInsectoidPart38Q']==='PELVIS')).toHaveLength(1);
      expect(parts.filter(o=>o.userData['civInsectoidPart38Q']==='COXAL_SCUTE')).toHaveLength(2);
      expect(root.userData['vida38InsectoidOcularDiversityRevision38Q1F'])
        .toBe(VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F);
    } finally {dispose(parts);}
  },15000);
});
