import { type SystemSceneSnapshot } from './system-scene-snapshot';
import { systemScenePlanetFicheRoute, systemSceneMoonFicheRoute } from './system-scene-scientific-route';

const base = { address: { galaxyIndex: '3', sectorKey: '-17', galacticObjectIndex: '8' } } as SystemSceneSnapshot;

describe('Scientific scene links: historical and multihost addressing', () => {
  it('retains legacy V1 ordinal routes without any explicit public catalogue', () => {
    expect(systemScenePlanetFicheRoute(base, 'planet-2')?.slice(-2)).toEqual(['planet', '1']);
    expect(systemSceneMoonFicheRoute(base, 'moon-2-3')?.slice(-4)).toEqual(['planet', '1', 'moon', '2']);
    expect(systemScenePlanetFicheRoute(base, 'mh-a-planet-1')).toBeNull();
    expect(systemSceneMoonFicheRoute(base, 'moon-0-1')).toBeNull();
  });
  it('routes by explicit public identities and rejects unknown/duplicate visual ids without fallback', () => {
    const multiple = { ...base,
      scientificPlanetBindings: Object.freeze([{ sceneBodyId: 'mh-b-planet-1', bodyIndex: '7' }]),
      scientificMoonBindings: Object.freeze([{ sceneBodyId: 'mh-b-moon-1-2', bodyIndex: '7', moonIndex: '1' }]),
    } as SystemSceneSnapshot;
    expect(systemScenePlanetFicheRoute(multiple, 'mh-b-planet-1')?.slice(-2)).toEqual(['planet', '7']);
    expect(systemSceneMoonFicheRoute(multiple, 'mh-b-moon-1-2')?.slice(-4))
      .toEqual(['planet', '7', 'moon', '1']);
    expect(systemScenePlanetFicheRoute(multiple, 'planet-1')).toBeNull();
    expect(systemSceneMoonFicheRoute(multiple, 'moon-1-1')).toBeNull();
    expect(systemScenePlanetFicheRoute({ ...multiple, scientificPlanetBindings: [
      multiple.scientificPlanetBindings![0]!, multiple.scientificPlanetBindings![0]!,
    ] }, 'mh-b-planet-1')).toBeNull();
    expect(systemSceneMoonFicheRoute({ ...multiple, scientificMoonBindings: undefined }, 'mh-b-moon-1-2'))
      .toBeNull();
  });
});
