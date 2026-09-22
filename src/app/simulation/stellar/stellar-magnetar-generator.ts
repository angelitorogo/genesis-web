import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type GalaxySectorStellarPopulationProperties } from '../../domain/sector/galaxy-sector-stellar-population-properties';
import { type StellarMagnetar } from '../../domain/stellar/stellar-magnetar';
import { type StellarPopulationProfile } from '../../domain/stellar/stellar-population-profile';
import { StellarMagnetarEngine } from './stellar-magnetar-engine';
import { StellarNeutronStarGenerator } from './stellar-neutron-star-generator';

/** Optional V1-only convenience helper: V2 MUST supply the real A/B/C remnant. */
export class StellarMagnetarGenerator {
  private constructor() {}

  static generateV1(
    key: UniverseGenerationKey,
    locator: SystemLocator,
    sector: GalaxySectorStellarPopulationProperties,
    population: StellarPopulationProfile,
  ): StellarMagnetar | null {
    if (key.generatorVersion !== GeneratorVersion.V1) {
      throw new RangeError('27.6 V1 helper must not regenerate V2 multihost components.');
    }
    const neutronStar = StellarNeutronStarGenerator.generateV1(key, locator, sector, population);
    return neutronStar === null ? null : StellarMagnetarEngine.fromExistingNeutronStar(neutronStar);
  }
}
