import type { SystemSceneMinorBodySnapshot } from './system-scene-snapshot';
import { systemSceneMinorBodyAtlasSource387x, systemSceneMinorBodyNeedsAtlas387x } from './system-scene-minor-body-parity-38-7x';

const minor = (name:string, key:string, seed:number): SystemSceneMinorBodySnapshot => ({
  id:key,kind:'minor-body',minorBodyKind:{name},
  asteroidPresentation: name==='ASTEROID'?{shapeSeedUint32:seed}:null,
  cometPresentation: name==='COMET'?{shapeSeedUint32:seed}:null,
  tnoPresentation:name==='TRANS_NEPTUNIAN_OBJECT'?{variantUint32:seed}:null,
  capturedPresentation:name==='CAPTURED_EXTRASOLAR_OBJECT'?{variantUint32:seed}:null,
}) as unknown as SystemSceneMinorBodySnapshot;

describe('38.7x — atlas de inspección idéntico al de la ficha, con límite de GPU', () => {
  it.each([
    ['ASTEROID','ASTEROID'],['COMET','COMET'],
    ['TRANS_NEPTUNIAN_OBJECT','TNO'],['CAPTURED_EXTRASOLAR_OBJECT','CAPTURED'],
  ])('resuelve tipo y seed estable de %s', (kind,expected) => {
    expect(systemSceneMinorBodyAtlasSource387x(minor(kind,kind,0x12345678)))
      .toEqual({kind:expected,seedUint32:0x12345678});
  });
  it('no inventa un atlas para cuerpos sin presentación científica', () => {
    const invalid = {...minor('ASTEROID','A',1),asteroidPresentation:null};
    expect(systemSceneMinorBodyAtlasSource387x(invalid)).toBeNull();
  });
  it('solo activa el atlas al acercarse y conserva histéresis entre 220 y 320 píxeles', () => {
    expect(systemSceneMinorBodyNeedsAtlas387x(100,false)).toBe(false);
    expect(systemSceneMinorBodyNeedsAtlas387x(290,false)).toBe(false);
    expect(systemSceneMinorBodyNeedsAtlas387x(350,false)).toBe(true);
    expect(systemSceneMinorBodyNeedsAtlas387x(290,true)).toBe(true);
    expect(systemSceneMinorBodyNeedsAtlas387x(190,true)).toBe(false);
  });
});
