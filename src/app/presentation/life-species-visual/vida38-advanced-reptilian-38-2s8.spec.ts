import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { deriveVida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { deriveVida38AdvancedReptilianDesign38S8, deriveVida38AdvancedReptilianCranialEnvelope38S8,
  VIDA38_ADV_REPT_STYLES_38S8, VIDA38_ADV_REPT_DIVERSITY_REVISION_38S8 } from './vida38-advanced-reptilian-diversity-38-2s8';

const gallery=buildVida38AdvancedReptilianGallery38S(24);

describe('38.2s8 — diversidad de ropa avanzada y cascos adaptados al cráneo reptiliano',()=>{
  it('incluye diez familias reconocibles, con distribución por cultura y rol, sin aleatoriedad temporal',()=>{
    const styles=new Set<string>();const signatures=new Set<string>();const helmets=new Set<string>();
    for(const entry of gallery){
      const design=deriveVida38AdvancedReptilianDesign38S8(entry.plan);
      expect(design).toEqual(deriveVida38AdvancedReptilianDesign38S8(entry.plan));
      styles.add(design.style);signatures.add(design.signature);helmets.add(design.helmet);
    }
    expect(styles.size).toBe(VIDA38_ADV_REPT_STYLES_38S8.length);
    expect(signatures.size).toBe(gallery.length);
    expect(styles).toContain('EVA_PRESSURE');
    expect(styles).toContain('FLIGHT_CREW');
    expect(styles).toContain('FIELD_RESEARCH');
    expect(styles).toContain('MEDICAL_RESPONSE');
    expect(helmets).toContain('EVA_TRANSPARENT');
    expect(helmets).toContain('PRESSURE_HOOD');
  });

  it('el visor y la galería obtienen realmente las nuevas mallas, sin tocar VERY_ADVANCED',()=>{
    const selected=['PILOT','SCIENTIST','SECURITY','SCHOLAR'] as const;
    for(const role of selected){
      const entry=gallery.find(e=>e.plan.role===role);
      expect(entry).toBeDefined();if(!entry)continue;
      const model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
      try{
        expect(model.subject.userData['vida38AdvancedReptilianDiversity38S8'])
          .toBe(VIDA38_ADV_REPT_DIVERSITY_REVISION_38S8);
        const added:THREE.Object3D[]=[];
        model.subject.traverse(o=>{
          if(o.userData['vida38AdvancedReptilianDiversity38S8']===VIDA38_ADV_REPT_DIVERSITY_REVISION_38S8)added.push(o);
        });
        expect(added.length).toBeGreaterThanOrEqual(4);
        expect(added.some(o=>o.name.startsWith('VIDA38_S8_OUTER_'))).toBe(true);
        for(const piece of added){
          if(!(piece instanceof THREE.Mesh))continue;
          const pos=piece.geometry.getAttribute('position');
          for(let k=0;k<pos.count;k+=Math.max(1,Math.floor(pos.count/30))){
            expect(Number.isFinite(pos.getX(k))).toBe(true);
            expect(Number.isFinite(pos.getY(k))).toBe(true);
            expect(Number.isFinite(pos.getZ(k))).toBe(true);
          }
        }
        if(role==='PILOT'){
          expect(added.some(o=>o.name.startsWith('VIDA38_S8_HELMET_'))).toBe(true);
          expect(model.subject.children.filter(o=>o.name==='VIDA38_S4_PRESSURE_HELMET'||o.name==='VIDA38_S7_ACCESSORY_SPACE_HELMET')
            .every(o=>o.visible===false)).toBe(true);
        }
      } finally{model.dispose();}
    }
  },60_000);

  it('la escafandra EVA cerrada contiene los vértices cefálicos realmente deformados',()=>{
    const entry=gallery.find(e=>deriveVida38AdvancedReptilianDesign38S8(e.plan).style==='EVA_PRESSURE');
    expect(entry).toBeDefined();if(!entry)return;
    const model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
    try{
      const body=model.subject.children.find((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&o.name==='VIDA38_2OD_REPTILIAN_BODY');
      expect(body).toBeDefined();if(!body)return;
      const anatomy=deriveVida38HumanoidAnatomy({...entry.contract,morphology:{...entry.contract.morphology,
        group:'HUMANOIDS',bodyPlan:'BIPED',covering:'SCALES',appendagePairs:2},locomotion:'WALKING'});
      const envelope=deriveVida38AdvancedReptilianCranialEnvelope38S8(body,anatomy);
      expect(envelope.sampledVertices).toBeGreaterThan(40);
      const [cx,cy,cz]=envelope.center,[rx,ry,rz]=envelope.radius;
      const eyeY=anatomy.legLength+(1.18+(anatomy.neckLength-1)*.14)*anatomy.torsoLength;
      const headStart=eyeY-Math.max(anatomy.headHeight*.70,.17);
      const positions=body.geometry.getAttribute('position');
      let maxRadius=0;
      for(let i=0;i<positions.count;i++){
        const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
        if(y<headStart)continue;
        maxRadius=Math.max(maxRadius,Math.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2+((z-cz)/rz)**2));
      }
      expect(maxRadius).toBeLessThan(.97);
      const dome=model.subject.children.find(o=>o.name==='VIDA38_S8_HELMET_CLOSED_GLASS_DOME');
      expect(dome).toBeDefined();
    }finally{model.dispose();}
  },60_000);

  it('no activa el vestuario 38.2s8 en los tres linajes VERY_ADVANCED',()=>{
    for(const lineage of ['REPTILIAN','INSECTOID','HUMANOID'] as const){
      const entry=gallery[0]!;
      const model=createVida38SpeciesPreviewModelV1({...entry.contract,intelligence:{lineage,civilizationTier:'VERY_ADVANCED'}},
        {humanoidQuality:'LOW'});
      try{
        expect(model.subject.userData['vida38AdvancedReptilianDiversity38S8']).toBeUndefined();
        expect(model.subject.children.some(o=>o.name.startsWith('VIDA38_S8_'))).toBe(false);
      }finally{model.dispose();}
    }
  },60_000);
});
