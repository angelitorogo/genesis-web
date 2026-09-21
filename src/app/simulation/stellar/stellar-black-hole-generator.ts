import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type GalaxySectorStellarPopulationProperties } from '../../domain/sector/galaxy-sector-stellar-population-properties';
import { type StellarBlackHole } from '../../domain/stellar/stellar-black-hole';
import { type StellarPopulationProfile } from '../../domain/stellar/stellar-population-profile';
import { StellarBlackHoleEngine } from './stellar-black-hole-engine';
import { StellarGenerator } from './stellar-generator';

/**
 * Optional V1 system-primary convenience entrypoint for 27.1.
 * V2 callers MUST use StellarBlackHoleEngine.fromExistingStar() on their exact
 * component inputs; V2 host components have independent private physical keys
 * and cannot be regenerated from the public parent locator without divergence.
 */
export class StellarBlackHoleGenerator {
  private constructor() {}

  static generateV1(
    key: UniverseGenerationKey,
    locator: SystemLocator,
    sector: GalaxySectorStellarPopulationProperties,
    population: StellarPopulationProfile,
  ): StellarBlackHole | null {
    if (key.generatorVersion !== GeneratorVersion.V1) {
      throw new RangeError('27.1 V1 convenience generation cannot resolve a V2 multihost component.');
    }
    const physical = StellarGenerator.generatePhysicalProperties(key, locator, sector, population);
    const lifetime = StellarGenerator.generateLifetimeProfile(key, locator, physical, sector, population);
    const star = StellarGenerator.generateStar(key, locator, sector, population);
    return StellarBlackHoleEngine.fromExistingStar(star, physical, lifetime);
  }
}
