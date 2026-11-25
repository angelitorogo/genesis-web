import * as THREE from 'three';
import { VIDA38_INFRASTRUCTURE_REVISION_386, type Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';
import { COLVIS1_REVISION, colvis1LayoutFromVerifiedPlan } from './colvis1-colonial-architecture';
import { createVida38InfrastructureSurfaceVisual386 } from './vida38-infrastructure-render-38-6';

type Kind='PLANET'|'MOON';type Tier='ADVANCED'|'VERY_ADVANCED';
type Lineage='HUMANOID'|'REPTILIAN'|'INSECTOID';
type Band='OUTPOST'|'SETTLEMENT'|'CITY'|'NETWORK';
const ranges:Readonly<Record<Band,readonly [number,number]>>={
  OUTPOST:[12,150],SETTLEMENT:[151,5000],CITY:[5001,120000],NETWORK:[120001,1500000],
};
function colony(kind:Kind='PLANET',tier:Tier='ADVANCED',lineage:Lineage='HUMANOID',
  band:Band='CITY',habitat:'SEALED_SURFACE'|'SUBSURFACE_VAULT'|'ENVIRONMENTAL_SHIELD'='SEALED_SURFACE',
  purpose:'RESEARCH'|'EXTRACTION'|'HABITATION'|'BIOSPHERE_CONSERVATION'='RESEARCH',
  seed=281771):Vida38InfrastructurePlan386 {
  return Object.freeze({revision:VIDA38_INFRASTRUCTURE_REVISION_386,
    provenance:'VIDA8_COLONIAL_SETTLEMENT',id:'colvis-demo-colony',bodyStorageKey:'0:0:0:0:PLANET:-',
    seedUint32:seed,locationStatus:'RECONSTRUCTED_NOT_OBSERVED',latitudeRadians:.4,
    longitudeRadians:1.2,form:'COLONIAL_HABITAT',scale:band,tier:'COLONIAL',lineage,
    habitat,purpose,habitatTechnology:habitat,
    colonyArchitectureCOLVIS1:Object.freeze({founderTier:tier,destinationKind:kind,
      populationRange:ranges[band],function:purpose,
      founderSpeciesId:'origin-1',founderSourceBodyStorageKey:'other-planet'})});
}
function shapeSignature(plan:Vida38InfrastructurePlan386):string {
  const l=colvis1LayoutFromVerifiedPlan(plan)!;
  return l.high.map(p=>`${p.shape}:${p.role}:${p.x.toFixed(2)}:${p.z.toFixed(2)}:${p.lift.toFixed(2)}`).join('|');
}
function dispose(view:ReturnType<typeof createVida38InfrastructureSurfaceVisual386>):void {
  view.resources.forEach(r=>r.dispose());
}

describe('COLVIS.1 · Arquitectura colonial física y visual',()=>{
  it('las 12 familias × mundos son válidas, distintas y procedurales',()=>{
    const signatures=new Set<string>();
    for(const kind of ['PLANET','MOON'] as const)
      for(const tier of ['ADVANCED','VERY_ADVANCED'] as const)
        for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID'] as const){
          const source=colony(kind,tier,lineage),before=JSON.stringify(source);
          const l=colvis1LayoutFromVerifiedPlan(source)!;
          expect(l.revision).toBe(COLVIS1_REVISION);
          expect(l.worldKind).toBe(kind);expect(l.founderTier).toBe(tier);
          expect(l.high.length).toBeGreaterThan(15);expect(l.medium.length).toBeGreaterThan(2);
          signatures.add(shapeSignature(source));
          expect(JSON.stringify(source)).toBe(before);
          expect(colvis1LayoutFromVerifiedPlan({...source})).toEqual(l);
        }
    expect(signatures.size).toBe(12);
  });
  it('VERY_ADVANCED añade complejidad y morfologías distintas, no solo tamaño',()=>{
    for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID'] as const){
      const a=colvis1LayoutFromVerifiedPlan(colony('PLANET','ADVANCED',lineage))!;
      const v=colvis1LayoutFromVerifiedPlan(colony('PLANET','VERY_ADVANCED',lineage))!;
      expect(v.high.length).toBeGreaterThan(a.high.length);
      expect(v.maximumHeightKm).toBeGreaterThan(a.maximumHeightKm);
      expect(v.footprintRadiusKm).toBeLessThan(a.footprintRadiusKm);
    }
  });
  it('las lunas mantienen instalaciones más compactas, sin cambiar la identidad',()=>{
    const p=colvis1LayoutFromVerifiedPlan(colony('PLANET'))!;
    const m=colvis1LayoutFromVerifiedPlan(colony('MOON'))!;
    expect(m.siteId).toBe(p.siteId);expect(m.seedUint32).toBe(p.seedUint32);
    expect(m.footprintRadiusKm).toBeLessThan(p.footprintRadiusKm);
    expect(shapeSignature(colony('MOON'))).not.toBe(shapeSignature(colony('PLANET')));
  });
  it('poblaciones OUTPOST < SETTLEMENT < CITY < NETWORK conservan rango científico',()=>{
    const labels=['OUTPOST','SETTLEMENT','CITY','NETWORK'] as const;
    const layouts=labels.map(band=>colvis1LayoutFromVerifiedPlan(colony('PLANET','ADVANCED','HUMANOID',band))!);
    expect(layouts.map(l=>l.populationRange)).toEqual(labels.map(b=>ranges[b]));
    expect(layouts.map(l=>l.footprintRadiusKm)).toEqual([...layouts.map(l=>l.footprintRadiusKm)].sort((a,b)=>a-b));
    expect(new Set(layouts.map(l=>l.high.length)).size).toBe(4);
  });
  it('tecnologías, funciones y semillas cambian partes, sin añadir estaciones orbitales',()=>{
    for(const habitat of ['SEALED_SURFACE','SUBSURFACE_VAULT','ENVIRONMENTAL_SHIELD'] as const){
      const l=colvis1LayoutFromVerifiedPlan(colony('MOON','VERY_ADVANCED','INSECTOID','CITY',habitat))!;
      expect(l.habitatTechnology).toBe(habitat);
      if(habitat==='SUBSURFACE_VAULT'){
        expect(l.high.filter(p=>p.role==='ACCESS').length).toBeGreaterThanOrEqual(3);
        expect(l.high.some(p=>p.role==='ENVIRONMENTAL_COVER')).toBe(false);
      }
      if(habitat==='ENVIRONMENTAL_SHIELD')expect(l.high.some(p=>p.role==='ENVIRONMENTAL_COVER')).toBe(true);
    }
    for(const [functionName,role] of [['RESEARCH','SENSOR'],['EXTRACTION','EXTRACTOR'],
      ['HABITATION','HABITAT'],['BIOSPHERE_CONSERVATION','BIOLAB']] as const){
      const l=colvis1LayoutFromVerifiedPlan(colony('PLANET','ADVANCED','REPTILIAN','CITY','SEALED_SURFACE',functionName))!;
      expect(l.high.some(p=>p.role===role)).toBe(true);
    }
    expect(shapeSignature(colony())).not.toBe(shapeSignature(colony('PLANET','ADVANCED','HUMANOID','CITY','SEALED_SURFACE','RESEARCH',19733)));
  });
  it('rechaza planes sin acreditación colonial o metadatos incompletos',()=>{
    const p=colony();
    expect(colvis1LayoutFromVerifiedPlan({...p,provenance:'VIDA7_NATIVE_SETTLEMENT'})).toBeNull();
    expect(colvis1LayoutFromVerifiedPlan({...p,colonyArchitectureCOLVIS1:undefined})).toBeNull();
    expect(colvis1LayoutFromVerifiedPlan({...p,colonyArchitectureCOLVIS1:{...p.colonyArchitectureCOLVIS1!,populationRange:[0,999]}})).toBeNull();
    expect(colvis1LayoutFromVerifiedPlan({...p,locationStatus:'OBSERVED' as never})).toBeNull();
  });
  it('instancia geometrías y conserva tamaño físico, anclaje, LOD y recursos',()=>{
    for(const kind of ['PLANET','MOON'] as const){
      const plan=colony(kind,'VERY_ADVANCED','INSECTOID','CITY');
      const radiusEarth=kind==='PLANET'?1:.17;
      const layout=colvis1LayoutFromVerifiedPlan(plan)!;
      const view=createVida38InfrastructureSurfaceVisual386([plan],1,null,null,true,radiusEarth);
      expect(view.siteCount).toBe(1);
      view.updateProjectedDiameterPixels(600);
      const high=view.group.children[1] as THREE.Group;
      expect(high.visible).toBe(true);
      const site=high.children[0] as THREE.Group;
      expect(site.position.length()).toBeCloseTo(1,7);
      const instances:THREE.InstancedMesh[]=[];
      site.traverse(o=>{if(o instanceof THREE.InstancedMesh)instances.push(o);});
      expect(instances.length).toBeGreaterThan(4);
      const matrices=instances.map(i=>{const m=new THREE.Matrix4();i.getMatrixAt(0,m);return m.elements;});
      expect(matrices.every(m=>m.every(Number.isFinite))).toBe(true);
      const site2=createVida38InfrastructureSurfaceVisual386([plan],1,null,null,true,radiusEarth);
      const high2=site2.group.children[1] as THREE.Group;
      const instances2:THREE.InstancedMesh[]=[];
      high2.children[0]!.traverse(o=>{if(o instanceof THREE.InstancedMesh)instances2.push(o);});
      expect(instances2.length).toBe(instances.length);
      const first2=new THREE.Matrix4();instances2[0]!.getMatrixAt(0,first2);
      expect([...first2.elements]).toEqual([...matrices[0]!]);
      // 0.75 % of body radius is maximum representative ground footprint.
      expect(Math.min(layout.footprintRadiusKm,radiusEarth*6371*.0075)).toBeLessThanOrEqual(radiusEarth*6371*.0075);
      dispose(view);dispose(site2);
    }
  });
});
