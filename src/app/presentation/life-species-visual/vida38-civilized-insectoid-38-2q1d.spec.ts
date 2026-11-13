import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { createVida38CivilizedInsectoidPreview38Q, deriveVida38CivilizedInsectoidPlan38Q } from './vida38-civilized-insectoid-preview-38-2q';
import {
  VIDA38_INSECTOID_OCULAR_COXAL_REVISION_38Q1D,
  VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D,
  deriveVida38InsectoidDarkEyePlan38Q1D,
  deriveVida38InsectoidCoxalFrame38Q1D,
  buildVida38InsectoidPelvis38Q1D,
  buildVida38InsectoidCoxalScute38Q1D,
} from './vida38-civilized-insectoid-ocular-coxal-38-2q1d';

function dispose(objects: readonly THREE.Object3D[]): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  for (const obj of objects) {
    if (!(obj instanceof THREE.Mesh)) continue;
    geometries.add(obj.geometry);
    for (const m of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(m);
  }
  for (const g of geometries) g.dispose();
  for (const m of materials) m.dispose();
}

describe('38.2q1d — ojos compuestos oscuros y continuidad pelvis/coxa', () => {
  const entries = buildVida38InsectoidGallery38Q(24);

  it('limita la paleta ocular a negros, grafitos y obsidianas deterministas', () => {
    const colors = new Set<string>();
    for (const entry of entries) {
      const a = deriveVida38InsectoidDarkEyePlan38Q1D(entry.plan);
      const b = deriveVida38InsectoidDarkEyePlan38Q1D(deriveVida38CivilizedInsectoidPlan38Q(entry.contract));
      expect(a).toEqual(b);
      expect(VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D).toContain(a.baseHex);
      const color = new THREE.Color(a.baseHex);
      expect(color.getHSL({h:0,s:0,l:0}).l).toBeLessThan(.014);
      expect(a.roughness).toBeGreaterThanOrEqual(.40);
      expect(a.roughness).toBeLessThanOrEqual(.52);
      expect(a.signature).toBeTruthy();
      colors.add(a.baseHex);
    }
    expect(colors.size).toBeGreaterThanOrEqual(3);
  });

  it('sitúa ambas raíces coxales dentro del volumen pélvico en especies robustas y delgadas', () => {
    for (const entry of entries) {
      const frames = [-1, 1].map(side => deriveVida38InsectoidCoxalFrame38Q1D(entry.plan, side as -1|1));
      expect(frames[0]!.inside.x).toBeLessThan(0);
      expect(frames[1]!.inside.x).toBeGreaterThan(0);
      for (const frame of frames) {
        expect(frame.embedDepth).toBeGreaterThan(.045);
        expect(frame.embedDepth).toBeLessThan(.17);
        expect(Math.abs(frame.exit.x)).toBeGreaterThan(Math.abs(frame.inside.x));
        expect(frame.exit.distanceTo(frame.femurStart)).toBeLessThan(.005);
        expect(frame.inside.y).toBeGreaterThan(frame.exit.y);
        expect(frame.pelvisSurfaceX).toBeGreaterThan(Math.abs(frame.inside.x));
      }
    }
  });

  it('construye una transición abdominal continua y dos placas conformadas', () => {
    const specimens = entries.filter(entry => entry.plan.archetype === 'BEETLE_BASTION'
      || entry.plan.archetype === 'MOTH_ORACLE' || entry.plan.archetype === 'STICK_SCHOLAR').slice(0,3);
    expect(specimens.length).toBe(3);
    for (const specimen of specimens) {
      const pelvis = buildVida38InsectoidPelvis38Q1D(specimen.plan,'LOW');
      const left = buildVida38InsectoidCoxalScute38Q1D(specimen.plan,-1,'LOW');
      const right = buildVida38InsectoidCoxalScute38Q1D(specimen.plan,1,'LOW');
      try {
        const position = pelvis.geometry.getAttribute('position') as THREE.BufferAttribute;
        expect(position.count).toBeGreaterThan(800);
        expect(pelvis.geometry.index!.count).toBeGreaterThan(4000);
        const box = new THREE.Box3().setFromObject(pelvis);
        expect(box.min.y).toBeLessThan(.85);
        expect(box.max.y).toBeGreaterThan(1.24);
        expect(box.min.x).toBeLessThan(-.20);
        expect(box.max.x).toBeGreaterThan(.20);
        expect(left.userData['vida38CoxalScuteSide38Q1D']).toBe(-1);
        expect(right.userData['vida38CoxalScuteSide38Q1D']).toBe(1);
      } finally { dispose([pelvis,left,right]); }
    }
  }, 15000);

  it('renderiza ojos compuestos y ocelos oscuros con ambas coxas y sin perder los brazos/alas', () => {
    const withOcelli = entries.find(entry => entry.plan.extraEyes > 0 && entry.plan.wingPairs > 0);
    expect(withOcelli).toBeDefined();
    if (!withOcelli) return;
    const root = new THREE.Group();
    const created = createVida38CivilizedInsectoidPreview38Q(root,withOcelli.contract,'LOW');
    try {
      expect(root.userData['vida38InsectoidOcularCoxalRevision38Q1D']).toBe(VIDA38_INSECTOID_OCULAR_COXAL_REVISION_38Q1D);
      expect(created.filter(obj => obj.userData['civInsectoidPart38Q'] === 'PELVIS')).toHaveLength(1);
      expect(created.filter(obj => obj.userData['civInsectoidPart38Q'] === 'COXAL_SCUTE')).toHaveLength(2);
      const coxae = created.filter(obj => obj.userData['vida38CoxalEmbedded38Q1D']);
      expect(coxae).toHaveLength(2);
      expect(coxae.every(obj => Number(obj.userData['vida38CoxalEmbedDepth38Q1D']) > .045)).toBe(true);
      const compound = created.filter(obj => obj.userData['civInsectoidPart38Q'] === 'COMPOUND_EYE');
      const simple = created.filter(obj => obj.userData['civInsectoidPart38Q'] === 'AUX_EYE');
      expect(compound).toHaveLength(2);
      expect(simple).toHaveLength(withOcelli.plan.extraEyes);
      for (const obj of [...compound,...simple]) {
        expect(typeof obj.userData['vida38InsectoidDarkEyeHex38Q1D']).toBe('string');
        const material = (obj as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
        expect(material.emissiveIntensity).toBe(0);
      }
      for (const obj of compound) {
        const position = (obj as THREE.Mesh).geometry.getAttribute('color') as THREE.BufferAttribute;
        let maximum = 0;
        for(let i=0;i<position.count;i++)maximum=Math.max(maximum,position.getX(i),position.getY(i),position.getZ(i));
        expect(maximum).toBeLessThan(.05); // componentes lineales, no colores neón
      }
      expect(created.filter(obj => obj.userData['civInsectoidPart38Q'] === 'ARM')).toHaveLength(withOcelli.plan.armCount*2);
      expect(created.filter(obj => obj.userData['civInsectoidPart38Q'] === 'WING')).toHaveLength(withOcelli.plan.wingPairs*2);
    } finally { dispose(created); }
  },15000);
});
