import * as THREE from 'three';
import { describe,expect,it } from 'vitest';
import { buildVida38HumanoidGallery38R } from './vida38-civilized-humanoid-fixtures-38-2r';
import { createVida38CivilizedHumanoidPreview38R } from './vida38-civilized-humanoid-preview-38-2r';
import {
  VIDA38_CIV_HUMANOID_REVISION_38R,deriveVida38CivilHumanoidPlan38R,
  isVida38VeryAdvancedHumanoid38R,
} from './vida38-civilized-humanoid-plan-38-2r';

function release(objects:readonly THREE.Object3D[]):void{
  const geom=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();
  for(const obj of objects){if(!(obj instanceof THREE.Mesh))continue;
    geom.add(obj.geometry);for(const material of Array.isArray(obj.material)?obj.material:[obj.material])mats.add(material);
  }
  for(const g of geom)g.dispose();for(const m of mats)m.dispose();
}

describe('38.2r — civilizaciones humanoides MUY AVANZADAS',()=>{
  const gallery=buildVida38HumanoidGallery38R(24);
  it('exige el contrato VIDA.7 verdadero, sin activar la rama de especies naturales o ADVANCED',()=>{
    const contract=gallery[0]!.contract;
    expect(isVida38VeryAdvancedHumanoid38R(contract)).toBe(true);
    expect(isVida38VeryAdvancedHumanoid38R({...contract,intelligence:{lineage:'HUMANOID',civilizationTier:'ADVANCED'}})).toBe(false);
    expect(isVida38VeryAdvancedHumanoid38R({...contract,intelligence:null})).toBe(false);
    expect(isVida38VeryAdvancedHumanoid38R({...contract,intelligence:{lineage:'REPTILIAN',civilizationTier:'VERY_ADVANCED'}})).toBe(false);
  });
  it('garantiza cobertura de 10 anatomías, 10 vestimentas y 6 culturas incluso en 12 muestras',()=>{
    const entries=buildVida38HumanoidGallery38R(12);
    expect(new Set(entries.map(e=>e.plan.archetype)).size).toBe(10);
    expect(new Set(entries.map(e=>e.plan.garment)).size).toBe(10);
    expect(new Set(entries.map(e=>e.plan.culture)).size).toBe(6);
    expect(new Set(entries.map(e=>e.plan.role)).size).toBe(8);
    expect(new Set(entries.map(e=>e.plan.material)).size).toBe(6);
  });
  it('mantiene reproducibilidad de anatomía, roles, accesorios y materiales',()=>{
    expect(gallery.length).toBe(24);
    const signatures=new Set<string>();
    for(const entry of gallery){
      const a=deriveVida38CivilHumanoidPlan38R(entry.contract);
      const b=deriveVida38CivilHumanoidPlan38R(entry.contract);
      expect(a).toEqual(b);expect(a.revision).toBe(VIDA38_CIV_HUMANOID_REVISION_38R);
      expect(a.speciesId).toBe(entry.contract.speciesId);
      signatures.add(a.signature);
    }
    expect(signatures.size).toBe(24);
  });
  it('crea un cuerpo orgánico SDF continuo con vestuario tecnológico, sin sustitución por cajas',()=>{
    const e=gallery.find(e=>e.plan.garment==='TECH_SUIT')!;
    const subject=new THREE.Group();
    const created=createVida38CivilizedHumanoidPreview38R(subject,e.contract,'LOW');
    try{
      expect(subject.userData['civilizedRenderer38R']).toBe('HUMANOID');
      expect(created.filter(o=>o.userData['civHumPart38R']==='CONTINUOUS_BODY')).toHaveLength(1);
      expect(created.some(o=>o.userData['civHumPart38R']==='TECH_GARMENT')).toBe(true);
      const body=created.find(o=>o.userData['civHumPart38R']==='CONTINUOUS_BODY') as THREE.Mesh;
      const geo=body.geometry as THREE.BufferGeometry;
      expect(geo.getAttribute('position').count).toBeGreaterThan(1500);
      expect(geo.index?.count).toBeGreaterThan(3000);
      for(const o of created){if(!(o instanceof THREE.Mesh))continue;
        const pos=o.geometry.getAttribute('position') as THREE.BufferAttribute;
        if(!pos)continue;
        for(let i=0;i<pos.count;i+=37){expect(Number.isFinite(pos.getX(i))).toBe(true);expect(Number.isFinite(pos.getY(i))).toBe(true);}}
    }finally{release(created);}
  },15000);
  it('los tejidos ceremoniales tienen superficie continua, reverso y volumen de faldón',()=>{
    const e=gallery.find(e=>e.plan.garment==='CEREMONIAL_TUNIC')!;
    const subject=new THREE.Group();
    const created=createVida38CivilizedHumanoidPreview38R(subject,e.contract,'LOW');
    try{
      const textile=created.find(o=>o.userData['civHumPart38R']==='SOFT_GARMENT') as THREE.Mesh|undefined;
      expect(textile).toBeDefined();
      if(textile){const g=textile.geometry as THREE.BufferGeometry;
        expect(g.index?.count).toBeGreaterThan(1500);
        expect(textile.userData['draperyTopology38R']).toBe('CONTINUOUS');
        const box=new THREE.Box3().setFromBufferAttribute(g.getAttribute('position') as THREE.BufferAttribute);
        expect(box.max.y-box.min.y).toBeGreaterThan(.35);
        expect(box.max.z-box.min.z).toBeGreaterThan(.28);
      }
    }finally{release(created);}
  },15000);
});
