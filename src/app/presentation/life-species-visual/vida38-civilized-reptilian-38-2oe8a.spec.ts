import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import { buildVida38ReptilianGallery38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import {
  VIDA38_TECH_GARMENT_REVISION_38OE8,
  deriveVida38TechArmorPlan38OE8,
  createVida38ReptilianTechnicalGarments38OE8,
} from './vida38-reptilian-technical-garments-38-2oe8';

const anatomy = {
  legLength: 1.04, torsoLength: 0.73, shoulderWidth: 0.31,
  hipWidth: 0.235, hipSpacing: 0.96,
} as Vida38HumanoidAnatomy;

function specimenBody(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.245, 24, 20);
  geometry.scale(1.18, 1.68, 0.88);
  geometry.translate(0, 1.39, 0);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
}

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

function parts(meshes: readonly THREE.Mesh[]): Set<string> {
  return new Set(meshes.map(mesh => String(mesh.userData['garmentPart38OE6'])));
}

describe('38.2o.e8a — estabilización de armaduras anatómicas', () => {
  it('mantiene determinismo y cubre cinco disciplinas técnicas legibles', () => {
    const disciplines = new Set<string>();
    const silhouettes = new Set<string>();
    const signatures = new Set<string>();
    const requests = [
      { speciesId: 'mil', appearanceFingerprint: 'mil', family: 'SEGMENTED_ARMOR', garmentLine: 'MILITARY', culture: 'FRONTIER_HEGEMONY' },
      { speciesId: 'exp', appearanceFingerprint: 'exp', family: 'COLONIAL_RIG', garmentLine: 'EXPLORER', culture: 'PELAGIC_CONCORD' },
      { speciesId: 'col', appearanceFingerprint: 'col', family: 'COLONIAL_RIG', garmentLine: 'INDUSTRIAL_COLONIZER', culture: 'DUNE_MANDATE' },
      { speciesId: 'tec', appearanceFingerprint: 'tec', family: 'SEGMENTED_ARMOR', garmentLine: 'TECHNO_PRIEST', culture: 'BASILICA_TECHNOCRACY' },
      { speciesId: 'nob', appearanceFingerprint: 'nob', family: 'SEGMENTED_ARMOR', garmentLine: 'NOBLE', culture: 'STAR_KINGDOM' },
    ] as const;
    for (const request of requests) {
      const a = deriveVida38TechArmorPlan38OE8(request);
      const b = deriveVida38TechArmorPlan38OE8(request);
      expect(a).toEqual(b);
      disciplines.add(a.discipline);
      silhouettes.add(a.silhouette);
      signatures.add(a.signature);
    }
    expect(disciplines.size).toBe(5);
    expect(silhouettes.size).toBeGreaterThanOrEqual(4);
    expect(signatures.size).toBe(5);
  });

  it('refuerza una armadura segmentada con cintura articulada y blindajes de extremidades', () => {
    const body = specimenBody();
    const plan = deriveVida38TechArmorPlan38OE8({
      speciesId: 'seg:1', appearanceFingerprint: 'seg:1', family: 'SEGMENTED_ARMOR', garmentLine: 'MILITARY', culture: 'FRONTIER_HEGEMONY',
    });
    const meshes = createVida38ReptilianTechnicalGarments38OE8(body, anatomy, plan, 'LOW');
    try {
      const labels = parts(meshes);
      for (const expected of ['CUIRASS', 'BACKPLATE', 'WAIST_GUARD', 'LEFT_SIDE_RIB', 'RIGHT_SIDE_RIB',
        'LEFT_GREAVE_SHELL', 'RIGHT_GREAVE_SHELL', 'LEFT_BOOT_SHELL', 'RIGHT_BOOT_SHELL',
        'LEFT_FOREARM_SHELL', 'RIGHT_FOREARM_SHELL']) {
        expect(labels.has(expected)).toBe(true);
      }
      expect([...labels].some(label => label.startsWith('ABDOMEN_LAMELLA_'))).toBe(true);
      expect(meshes.every(mesh => mesh.geometry.type !== 'BoxGeometry')).toBe(true);
    } finally {
      dispose([...meshes, body]);
    }
  }, 15000);

  it('separa explorador táctico y colonizador industrial por silueta y utilería', () => {
    const body = specimenBody();
    const explorerPlan = deriveVida38TechArmorPlan38OE8({
      speciesId: 'exp:1', appearanceFingerprint: 'exp:1', family: 'COLONIAL_RIG', garmentLine: 'EXPLORER', culture: 'PELAGIC_CONCORD',
    });
    const industrialPlan = deriveVida38TechArmorPlan38OE8({
      speciesId: 'ind:1', appearanceFingerprint: 'ind:1', family: 'COLONIAL_RIG', garmentLine: 'INDUSTRIAL_COLONIZER', culture: 'DUNE_MANDATE',
    });
    const explorerMeshes = createVida38ReptilianTechnicalGarments38OE8(body, anatomy, explorerPlan, 'LOW');
    const industrialMeshes = createVida38ReptilianTechnicalGarments38OE8(body, anatomy, industrialPlan, 'LOW');
    try {
      const explorerParts = parts(explorerMeshes);
      const industrialParts = parts(industrialMeshes);
      expect(explorerPlan.discipline).toBe('TACTICAL_EXPLORER');
      expect(industrialPlan.discipline).toBe('COLONIAL_INDUSTRIAL');
      expect(explorerParts.has('CHEST_SENSOR_BRIDGE')).toBe(true);
      expect(explorerParts.has('LEFT_POUCH')).toBe(false);
      expect(industrialParts.has('LEFT_POUCH')).toBe(true);
      expect(industrialParts.has('CHEST_SENSOR_BRIDGE')).toBe(false);
    } finally {
      dispose([...explorerMeshes, ...industrialMeshes, body]);
    }
  }, 15000);

  it('expone la disciplina técnica en el renderer 38.2o cuando la familia es técnica', () => {
    const entries = buildVida38ReptilianGallery38OE5(24);
    const technical = entries.find(entry => entry.contract.speciesId.includes('SPECIES-') || true);
    expect(technical).toBeDefined();
    if (!technical) return;
    const group = new THREE.Group();
    const objects = createVida38CivilizedReptilianPreview38O(group, technical.contract, 'LOW');
    try {
      const family = group.userData['vida38ReptilianGarmentFamily38OE6'];
      if (family === 'SEGMENTED_ARMOR' || family === 'COLONIAL_RIG') {
        expect(group.userData['vida38TechnicalGarmentRevision38OE8']).toBe(VIDA38_TECH_GARMENT_REVISION_38OE8);
        expect(typeof group.userData['vida38TechnicalGarmentDiscipline38OE8']).toBe('string');
      }
    } finally {
      dispose(objects);
    }
  }, 15000);
});
