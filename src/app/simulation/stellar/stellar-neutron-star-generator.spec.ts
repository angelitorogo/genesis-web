import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxySectorStellarPopulationProperties } from '../../domain/sector/galaxy-sector-stellar-population-properties';
import { StellarPopulationProfile, StellarPopulationRegime } from '../../domain/stellar/stellar-population-profile';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarGenerator } from './stellar-generator';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';
import { StellarNeutronStarGenerator } from './stellar-neutron-star-generator';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const sector = new GalaxySectorStellarPopulationProperties(1, 8);
const population = new StellarPopulationProfile(
  8, 0.35, 0.20, 0.45, 0.35, 0.88, 0.72, 0.18, 0.55, StellarPopulationRegime.MIXED,
);

describe('27.4 — V1 convenience neutron-star generator', () => {
  it('reuses exactly the existing Star/physical/lifetime branches without new seeds', () => {
    const key = new UniverseGenerationKey(seed, GeneratorVersion.V1);
    const locator = new SystemLocator(0n, 123456789n, 7n);
    const physical = StellarGenerator.generatePhysicalProperties(key, locator, sector, population);
    const lifetime = StellarGenerator.generateLifetimeProfile(key, locator, physical, sector, population);
    const star = StellarGenerator.generateStar(key, locator, sector, population);
    const expected = StellarNeutronStarEngine.fromExistingStar(star, physical, lifetime);
    const result = StellarNeutronStarGenerator.generateV1(key, locator, sector, population);
    expect(result).toEqual(expected);
    expect(StellarNeutronStarGenerator.generateV1(key, locator, sector, population)).toEqual(result);
    expect(StellarGenerator.generateStar(key, locator, sector, population)).toEqual(star);
  });

  it('refuses V2 public-parent regeneration: caller must supply the real component', () => {
    const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);
    expect(() => StellarNeutronStarGenerator.generateV1(
      key, new SystemLocator(0n, 123456789n, 7n), sector, population,
    )).toThrow(RangeError);
  });
});
