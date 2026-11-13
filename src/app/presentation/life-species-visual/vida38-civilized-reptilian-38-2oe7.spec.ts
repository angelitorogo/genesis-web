import { findVida38ReptilianTestEntry38S8C } from './vida38-reptilian-test-fixtures-38-2s8c';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import { buildVida38ReptilianGallery38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';

/**
 * 38.2o.e7a — la galería solo admite 12 | 24. No construir 48 cuerpos SDF
 * completos para comprobar propiedades geométricas de cuatro muestras.
 * Las identidades 7/2/17/18 son muestras reproducibles del laboratorio 38.2o.e5.
 */
const gallery = buildVida38ReptilianGallery38OE5(24);

function previewGallerySpecimen(ordinal: number): {
  subject: THREE.Group;
  created: THREE.Object3D[];
} {
  const entry = gallery.find((candidate) => candidate.ordinal === ordinal)
    ?? findVida38ReptilianTestEntry38S8C(candidate => candidate.ordinal === ordinal, `ordinal ${ordinal}`);
  if (!entry) throw new Error(`La muestra ${ordinal} no existe en la galería reproducible 38.2o.e5`);
  const subject = new THREE.Group();
  const created = createVida38CivilizedReptilianPreview38O(subject, entry.contract, 'LOW');
  return { subject, created };
}

function disposeObjects(created: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const object of created) {
    if (!(object instanceof THREE.Mesh)) continue;
    if (object.geometry) geometries.add(object.geometry);
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    for (const mat of mats) if (mat) materials.add(mat);
  }
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

describe('38.2o.e7 — motor geométrico de vestimenta orgánica', () => {
  it('genera mallas continuas de prendas en túnicas y mantos, con cobertura de ambas familias', () => {
    const expected = [
      { ordinal: 7, family: 'CEREMONIAL_ROBES' },
      { ordinal: 2, family: 'NOBLE_REGALIA' },
    ] as const;
    let denseOrganicMeshes = 0;

    for (const sample of expected) {
      const { subject, created } = previewGallerySpecimen(sample.ordinal);
      try {
        expect(subject.userData['vida38ReptilianGarmentFamily38OE6']).toBe(sample.family);
        for (const object of created) {
          if (!(object instanceof THREE.Mesh) || !object.userData['garmentGeom38OE7']) continue;
          const positions = (object.geometry as THREE.BufferGeometry).getAttribute('position');
          if (positions && positions.count >= 80) denseOrganicMeshes++;
        }
      } finally {
        disposeObjects(created);
      }
    }

    expect(denseOrganicMeshes).toBeGreaterThanOrEqual(6);
  }, 60_000);

  it('aplica tejidos orgánicos culturales a BASILICA_TECHNOCRACY y PELAGIC_CONCORD', () => {
    const samples = [
      { ordinal: 17, culture: 'BASILICA_TECHNOCRACY', prefix: 'BASILICA_' },
      { ordinal: 18, culture: 'PELAGIC_CONCORD', prefix: 'PELAGIC_' },
    ] as const;

    for (const sample of samples) {
      const { subject, created } = previewGallerySpecimen(sample.ordinal);
      try {
        expect(subject.userData['vida38ReptilianCulture38OE']).toBe(sample.culture);
        const organicCulturePart = created.some((object) =>
          object instanceof THREE.Mesh
          && object.userData['garmentGeom38OE7'] === true
          && String(object.userData['garmentPart38OE6'] ?? '').startsWith(sample.prefix),
        );
        expect(organicCulturePart).toBe(true);
      } finally {
        disposeObjects(created);
      }
    }
  }, 60_000);
});
