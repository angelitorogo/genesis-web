import { resolveVida38ReptilianTestEntry38S8C } from './vida38-reptilian-test-fixtures-38-2s8c';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  createVida38ReptilianOrganicGarments38OE7B,
  createVida38ReptilianSoftShell38OE7B,
  deriveVida38OrganicGarmentPlan38OE7B,
} from './vida38-reptilian-organic-garments-38-2oe7b';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';

const stubAnatomy = {
  legLength: 1.04, torsoLength: 0.73, shoulderWidth: 0.31, hipWidth: 0.235,
} as Vida38HumanoidAnatomy;

function stubBody(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.23, 20, 16);
  geometry.scale(1, 1.75, 0.75);
  geometry.translate(0, 1.31, 0);
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
}
function plan(speciesId: string, garmentFamily = 'CEREMONIAL_ROBES', culture = 'BASILICA_TECHNOCRACY', garmentLine = 'TECHNO_PRIEST') {
  return deriveVida38OrganicGarmentPlan38OE7B({
    speciesId, appearanceFingerprint: `fp:${speciesId}`,
    garmentFamily, garmentLine, culture,
    primaryColor: '#101c2b', accentColor: '#65dabf',
  });
}
function release(meshes: readonly THREE.Mesh[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const mesh of meshes) {
    geometries.add(mesh.geometry);
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const item of list) materials.add(item);
  }
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

describe('38.2o.e7b — continuidad, abertura de cola y caída de prendas blandas', () => {
  it('produce un plan determinista y longitudes/pliegues variables por especie', () => {
    expect(plan('a')).toEqual(plan('a'));
    const plans = Array.from({ length: 64 }, (_, i) => plan(`e7b:species:${i}`));
    expect(new Set(plans.map(p => p.signature)).size).toBe(64);
    expect(new Set(plans.map(p => p.length)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(plans.map(p => p.pleatCount)).size).toBeGreaterThanOrEqual(4);
  });

  it('genera una malla envolvente única con interior, exterior y bordes cerrados', () => {
    const body = stubBody();
    const shell = createVida38ReptilianSoftShell38OE7B(body, stubAnatomy, plan('synthetic:habit'));
    try {
      const geom = shell.geometry;
      const positions = geom.getAttribute('position');
      const triangles = geom.getIndex();
      const stats = shell.userData['garmentStats38OE7B'] as {
        vertexCount: number; triangleCount: number; rearTailOpening: boolean;
        closedThickness: boolean; minimumHemY: number; maximumShoulderY: number;
      };
      expect(positions.count).toBeGreaterThan(5000);
      expect(triangles?.count ?? 0).toBeGreaterThan(12000);
      expect(stats.closedThickness).toBe(true);
      expect(stats.rearTailOpening).toBe(true);
      expect(stats.minimumHemY).toBeLessThan(stubAnatomy.legLength);
      expect(stats.maximumShoulderY).toBeGreaterThan(stubAnatomy.legLength);
      expect(shell.userData['garmentCoverage38OE7B']).toBe('TORSO_BACK_HIPS_360');
      const zValues = Array.from({ length: positions.count }, (_, i) => positions.getZ(i));
      expect(Math.min(...zValues)).toBeLessThan(-0.13);
      expect(Math.max(...zValues)).toBeGreaterThan(0.13);
      for (let i = 0; i < positions.count; i++) {
        expect(Number.isFinite(positions.getX(i))).toBe(true);
        expect(Number.isFinite(positions.getY(i))).toBe(true);
        expect(Number.isFinite(positions.getZ(i))).toBe(true);
      }
    } finally {
      release([shell, body]);
    }
  }, 15000);

  it('deja libre el centro de la salida de cola en la zona posterior', () => {
    const body = stubBody();
    const shell = createVida38ReptilianSoftShell38OE7B(body, stubAnatomy, plan('synthetic:tail'));
    try {
      const position = shell.geometry.getAttribute('position');
      let nearTailCenter = 0;
      for (let i = 0; i < position.count; i += 2) {
        const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
        if (Math.abs(x) < 0.04 && Math.abs(y - (stubAnatomy.legLength - 0.025)) < 0.06 && z < -0.12) {
          nearTailCenter++;
        }
      }
      // Hay vértices de la plantilla completa, pero ninguna cara de tejido
      // debe usar el centro de la abertura: se verifica sobre índices.
      const used = new Set<number>();
      const index = shell.geometry.getIndex()!;
      for (let i = 0; i < index.count; i++) used.add(index.getX(i));
      let usedInside = 0;
      for (let i = 0; i < position.count; i += 2) {
        if (!used.has(i)) continue;
        const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
        if (Math.abs(x) < 0.04 && Math.abs(y - (stubAnatomy.legLength - 0.025)) < 0.06 && z < -0.12) usedInside++;
      }
      expect(nearTailCenter).toBeGreaterThan(0);
      expect(usedInside).toBe(0);
    } finally {
      release([shell, body]);
    }
  });

  it('diferencia hábito sacerdotal, manto noble, sobreprenda colonial y velo pelágico', () => {
    const body = stubBody();
    const options = [
      plan('robe:a', 'CEREMONIAL_ROBES', 'BASILICA_TECHNOCRACY', 'TECHNO_PRIEST'),
      plan('noble:a', 'NOBLE_REGALIA', 'STAR_KINGDOM', 'NOBLE'),
      plan('industrial:a', 'COLONIAL_RIG', 'FRONTIER_HEGEMONY', 'INDUSTRIAL_COLONIZER'),
      plan('pelagic:a', 'PELAGIC_DRAPE', 'PELAGIC_CONCORD', 'SCIENTIST'),
    ];
    expect(new Set(options.map(p => p.kind)).size).toBe(4);
    for (const selected of options) {
      const meshes = createVida38ReptilianOrganicGarments38OE7B(body, stubAnatomy, selected);
      try {
        expect(meshes.length).toBeGreaterThanOrEqual(2);
        expect(meshes.every(mesh => mesh.name === 'VIDA38_2OD_REPTILIAN_GARMENT')).toBe(true);
        expect(meshes.every(mesh => mesh.userData['garmentGeom38OE7'] === true)).toBe(true);
        if (selected.kind === 'TECHNO_HABIT') {
          expect(meshes.some(mesh => String(mesh.userData['garmentPart38OE6']).startsWith('BASILICA_STOLE_'))).toBe(true);
        }
        if (selected.kind === 'PELAGIC_VEIL') {
          expect(meshes.some(mesh => String(mesh.userData['garmentPart38OE6']).startsWith('PELAGIC_'))).toBe(true);
        }
      } finally { release(meshes); }
    }
    release([body]);
  });

  it('integra el hábito orgánico en un ejemplar real de la galería', () => {
    const entry = resolveVida38ReptilianTestEntry38S8C(7);
    expect(entry).toBeDefined();
    const subject = new THREE.Group();
    const created = createVida38CivilizedReptilianPreview38O(subject, entry!.contract, 'LOW');
    try {
      expect(subject.userData['vida38ReptilianGarmentFamily38OE6']).toBe('CEREMONIAL_ROBES');
      expect(String(subject.userData['vida38OrganicGarmentPlan38OE7B'] ?? '')).toContain('HABIT');
      expect(created.some(obj => obj.userData['garmentGeomKind38OE7'] === 'CONTINUOUS_360_THICK_SHELL')).toBe(true);
    } finally {
      release(created.filter((obj): obj is THREE.Mesh => obj instanceof THREE.Mesh));
    }
  }, 15000);
});
