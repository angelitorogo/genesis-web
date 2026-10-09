import { type SystemLocator } from '../generation/procedural-locator';
import { type UniverseGenerationKey } from '../generation/universe-generation-key';
import { type CompactMergerCanonicalEvent } from '../transient/compact-merger-canonical-event';

export interface CompactMergerCanonicalEventRepository {
  loadForSystem(generationKey: UniverseGenerationKey, locator: SystemLocator): Promise<readonly CompactMergerCanonicalEvent[]>;
  replaceForSystem(generationKey: UniverseGenerationKey, locator: SystemLocator, events: readonly CompactMergerCanonicalEvent[]): Promise<void>;
}
