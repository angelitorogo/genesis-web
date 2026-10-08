import { type SystemLocator } from '../generation/procedural-locator';
import { type UniverseGenerationKey } from '../generation/universe-generation-key';
import { type NovaCanonicalEvent } from '../transient/nova-canonical-event';

export interface NovaCanonicalEventRepository {
  loadForSystem(
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): Promise<readonly NovaCanonicalEvent[]>;

  replaceForSystem(
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
    events: readonly NovaCanonicalEvent[],
  ): Promise<void>;
}
