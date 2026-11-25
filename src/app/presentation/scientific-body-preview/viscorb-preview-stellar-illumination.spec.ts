import {describe,it,expect} from 'vitest';
import { ScientificBodyPreviewKind,type ScientificBodyPreviewModel } from '../scientific/scientific-body-preview';
import { viscorbPreviewStellarSourcesV1 } from './viscorb-preview-stellar-illumination';
import { scientificPreviewDaylightCameraT7s } from './scientific-preview-daylight-camera-t7s';

const primary=[{x:-0.8,y:0.1,z:0.2,weight01:1,isOrbitalHost:true}];
const secondary=[{x:0.7,y:-0.1,z:-0.4,weight01:0.2,isOrbitalHost:false}];
const planet={stellarLightSources:primary, civilizationStarSources:secondary} as never;
describe('GENESIS VISCORB.1 · iluminación compartida de fichas',()=>{
  it('conserva las estrellas del planeta al activar MOSTRAR LUNAS',()=>{
    const model={kind:ScientificBodyPreviewKind.PLANET,primary,moons:[],epochSimulationDay:0,
      spinPlaybackDaysPerRealSecond:1,accessibleLabel:'planet'} as unknown as ScientificBodyPreviewModel;
    const {x}=scientificPreviewDaylightCameraT7s(viscorbPreviewStellarSourcesV1({...model,primary:planet} as ScientificBodyPreviewModel));
    expect(x).toBeLessThan(0);
  });
  it('una luna utiliza el mismo campo estelar que su anfitrión en contexto',()=>{
    const moon={kind:ScientificBodyPreviewKind.MOON,hostPlanet:planet,primary:{stellarLightSources:secondary},
      moons:[],epochSimulationDay:0,spinPlaybackDaysPerRealSecond:1,accessibleLabel:'moon'} as unknown as ScientificBodyPreviewModel;
    expect(viscorbPreviewStellarSourcesV1(moon)).toBe(primary);
  });
  it('luna aislada sin ficha del anfitrión conserva su campo propio',()=>{
    const moon={kind:ScientificBodyPreviewKind.MOON,hostPlanet:null,primary:{stellarLightSources:primary},
      moons:[],epochSimulationDay:0,spinPlaybackDaysPerRealSecond:1,accessibleLabel:'moon'} as unknown as ScientificBodyPreviewModel;
    expect(viscorbPreviewStellarSourcesV1(moon)).toBe(primary);
  });
  it('sin estrellas relevantes la cámara conserva el fallback estable',()=>{
    const fallback=scientificPreviewDaylightCameraT7s([]);
    expect(fallback.z).toBeGreaterThan(0);
  });
});
