import {
  type GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';
import {
  type SupernovaCanonicalEventRepository,
} from '../../domain/repository/supernova-canonical-event-repository';
import {
  type StellarPopulationProfile,
} from '../../domain/stellar/stellar-population-profile';
import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';
import {
  type SupernovaCanonicalEvent,
} from '../../domain/transient/supernova-canonical-event';
import {
  StellarSupernovaCanonicalEventResolver,
} from './stellar-supernova-canonical-event-resolver';

/**
 * Thin 29.1C orchestration boundary: regenerate canonical Ground Truth and make
 * persisted storage exactly match it. It does not mutate the stellar system.
 */
export class SupernovaCanonicalEventSynchronizer {
  private constructor() {}

  static async synchronizeGeneratedSystem(
    repository: SupernovaCanonicalEventRepository,
    system: StellarSystem,
    sectorStellarPopulation: GalaxySectorStellarPopulationProperties,
    stellarPopulationProfile: StellarPopulationProfile,
  ): Promise<readonly SupernovaCanonicalEvent[]> {
    const events =
      StellarSupernovaCanonicalEventResolver.resolveGeneratedSystem(
        system,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

    await repository.replaceForSystem(
      system.generationKey,
      system.locator,
      events,
    );

    return events;
  }
}
