import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import type {Vida38InfrastructurePlan386} from './vida38-infrastructure-plan-38-6';
import {colvis3ColonyDetailsFromVerifiedPlanT7c,colvis3MarkerRadiusSceneT7c,
  colvis3IsColonyClickT7c} from './colvis3-colony-visibility-t7c';
import {createVida38InfrastructureSurfaceVisual386} from './vida38-infrastructure-render-38-6';

function verified(tier:'ADVANCED'|'VERY_ADVANCED'='ADVANCED',
  purpose:'RESEARCH'|'EXTRACTION'|'HABITATION'|'BIOSPHERE_CONSERVATION'='RESEARCH',
  kind:'PLANET'|'MOON'='PLANET'):Vida38InfrastructurePlan386 {
  return {revision:'VIDA.38.6/physical-infrastructure/v1',id:'confirmed-t7c',
    provenance:'VIDA8_COLONIAL_SETTLEMENT',bodyStorageKey:'verified-planet',
    seedUint32:18374,locationStatus:'RECONSTRUCTED_NOT_OBSERVED',
    latitudeRadians:0,longitudeRadians:0,form:'COLONIAL_HABITAT',scale:'CITY',
    tier:'COLONIAL',lineage:'INSECTOID',habitat:'SEALED_SURFACE',
    purpose,habitatTechnology:'SEALED_SURFACE',colonyArchitectureCOLVIS1:{
      founderTier:tier,destinationKind:kind,populationRange:[5001,120000],
      function:purpose,founderSpeciesId:'confirmed-species',founderSourceBodyStorageKey:'verified-origin'}};
}

describe('GENESIS 38.bis-T7c · visibilidad e inspección sin nuevas entidades',()=>{
  it('solo usa colonias VIDA.8 verificadas y no inventa nombres ni habitantes',()=>{
    const v=verified();
    const data=colvis3ColonyDetailsFromVerifiedPlanT7c(v)!;
    expect(data.tierLabel).toBe('Avanzada');
    expect(data.destinationLabel).toBe('Planeta');
    expect(data.purposeLabel).toBe('Investigación');
    expect(data.populationLabel).toBe('5.001–120.000 habitantes');
    expect(data.originRegistered).toBe(true);
    expect(colvis3ColonyDetailsFromVerifiedPlanT7c({...v,provenance:'VIDA7_NATIVE_SETTLEMENT'})).toBeNull();
    expect(colvis3ColonyDetailsFromVerifiedPlanT7c({...v,colonyArchitectureCOLVIS1:undefined})).toBeNull();
  });
  it('adapta color/puntos de luz a tier, destino y función de colonias lunares y planetarias',()=>{
    const advanced=colvis3ColonyDetailsFromVerifiedPlanT7c(verified('ADVANCED','EXTRACTION','MOON'))!;
    const very=colvis3ColonyDetailsFromVerifiedPlanT7c(verified('VERY_ADVANCED','BIOSPHERE_CONSERVATION'))!;
    expect(advanced.destinationLabel).toBe('Luna');
    expect(advanced.purposeLabel).toBe('Extracción');
    expect(advanced.lampBudget).toBeLessThan(very.lampBudget);
    expect(advanced.lampHex).not.toBe(very.lampHex);
    expect(advanced.markerHex).not.toBe(0xb6caff);
    expect(very.markerHex).toBe(0xff4fd8);
  });
  it('el marcador es un indicador óptico acotado, no una ampliación de edificios',()=>{
    for(const d of [80,200,720,1800]){
      const r=colvis3MarkerRadiusSceneT7c(1,d);
      expect(r).toBeGreaterThanOrEqual(.025);
      expect(r).toBeLessThanOrEqual(.090);
    }
    expect(colvis3MarkerRadiusSceneT7c(1,200)).toBeGreaterThan(colvis3MarkerRadiusSceneT7c(1,720));
    expect(colvis3MarkerRadiusSceneT7c(0,720)).toBe(0);
  });
  it('clic cercano y visible sí; giro, hemisferio oculto y clic fuera no',()=>{
    expect(colvis3IsColonyClickT7c(0,11,true)).toBe(true);
    expect(colvis3IsColonyClickT7c(8,11,true)).toBe(false);
    expect(colvis3IsColonyClickT7c(0,30,true)).toBe(false);
    expect(colvis3IsColonyClickT7c(0,11,false)).toBe(false);
  });
  it('SystemScene mantiene el tamaño COLVIS.2 anterior por defecto',()=>{
    const old=createVida38InfrastructureSurfaceVisual386([verified()],1,null,null,false,1);
    old.updateProjectedDiameterPixels(720);
    const rings:THREE.Mesh[]=[];
    old.group.traverse(o=>{if(o instanceof THREE.Mesh&&o.name.includes('colony location indicator'))rings.push(o);});
    expect(rings).toHaveLength(3);
    expect(rings[0]!.scale.x).toBeCloseTo(.014);
    old.resources.forEach(r=>r.dispose());
  });
  it('las mismas geometrías COLVIS.2 mantienen un sitio y luces nocturnas opcionales',()=>{
    for(const kind of ['PLANET','MOON'] as const){
      const v=createVida38InfrastructureSurfaceVisual386([verified('VERY_ADVANCED','EXTRACTION',kind)],1,
        null,null,true,kind==='MOON'?.12:1,null,true);
      expect(v.colonialSitesCOLVIS2).toHaveLength(1);
      expect(v.colonialSitesCOLVIS2[0]!.details.purposeLabel).toBe('Extracción');
      const lamps:THREE.InstancedMesh[]=[];
      v.group.traverse(o=>{if(o instanceof THREE.InstancedMesh && o.userData['colonialNightIndicators386c3']===true)lamps.push(o);});
      expect(lamps.length).toBeGreaterThan(0);
      v.group.updateMatrixWorld(true);
      v.updateColonialNightLighting386c3([new THREE.Vector3(-1,0,0)],
        new THREE.Vector3(1,0,0),new THREE.Matrix4());
      v.updateProjectedDiameterPixels(700);
      const marker:THREE.Mesh[]=[];
      v.group.traverse(o=>{if(o instanceof THREE.Mesh&&o.name.includes('colony location indicator'))marker.push(o);});
      expect(marker.length).toBeGreaterThanOrEqual(3);
      expect(marker.every(o=>o.scale.x>=.025&&o.scale.x<=.090)).toBe(true);
      v.setColonialInspectionActiveCOLVIS2(true);
      expect(marker.every(o=>!o.visible)).toBe(true);
      v.resources.forEach(r=>r.dispose());
    }
  });
});
