import { type UniverseGenerationKey } from '../generation/universe-generation-key';
import { type SystemLocator } from '../generation/procedural-locator';
import { type MultihostModelManifestV245 } from '../planetary/multihost-model-manifest-v245';

/** User-authorized V2 reference-model selection: intentionally separate from
 * observed discoveries and scientific evidence. */
export interface MultihostModelRepositoryV245 {
  load(generationKey: UniverseGenerationKey, locator: SystemLocator): Promise<MultihostModelManifestV245 | null>;
  save(generationKey: UniverseGenerationKey, locator: SystemLocator, manifest: MultihostModelManifestV245): Promise<void>;
  clear(generationKey: UniverseGenerationKey, locator: SystemLocator): Promise<void>;
}
