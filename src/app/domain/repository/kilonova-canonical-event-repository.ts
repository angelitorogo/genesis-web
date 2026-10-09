import { type SystemLocator } from '../generation/procedural-locator';
import { type UniverseGenerationKey } from '../generation/universe-generation-key';
import { type KilonovaCanonicalEvent } from '../transient/kilonova-canonical-event';

export interface KilonovaCanonicalEventRepository {
  loadForSystem(generationKey: UniverseGenerationKey, locator: SystemLocator): Promise<readonly KilonovaCanonicalEvent[]>;
  replaceForSystem(generationKey: UniverseGenerationKey, locator: SystemLocator, events: readonly KilonovaCanonicalEvent[]): Promise<void>;
}
