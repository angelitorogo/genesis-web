import { resolveVida38ReptilianTestEntry38S8C } from './vida38-reptilian-test-fixtures-38-2s8c';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  createVida38ReptilianTailoredShell38OE7C,
  createVida38ReptilianOrganicGarments38OE7C,
  deriveVida38OrganicGarmentFit38OE7C,
  type Vida38SoftGarmentGeometryStats38OE7C,
} from './vida38-reptilian-organic-garments-38-2oe7c';
import { deriveVida38OrganicGarmentPlan38OE7B } from './vida38-reptilian-organic-garments-38-2oe7b';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';

const anatomy = { legLength: 1.04, torsoLength: 0.73, shoulderWidth: 0.31, hipWidth: 0.235 } as Vida38HumanoidAnatomy;
function body(): THREE.Mesh {
  const g = new THREE.SphereGeometry(0.235, 20, 20);
  g.scale(1.05, 1.70, 0.86);
  g.translate(0, 1.35, 0);
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial());
}
function plan(id: string, family: string, line: string, culture: string) {
  return deriveVida38OrganicGarmentPlan38OE7B({
    speciesId: id, appearanceFingerprint: `e7c:${id}`,
    garmentFamily: family, garmentLine: line, culture,
    primaryColor: '#101b28', accentColor: '#62ddc5',
  });
}
function dispose(objects: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const object of objects) {
    if (!(object instanceof THREE.Mesh)) continue;
    geometries.add(object.geometry);
    for (const m of Array.isArray(object.material) ? object.material : [object.material]) materials.add(m);
  }
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
}
function edgeCounts(geometry: THREE.BufferGeometry): { holes: number; nonmanifold: number } {
  const index = geometry.getIndex();
  expect(index).not.toBeNull();
  const counts = new Map<string, number>();
  for (let i=0;i<index!.count;i+=3) {
    const a=index!.getX(i),b=index!.getX(i+1),c=index!.getX(i+2);
    for (const [u,v] of [[a,b],[b,c],[c,a]]) {
      const key = `${Math.min(u,v)}:${Math.max(u,v)}`;
      counts.set(key,(counts.get(key)??0)+1);
    }
  }
  return { holes:[...counts.values()].filter(v=>v===1).length,
    nonmanifold:[...counts.values()].filter(v=>v>2).length };
}

describe('38.2o.e7c — integración anatómica final de prendas blandas', () => {
  it('recorta una abertura caudal de contorno cerrado, sin celdas rectangulares', () => {
    const specimen = body();
    const robePlan = plan('e7c:anatomical-tail','CEREMONIAL_ROBES','TECHNO_PRIEST','BASILICA_TECHNOCRACY');
    const first = createVida38ReptilianTailoredShell38OE7C(specimen, anatomy, robePlan);
    const second = createVida38ReptilianTailoredShell38OE7C(specimen, anatomy, robePlan);
    try {
      const fit = deriveVida38OrganicGarmentFit38OE7C(specimen,anatomy,robePlan);
      const stats = first.userData['garmentStats38OE7C'] as Vida38SoftGarmentGeometryStats38OE7C;
      expect(fit).toEqual(deriveVida38OrganicGarmentFit38OE7C(specimen,anatomy,robePlan));
      expect(['OVAL','TEARDROP','REINFORCED_SLIT']).toContain(fit.opening);
      expect(stats.tailOpeningLoop).toBe(true);
      expect(stats.tailOpeningEdges).toBeGreaterThan(12);
      expect(stats.vertices).toBeGreaterThan(3500);
      expect(stats.frontAndBack).toBe(true);
      expect(stats.openBoundaryEdges).toBe(0);
      expect(stats.nonManifoldEdges).toBe(0);
      const topology = edgeCounts(first.geometry);
      expect(topology.holes).toBe(0);
      expect(topology.nonmanifold).toBe(0);
      const firstPositions=first.geometry.getAttribute('position');
      const secondPositions=second.geometry.getAttribute('position');
      expect(firstPositions.count).toBe(secondPositions.count);
      for(let i=0;i<firstPositions.count;i++){
        expect(firstPositions.getX(i)).toBe(secondPositions.getX(i));
        expect(firstPositions.getY(i)).toBe(secondPositions.getY(i));
        expect(firstPositions.getZ(i)).toBe(secondPositions.getZ(i));
      }
    } finally { dispose([first,second,specimen]); }
  },15000);

  it('construye siluetas distintas para las cinco familias blandas, con ropa dorsal curvada', () => {
    const specimen=body();
    const families = [
      ['CEREMONIAL_ROBES','SCIENTIST','DUNE_MANDATE'],
      ['CEREMONIAL_ROBES','TECHNO_PRIEST','BASILICA_TECHNOCRACY'],
      ['NOBLE_REGALIA','NOBLE','STAR_KINGDOM'],
      ['COLONIAL_RIG','INDUSTRIAL_COLONIZER','FRONTIER_HEGEMONY'],
      ['PELAGIC_DRAPE','EXPLORER','PELAGIC_CONCORD'],
    ] as const;
    const silhouettes=new Set<string>();
    for (const [family,line,culture] of families) {
      const garments=createVida38ReptilianOrganicGarments38OE7C(specimen,anatomy,plan(`e7c:${culture}`,family,line,culture),'LOW');
      try {
        const shell=garments[0]!;
        const stats=shell.userData['garmentStats38OE7C'] as Vida38SoftGarmentGeometryStats38OE7C;
        silhouettes.add(stats.silhouette);
        expect(garments.some(m=>m.userData['garmentGeomKind38OE7C']==='ANATOMICAL_EDGE_BINDING')).toBe(true);
        expect(garments.some(m=>m.userData['garmentGeomKind38OE7C']==='CONFORMAL_DORSAL_DRAPE') || family==='CEREMONIAL_ROBES').toBe(true);
        expect(garments.every(m=>m.name==='VIDA38_2OD_REPTILIAN_GARMENT')).toBe(true);
        expect(garments.every(m=>m.userData['garmentRefinement38OE7C']===true)).toBe(true);
      } finally { dispose(garments); }
    }
    expect(silhouettes.size).toBe(5);
    dispose([specimen]);
  },15000);

  it('integra el nuevo motor en un espécimen real del laboratorio sin alterar el renderer técnico', () => {
    const entry = resolveVida38ReptilianTestEntry38S8C(7);
    expect(entry).toBeDefined();
    const subject=new THREE.Group();
    const created=createVida38CivilizedReptilianPreview38O(subject,entry!.contract,'LOW');
    try {
      expect(subject.userData['vida38OrganicGarmentRevision38OE7C']).toBe('VIDA.38.2o.e7c');
      const garmentMeshes=created.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&o.name==='VIDA38_2OD_REPTILIAN_GARMENT');
      expect(garmentMeshes.some(o=>o.userData['garmentGeomKind38OE7C']==='ANATOMIC_CONTINUOUS_SHELL')).toBe(true);
      expect(garmentMeshes.some(o=>String(o.userData['garmentPart38OE6']).includes('TAIL_OUTLET_BINDING'))).toBe(true);
    } finally { dispose(created); }
  },15000);
});
