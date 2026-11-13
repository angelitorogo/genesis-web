import { resolveVida38ReptilianTestEntry38S8C } from './vida38-reptilian-test-fixtures-38-2s8c';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
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

function params(id: string, family: 'SEGMENTED_ARMOR' | 'COLONIAL_RIG',
  culture = 'FRONTIER_HEGEMONY', garmentLine?: string) {
  return {speciesId: id, appearanceFingerprint:`oe8:${id}`,family,
    garmentLine: garmentLine ?? (family==='SEGMENTED_ARMOR'?'MILITARY':'INDUSTRIAL_COLONIZER'),culture};
}

function dispose(objects: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const object of objects) {
    if (!(object instanceof THREE.Mesh)) continue;
    geometries.add(object.geometry);
    for (const m of Array.isArray(object.material)?object.material:[object.material]) materials.add(m);
  }
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
}

function parts(meshes: readonly THREE.Mesh[]): Set<string> {
  return new Set(meshes.map(mesh=>String(mesh.userData['garmentPart38OE6'])));
}

describe('38.2o.e8 — armaduras y prendas técnicas anatómicas', () => {
  it('mantiene selección determinista y genera diversidad de materiales/siluetas', () => {
    const first = deriveVida38TechArmorPlan38OE8(params('oe8:repeat','SEGMENTED_ARMOR'));
    expect(deriveVida38TechArmorPlan38OE8(params('oe8:repeat','SEGMENTED_ARMOR'))).toEqual(first);
    const signatures=new Set<string>();
    const materials=new Set<string>();
    const silhouettes=new Set<string>();
    const cultures=['STAR_KINGDOM','BASILICA_TECHNOCRACY','FRONTIER_HEGEMONY','PELAGIC_CONCORD','DUNE_MANDATE','OBSIDIAN_CLAN'];
    // 38.2o.e8a asigna la silueta según DISCIPLINA, no solo según familia.
    // El muestreo antiguo usaba exclusivamente MILITARY e INDUSTRIAL_COLONIZER:
    // nunca daba a COLONIAL_RIG un explorador táctico, y perdía FIELD_EXPLORER.
    const disciplines = [
      {family:'SEGMENTED_ARMOR', garmentLine:'MILITARY'},
      {family:'SEGMENTED_ARMOR', garmentLine:'TECHNO_PRIEST'},
      {family:'COLONIAL_RIG', garmentLine:'INDUSTRIAL_COLONIZER'},
      {family:'COLONIAL_RIG', garmentLine:'EXPLORER'},
    ] as const;
    for(const {family, garmentLine} of disciplines){
      for(const culture of cultures){
        for(let i=0;i<16;i++){
          const id=`oe8:spec:${family}:${garmentLine}:${culture}:${i}`;
          const plan=deriveVida38TechArmorPlan38OE8(params(id,family,culture,garmentLine));
          signatures.add(plan.signature);materials.add(plan.materialKind);silhouettes.add(plan.silhouette);
        }
      }
    }
    expect(signatures.size).toBeGreaterThanOrEqual(30);
    expect(materials.size).toBe(3);
    expect(silhouettes.size).toBe(4);
  });

  it('construye coraza segmentada, espalda, hombreras curvas y calzado conformal sin BoxGeometry', () => {
    const body=specimenBody();
    const plan=deriveVida38TechArmorPlan38OE8(params('oe8:armor','SEGMENTED_ARMOR'));
    const meshes=createVida38ReptilianTechnicalGarments38OE8(body,anatomy,plan,'LOW');
    try{
      const labels=parts(meshes);
      for(const expected of ['CUIRASS','BACKPLATE','LEFT_PAULDRON','RIGHT_PAULDRON',
        'TECHNICAL_UNDERSUIT','ARM_GUARDS_GREAVES_BOOTS']) {
        expect(labels.has(expected)).toBe(true);
      }
      expect([...labels].filter(x=>x.startsWith('ABDOMEN_LAMELLA_')).length).toBe(plan.plateCount);
      expect(meshes.every(mesh=>mesh.name==='VIDA38_2OD_REPTILIAN_GARMENT')).toBe(true);
      expect(meshes.every(mesh=>mesh.userData['garmentRevision38OE8']===VIDA38_TECH_GARMENT_REVISION_38OE8)).toBe(true);
      expect(meshes.some(mesh=>mesh.userData['armorSurfaceFit38OE8']==='EXACT_BODY_SDF')).toBe(true);
      for(const mesh of meshes){
        expect(mesh.geometry.type).not.toBe('BoxGeometry');
        expect(mesh.geometry.getAttribute('position').count).toBeGreaterThan(20);
        const attr=mesh.geometry.getAttribute('position');
        for(let i=0;i<attr.count;i++){
          expect(Number.isFinite(attr.getX(i))).toBe(true);
          expect(Number.isFinite(attr.getY(i))).toBe(true);
          expect(Number.isFinite(attr.getZ(i))).toBe(true);
        }
      }
      const shell=meshes.find(mesh=>mesh.userData['garmentPart38OE6']==='CUIRASS')!;
      expect(shell.userData['armorSealedThickness38OE8']).toBeGreaterThan(0);
      expect(shell.geometry.getIndex()).not.toBeNull();
    }finally{dispose([...meshes,body]);}
  },60_000);

  it('construye vestimenta industrial anatómica distinta de una armadura militar', () => {
    const body=specimenBody();
    const plan=deriveVida38TechArmorPlan38OE8(params('oe8:colonial','COLONIAL_RIG','DUNE_MANDATE'));
    const meshes=createVida38ReptilianTechnicalGarments38OE8(body,anatomy,plan,'LOW');
    try{
      const names=parts(meshes);
      for(const item of ['UTILITY_VEST','DORSAL_TECH_FRAME','HARNESS_LEFT','HARNESS_RIGHT',
        'UTILITY_BELT','ARM_GUARDS_GREAVES_BOOTS'])expect(names.has(item)).toBe(true);
      expect(names.has('CUIRASS')).toBe(false);
      expect(plan.silhouette.startsWith('INDUSTRIAL_')||plan.silhouette.startsWith('FIELD_')).toBe(true);
      expect(meshes.every(mesh=>mesh.geometry.type!=='BoxGeometry')).toBe(true);
    } finally{dispose([...meshes,body]);}
  },60_000);

  it('reutiliza el renderer 38.2o de laboratorio para un ejemplar blindado', () => {
    const entry=resolveVida38ReptilianTestEntry38S8C(35);
    expect(entry).toBeDefined();
    if(!entry)return;
    const group=new THREE.Group();
    const objects=createVida38CivilizedReptilianPreview38O(group,entry.contract,'LOW');
    try{
      // Si el selector cultural de este ejemplar le da armadura, el nuevo
      // renderer debe integrar el plan; en otras familias no debe hacerlo.
      const family=group.userData['vida38ReptilianGarmentFamily38OE6'];
      if(family==='SEGMENTED_ARMOR'||family==='COLONIAL_RIG'){
        expect(group.userData['vida38TechnicalGarmentRevision38OE8']).toBe(VIDA38_TECH_GARMENT_REVISION_38OE8);
        expect(objects.some(o=>o.userData['garmentGeom38OE8']==='ANATOMICAL_CURVED_PLATE')).toBe(true);
      }else{
        expect(group.userData['vida38TechnicalGarmentRevision38OE8']).toBeUndefined();
      }
      expect(group.userData['vida38IntegratedSdfTail38OD5']).toBe(true);
      expect(group.userData['vida38ReptilianOrbitalGlobe38OE4']).toBe(true);
    }finally{dispose(objects);}
  },60_000);
});
