import { colvis2ColonyCameraFraming } from './colvis2-colony-inspection-camera';

describe('COLVIS.2 · cámara de inspección físicamente coherente',()=>{
  it('mantiene near/far adecuados incluso en un puesto avanzado diminuto',()=>{
    for(const radius of [.025,.12,1,2.5])for(const footprint of [1e-8,1e-6,.0001]){
      const f=colvis2ColonyCameraFraming(footprint,radius)!;
      expect(f.nearScene).toBeGreaterThan(0);
      expect(f.farScene).toBeGreaterThan(f.distanceScene);
      expect(f.distanceScene).toBeGreaterThan(f.nearScene);
      expect(f.farScene/f.nearScene).toBeLessThan(1e9);
    }
  });
  it('zoom cambia SOLO la cámara sin afectar la huella ni la semilla',()=>{
    const near=colvis2ColonyCameraFraming(.00007,1,.40)!;
    const far=colvis2ColonyCameraFraming(.00007,1,4)!;
    expect(near.distanceScene).toBeLessThan(far.distanceScene);
    expect(colvis2ColonyCameraFraming(.00007,1,.40)).toEqual(near);
  });
  it('rechaza tamaños inválidos y acota el zoom',()=>{
    expect(colvis2ColonyCameraFraming(0,1)).toBeNull();
    expect(colvis2ColonyCameraFraming(1,0)).toBeNull();
    expect(colvis2ColonyCameraFraming(NaN,1)).toBeNull();
    expect(colvis2ColonyCameraFraming(1,1,NaN)).toBeNull();
    expect(colvis2ColonyCameraFraming(1,1,.001)).toEqual(colvis2ColonyCameraFraming(1,1,.32));
  });
});
