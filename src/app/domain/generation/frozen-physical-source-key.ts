import { GeneratorVersion } from './generator-version';
import { UniverseGenerationKey } from './universe-generation-key';

/**
 * Private input ONLY for physical algorithms that were frozen in V1.
 *
 * V2 changes the composition of stellar systems, not the galaxy's physical
 * entropy stream. Never persist, route, or disclose this source key in place
 * of the public V2 generation identity. Do not use it to resolve public V2
 * planet/moon indices: those belong to the multihost catalogue.
 */
export function frozenPhysicalSourceKey(parent: UniverseGenerationKey): UniverseGenerationKey {
  if (parent.generatorVersion === GeneratorVersion.V1) return parent;
  if (parent.generatorVersion === GeneratorVersion.V2) {
    return new UniverseGenerationKey(parent.universeSeed, GeneratorVersion.V1);
  }
  throw new RangeError(`Unsupported GeneratorVersion for frozen physical source: ${parent.generatorVersionCode}.`);
}
