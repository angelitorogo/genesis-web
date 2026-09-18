import {
  buildMultihostModelManifestV245, multihostManifestMatchesV245, multihostPublicRefV245,
} from './multihost-model-manifest-v245';
import { type MultihostScientificPlanetCatalogV241 } from './multihost-scientific-planet-v241';
import { type MultihostScientificMoonCatalogV242 } from './multihost-scientific-moon-v242';
import { type MultihostScientificMinorBodyCatalogV243 } from './multihost-scientific-minor-bodies-v243';
import { type MultihostHabitabilityCatalogV244 } from './multihost-habitability-v244';

const SEED = '00000000000000000000000000000001';
const fixture = () => ({
  planets: {
    version: 'V2_4_1_PLANET_SCIENCE', sourceSystemSeed: SEED,
    planets: [{id: 'v22-planet-A-1', hostId: 'A', physics: {massEarth: 1}}], limitations: [],
  } as unknown as MultihostScientificPlanetCatalogV241,
  moons: {
    version: 'V2_4_2_MOON_SCIENCE', sourceSystemSeed: SEED,
    moons: [{id: 'v242-moon-A-1', hostId: 'A', hostPlanetId: 'v22-planet-A-1'}],
    systems: [], limitations: [],
  } as unknown as MultihostScientificMoonCatalogV242,
  minorBodies: {
    version: 'V2_4_3_MINOR_BODY_SCIENCE', sourceSystemSeed: SEED,
    hosts: [], belts: [{id: 'v243-belt-A-1', hostId: 'A'}],
    bodies: [{id: 'v243-comet-B-1', hostId: 'B', kind: 'COMET'}], limitations: [],
  } as unknown as MultihostScientificMinorBodyCatalogV243,
  habitability: {
    version: 'V2_4_4_S_TYPE_HABITABILITY', sourceSystemSeed: SEED,
    hosts: [{hostId: 'A'}, {hostId: 'B'}], planets: [{planetId: 'v22-planet-A-1'}], limitations: [],
  } as unknown as MultihostHabitabilityCatalogV244,
});

describe('V2.4.5 deterministic, versioned A/B identities and manifest', () => {
  it('creates opaque stable references for planet, moon, belt and comet with linked parent', () => {
    const catalog = fixture();
    const manifest = buildMultihostModelManifestV245(catalog);
    expect(buildMultihostModelManifestV245(catalog)).toEqual(manifest);
    expect(manifest.identities.map(item => item.kind)).toEqual(['PLANET', 'MOON', 'BELT', 'COMET']);
    expect(manifest.identities[1]?.parentPublicRef).toBe(manifest.identities[0]?.publicRef);
    expect(manifest.identities[0]?.publicRef).toMatch(/^[0-9A-F]{32}$/);
    expect(manifest.identities[0]?.publicRef).not.toContain(SEED);
    expect(manifest.identities[3]?.hostId).toBe('B');
    expect(multihostPublicRefV245('PLANET', 'v22-planet-A-1'))
      .not.toBe(multihostPublicRefV245('MOON', 'v22-planet-A-1'));
    expect(multihostManifestMatchesV245(manifest, manifest)).toBe(true);
  });

  it('detects different scientific data without minting V1 locators or silently changing a save', () => {
    const first = fixture();
    const before = JSON.stringify(first);
    const manifest = buildMultihostModelManifestV245(first);
    const changed = fixture();
    changed.planets = {...changed.planets, planets: [
      {...changed.planets.planets[0]!, physics: {...changed.planets.planets[0]!.physics, massEarth: 9}},
    ]} as MultihostScientificPlanetCatalogV241;
    const different = buildMultihostModelManifestV245(changed);
    expect(multihostManifestMatchesV245(manifest, different)).toBe(false);
    expect(JSON.stringify(first)).toBe(before);
    expect(manifest.identities[0]).not.toHaveProperty('bodyLocator');
  });

  it('rejects inconsistent system seeds, duplicate bodies and cross-host/dangling lunar parents', () => {
    const correct = fixture();
    expect(() => buildMultihostModelManifestV245({
      ...correct, moons: {...correct.moons, sourceSystemSeed: 'F'.repeat(32)},
    })).toThrow(RangeError);
    expect(() => buildMultihostModelManifestV245({
      ...correct, minorBodies: {...correct.minorBodies,
        bodies: [{...correct.minorBodies.bodies[0]!, id: 'v22-planet-A-1'}]},
    })).toThrow(RangeError);
    expect(() => buildMultihostModelManifestV245({
      ...correct, moons: {...correct.moons,
        moons: [{...correct.moons.moons[0]!, hostId: 'B'}]},
    })).toThrow(RangeError);
  });
});
