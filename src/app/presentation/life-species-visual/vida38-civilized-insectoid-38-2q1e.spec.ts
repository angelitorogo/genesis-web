import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { createVida38CivilizedInsectoidPreview38Q } from './vida38-civilized-insectoid-preview-38-2q';
import {
  VIDA38_INSECTOID_FLY_EYE_REVISION_38Q1E,
  deriveVida38InsectoidFlyEyeSpec38Q1E,
  buildVida38InsectoidOmmatidiaGeometry38Q1E,
  createVida38InsectoidFlyEye38Q1E,
} from './vida38-civilized-insectoid-compound-eye-38-2q1e';
import {
  VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D,
  deriveVida38InsectoidDarkEyePlan38Q1D,
} from './vida38-civilized-insectoid-ocular-coxal-38-2q1d';

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

describe('38.2q1e — ojos compuestos como los de una mosca, en gama negra', () => {
  const entries = buildVida38InsectoidGallery38Q(24);

  it('conserva cuatro tonos negros entre especies con identidades reproducibles', () => {
    const observed = new Set<string>();
    for (const entry of entries) {
      const old = deriveVida38InsectoidDarkEyePlan38Q1D(entry.plan);
      const one = deriveVida38InsectoidFlyEyeSpec38Q1E(entry.plan, 'MEDIUM');
      const two = deriveVida38InsectoidFlyEyeSpec38Q1E(entry.plan, 'MEDIUM');
      expect(one).toEqual(two);
      expect(one.revision).toBe(VIDA38_INSECTOID_FLY_EYE_REVISION_38Q1E);
      expect(one.baseHex).toBe(old.baseHex);
      expect(VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D).toContain(one.baseHex);
      observed.add(one.baseHex);
    }
    expect(observed.size).toBeGreaterThanOrEqual(3);
  });

  it('escala microfacetas por LOD sin crear una esfera de grandes polígonos', () => {
    const plan = entries[0]!.plan;
    const low = deriveVida38InsectoidFlyEyeSpec38Q1E(plan, 'LOW');
    const medium = deriveVida38InsectoidFlyEyeSpec38Q1E(plan, 'MEDIUM');
    const high = deriveVida38InsectoidFlyEyeSpec38Q1E(plan, 'HIGH');
    expect(low.facets).toBeGreaterThanOrEqual(250);
    expect(medium.facets).toBeGreaterThan(800);
    expect(high.facets).toBeGreaterThan(2000);
    expect(low.facets).toBeLessThan(medium.facets);
    expect(medium.facets).toBeLessThan(high.facets);
  });

  it('genera una sola malla hexagonal/pentagonal oscura con caras exteriores', () => {
    const spec = deriveVida38InsectoidFlyEyeSpec38Q1E(entries[0]!.plan, 'LOW');
    const geometry = buildVida38InsectoidOmmatidiaGeometry38Q1E(spec, 'deterministic-fixture');
    const twin = buildVida38InsectoidOmmatidiaGeometry38Q1E(spec, 'deterministic-fixture');
    try {
      expect(geometry.userData['vida38OmmatidiumCount38Q1E']).toBe(spec.facets);
      expect(geometry.userData['vida38OmmatidiumShape38Q1E']).toBe('ICOSAHEDRAL_DUAL_HEX_PENT');
      const vertices = geometry.getAttribute('position') as THREE.BufferAttribute;
      const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
      const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
      expect(vertices.count).toBeGreaterThan(spec.facets * 12);
      expect(vertices.count).toBe(twin.getAttribute('position').count);
      let maxColor = 0;
      let inward = 0;
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
        const nx = normals.getX(i), ny = normals.getY(i), nz = normals.getZ(i);
        if (x * nx + y * ny + z * nz < -0.001) inward++;
        maxColor = Math.max(maxColor, colors.getX(i), colors.getY(i), colors.getZ(i));
        if (i < 60) {
          expect(vertices.getX(i)).toBeCloseTo(twin.getAttribute('position').getX(i), 7);
          expect(colors.getX(i)).toBeCloseTo(twin.getAttribute('color').getX(i), 7);
        }
      }
      expect(inward).toBe(0);
      expect(maxColor).toBeLessThan(.05);
    } finally {
      geometry.dispose();
      twin.dispose();
    }
  }, 15000);

  it('encastra el globo ocular y conserva un objeto por ojo y ojos compuestos legibles', () => {
    const sample = entries.find(entry => entry.plan.extraEyes > 0 && entry.plan.wingPairs > 0);
    expect(sample).toBeDefined();
    if (!sample) return;
    const root = new THREE.Group();
    const created = createVida38CivilizedInsectoidPreview38Q(root, sample.contract, 'LOW');
    try {
      expect(root.userData['vida38InsectoidFlyEyeRevision38Q1E']).toBe(VIDA38_INSECTOID_FLY_EYE_REVISION_38Q1E);
      const compound = created.filter(object => object.userData['civInsectoidPart38Q'] === 'COMPOUND_EYE');
      const ocelli = created.filter(object => object.userData['civInsectoidPart38Q'] === 'AUX_EYE');
      expect(compound).toHaveLength(2);
      expect(ocelli).toHaveLength(sample.plan.extraEyes);
      for (const object of compound) {
        const mesh = object as THREE.Mesh;
        const mat = mesh.material as THREE.MeshPhysicalMaterial;
        expect(mesh.userData['vida38InsectoidFlyEyeRevision38Q1E']).toBe(VIDA38_INSECTOID_FLY_EYE_REVISION_38Q1E);
        expect(mesh.userData['vida38InsectoidFlyEyeOmmatidia38Q1E']).toBeGreaterThanOrEqual(250);
        expect(VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D).toContain(mesh.userData['vida38InsectoidDarkEyeHex38Q1D']);
        expect(mat.emissiveIntensity).toBe(0);
        expect(mat.side).toBe(THREE.FrontSide);
        expect(mesh.scale.z).toBeLessThan(mesh.scale.y);
      }
      expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'PELVIS')).toHaveLength(1);
      expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'COXAL_SCUTE')).toHaveLength(2);
      expect(created.filter(object => object.userData['vida38CoxalEmbedded38Q1D'])).toHaveLength(2);
      expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'ARM')).toHaveLength(sample.plan.armCount * 2);
      expect(created.filter(object => object.userData['civInsectoidPart38Q'] === 'WING')).toHaveLength(sample.plan.wingPairs * 2);
    } finally { dispose(created); }
  }, 15000);

  it('mantiene las dos órbitas simétricas y el negro incluso en calidad alta', () => {
    const plan = entries[4]!.plan;
    const left = createVida38InsectoidFlyEye38Q1E(plan, -1, 'HIGH');
    const right = createVida38InsectoidFlyEye38Q1E(plan, 1, 'HIGH');
    try {
      expect(left.position.x).toBeLessThan(0);
      expect(right.position.x).toBeGreaterThan(0);
      expect(left.position.x).toBeCloseTo(-right.position.x, 5);
      expect(left.userData['vida38InsectoidFlyEyeOmmatidia38Q1E']).toBeGreaterThan(2000);
      expect(left.userData['vida38InsectoidFlyEyeOmmatidia38Q1E']).toBe(right.userData['vida38InsectoidFlyEyeOmmatidia38Q1E']);
    } finally { dispose([left, right]); }
  }, 15000);
});
