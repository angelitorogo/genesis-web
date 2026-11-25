import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import type {Vida38InfrastructurePlan386} from '../infrastructure/vida38-infrastructure-plan-38-6';
import {createVida38InfrastructureSurfaceVisual386} from '../infrastructure/vida38-infrastructure-render-38-6';
import {
  systemSceneColonySiteMarkerPresentationT7t,
  systemSceneColonySiteMarkerWorldDiameterT7t,
} from './system-scene-colony-sites-t7t';

const verified=(id:string,longitudeRadians=0):Vida38InfrastructurePlan386=>({
  revision:'VIDA.38.6/physical-infrastructure/v1',id,
  provenance:'VIDA8_COLONIAL_SETTLEMENT',bodyStorageKey:'confirmed',seedUint32:747,
  locationStatus:'RECONSTRUCTED_NOT_OBSERVED',latitudeRadians:0,longitudeRadians,
  form:'COLONIAL_HABITAT',scale:'CITY',tier:'COLONIAL',lineage:'HUMANOID',
  habitat:'SEALED_SURFACE',purpose:'HABITATION',habitatTechnology:'SEALED_SURFACE',
  colonyArchitectureCOLVIS1:{founderTier:'ADVANCED',destinationKind:'MOON',
    populationRange:[5001,120000],function:'HABITATION',founderSpeciesId:'known-species',
    founderSourceBodyStorageKey:'confirmed-origin'},
});

describe('GENESIS 38.bis-T7t · emplazamientos coloniales opcionales',()=>{
  it('oculta círculos pequeños sin COLONIAS, con capa apagada o detrás de la luna',()=>{
    expect(systemSceneColonySiteMarkerPresentationT7t(false,true,480,.8).visible).toBe(false);
    expect(systemSceneColonySiteMarkerPresentationT7t(true,false,480,.8).visible).toBe(false);
    expect(systemSceneColonySiteMarkerPresentationT7t(true,true,480,-.3).visible).toBe(false);
    expect(systemSceneColonySiteMarkerPresentationT7t(true,true,480,0).visible).toBe(false);
    expect(systemSceneColonySiteMarkerPresentationT7t(true,true,80,.9).visible).toBe(false);
    expect(systemSceneColonySiteMarkerPresentationT7t(true,true,480,.8).visible).toBe(true);
  });
  it('acota el diámetro óptico y respeta el radio del anfitrión',()=>{
    const px=systemSceneColonySiteMarkerPresentationT7t(true,true,400,.9).diameterPixels;
    expect(px).toBeGreaterThanOrEqual(12);
    expect(px).toBeLessThanOrEqual(25);
    const world=systemSceneColonySiteMarkerWorldDiameterT7t(px,5,38,900,1);
    expect(world).toBeGreaterThan(0);
    expect(world).toBeLessThanOrEqual(.28);
    expect(systemSceneColonySiteMarkerWorldDiameterT7t(px,5,38,0,1)).toBe(0);
  });
  it('conserva un anclaje por cada plan confirmado, incluso sin geometría COLVIS',()=>{
    const old={...verified('legacy',1),colonyArchitectureCOLVIS1:undefined};
    const native={...verified('native',2),provenance:'VIDA7_NATIVE_SETTLEMENT' as const};
    const visual=createVida38InfrastructureSurfaceVisual386(
      [verified('one'),old,native],1,null,null,true,1,null,false,false);
    expect(visual.colonialSiteAnchorsT7t?.map(a=>a.id)).toEqual(['one','legacy']);
    for(const anchor of visual.colonialSiteAnchorsT7t??[]){
      expect(anchor.site).toBeInstanceOf(THREE.Group);
      expect(anchor.site.position.length()).toBeGreaterThan(.9);
      expect(anchor.markerHex).toBeGreaterThan(0);
    }
    // Activar anclajes no crea ni muestra marcadores COLVIS antiguos en la escena.
    let oldMarkerCount=0;
    visual.group.traverse(o=>{if(o.name.includes('colony location indicator'))oldMarkerCount++;});
    expect(oldMarkerCount).toBe(0);
    visual.resources.forEach(r=>r.dispose());
  });
});
