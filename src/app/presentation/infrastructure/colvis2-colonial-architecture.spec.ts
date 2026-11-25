import * as THREE from 'three';
import { VIDA38_INFRASTRUCTURE_REVISION_386, type Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';
import { COLVIS2_REVISION, colvis2LayoutFromVerifiedPlan } from './colvis2-colonial-architecture';
import { colvis2SculptedGeometry, COLVIS2_SCULPTED_SHAPES } from './colvis2-architecture-geometry';
import { createVida38InfrastructureSurfaceVisual386 } from './vida38-infrastructure-render-38-6';

type Kind='PLANET'|'MOON';type Lineage='HUMANOID'|'REPTILIAN'|'INSECTOID';
type Tier='ADVANCED'|'VERY_ADVANCED';type Band='OUTPOST'|'SETTLEMENT'|'CITY'|'NETWORK';
type Habitat='SEALED_SURFACE'|'SUBSURFACE_VAULT'|'ENVIRONMENTAL_SHIELD';
type Purpose='RESEARCH'|'EXTRACTION'|'HABITATION'|'BIOSPHERE_CONSERVATION';
const ranges:Readonly<Record<Band,readonly [number,number]>>={
  OUTPOST:[12,150],SETTLEMENT:[151,5000],CITY:[5001,120000],NETWORK:[120001,1500000],
};
function fixture(kind:Kind='PLANET',tier:Tier='ADVANCED',lineage:Lineage='HUMANOID',
  band:Band='CITY',habitat:Habitat='SEALED_SURFACE',purpose:Purpose='RESEARCH',seed=24711):Vida38InfrastructurePlan386 {
  return Object.freeze({revision:VIDA38_INFRASTRUCTURE_REVISION_386,
    provenance:'VIDA8_COLONIAL_SETTLEMENT',id:'synthetic-test-colony',bodyStorageKey:'synthetic',
    seedUint32:seed,locationStatus:'RECONSTRUCTED_NOT_OBSERVED',latitudeRadians:.25,
    longitudeRadians:-.40,form:'COLONIAL_HABITAT',scale:band,tier:'COLONIAL',lineage,
    habitat,purpose,habitatTechnology:habitat,
    colonyArchitectureCOLVIS1:Object.freeze({founderTier:tier,destinationKind:kind,
      populationRange:ranges[band],function:purpose,founderSpeciesId:'synthetic-species',
      founderSourceBodyStorageKey:'synthetic-origin'})});
}
const parts=(plan:Vida38InfrastructurePlan386)=>colvis2LayoutFromVerifiedPlan(plan)!;

describe('COLVIS.2 — shared sculpted architectures, real colony visibility and metric inspection',()=>{
  it('constructs twelve physically bounded, deterministic, morphologically distinct layouts',()=>{
    const signatures=new Set<string>();
    for(const kind of ['PLANET','MOON'] as const)for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID'] as const)
    for(const tier of ['ADVANCED','VERY_ADVANCED'] as const){
      const p=fixture(kind,tier,lineage);const snapshot=JSON.stringify(p);
      const layout=parts(p);
      expect(layout.revision).toBe(COLVIS2_REVISION);
      expect(layout.worldKind).toBe(kind);expect(layout.founderTier).toBe(tier);
      expect(layout.medium.length).toBeGreaterThan(2);
      expect(layout.high.length).toBeGreaterThan(10);
      expect(layout.high.every(b=>[b.x,b.z,b.width,b.height,b.depth,b.yaw,b.lift].every(Number.isFinite))).toBe(true);
      expect(layout.high.every(b=>Math.hypot(b.x,b.z)<layout.unitExtent)).toBe(true);
      signatures.add(layout.silhouetteSignature + layout.high.map(b=>b.shape+':'+b.x.toFixed(2)+':'+b.z.toFixed(2)).join('|'));
      expect(parts(p)).toEqual(layout);expect(JSON.stringify(p)).toBe(snapshot);
    }
    expect(signatures.size).toBe(12);
  });
  it('uses truly different main buildings AND circulation geometry, even without colours',()=>{
    const mainShapes=new Set<string>();const links=new Set<string>();
    for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID'] as const){
      const l=parts(fixture('PLANET','VERY_ADVANCED',lineage));
      mainShapes.add(l.high.find(p=>p.role==='MAIN_MODULE')?.shape??'');
      links.add(l.high.find(p=>p.role==='CONNECTION')?.shape??'');
    }
    expect(mainShapes.size).toBe(3);expect(links.size).toBe(3);
    expect([...mainShapes].every(s=>COLVIS2_SCULPTED_SHAPES.includes(s as never))).toBe(true);
  });
  it('VERY_ADVANCED creates additional compound geometry without enlarging footprints',()=>{
    for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID'] as const){
      const advanced=parts(fixture('PLANET','ADVANCED',lineage));
      const very=parts(fixture('PLANET','VERY_ADVANCED',lineage));
      expect(very.high.length).toBeGreaterThan(advanced.high.length);
      expect(very.footprintRadiusKm).toBeLessThan(advanced.footprintRadiusKm);
      expect(very.maximumHeightKm).toBeGreaterThan(advanced.maximumHeightKm);
      expect(very.silhouetteSignature).not.toBe(advanced.silhouetteSignature);
    }
  });
  it('retains calibrated population sizes, compact lunar footprint and specialized roles',()=>{
    for(const world of ['PLANET','MOON'] as const){
      const size=(['OUTPOST','SETTLEMENT','CITY','NETWORK'] as const).map(b=>parts(fixture(world,'ADVANCED','HUMANOID',b)));
      expect(size.map(l=>l.populationRange)).toEqual((['OUTPOST','SETTLEMENT','CITY','NETWORK'] as const).map(b=>ranges[b]));
      expect(size.every((l,i)=>i===0||l.footprintRadiusKm>=size[i-1]!.footprintRadiusKm)).toBe(true);
    }
    expect(parts(fixture('MOON')).footprintRadiusKm).toBeLessThan(parts(fixture('PLANET')).footprintRadiusKm);
    for(const [purpose,role] of [['RESEARCH','SENSOR'],['EXTRACTION','EXTRACTOR'],['HABITATION','HABITAT'],['BIOSPHERE_CONSERVATION','BIOLAB']] as const){
      expect(parts(fixture('MOON','VERY_ADVANCED','INSECTOID','CITY','SEALED_SURFACE',purpose)).high.some(p=>p.role===role)).toBe(true);
    }
  });
  it('does not turn SUBSURFACE_VAULT into a metropolis in the open air',()=>{
    for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID'] as const){
      const buried=parts(fixture('MOON','VERY_ADVANCED',lineage,'NETWORK','SUBSURFACE_VAULT'));
      const exposed=parts(fixture('MOON','VERY_ADVANCED',lineage,'NETWORK'));
      expect(buried.high.some(p=>p.role==='MAIN_MODULE')).toBe(false);
      expect(buried.high.some(p=>p.role==='ACCESS')).toBe(true);
      expect(buried.high.length).toBeLessThan(exposed.high.length);
    }
  });
  it('generates smooth compound geometries with consistent buffer attributes',()=>{
    for(const shape of COLVIS2_SCULPTED_SHAPES){
      const geo=colvis2SculptedGeometry(shape);
      const p=geo.getAttribute('position'),normal=geo.getAttribute('normal'),color=geo.getAttribute('color');
      expect(p.count).toBeGreaterThan(80);
      expect(p.count).toBe(normal.count);
      expect(p.count).toBe(color.count);
      expect(p.count%3).toBe(0);
      expect(geo.boundingBox?.min.y).toBeGreaterThan(-.2);
      expect(geo.boundingBox?.max.y).toBeLessThan(1.35);
      geo.dispose();
    }
  });
  it('has confirmed colony locations, locators and close-up LOD in the SAME production renderer',()=>{
    for(const kind of ['PLANET','MOON'] as const){
      const source=fixture(kind,'VERY_ADVANCED','INSECTOID','CITY');
      const rEarth=kind==='MOON'?.12:1;
      const visual=createVida38InfrastructureSurfaceVisual386([source],1,null,null,false,rEarth);
      expect(visual.colonialSitesCOLVIS2).toHaveLength(1);
      expect(visual.colonialSitesCOLVIS2[0]!.id).toBe(source.id);
      expect(visual.colonialSitesCOLVIS2[0]!.footprintScene).toBeGreaterThan(0);
      visual.updateProjectedDiameterPixels(1300);
      expect(visual.group.children[1]!.visible).toBe(true);
      const named:THREE.Object3D[]=[];visual.group.traverse(o=>{if(o.name.includes('colony location indicator'))named.push(o);});
      expect(named.length).toBeGreaterThanOrEqual(3);
      visual.setColonialInspectionActiveCOLVIS2(true);
      expect(named.every(o=>!o.visible)).toBe(true);
      const instanced:THREE.InstancedMesh[]=[];
      visual.colonialSitesCOLVIS2[0]!.site.traverse(o=>{if(o instanceof THREE.InstancedMesh)instanced.push(o);});
      expect(instanced.length).toBeGreaterThan(4);
      visual.setColonialInspectionActiveCOLVIS2(false);
      expect(named.every(o=>o.visible)).toBe(true);
      visual.resources.forEach(r=>r.dispose());
    }
  });
  it('rejects unknown, native and unverified colonies; does not mutate identity',()=>{
    const p=fixture();
    expect(colvis2LayoutFromVerifiedPlan({...p,provenance:'VIDA7_NATIVE_SETTLEMENT'})).toBeNull();
    expect(colvis2LayoutFromVerifiedPlan({...p,colonyArchitectureCOLVIS1:undefined})).toBeNull();
    expect(colvis2LayoutFromVerifiedPlan({...p,colonyArchitectureCOLVIS1:{...p.colonyArchitectureCOLVIS1!,populationRange:[0,999]}})).toBeNull();
    expect(colvis2LayoutFromVerifiedPlan({...p,seedUint32:NaN})).toBeNull();
  });
});
