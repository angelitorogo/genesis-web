import {
  type SystemLocator,
} from '../generation/procedural-locator';
import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';
import {
  type SupernovaCanonicalEvent,
} from '../transient/supernova-canonical-event';

/**
 * 29.1C persistence boundary. The complete event set for a system is replaced
 * atomically so stale A/B/C rows can never survive a deterministic regeneration.
 */
export interface SupernovaCanonicalEventRepository {
  loadForSystem(
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): Promise<readonly SupernovaCanonicalEvent[]>;

  replaceForSystem(
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
    events: readonly SupernovaCanonicalEvent[],
  ): Promise<void>;
}
