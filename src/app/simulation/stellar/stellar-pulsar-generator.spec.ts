import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorStellarPopulationProperties } from '../../domain/sector/galaxy-sector-stellar-population-properties';
import { StellarPopulationProfile, StellarPopulationRegime } from '../../domain/stellar/stellar-population-profile';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarNeutronStarGenerator } from './stellar-neutron-star-generator';
import { StellarPulsarEngine } from './stellar-pulsar-engine';
import { StellarPulsarGenerator } from './stellar-pulsar-generator';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const sector = new GalaxySectorStellarPopulationProperties(1, 8);
const population = new StellarPopulationProfile(
  8, 0.35, 0.20, 0.45, 0.35, 0.88, 0.72, 0.18, 0.55, StellarPopulationRegime.MIXED,
);

describe('27.5 — V1 pulsar convenience wrapper', () => {
  it('matches projection of the existing canonical V1 neutron-star pipeline exactly', () => {
    const key = new UniverseGenerationKey(seed, GeneratorVersion.V1);
    const locator = new SystemLocator(0n, 123456789n, 7n);
    const neutronStar = StellarNeutronStarGenerator.generateV1(key, locator, sector, population);
    const expected = neutronStar === null ? null :
      StellarPulsarEngine.fromExistingNeutronStar(neutronStar);
    expect(StellarPulsarGenerator.generateV1(key, locator, sector, population)).toEqual(expected);
    expect(StellarPulsarGenerator.generateV1(key, locator, sector, population)).toEqual(expected);
  });

  it('rejects public-parent V2 regeneration; real hosts must pass the exact 27.4 component', () => {
    const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);
    expect(() => StellarPulsarGenerator.generateV1(key,
      new SystemLocator(0n, 123456789n, 7n), sector, population)).toThrow(RangeError);
  });
});
