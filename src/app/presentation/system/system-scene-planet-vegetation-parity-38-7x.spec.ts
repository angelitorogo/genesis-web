import { systemScenePlanetTextureCacheKeyVISCIV1b } from './system-scene-planet-civilization-cache-visciv1b';

const profile = {
  coverageFraction01:.55,lushness01:.75,floraSpeciesCount:4,
  paletteHexes:['#3B7D45','#9AC26C'],
  paletteEntries:[{hex:'#3B7D45',weight01:.7},{hex:'#9AC26C',weight01:.3}],
};

describe('38.7x — clave de atlas común para ficha y sistema', () => {
  const key = (vegetation: typeof profile | null, tier: 'ADVANCED' | null = null) =>
    systemScenePlanetTextureCacheKeyVISCIV1b('same-universe-v3-system','planet-2',256,tier,vegetation);

  it('distingue el atlas estéril de la superficie con flora confirmada sin civilización', () => {
    expect(key(null)).not.toBe(key(profile));
    expect(key(profile)).toBe(key({...profile}));
  });
  it('distingue paletas, cobertura y abundancia sin cambiar la identidad científica', () => {
    expect(key(profile)).not.toBe(key({...profile,paletteHexes:['#7D3939']}));
    expect(key(profile)).not.toBe(key({...profile,coverageFraction01:.35}));
    expect(key(profile)).not.toBe(key(profile,'ADVANCED'));
  });
  it('separa también los sistemas y los planetas, sin compartir texturas incorrectas', () => {
    expect(key(profile)).not.toBe(systemScenePlanetTextureCacheKeyVISCIV1b('otro-sistema','planet-2',256,null,profile));
    expect(key(profile)).not.toBe(systemScenePlanetTextureCacheKeyVISCIV1b('same-universe-v3-system','planet-1',256,null,profile));
  });
});
