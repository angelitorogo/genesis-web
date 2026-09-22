import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorStellarPopulationProperties } from '../../domain/sector/galaxy-sector-stellar-population-properties';
import { StellarPopulationProfile, StellarPopulationRegime } from '../../domain/stellar/stellar-population-profile';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarMagnetarEngine } from './stellar-magnetar-engine';
import { StellarMagnetarGenerator } from './stellar-magnetar-generator';
import { StellarNeutronStarGenerator } from './stellar-neutron-star-generator';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const sector = new GalaxySectorStellarPopulationProperties(1, 8);
const population = new StellarPopulationProfile(
  8, 0.35, 0.20, 0.45, 0.35, 0.88, 0.72, 0.18, 0.55, StellarPopulationRegime.MIXED,
);

describe('27.6 — optional V1 magnetar convenience wrapper', () => {
  it('exactly matches the existing V1 neutron-star projection without changing generation', () => {
    const key = new UniverseGenerationKey(seed, GeneratorVersion.V1);
    const locator = new SystemLocator(0n, 123456789n, 7n);
    const neutronStar = StellarNeutronStarGenerator.generateV1(key, locator, sector, population);
    const expected = neutronStar === null ? null :
      StellarMagnetarEngine.fromExistingNeutronStar(neutronStar);
    expect(StellarMagnetarGenerator.generateV1(key, locator, sector, population)).toEqual(expected);
    expect(StellarMagnetarGenerator.generateV1(key, locator, sector, population)).toEqual(expected);
  });

  it('refuses public-parent V2 regeneration; the caller must use the actual component', () => {
    const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);
    expect(() => StellarMagnetarGenerator.generateV1(key,
      new SystemLocator(0n, 123456789n, 7n), sector, population)).toThrow(RangeError);
  });
});
