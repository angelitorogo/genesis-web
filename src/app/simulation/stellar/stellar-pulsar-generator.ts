import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type GalaxySectorStellarPopulationProperties } from '../../domain/sector/galaxy-sector-stellar-population-properties';
import { type StellarPopulationProfile } from '../../domain/stellar/stellar-population-profile';
import { type StellarPulsar } from '../../domain/stellar/stellar-pulsar';
import { StellarNeutronStarGenerator } from './stellar-neutron-star-generator';
import { StellarPulsarEngine } from './stellar-pulsar-engine';

/** V1-only helper. For V2, use fromExistingNeutronStar(actualComponent). */
export class StellarPulsarGenerator {
  private constructor() {}

  static generateV1(
    key: UniverseGenerationKey,
    locator: SystemLocator,
    sector: GalaxySectorStellarPopulationProperties,
    population: StellarPopulationProfile,
  ): StellarPulsar | null {
    if (key.generatorVersion !== GeneratorVersion.V1) {
      throw new RangeError('27.5 V1 helper cannot regenerate a V2 host from the public parent.');
    }
    const neutronStar = StellarNeutronStarGenerator.generateV1(key, locator, sector, population);
    return neutronStar === null ? null : StellarPulsarEngine.fromExistingNeutronStar(neutronStar);
  }
}
