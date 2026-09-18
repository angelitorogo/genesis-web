import {DiscoveryState} from '../../domain/discovery/discovery-state';
import {multihostPublicRefV245} from '../../domain/planetary/multihost-model-manifest-v245';
import {type SystemSceneSnapshot} from './system-scene-snapshot';
import {systemSceneV2FicheRoute} from './system-scene-v2-fiche-route';

const seedPlanetId = 'v22-ABCDEF-A-01';
const scene = (): SystemSceneSnapshot => ({
  multiplicityName: 'BINARY',
  address: {galaxyIndex: '0', sectorKey: '-34359738349', galacticObjectIndex: '1'},
  discoveryStateCode: DiscoveryState.CONFIRMED.code,
  planets: [{id: seedPlanetId}], moons: [], minorBodies: [],
  scientificMultihostPlanetsV241: {planets: [{
    id: seedPlanetId, designation: 'A · b', hostId: 'A', type: 'ROCKY',
    physics: {massEarth: 1, radiusEarth: 1, semiMajorAxisAu: 1,
      periapsisAu: .9, apoapsisAu: 1.1, periodDays: 365},
    formationPath: {regime: 'IN_SITU'},
    environment: {atmosphere: {regime: 'RETAINED'},
      climate: {meanSurfaceTemperatureKelvin: 290}, water: {regime: 'LIQUID_CANDIDATE'}},
  }]},
  scientificMultihostMoonsV242: {moons: []},
  scientificMultihostMinorBodiesV243: {bodies: []},
  scientificMultihostHabitabilityV244: {planets: []},
}) as unknown as SystemSceneSnapshot;

describe('V2 scientific fiche route is distinct from V1 BodyLocator routes', () => {
  it('uses an opaque V2 public reference and the real persisted system address', () => {
    expect(systemSceneV2FicheRoute(scene(), seedPlanetId)).toEqual([
      '/system', '0', '-34359738349', '1', 'v2', 'planet',
      multihostPublicRefV245('PLANET', seedPlanetId),
    ]);
  });
  it('never opens route for missing, nonbinary or nonconfirmed identities', () => {
    expect(systemSceneV2FicheRoute(scene(), 'planet-1')).toBeNull();
    expect(systemSceneV2FicheRoute({...scene(), multiplicityName: 'SINGLE'}, seedPlanetId)).toBeNull();
    expect(systemSceneV2FicheRoute({...scene(), discoveryStateCode: DiscoveryState.CATALOGUED.code}, seedPlanetId)).toBeNull();
  });
});
