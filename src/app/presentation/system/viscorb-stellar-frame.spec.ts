import {describe,it,expect} from 'vitest';
import {viscorbStellarViewDirectionV1} from './viscorb-stellar-frame';

describe('GENESIS VISCORB.1 · cámara con iluminación estelar real',()=>{
  it('mira hacia la estrella orbital del planeta',()=>{
    const direction=viscorbStellarViewDirectionV1({x:0,y:0,z:0},[
      {id:'A',x:5,y:0,z:0,sourceLuminositySolar:1},
      {id:'B',x:-3,y:0,z:0,sourceLuminositySolar:1},
    ],['A'])!;
    expect(direction.x).toBeGreaterThan(.8);
  });
  it('en binarios opuestos y de igual peso conserva dirección determinista',()=>{
    const stars=[{id:'A',x:2,y:0,z:0,sourceLuminositySolar:1},
      {id:'B',x:-2,y:0,z:0,sourceLuminositySolar:1}];
    const first=viscorbStellarViewDirectionV1({x:0,y:0,z:0},stars);
    expect(first).toEqual(viscorbStellarViewDirectionV1({x:0,y:0,z:0},stars));
  });
  it('no inventa luz de agujeros negros sin emisión',()=>{
    expect(viscorbStellarViewDirectionV1({x:0,y:0,z:0},
      [{id:'BH',x:2,y:0,z:0,sourceLuminositySolar:0}])).toBeNull();
  });
});
