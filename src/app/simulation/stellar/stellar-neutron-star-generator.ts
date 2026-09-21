import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type GalaxySectorStellarPopulationProperties } from '../../domain/sector/galaxy-sector-stellar-population-properties';
import { type StellarNeutronStar } from '../../domain/stellar/stellar-neutron-star';
import { type StellarPopulationProfile } from '../../domain/stellar/stellar-population-profile';
import { StellarGenerator } from './stellar-generator';
import { StellarNeutronStarEngine } from './stellar-neutron-star-engine';

/** Optional V1-primary convenience wrapper. Never regenerate a V2 host from its parent locator. */
export class StellarNeutronStarGenerator {
  private constructor() {}

  static generateV1(
    key: UniverseGenerationKey,
    locator: SystemLocator,
    sector: GalaxySectorStellarPopulationProperties,
    population: StellarPopulationProfile,
  ): StellarNeutronStar | null {
    if (key.generatorVersion !== GeneratorVersion.V1) {
      throw new RangeError('27.4 V1 convenience generation cannot resolve a V2 multihost component.');
    }
    const physical = StellarGenerator.generatePhysicalProperties(key, locator, sector, population);
    const lifetime = StellarGenerator.generateLifetimeProfile(key, locator, physical, sector, population);
    const star = StellarGenerator.generateStar(key, locator, sector, population);
    return StellarNeutronStarEngine.fromExistingStar(star, physical, lifetime);
  }
}
