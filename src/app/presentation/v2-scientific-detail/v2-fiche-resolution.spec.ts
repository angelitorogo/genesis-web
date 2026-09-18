import {DiscoveryState} from '../../domain/discovery/discovery-state';
import {multihostPublicRefV245, type MultihostModelManifestV245} from '../../domain/planetary/multihost-model-manifest-v245';
import {type SystemSceneSnapshot} from '../system/system-scene-snapshot';
import {resolveV2FicheReference} from './v2-fiche-resolution';

const planetId = 'v22-seed-A-01';
const ref = multihostPublicRefV245('PLANET', planetId);
const manifest = (): MultihostModelManifestV245 => ({
  version: 'V2_4_5_MODEL_MANIFEST', modelRelease: 'V2.4.5-S-TYPE-A-B-REFERENCE-1',
  sourceSystemSeed: 'A'.repeat(32), catalogueFingerprint: 'F'.repeat(32),
  habitableHostCount: 1,
  identities: [{kind: 'PLANET', sourceId: planetId, publicRef: ref, hostId: 'A', parentPublicRef: null}],
});
const scene = (): SystemSceneSnapshot => ({
  multiplicityName: 'BINARY', discoveryStateCode: DiscoveryState.CONFIRMED.code,
  planets: [], moons: [], minorBodies: [],
  scientificMultihostPlanetsV241: {planets: [{
    id: planetId, designation: 'A · b', hostId: 'A', type: 'ROCKY',
    physics: {massEarth: 1, radiusEarth: 1, semiMajorAxisAu: 1,
      periapsisAu: .9, apoapsisAu: 1.1, periodDays: 365},
    formationPath: {regime: 'IN_SITU'},
    environment: {atmosphere: {regime: 'NONE'},
      climate: {meanSurfaceTemperatureKelvin: null}, water: {regime: 'DRY'}},
  }]},
  scientificMultihostMoonsV242: {moons: []},
  scientificMultihostMinorBodiesV243: {bodies: []},
  scientificMultihostHabitabilityV244: {planets: []},
}) as unknown as SystemSceneSnapshot;

describe('V2 standalone fiche resolves saved public identities only', () => {
  it('resolves the persisted scientific planet even when its render slot was culled', () => {
    const result = resolveV2FicheReference(manifest(), manifest(), scene(), 'PLANET', ref);
    expect(result.status).toBe('available');
    if (result.status === 'available') {
      expect(result.identity.sourceId).toBe(planetId);
      expect(result.fiche.title).toBe('A · b');
      expect(result.fiche.provenance).toContain('no es una observación');
    }
  });
  it('rejects a mismatched fingerprint, wrong kind/ref and a nonbinary or unconfirmed scene', () => {
    const saved = manifest();
    expect(resolveV2FicheReference(saved, {...saved, catalogueFingerprint: '0'.repeat(32)}, scene(), 'PLANET', ref).status)
      .toBe('stale');
    expect(resolveV2FicheReference(saved, saved, scene(), 'MOON', ref).status).toBe('missing');
    expect(resolveV2FicheReference(saved, saved, scene(), 'PLANET', '0'.repeat(32)).status).toBe('missing');
    expect(resolveV2FicheReference(saved, saved, {...scene(), multiplicityName: 'SINGLE'}, 'PLANET', ref).status)
      .toBe('missing');
    expect(resolveV2FicheReference(saved, saved,
      {...scene(), discoveryStateCode: DiscoveryState.CATALOGUED.code}, 'PLANET', ref).status).toBe('missing');
  });
});
